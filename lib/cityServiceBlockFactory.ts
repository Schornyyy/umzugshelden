import type {
  CityServiceBlock,
  CityServiceBlockType,
} from "@/types/city/CityServicePage";

function createBlockId(type: CityServiceBlockType) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${type}-${crypto.randomUUID()}`;
  }
  return `${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createCityServiceBlock(
  type: CityServiceBlockType,
): CityServiceBlock {
  const base = {
    id: createBlockId(type),
    enabled: true,
    tone: "white" as const,
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        type,
        tone: "navy",
        title: "{primaryKeyword} in {city}",
        description: "Professionelle Unterstützung in {city}.",
        image: "/images/Umzugsunternhemen_olpe.png",
        imageAlt: "{primaryKeyword} in {city}",
        formTitle: "Angebot für {service} anfordern",
        formText: "Kostenlos und unverbindlich anfragen.",
      };
    case "intro":
      return {
        ...base,
        type,
        heading: "Neue Überschrift für {city}",
        text: "Neuer Text für {service} in {city}.",
      };
    case "imageText":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "Neue Sektion in {city}",
        paragraphs: ["Neuer Abschnittstext."],
        image: "/images/Umzugsunternehmen_Olpe.png",
        imageAlt: "{service} in {city}",
        imagePosition: "left",
      };
    case "localArea":
      return {
        ...base,
        type,
        tone: "accent",
        eyebrow: "Regionaler Einsatz im {region}",
        heading: "{service} in {city} und der direkten Umgebung",
        nearbyLimit: 3,
        showFacts: true,
      };
    case "cardGrid":
      return {
        ...base,
        type,
        heading: "Neue Leistungen in {city}",
        cards: [{ title: "Neue Karte", text: "Beschreibung der Karte." }],
        columns: 3,
        numbered: false,
      };
    case "checkList":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "Ihre Vorteile in {city}",
        items: ["Neuer Listenpunkt"],
        columns: 3,
      };
    case "process":
      return {
        ...base,
        type,
        heading: "So läuft {service} in {city} ab",
        steps: ["Erster Schritt"],
      };
    case "pricing":
      return {
        ...base,
        type,
        tone: "accent",
        eyebrow: "Transparent kalkuliert",
        heading: "Kosten für {service} in {city}",
        text: "Die Kosten richten sich nach dem tatsächlichen Aufwand.",
        factors: ["Umfang und Zugänglichkeit"],
        ctaTitle: "Kostenlos kalkulieren lassen",
        ctaText: "Beschreiben Sie Ihren Auftrag in {city}.",
        ctaLabel: "Angebot anfordern",
      };
    case "faq":
      return {
        ...base,
        type,
        heading: "Häufige Fragen zu {service} in {city}",
        items: [{ question: "Neue Frage", answer: "Neue Antwort" }],
        includeLocalQuestion: true,
      };
    case "contact":
      return {
        ...base,
        type,
        heading: "Angebot für {service} in {city}",
        text: "Wir melden uns zeitnah bei Ihnen.",
        showPhone: true,
        showEmail: true,
        showForm: true,
      };
    case "nearbyCities":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "{service} im Umkreis von {city}",
        intro: "Weitere Einsatzorte rund um {city}.",
        limit: 12,
        radiusKm: 50,
        showDistance: true,
      };
    case "otherServices":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "Weitere Leistungen in {city}",
      };
    case "serviceCards":
      return {
        ...base,
        type,
        heading: "Unsere Leistungen in {city}",
        serviceKeys: [
          "umzugsservice",
          "anstricharbeiten",
          "moebel-service",
          "senior-umzug",
          "entruempelung",
        ],
      };
    case "cta":
      return {
        ...base,
        type,
        tone: "navy",
        eyebrow: "Kostenlos und unverbindlich",
        heading: "Jetzt Angebot für {service} in {city} anfordern",
        text: "Erzählen Sie uns kurz von Ihrem Vorhaben. Wir melden uns persönlich mit den nächsten Schritten.",
        primaryLabel: "Angebot anfordern",
        primaryUrl: "#kontakt",
        secondaryLabel: "Jetzt anrufen",
        secondaryUrl: "tel:+4915168567708",
      };
    case "stats":
      return {
        ...base,
        type,
        tone: "accent",
        heading: "Umzugshelden in Zahlen",
        columns: 4,
        items: [
          { value: "500+", label: "erfolgreiche Aufträge" },
          { value: "4,9/5", label: "Kundenbewertung" },
          { value: "10+", label: "Jahre Erfahrung" },
          { value: "100 %", label: "persönliche Planung" },
        ],
      };
    case "testimonials":
      return {
        ...base,
        type,
        heading: "Das sagen unsere Kunden",
        columns: 3,
        items: [
          {
            quote: "Von der Planung bis zum letzten Karton lief alles zuverlässig und freundlich.",
            name: "Max Mustermann",
            role: "Privatumzug in {city}",
            source: "Google",
            rating: 5,
          },
        ],
      };
    case "gallery":
      return {
        ...base,
        type,
        heading: "Einblicke in unsere Arbeit",
        intro: "Ausgewählte Eindrücke aus unseren Projekten in {city}.",
        columns: 3,
        aspectRatio: "landscape",
        images: [
          {
            src: "/images/Umzugsunternhemen_olpe.png",
            alt: "{service} in {city}",
            caption: "Professionell vorbereitet und sicher durchgeführt",
          },
        ],
      };
    case "video":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "{service} persönlich erklärt",
        text: "Zeigen Sie hier ein Video von Ihrem Team oder einem Projekt.",
        videoUrl: "",
      };
    case "logoCloud":
      return {
        ...base,
        type,
        heading: "Partner und Qualität",
        columns: 4,
        logos: [
          {
            src: "/images/Umzugshelden.png",
            alt: "Umzugshelden",
          },
        ],
      };
    case "accordion":
      return {
        ...base,
        type,
        heading: "Weitere Informationen",
        intro: "Alle wichtigen Details auf einen Blick.",
        items: [
          {
            title: "Was ist im Leistungsumfang enthalten?",
            content: "Beschreiben Sie hier den Leistungsumfang für {service} in {city}.",
          },
        ],
      };
    case "spacer":
      return {
        ...base,
        type,
        height: 64,
        showDivider: false,
        dividerColor: "#e2e8f0",
        dividerWidth: 1,
      };
    case "carousel":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "Unsere Arbeit in {city}",
        intro: "Projekte, Leistungen und Eindrücke im Überblick.",
        autoplay: true,
        interval: 5000,
        showArrows: true,
        showDots: true,
        slides: [
          {
            image: "/images/Umzugsunternhemen_olpe.png",
            imageAlt: "{service} in {city}",
            heading: "Sorgfältig geplant",
            text: "Professionelle Umsetzung durch unser erfahrenes Team.",
          },
        ],
      };
    case "imageCollage":
      return {
        ...base,
        type,
        eyebrow: "Einblicke",
        heading: "Persönlicher Service für {city}",
        text: "Kombinieren Sie mehrere Bilder zu einer lebendigen, überlappenden Bildkomposition.",
        imagePosition: "left",
        layout: "stacked",
        images: [
          { src: "/images/Umzugsunternhemen_olpe.png", alt: "{service} in {city}" },
          { src: "/images/Umzugsunternehmen_Olpe.png", alt: "Umzugshelfer in {city}" },
        ],
      };
    case "beforeAfter":
      return {
        ...base,
        type,
        tone: "muted",
        heading: "Vorher und nachher",
        text: "Ziehen Sie den Regler, um das Ergebnis direkt zu vergleichen.",
        beforeImage: "/images/Umzugsunternhemen_olpe.png",
        beforeAlt: "Ausgangssituation in {city}",
        beforeLabel: "Vorher",
        afterImage: "/images/Umzugsunternehmen_Olpe.png",
        afterAlt: "Ergebnis in {city}",
        afterLabel: "Nachher",
      };
    case "imageCards":
      return {
        ...base,
        type,
        heading: "Leistungen im Überblick",
        intro: "Schnell erfassbare Angebote mit aussagekräftigen Bildern.",
        columns: 3,
        overlay: false,
        cards: [
          {
            image: "/images/Umzugsunternhemen_olpe.png",
            imageAlt: "{service} in {city}",
            title: "Professionelle Planung",
            text: "Individuell abgestimmt auf Ihren Auftrag.",
          },
        ],
      };
    case "team":
      return {
        ...base,
        type,
        heading: "Ihr Team vor Ort",
        intro: "Persönliche Ansprechpartner für {service} in {city}.",
        columns: 3,
        members: [
          {
            image: "/images/Umzugsunternhemen_olpe.png",
            imageAlt: "Ansprechpartner für {city}",
            name: "Vorname Nachname",
            role: "Ansprechpartner",
            text: "Kurze persönliche Vorstellung.",
          },
        ],
      };
  }
}