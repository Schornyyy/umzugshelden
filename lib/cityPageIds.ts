import type { CityServiceKey } from "@/types/city/CityServicePage";

/** Firestore-Collections und Dokument-IDs der Stadt- und Stadt-Service-Seiten. */
export const CITY_SERVICE_TEMPLATE_COLLECTION = "cityServiceTemplates";
export const CITY_SERVICE_PAGE_COLLECTION = "cityServicePages";
export const CITY_LANDING_TEMPLATE_COLLECTION = "cityLandingTemplates";
export const CITY_LANDING_PAGE_COLLECTION = "cityLandingPages";

function safeDocumentPart(value: string) {
  return encodeURIComponent(value.trim().toLowerCase());
}

export function cityServiceTemplateId(ownerId: string, serviceKey: CityServiceKey) {
  return `${safeDocumentPart(ownerId)}__${serviceKey}`;
}

export function cityServicePageId(ownerId: string, citySlug: string, serviceKey: CityServiceKey) {
  return `${safeDocumentPart(ownerId)}__${citySlug}__${serviceKey}`;
}

export function cityLandingTemplateId(ownerId: string) {
  return `${safeDocumentPart(ownerId)}__city-overview`;
}

export function cityLandingPageId(ownerId: string, citySlug: string) {
  return `${safeDocumentPart(ownerId)}__${citySlug}`;
}

export function cityServicePath(citySlug: string, serviceKey?: CityServiceKey) {
  return serviceKey ? `/stadt/${citySlug}/${serviceKey}` : `/stadt/${citySlug}`;
}
