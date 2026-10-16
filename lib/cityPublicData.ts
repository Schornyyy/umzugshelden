import "server-only";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { createDefaultCityLandingTemplate } from "@/lib/cityLandingDefaults";
import { createDefaultCityServiceTemplate } from "@/lib/cityServiceDefaults";
import type {
  CityLandingPage,
  CityLandingTemplate,
  CityServiceKey,
  CityServicePage,
  CityServiceTemplate,
  ResolvedCityLandingPage,
  ResolvedCityServicePage,
} from "@/types/city/CityServicePage";

const TEMPLATE_COLLECTION = "cityServiceTemplates";
const PAGE_COLLECTION = "cityServicePages";
const LANDING_TEMPLATE_COLLECTION = "cityLandingTemplates";
const LANDING_PAGE_COLLECTION = "cityLandingPages";

function ownerId(): string {
  return process.env.NEXT_PUBLIC_OWNERID?.trim() || "default";
}

function safeDocumentPart(value: string): string {
  return encodeURIComponent(value.trim().toLocaleLowerCase("de"));
}

function serviceTemplateId(
  resolvedOwnerId: string,
  serviceKey: CityServiceKey,
): string {
  return `${safeDocumentPart(resolvedOwnerId)}__${serviceKey}`;
}

function servicePageId(
  resolvedOwnerId: string,
  citySlug: string,
  serviceKey: CityServiceKey,
): string {
  return `${safeDocumentPart(resolvedOwnerId)}__${citySlug}__${serviceKey}`;
}

function landingTemplateId(resolvedOwnerId: string): string {
  return `${safeDocumentPart(resolvedOwnerId)}__city-overview`;
}

function landingPageId(resolvedOwnerId: string, citySlug: string): string {
  return `${safeDocumentPart(resolvedOwnerId)}__${citySlug}`;
}

export async function getPublicResolvedCityServicePage(input: {
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
}): Promise<ResolvedCityServicePage> {
  const resolvedOwnerId = ownerId();
  const templateId = serviceTemplateId(resolvedOwnerId, input.serviceKey);
  const pageId = servicePageId(
    resolvedOwnerId,
    input.citySlug,
    input.serviceKey,
  );
  const database = getAdminDatabase();
  const [templateDocument, pageDocument] = await Promise.all([
    database.collection(TEMPLATE_COLLECTION).doc(templateId).get(),
    database.collection(PAGE_COLLECTION).doc(pageId).get(),
  ]);
  const template: CityServiceTemplate = templateDocument.exists
    ? ({
        id: templateDocument.id,
        ...templateDocument.data(),
      } as CityServiceTemplate)
    : {
        ...createDefaultCityServiceTemplate(
          input.serviceKey,
          resolvedOwnerId,
          0,
        ),
        id: templateId,
      };
  const page: CityServicePage = pageDocument.exists
    ? ({
        id: pageDocument.id,
        ...pageDocument.data(),
      } as CityServicePage)
    : {
        id: pageId,
        ownerId: resolvedOwnerId,
        cityName: input.cityName,
        citySlug: input.citySlug,
        serviceKey: input.serviceKey,
        templateId,
        inheritTemplate: true,
        published: true,
        createdAt: 0,
        updatedAt: 0,
      };
  return {
    page,
    template,
    blocks:
      page.inheritTemplate || !page.blocks?.length
        ? template.blocks
        : page.blocks,
    seo: { ...template.seo, ...page.seo },
  };
}

export async function getPublicResolvedCityLandingPage(input: {
  cityName: string;
  citySlug: string;
}): Promise<ResolvedCityLandingPage> {
  const resolvedOwnerId = ownerId();
  const templateId = landingTemplateId(resolvedOwnerId);
  const pageId = landingPageId(resolvedOwnerId, input.citySlug);
  const database = getAdminDatabase();
  const [templateDocument, pageDocument] = await Promise.all([
    database.collection(LANDING_TEMPLATE_COLLECTION).doc(templateId).get(),
    database.collection(LANDING_PAGE_COLLECTION).doc(pageId).get(),
  ]);
  const template: CityLandingTemplate = templateDocument.exists
    ? ({
        id: templateDocument.id,
        ...templateDocument.data(),
      } as CityLandingTemplate)
    : {
        ...createDefaultCityLandingTemplate(resolvedOwnerId, 0),
        id: templateId,
      };
  const page: CityLandingPage = pageDocument.exists
    ? ({
        id: pageDocument.id,
        ...pageDocument.data(),
      } as CityLandingPage)
    : {
        id: pageId,
        ownerId: resolvedOwnerId,
        cityName: input.cityName,
        citySlug: input.citySlug,
        templateId,
        inheritTemplate: true,
        published: true,
        createdAt: 0,
        updatedAt: 0,
      };
  return {
    page,
    template,
    blocks:
      page.inheritTemplate || !page.blocks?.length
        ? template.blocks
        : page.blocks,
    seo: { ...template.seo, ...page.seo },
  };
}

export async function getPublicCityLandingSitemapRecords() {
  const snapshot = await getAdminDatabase()
    .collection(LANDING_PAGE_COLLECTION)
    .where("ownerId", "==", ownerId())
    .get();
  return snapshot.docs.map((document) => {
    const page = document.data() as CityLandingPage;
    return {
      citySlug: page.citySlug,
      published: page.published,
      updatedAt: page.updatedAt,
    };
  });
}

export async function getPublicCityServiceSitemapRecords() {
  const snapshot = await getAdminDatabase()
    .collection(PAGE_COLLECTION)
    .where("ownerId", "==", ownerId())
    .get();
  return snapshot.docs.map((document) => {
    const page = document.data() as CityServicePage;
    return {
      citySlug: page.citySlug,
      serviceKey: page.serviceKey,
      published: page.published,
      updatedAt: page.updatedAt,
    };
  });
}
