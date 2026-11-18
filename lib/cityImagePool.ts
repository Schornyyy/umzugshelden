import "server-only";

import { DEFAULT_SERVICE_IMAGES, type LayoutImage } from "@/lib/cityDefaultImages";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { rotateBy } from "@/utils/stableHash";
import { PROJECT_COLLECTION } from "@/lib/projects";
import { CITY_SERVICE_KEYS, type CityServiceKey } from "@/types/city/CityServicePage";

const SETTINGS_COLLECTION = "cityLocalizationSettings";

export type ProjectImageSource = {
  cityName: string;
  serviceKey: string;
  title: string;
  images: string[];
};

export async function loadProjectImages(): Promise<ProjectImageSource[]> {
  const snapshot = await getAdminDatabase().collection(PROJECT_COLLECTION).where("published", "==", true).get();
  return snapshot.docs.map((document) => ({
    cityName: String(document.get("cityName") || ""),
    serviceKey: String(document.get("serviceKey") || ""),
    title: String(document.get("previewTitle") || document.get("title") || "Projekt der Umzugshelden"),
    images: [document.get("thumbnailUrl"), ...(document.get("images") ?? [])].filter(
      (url): url is string => typeof url === "string" && Boolean(url),
    ),
  }));
}

export async function loadConfiguredImagePools(ownerId: string) {
  const snapshot = await getAdminDatabase().collection(SETTINGS_COLLECTION).doc(ownerId).get();
  return (snapshot.get("imagePools") ?? {}) as Partial<Record<CityServiceKey, string[]>>;
}

/**
 * Bilder für eine Stadt-/Stadt-Service-Seite: Projektbilder (gleiche Stadt zuerst),
 * im Admin gepflegte Pools und echte Standardfotos. Jede Stadt bekommt eine andere
 * Reihenfolge, damit Nachbarstädte nicht dieselben Bilder zeigen.
 */
export function buildCityImagePool(input: {
  cityName: string;
  serviceKey?: CityServiceKey;
  configuredPools: Partial<Record<CityServiceKey, string[]>>;
  projects: readonly ProjectImageSource[];
}): LayoutImage[] {
  const serviceKeys = input.serviceKey ? [input.serviceKey] : [...CITY_SERVICE_KEYS];
  const fromProjects = input.projects
    .filter((project) => project.cityName === input.cityName || serviceKeys.includes(project.serviceKey as CityServiceKey))
    .sort((left, right) => Number(right.cityName === input.cityName) - Number(left.cityName === input.cityName))
    .flatMap((project) => project.images.map((src) => ({ src, alt: project.title })));
  const configured = serviceKeys.flatMap((key) =>
    (input.configuredPools[key] ?? []).map((src) => ({ src, alt: `Einsatz der Umzugshelden in der Region` })),
  );
  const defaults = serviceKeys.flatMap((key) => DEFAULT_SERVICE_IMAGES[key]);

  const seen = new Set<string>();
  const pool = [...fromProjects, ...configured, ...defaults].filter((image) => {
    if (seen.has(image.src)) return false;
    seen.add(image.src);
    return true;
  });
  return rotateBy(pool, `${input.cityName}/${input.serviceKey ?? "stadt"}`);
}

export async function getCityImagePool(ownerId: string, cityName: string, serviceKey?: CityServiceKey) {
  const [configuredPools, projects] = await Promise.all([loadConfiguredImagePools(ownerId), loadProjectImages()]);
  return buildCityImagePool({ cityName, serviceKey, configuredPools, projects });
}
