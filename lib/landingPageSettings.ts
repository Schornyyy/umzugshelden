import { z } from "zod";

export const LANDING_PAGE_SERVICE_KEYS = [
  "umzugsservice",
  "anstricharbeiten",
  "moebel-service",
  "senior-umzug",
  "entruempelung",
] as const;

export const landingPageServiceKeySchema = z.enum(LANDING_PAGE_SERVICE_KEYS);
export type LandingPageServiceKey = z.infer<typeof landingPageServiceKeySchema>;

const landingPageQuestionSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(200),
  type: z.enum(["select", "text", "date"]),
  options: z.array(z.string().trim().min(1).max(150)).max(12).optional(),
  placeholder: z.string().trim().max(200).optional(),
});

export const landingPageSchema = z.object({
  serviceKey: landingPageServiceKeySchema,
  slug: z.string().trim().min(1).max(100),
  serviceName: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  subtitle: z.string().trim().min(1).max(500),
  formTitle: z.string().trim().min(1).max(200),
  benefits: z.array(z.string().trim().min(1).max(200)).min(1).max(8),
  questions: z.array(landingPageQuestionSchema).min(1).max(8),
  createdAt: z.number().int().nonnegative(),
  ownerId: z.string().trim().min(1).max(200),
});

export type LandingPage = z.infer<typeof landingPageSchema>;
export type LandingPageQuestion = z.infer<typeof landingPageQuestionSchema>;

type LandingPageTemplate = Omit<LandingPage, "createdAt" | "ownerId">;

export const LANDING_PAGE_TEMPLATES: Record<
  LandingPageServiceKey,
  LandingPageTemplate
> = {
  umzugsservice: {
    serviceKey: "umzugsservice",
    slug: "umzugsservice",
    serviceName: "Umzugsservice",
    title: "Ihr Umzug. Persönlich geplant und sicher durchgeführt.",
    subtitle:
      "Teilen Sie uns die wichtigsten Eckdaten mit und erhalten Sie ein transparentes, auf Ihren Umzug abgestimmtes Angebot.",
    formTitle: "Kostenloses Umzugsangebot anfordern",
    benefits: [
      "Persönlicher Ansprechpartner",
      "Sorgfältiger und versicherter Transport",
      "Flexible Zusatzleistungen",
    ],
    questions: [
      {
        id: "umfang",
        label: "Wie groß ist Ihr Umzug?",
        type: "select",
        options: ["1 Zimmer", "2–3 Zimmer", "4 oder mehr Zimmer", "Gewerbeumzug"],
      },
      {
        id: "auszugsadresse",
        label: "Von wo ziehen Sie aus?",
        type: "text",
        placeholder: "Straße, PLZ und Ort",
      },
      {
        id: "einzugsadresse",
        label: "Wohin ziehen Sie?",
        type: "text",
        placeholder: "Straße, PLZ und Ort",
      },
      { id: "termin", label: "Wann möchten Sie umziehen?", type: "date" },
    ],
  },
  anstricharbeiten: {
    serviceKey: "anstricharbeiten",
    slug: "anstricharbeiten",
    serviceName: "Anstricharbeiten",
    title: "Saubere Anstricharbeiten ohne unnötigen Aufwand.",
    subtitle:
      "Beschreiben Sie Ihr Projekt in wenigen Schritten. Wir prüfen den Umfang und erstellen ein passendes Angebot.",
    formTitle: "Angebot für Anstricharbeiten anfordern",
    benefits: [
      "Saubere Vorbereitung und Ausführung",
      "Transparente Leistungsabsprache",
      "Passend für Wohnung, Haus und Gewerbe",
    ],
    questions: [
      {
        id: "objekt",
        label: "Was soll gestrichen werden?",
        type: "select",
        options: ["Wohnung", "Haus", "Einzelne Räume", "Gewerbefläche"],
      },
      {
        id: "flaeche",
        label: "Wie groß ist die Fläche ungefähr?",
        type: "select",
        options: ["Bis 50 m²", "50–100 m²", "Über 100 m²", "Noch unklar"],
      },
      { id: "termin", label: "Wann sollen die Arbeiten beginnen?", type: "date" },
    ],
  },
  "moebel-service": {
    serviceKey: "moebel-service",
    slug: "moebel-service",
    serviceName: "Möbelservice",
    title: "Möbel fachgerecht abbauen, transportieren und aufbauen.",
    subtitle:
      "Senden Sie uns die Eckdaten zu Ihren Möbeln. Wir planen Personal, Werkzeug und Zeitaufwand passend zu Ihrem Auftrag.",
    formTitle: "Möbelservice unverbindlich anfragen",
    benefits: [
      "Fachgerechte De- und Montage",
      "Sorgfältiger Umgang mit Ihren Möbeln",
      "Auch als einzelne Leistung buchbar",
    ],
    questions: [
      {
        id: "leistung",
        label: "Welche Unterstützung benötigen Sie?",
        type: "select",
        options: ["Abbau", "Aufbau", "Ab- und Aufbau", "Transport inklusive"],
      },
      {
        id: "umfang",
        label: "Wie viele Möbelstücke sind betroffen?",
        type: "select",
        options: ["1–3", "4–10", "Mehr als 10", "Kompletter Haushalt"],
      },
      { id: "termin", label: "Wann benötigen Sie den Service?", type: "date" },
    ],
  },
  "senior-umzug": {
    serviceKey: "senior-umzug",
    slug: "senior-umzug",
    serviceName: "Seniorenumzug",
    title: "Einfühlsam umziehen – mit persönlicher Unterstützung.",
    subtitle:
      "Wir planen den Seniorenumzug in Ruhe und stimmen alle benötigten Leistungen persönlich mit Ihnen ab.",
    formTitle: "Beratung zum Seniorenumzug anfragen",
    benefits: [
      "Fester persönlicher Ansprechpartner",
      "Hilfe beim Packen und Einrichten",
      "Rücksichtsvolle, verlässliche Durchführung",
    ],
    questions: [
      {
        id: "umfang",
        label: "Wie groß ist der bisherige Haushalt?",
        type: "select",
        options: ["1 Zimmer", "2–3 Zimmer", "4 oder mehr Zimmer", "Noch unklar"],
      },
      {
        id: "unterstuetzung",
        label: "Welche Unterstützung ist gewünscht?",
        type: "select",
        options: [
          "Nur Transport",
          "Packservice",
          "Möbelmontage",
          "Komplettservice",
        ],
      },
      { id: "termin", label: "Wann soll der Umzug stattfinden?", type: "date" },
    ],
  },
  entruempelung: {
    serviceKey: "entruempelung",
    slug: "entruempelung",
    serviceName: "Entrümpelung",
    title: "Professionelle Entrümpelung zum transparenten Festpreis.",
    subtitle:
      "Nennen Sie uns Objekt, Größe und Zeitraum. Nach der Einschätzung erhalten Sie ein verbindliches Angebot.",
    formTitle: "Entrümpelung kostenlos anfragen",
    benefits: [
      "Kostenlose Ersteinschätzung",
      "Faire Wertanrechnung nach Prüfung",
      "Besenreine Übergabe",
    ],
    questions: [
      {
        id: "objekt",
        label: "Was soll entrümpelt werden?",
        type: "select",
        options: ["Wohnung", "Haus", "Keller / Dachboden", "Gewerbe / Garten"],
      },
      {
        id: "flaeche",
        label: "Wie groß ist die Fläche ungefähr?",
        type: "select",
        options: ["Bis 50 m²", "50–100 m²", "Über 100 m²"],
      },
      {
        id: "zeitraum",
        label: "Wann soll die Entrümpelung stattfinden?",
        type: "select",
        options: ["Schnellstmöglich", "In den nächsten 2 Wochen", "Später"],
      },
    ],
  },
};

export function createLandingPageFromTemplate(
  serviceKey: LandingPageServiceKey,
  ownerId: string,
  createdAt = Date.now(),
): LandingPage {
  return landingPageSchema.parse({
    ...LANDING_PAGE_TEMPLATES[serviceKey],
    ownerId,
    createdAt,
  });
}
