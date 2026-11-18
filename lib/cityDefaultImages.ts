import type { CityServiceKey } from "@/types/city/CityServicePage";

export type LayoutImage = { src: string; alt: string };

const img = (path: string, alt: string): LayoutImage => ({ src: encodeURI(path), alt });

const VAN = img("/images/Umzugsunternhemen_olpe.png", "Transporter der Umzugshelden");
const FOUNDERS = img("/images/person/gruender_vor_auto.webp", "Die Gründer der Umzugshelden vor ihrem Fahrzeug");
const ADVISOR = img("/images/person/umzugsberater.jpeg", "Persönlicher Ansprechpartner der Umzugshelden");
const FURNITURE = img("/images/möbel aufbau service.webp", "Möbelmontage durch die Umzugshelden");
const CLEARANCE = img("/images/entrümpelung.webp", "Entrümpelung durch die Umzugshelden");
const PAINTING = img("/images/anstricharbeiten.webp", "Anstricharbeiten durch die Umzugshelden");
const SENIOR = img("/images/senioren_umzüge.webp", "Seniorenumzug mit den Umzugshelden");
const CLEARANCE_BEFORE = [
  "/images/entruempelung/WhatsApp Image 2026-10-22 at 06.58.29.jpeg",
  "/images/entruempelung/WhatsApp Image 2026-10-22 at 07.00.09.jpeg",
  "/images/entruempelung/WhatsApp Image 2026-10-22 at 07.00.10.jpeg",
  "/images/entruempelung/WhatsApp Image 2026-10-22 at 07.00.11 (1).jpeg",
  "/images/entruempelung/WhatsApp Image 2026-10-22 at 07.00.11.jpeg",
].map((path) => img(path, "Ausgangssituation vor einer Entrümpelung"));

/** Echte Fotos je Dienstleistung – Grundlage, bis im Admin eigene Bilder-Pools gepflegt sind. */
export const DEFAULT_SERVICE_IMAGES: Record<CityServiceKey, LayoutImage[]> = {
  umzugsservice: [VAN, FOUNDERS, ADVISOR, FURNITURE],
  entruempelung: [CLEARANCE, ...CLEARANCE_BEFORE, VAN],
  anstricharbeiten: [PAINTING, FOUNDERS, ADVISOR],
  "moebel-service": [FURNITURE, VAN, FOUNDERS],
  "senior-umzug": [SENIOR, ADVISOR, FOUNDERS, VAN],
};

/** Teamfoto für den „Über uns“-Abschnitt. */
export const ABOUT_IMAGE = FOUNDERS;
