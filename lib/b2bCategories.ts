import type { B2bLeadCategory } from "@/types/B2b";

/** Zentrale Definition der B2B-Zielgruppen (Labels, Beschreibung, Google-Suchbegriffe). */
export const B2B_CATEGORIES: ReadonlyArray<{
  value: B2bLeadCategory;
  label: string;
  shortLabel: string;
  description: string;
  queries: readonly string[];
}> = [
  {
    value: "real_estate_agent",
    label: "Immobilienmakler",
    shortLabel: "Immobilienmakler",
    description: "Maklerbüros und Immobilienvermittler",
    queries: ["Immobilienmakler"],
  },
  {
    value: "property_management",
    label: "Immobilienverwaltungen",
    shortLabel: "Immobilienverwaltung",
    description: "Haus- und Mietverwaltungen",
    queries: ["Immobilienverwaltung", "Hausverwaltung"],
  },
  {
    value: "housing_company",
    label: "Wohnungsbaugesellschaften",
    shortLabel: "Wohnungsbaugesellschaft",
    description: "Kommunale und private Wohnungsunternehmen",
    queries: ["Wohnungsbaugesellschaft", "Wohnungsunternehmen"],
  },
  {
    value: "senior_care",
    label: "Senioren- und Pflegeheime",
    shortLabel: "Senioren-/Pflegeheim",
    description: "Stationäre Pflege- und Senioreneinrichtungen",
    queries: ["Seniorenheim", "Pflegeheim"],
  },
];

export const B2B_CATEGORY_VALUES = B2B_CATEGORIES.map((category) => category.value);

export const B2B_CATEGORY_LABELS = Object.fromEntries(
  B2B_CATEGORIES.map((category) => [category.value, category.shortLabel]),
) as Record<B2bLeadCategory, string>;

export const B2B_CATEGORY_QUERIES = Object.fromEntries(
  B2B_CATEGORIES.map((category) => [category.value, category.queries]),
) as Record<B2bLeadCategory, readonly string[]>;
