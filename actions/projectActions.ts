"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeAdminIdToken } from "@/lib/adminApiAuth";
import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { generateProjectContent } from "@/lib/projectGeneration";
import { PROJECT_COLLECTION, projectPath, serializeProject } from "@/lib/projects";
import { CITY_SERVICE_KEYS, type CityServiceBlock } from "@/types/city/CityServicePage";
import type { Project } from "@/types/project/Project";
import { slugify } from "@/utils/slugify";

const authSchema = z.object({
  token: z.string().min(1),
  ownerId: z.string().trim().min(1).max(200),
});
const projectIdSchema = authSchema.extend({ projectId: z.string().trim().min(1).max(200) });

const imageUrlSchema = z.string().trim().max(2_048);
const baseInputSchema = z.object({
  briefing: z.string().trim().max(10_000),
  serviceKey: z.enum(CITY_SERVICE_KEYS),
  cityName: z.string().trim().max(80),
  thumbnailUrl: imageUrlSchema.min(1, "Bitte ein Thumbnail auswählen."),
  images: z.array(imageUrlSchema.min(1)).max(30).default([]),
});
const generateSchema = authSchema.merge(baseInputSchema).extend({
  briefing: z.string().trim().min(30, "Bitte das Projekt mit mindestens 30 Zeichen beschreiben.").max(10_000),
});
const createManualSchema = authSchema.merge(baseInputSchema).extend({
  title: z.string().trim().min(3, "Bitte einen Titel eingeben.").max(140),
});
const updateSchema = projectIdSchema.extend({
  patch: z
    .object({
      slug: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(140),
      previewTitle: z.string().trim().min(1).max(80),
      previewText: z.string().trim().max(300),
      metaTitle: z.string().trim().max(70),
      metaDescription: z.string().trim().max(170),
      thumbnailUrl: imageUrlSchema,
      thumbnailAlt: z.string().trim().max(160),
      images: z.array(imageUrlSchema.min(1)).max(30),
      serviceKey: z.enum(CITY_SERVICE_KEYS),
      cityName: z.string().trim().max(80),
      facts: z
        .array(z.object({ label: z.string().trim().max(40), value: z.string().trim().max(80) }))
        .max(6),
      briefing: z.string().trim().max(10_000),
      blocks: z.array(z.object({ id: z.string(), type: z.string() }).passthrough()).max(60),
      published: z.boolean(),
    })
    .partial(),
});

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

async function authorize(input: z.infer<typeof authSchema>) {
  if (!(await authorizeAdminIdToken(input.token, input.ownerId))) {
    throw new Error("Keine Berechtigung.");
  }
}

function failure(error: unknown, fallback: string): { success: false; error: string } {
  if (error instanceof z.ZodError) return { success: false, error: error.issues[0]?.message ?? fallback };
  return { success: false, error: error instanceof Error ? error.message : fallback };
}

function collection() {
  return getAdminDatabase().collection(PROJECT_COLLECTION);
}

async function getOwnedProject(input: z.infer<typeof projectIdSchema>) {
  const reference = collection().doc(input.projectId);
  const snapshot = await reference.get();
  if (!snapshot.exists || snapshot.get("ownerId") !== input.ownerId) {
    throw new Error("Projekt nicht gefunden.");
  }
  return { reference, project: serializeProject(snapshot.id, snapshot.data()!) };
}

/** Liefert einen eindeutigen Slug; `ignoreId` erlaubt den eigenen, unveränderten Slug. */
async function uniqueSlug(value: string, ignoreId?: string) {
  const base = slugify(value).slice(0, 90) || "projekt";
  for (let suffix = 1; suffix < 100; suffix += 1) {
    const slug = suffix === 1 ? base : `${base}-${suffix}`;
    const existing = await collection().where("slug", "==", slug).limit(1).get();
    if (existing.empty || existing.docs[0].id === ignoreId) return slug;
  }
  throw new Error("Es konnte keine freie Projekt-URL gefunden werden.");
}

function revalidateProject(...slugs: string[]) {
  revalidatePath("/projekte");
  revalidatePath("/sitemaps/static/sitemap.xml");
  for (const slug of new Set(slugs.filter(Boolean))) revalidatePath(projectPath(slug));
}

async function createProjectDocument(data: Omit<Project, "id" | "slug" | "createdAt" | "updatedAt">) {
  const now = Date.now();
  const reference = collection().doc();
  const slug = await uniqueSlug(data.title);
  await reference.create({ ...data, slug, createdAt: now, updatedAt: now });
  return reference.id;
}

export async function listProjects(input: z.infer<typeof authSchema>): Promise<ActionResult<Project[]>> {
  try {
    const parsed = authSchema.parse(input);
    await authorize(parsed);
    const snapshot = await collection().where("ownerId", "==", parsed.ownerId).get();
    return {
      success: true,
      data: snapshot.docs
        .map((document) => serializeProject(document.id, document.data()))
        .sort((left, right) => right.createdAt - left.createdAt),
    };
  } catch (error) {
    return failure(error, "Projekte konnten nicht geladen werden.");
  }
}

export async function getProject(input: z.infer<typeof projectIdSchema>): Promise<ActionResult<Project>> {
  try {
    const parsed = projectIdSchema.parse(input);
    await authorize(parsed);
    return { success: true, data: (await getOwnedProject(parsed)).project };
  } catch (error) {
    return failure(error, "Projekt konnte nicht geladen werden.");
  }
}

/** Legt ein Projekt an und lässt Texte, Abschnitte und Meta-Daten per KI erstellen. */
export async function generateProject(input: z.infer<typeof generateSchema>): Promise<ActionResult<string>> {
  try {
    const parsed = generateSchema.parse(input);
    await authorize(parsed);
    const content = await generateProjectContent(parsed);
    const id = await createProjectDocument({
      ...content,
      ownerId: parsed.ownerId,
      thumbnailUrl: parsed.thumbnailUrl,
      images: parsed.images,
      serviceKey: parsed.serviceKey,
      cityName: parsed.cityName,
      briefing: parsed.briefing,
      published: false,
    });
    return { success: true, data: id };
  } catch (error) {
    return failure(error, "Projekt konnte nicht generiert werden.");
  }
}

/** Legt ein leeres Projekt an, das komplett im Pagebuilder befüllt wird. */
export async function createProject(input: z.infer<typeof createManualSchema>): Promise<ActionResult<string>> {
  try {
    const parsed = createManualSchema.parse(input);
    await authorize(parsed);
    const intro = createCityServiceBlock("intro");
    const id = await createProjectDocument({
      ownerId: parsed.ownerId,
      title: parsed.title,
      previewTitle: parsed.title,
      previewText: "",
      metaTitle: parsed.title,
      metaDescription: "",
      thumbnailUrl: parsed.thumbnailUrl,
      thumbnailAlt: parsed.title,
      images: parsed.images,
      serviceKey: parsed.serviceKey,
      cityName: parsed.cityName,
      facts: [],
      briefing: parsed.briefing,
      blocks: [
        intro.type === "intro" ? { ...intro, heading: parsed.title, text: parsed.briefing || "Projektbeschreibung" } : intro,
      ],
      published: false,
    });
    return { success: true, data: id };
  } catch (error) {
    return failure(error, "Projekt konnte nicht angelegt werden.");
  }
}

export async function updateProject(input: z.infer<typeof updateSchema>): Promise<ActionResult<Project>> {
  try {
    const parsed = updateSchema.parse(input);
    await authorize(parsed);
    const { reference, project } = await getOwnedProject(parsed);
    const patch: Record<string, unknown> = { ...parsed.patch, updatedAt: Date.now() };
    if (parsed.patch.slug !== undefined && parsed.patch.slug !== project.slug) {
      patch.slug = await uniqueSlug(parsed.patch.slug, project.id);
    }
    if (parsed.patch.blocks) patch.blocks = parsed.patch.blocks as unknown as CityServiceBlock[];
    await reference.update(patch);
    const updated = serializeProject(project.id, (await reference.get()).data()!);
    revalidateProject(project.slug, updated.slug);
    return { success: true, data: updated };
  } catch (error) {
    return failure(error, "Projekt konnte nicht gespeichert werden.");
  }
}

/** Erstellt Texte, Abschnitte und Meta-Daten aus der (ggf. geänderten) Beschreibung neu. */
export async function regenerateProject(
  input: z.infer<typeof projectIdSchema> & { briefing: string },
): Promise<ActionResult<Project>> {
  try {
    const parsed = projectIdSchema
      .extend({ briefing: generateSchema.shape.briefing })
      .parse(input);
    await authorize(parsed);
    const { reference, project } = await getOwnedProject(parsed);
    const content = await generateProjectContent({ ...project, briefing: parsed.briefing });
    await reference.update({ ...content, briefing: parsed.briefing, updatedAt: Date.now() });
    revalidateProject(project.slug);
    return { success: true, data: serializeProject(project.id, (await reference.get()).data()!) };
  } catch (error) {
    return failure(error, "Projekt konnte nicht neu generiert werden.");
  }
}

export async function deleteProject(input: z.infer<typeof projectIdSchema>): Promise<ActionResult<null>> {
  try {
    const parsed = projectIdSchema.parse(input);
    await authorize(parsed);
    const { reference, project } = await getOwnedProject(parsed);
    await reference.delete();
    revalidateProject(project.slug);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "Projekt konnte nicht gelöscht werden.");
  }
}
