import "server-only";

import { z } from "zod";
import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";
import { serviceGenerationRules } from "@/lib/cityServiceContentPolicy";
import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { generateGeminiJson } from "@/lib/gemini";
import {
  createGeneratedContactBlock,
  createGeneratedSectionBlocks,
  GENERATED_SECTION_JSON_FORMAT,
  generatedSectionSchema,
  IMAGE_PLACEHOLDER,
  seoLengthField,
  zodCorrection,
} from "@/lib/seoGeneratedContent";
import type { CityServiceBlock, CityServiceKey } from "@/types/city/CityServicePage";
import type { Project } from "@/types/project/Project";

const MAX_ATTEMPTS = 3;

const projectContentSchema = z.object({
  title: z.string().trim().min(10).max(140),
  previewTitle: z.string().trim().min(5).max(80),
  previewText: z.string().trim().min(60).max(300),
  metaTitle: seoLengthField(20, 60),
  metaDescription: seoLengthField(110, 160),
  thumbnailAlt: z.string().trim().min(5).max(160),
  facts: z
    .array(z.object({ label: z.string().trim().min(2).max(40), value: z.string().trim().min(1).max(80) }))
    .min(2)
    .max(5),
  sections: z.array(generatedSectionSchema).min(3).max(7),
});

export type ProjectGenerationInput = {
  briefing: string;
  serviceKey: CityServiceKey;
  cityName: string;
  thumbnailUrl: string;
  images: string[];
};

export type GeneratedProject = Pick<
  Project,
  | "title"
  | "previewTitle"
  | "previewText"
  | "metaTitle"
  | "metaDescription"
  | "thumbnailAlt"
  | "facts"
  | "blocks"
>;

/** Verteilt die Projektbilder auf Bild-Text-Abschnitte und ergänzt eine Galerie. */
function buildProjectBlocks(
  sections: z.infer<typeof generatedSectionSchema>[],
  input: ProjectGenerationInput,
  imageAlt: string,
): CityServiceBlock[] {
  const pool = input.images.length ? input.images : [input.thumbnailUrl].filter(Boolean);
  let imageIndex = 0;
  const blocks = createGeneratedSectionBlocks(sections, "project").map((block) => {
    if (block.type !== "imageText") return block;
    const image = pool[imageIndex % Math.max(pool.length, 1)] ?? IMAGE_PLACEHOLDER;
    imageIndex += 1;
    return { ...block, image };
  });

  if (input.images.length >= 2) {
    const gallery = createCityServiceBlock("gallery");
    if (gallery.type === "gallery") {
      blocks.push({
        ...gallery,
        id: "project-gallery",
        heading: "Eindrücke aus dem Projekt",
        intro: "",
        images: input.images.map((src, index) => ({
          src,
          alt: `${imageAlt} – Bild ${index + 1}`,
        })),
      });
    }
  }
  blocks.push(createGeneratedContactBlock("project-contact", "Sie planen ein ähnliches Projekt?"));
  return blocks;
}

/** Erstellt alle Texte, Abschnitte und Meta-Daten eines Projekts aus der Admin-Beschreibung. */
export async function generateProjectContent(
  input: ProjectGenerationInput,
): Promise<GeneratedProject> {
  const serviceName = getDefaultCityServiceName(input.serviceKey);
  let correction: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await generateGeminiJson({
      temperature: 0.4,
      timeoutMs: 50_000,
      maxOutputTokens: 8_192,
      thinkingBudget: 0,
      systemInstruction: `Du bist Redakteur für die Referenzprojekte eines regionalen Umzugs- und Dienstleistungsunternehmens (Umzugshelden).
Schreibe aus der Projektbeschreibung des Admins eine überzeugende, gut lesbare Projektseite (Case Study) auf Deutsch.
Struktur: Ausgangslage, Herausforderung, Vorgehen (als process mit Schritten), Ergebnis; optional erbrachte Leistungen (checklist) und 3 FAQ.
Nutze mindestens einen imageText-Abschnitt. Kein cta-Abschnitt – das Kontaktformular wird automatisch ergänzt.
Verwende ausschließlich Fakten aus briefing. Erfinde keine Zahlen, Preise, Kundennamen, Zitate, Bewertungen oder Garantien. Fehlt eine Angabe, formuliere allgemein.
facts: 2 bis 5 kurze Eckdaten für die Projektkarte (z. B. Ort, Leistung, Umfang, Dauer) – nur, was aus briefing hervorgeht.
title ist die H1, previewTitle ein kurzer Kartentitel, previewText ein Teaser (1–2 Sätze), metaTitle max. 60 Zeichen, metaDescription 120–155 Zeichen, thumbnailAlt beschreibt das Titelbild sachlich.
Keine Markdown-Überschriften und keine Links in Textfeldern.
${serviceGenerationRules(input.serviceKey).join("\n")}
Antworte ausschließlich als JSON:
{"title":string,"previewTitle":string,"previewText":string,"metaTitle":string,"metaDescription":string,"thumbnailAlt":string,"facts":[{"label":string,"value":string}],"sections":[${GENERATED_SECTION_JSON_FORMAT}]}`,
      prompt: JSON.stringify({
        briefing: input.briefing,
        serviceName,
        cityName: input.cityName,
        imageCount: input.images.length,
        correction,
      }),
    });
    const parsed = projectContentSchema.safeParse(response);
    if (parsed.success) {
      const { sections, ...content } = parsed.data;
      return { ...content, blocks: buildProjectBlocks(sections, input, content.thumbnailAlt) };
    }
    correction = zodCorrection(parsed.error);
    console.warn("Project generation returned invalid format", attempt, correction);
  }
  throw new Error("Die KI hat kein gültiges Projekt geliefert. Bitte erneut versuchen.");
}
