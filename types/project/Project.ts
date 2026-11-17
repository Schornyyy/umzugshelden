import type {
  CityServiceBlock,
  CityServiceKey,
} from "@/types/city/CityServicePage";

export interface ProjectFact {
  label: string;
  value: string;
}

/** Ein Referenzprojekt, das unter /projekte veröffentlicht wird. */
export interface Project {
  id: string;
  ownerId: string;
  slug: string;
  /** H1 auf der Detailseite */
  title: string;
  /** Titel auf der Projektkarte */
  previewTitle: string;
  /** Kurztext auf der Projektkarte */
  previewText: string;
  metaTitle: string;
  metaDescription: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  /** Zusätzliche Projektbilder (Galerie / Bild-Text-Abschnitte) */
  images: string[];
  serviceKey: CityServiceKey;
  cityName: string;
  facts: ProjectFact[];
  /** Freie Projektbeschreibung des Admins – Grundlage für die KI-Texte */
  briefing: string;
  blocks: CityServiceBlock[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ProjectCardData = Pick<
  Project,
  | "slug"
  | "previewTitle"
  | "previewText"
  | "thumbnailUrl"
  | "thumbnailAlt"
  | "cityName"
  | "serviceKey"
  | "facts"
>;
