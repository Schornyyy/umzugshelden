import type {
  CityLandingTemplate,
  CityServiceBlock,
} from "@/types/city/CityServicePage";

export function createDefaultCityLandingTemplate(
  ownerId: string,
  timestamp = Date.now(),
): CityLandingTemplate {
  const blocks: CityServiceBlock[] = [
    {
      id: "hero",
      type: "hero",
      enabled: true,
      tone: "navy",
      title: "{primaryKeyword} in {city}",
      description:
        "Umzug, Anstrich oder Möbelmontage – die Umzugshelden sind in {city} und Umgebung für Sie da. Schnell, zuverlässig und fair kalkuliert.",
      image: "/images/Umzugsunternehmen_Olpe.png",
      imageAlt: "Umzugsservice in {city}",
      formTitle: "Kostenloses Angebot anfordern",
      formText: "Beschreiben Sie kurz Ihren Auftrag in {city}.",
    },
    {
      id: "intro",
      type: "intro",
      enabled: true,
      tone: "white",
      heading: "Ihr Umzugs- und Renovierungsservice in {city}",
      text: "Ob Wohnungswechsel, Haushaltsauflösung oder Renovierung vor einer Übergabe: In {city} erhalten Sie bei Umzugshelden eine persönliche Planung und ein Team, das die Arbeit zuverlässig erledigt. Sie entscheiden, wie viel Unterstützung Sie benötigen – vom einzelnen Möbelaufbau bis zum Komplettumzug.",
    },
    {
      id: "planning",
      type: "cardGrid",
      enabled: true,
      tone: "accent",
      heading: "Kostenlos planen, transparent entscheiden",
      intro:
        "Nach Ihrer Anfrage sprechen wir über Ihren Bedarf in {city}. Bei umfangreicheren Aufträgen besichtigen wir die Situation vor Ort, damit Leistungen, Materialien und Entsorgungskosten nachvollziehbar enthalten sind.",
      cards: [
        {
          title: "Planbare Leistungen",
          text: "Termin, Zugangswege, Adressen und gewünschte Zusatzleistungen werden vor Beginn eindeutig abgestimmt.",
        },
      ],
      columns: 2,
      numbered: false,
    },
    {
      id: "services",
      type: "serviceCards",
      enabled: true,
      tone: "white",
      heading: "Unsere Leistungen in {city}",
      serviceKeys: [
        "umzugsservice",
        "anstricharbeiten",
        "moebel-service",
        "senior-umzug",
        "entruempelung",
      ],
    },
    {
      id: "process",
      type: "process",
      enabled: true,
      tone: "muted",
      heading: "So erhalten Sie Ihr Angebot in {city}",
      intro:
        "Ein klarer Ablauf sorgt dafür, dass Aufwand, Termin und Preis von Anfang an zusammenpassen.",
      steps: [
        "Anfrage mit Leistung, Wunschtermin und Eckdaten senden",
        "Umfang, Zugänge, Adressen und Zusatzleistungen abstimmen",
        "Transparentes Angebot mit vereinbarten Leistungen erhalten",
        "Auftrag zum abgestimmten Termin umsetzen",
      ],
    },
    {
      id: "local-area",
      type: "localArea",
      enabled: true,
      tone: "white",
      eyebrow: "Regionaler Einsatz im {region}",
      heading: "Im Einsatz in {city} und Umgebung",
      nearbyLimit: 3,
      showFacts: true,
    },
    {
      id: "preparation",
      type: "checkList",
      enabled: true,
      tone: "muted",
      heading: "Auftrag in {city} gut vorbereiten",
      items: [
        "Termin, Adresse und gewünschten Leistungsumfang nennen",
        "Stockwerke, Aufzug und Parksituation vorab mitteilen",
        "Fotos bei Möbelmontage, Entrümpelung oder Schäden hochladen",
        "Zusatzleistungen wie Verpackung, Entsorgung oder Anstrich angeben",
      ],
      columns: 2,
    },
    {
      id: "benefits",
      type: "cardGrid",
      enabled: true,
      tone: "navy",
      heading: "Warum Umzugshelden in {city}?",
      cards: [
        {
          title: "Feste Preise",
          text: "Sie erhalten ein klares und nachvollziehbares Festpreisangebot.",
        },
        {
          title: "Lokaler Service",
          text: "Wir planen Einsätze in {city} und der direkten Umgebung.",
        },
        {
          title: "Erfahrenes Team",
          text: "Unsere Mitarbeiter arbeiten sorgfältig, strukturiert und zügig.",
        },
        {
          title: "Alles aus einer Hand",
          text: "Umzug, Streichen, Möbelmontage und Entrümpelung lassen sich kombinieren.",
        },
        {
          title: "Flexible Termine",
          text: "Auch kurzfristige Termine und Wochenenden werden nach Verfügbarkeit geprüft.",
        },
        {
          title: "Persönliche Beratung",
          text: "Ein fester Ansprechpartner begleitet die Planung Ihres Auftrags.",
        },
      ],
      columns: 3,
      numbered: false,
    },
    {
      id: "faq",
      type: "faq",
      enabled: true,
      tone: "white",
      heading: "Häufige Fragen zu Umzugshelden in {city}",
      includeLocalQuestion: false,
      items: [
        {
          question: "Welche Leistungen bieten Sie in {city} an?",
          answer:
            "In {city} übernehmen wir Umzüge, Seniorenumzüge, Entrümpelungen, Anstricharbeiten sowie Möbelabbau und Möbelaufbau.",
        },
        {
          question: "Was kostet ein Umzugsservice in {city}?",
          answer:
            "Der Preis hängt vom Umfang, den Zugangswegen, der Entfernung und den gewünschten Zusatzleistungen ab. Nach einer Beratung oder Besichtigung erhalten Sie ein transparentes Festpreisangebot.",
        },
        {
          question: "Können Sie auch kurzfristig nach {city} kommen?",
          answer:
            "Wir prüfen auch kurzfristige Anfragen. Teilen Sie uns Wunschtermin und Umfang mit, damit wir die verfügbaren Kapazitäten klären können.",
        },
        {
          question: "Muss ich für das Angebot schon alles genau wissen?",
          answer:
            "Nein. Für eine erste Einschätzung reichen Angaben zu Leistung, Termin und Adresse. Fotos und Hinweise helfen bei der genauen Vorbereitung.",
        },
      ],
    },
    {
      id: "nearby-cities",
      type: "nearbyCities",
      enabled: true,
      tone: "muted",
      heading: "Umzugshelden in Städten rund um {city}",
      intro:
        "Entdecken Sie unsere Stadtseiten für weitere Orte im regionalen Einsatzgebiet.",
      limit: 12,
      radiusKm: 50,
      showDistance: true,
    },
    {
      id: "contact",
      type: "contact",
      enabled: true,
      tone: "white",
      heading: "Jetzt Angebot in {city} anfordern",
      text: "Kontaktieren Sie uns für ein kostenloses und unverbindliches Angebot für Ihren Umzug oder Ihre Renovierung in {city}.",
      showPhone: true,
      showEmail: true,
      showForm: true,
    },
  ];

  return {
    id: "city-overview",
    ownerId,
    blocks,
    seo: {
      title:
        "Umzugsservice {city} ▷ Schnell & zuverlässig | Umzugshelden",
      description:
        "Professioneller Umzugsservice in {city}: Privatumzug, Firmenumzug, Anstricharbeiten und Möbelmontage. Jetzt kostenlos anfragen!",
      image: "/images/Umzugsunternehmen_Olpe.png",
      imageAlt: "Umzugsservice in {city}",
      schemaDescription:
        "Umzugs- und Renovierungsservice in {city} und im {region}.",
      keywords: [
        "Umzugsservice",
        "Umzugsunternehmen",
        "Entrümpelung",
        "Anstricharbeiten",
        "Möbelmontage",
      ],
    },
    createdAt: timestamp,
    updatedAt: timestamp,
    version: 1,
  };
}