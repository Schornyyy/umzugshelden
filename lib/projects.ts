import type { Project, ProjectCardData } from "@/types/project/Project";

export const PROJECT_COLLECTION = "projects_umzugshelden";

export function projectPath(slug: string) {
  return `/projekte/${slug}`;
}

export function toProjectCard(project: Project): ProjectCardData {
  return {
    slug: project.slug,
    previewTitle: project.previewTitle,
    previewText: project.previewText,
    thumbnailUrl: project.thumbnailUrl,
    thumbnailAlt: project.thumbnailAlt,
    cityName: project.cityName,
    serviceKey: project.serviceKey,
    facts: project.facts,
  };
}

export function serializeProject(
  id: string,
  data: FirebaseFirestore.DocumentData,
): Project {
  return {
    id,
    ownerId: String(data.ownerId ?? ""),
    slug: String(data.slug ?? id),
    title: String(data.title ?? ""),
    previewTitle: String(data.previewTitle ?? data.title ?? ""),
    previewText: String(data.previewText ?? ""),
    metaTitle: String(data.metaTitle ?? ""),
    metaDescription: String(data.metaDescription ?? ""),
    thumbnailUrl: String(data.thumbnailUrl ?? ""),
    thumbnailAlt: String(data.thumbnailAlt ?? data.title ?? ""),
    images: Array.isArray(data.images) ? data.images.map(String) : [],
    serviceKey: data.serviceKey ?? "umzugsservice",
    cityName: String(data.cityName ?? ""),
    facts: Array.isArray(data.facts) ? data.facts : [],
    briefing: String(data.briefing ?? ""),
    blocks: Array.isArray(data.blocks) ? data.blocks : [],
    published: data.published === true,
    createdAt: Number(data.createdAt || 0),
    updatedAt: Number(data.updatedAt || 0),
  };
}
