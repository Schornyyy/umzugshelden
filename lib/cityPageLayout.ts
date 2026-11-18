import { createCityServiceBlock } from "@/lib/cityServiceBlockFactory";
import type { LayoutImage } from "@/lib/cityDefaultImages";
import { LEAD_FORM_ANCHOR } from "@/lib/leadContact";
import type { CityServiceBlock, CityServiceBlockTone } from "@/types/city/CityServicePage";

/** Platzhalterbilder, die nie auf einer fertigen Seite stehen sollen. */
const PLACEHOLDER_IMAGES = new Set(["/images/image.png", "/images/Umzugsunternehmen_Olpe.png"]);
/** Ab dieser Länge wird ein reiner Textblock zu Bild + Text. */
const MIN_WORDS_FOR_IMAGE = 40;
const GALLERY_MIN_IMAGES = 3;
const GALLERY_MAX_IMAGES = 6;

/**
 * Reihenfolge nach dem Muster einer Conversion-Landingpage:
 * Hero/Formular → Ablauf → Bewertungen → Inhalte (Bild/Text im Wechsel) → CTA →
 * Projekte → Kosten → Über uns → FAQ → Kontakt → interne Verlinkung.
 */
const RANK: Partial<Record<CityServiceBlock["type"], number>> = {
  hero: 0,
  process: 10,
  testimonials: 20,
  serviceCards: 25,
  cta: 50,
  gallery: 55,
  imageCollage: 55,
  beforeAfter: 55,
  pricing: 60,
  faq: 70,
  contact: 80,
  nearbyCities: 90,
  otherServices: 95,
};
const CONTENT_RANK = 30;
const ABOUT_RANK = 65;
const ABOUT_BLOCK_ID = "city-about";

/** Themen, die pro Seite nur einmal vorkommen sollen (erkannt an der Überschrift). */
const TOPICS: Array<[string, RegExp]> = [
  ["pricing", /kost|preis/iu],
  ["process", /ablauf|schritt|so funktioniert|so einfach|so läuft/iu],
  ["benefits", /vorteil|warum/iu],
  ["prep", /vorbereit|tipps/iu],
  ["services", /leistung/iu],
];
/** Strukturelle Blöcke, die nie wegen eines Themas entfernt werden. */
const NEVER_DEDUPED = new Set(["hero", "faq", "contact", "nearbyCities", "otherServices", "testimonials", "gallery", "cta", "localArea", "serviceCards"]);

function topicOf(block: CityServiceBlock) {
  const heading = "heading" in block && typeof block.heading === "string" ? block.heading : "";
  return TOPICS.find(([, pattern]) => pattern.test(heading))?.[0];
}

/** Vorlagen-Blöcke enthalten noch Platzhalter; lokalisierte Abschnitte nicht. */
function isTemplateBlock(block: CityServiceBlock) {
  return /\{(city|cityName|service|primaryKeyword)\}/u.test(JSON.stringify(block));
}

/**
 * Entfernt Vorlagen-Blöcke, deren Thema bereits ein lokalisierter Abschnitt
 * abdeckt (z. B. zweimal „Was kostet …“). Lokalisierte Inhalte bleiben immer.
 */
function dropDuplicateTemplateTopics(blocks: CityServiceBlock[]) {
  const localizedTopics = new Set(
    blocks.filter((block) => !NEVER_DEDUPED.has(block.type) && !isTemplateBlock(block)).map(topicOf).filter(Boolean),
  );
  return blocks.filter((block) => {
    if (NEVER_DEDUPED.has(block.type) || !isTemplateBlock(block)) return true;
    const topic = topicOf(block);
    return !topic || !localizedTopics.has(topic);
  });
}

const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/u).length : 0);

function rankOf(block: CityServiceBlock) {
  if (block.id === ABOUT_BLOCK_ID) return ABOUT_RANK;
  return RANK[block.type] ?? CONTENT_RANK;
}

function usedImages(blocks: readonly CityServiceBlock[]) {
  const used = new Set<string>();
  JSON.stringify(blocks, (key, value) => {
    if ((key === "image" || key === "src") && typeof value === "string") used.add(value);
    return value;
  });
  return used;
}

/**
 * Macht aus einer Textwüste eine bildstarke, auf Anfragen ausgerichtete Seite –
 * ohne Inhalte zu löschen. Wird beim Ausliefern angewendet.
 */
export function composeCityPageLayout(
  blocks: readonly CityServiceBlock[],
  options: {
    images: readonly LayoutImage[];
    cityName: string;
    serviceLabel: string;
    aboutImage: LayoutImage;
  },
): CityServiceBlock[] {
  const visible = dropDuplicateTemplateTopics(
    blocks.filter((block) => block.enabled).map((block) => structuredClone(block)),
  );
  const taken = usedImages(visible);
  const fresh = options.images.filter((image) => !taken.has(image.src));
  let freshCursor = 0;
  const nextFreshImage = () => fresh[freshCursor++];

  // 1) Platzhalter ersetzen, lange Textblöcke zu Bild + Text machen
  let imagePosition: "left" | "right" = "right";
  const withImages = visible.map((block): CityServiceBlock => {
    if (block.type === "imageText") {
      imagePosition = block.imagePosition === "left" ? "right" : "left";
      if (PLACEHOLDER_IMAGES.has(block.image)) {
        const image = nextFreshImage() ?? options.images[0];
        return image ? { ...block, image: image.src, imageAlt: block.imageAlt || image.alt } : block;
      }
      return block;
    }
    if (block.type === "intro" && wordCount(block.text) >= MIN_WORDS_FOR_IMAGE) {
      const image = nextFreshImage();
      if (!image) return block;
      imagePosition = imagePosition === "left" ? "right" : "left";
      return {
        id: block.id,
        type: "imageText",
        enabled: true,
        tone: block.tone,
        headingLevel: block.headingLevel,
        style: block.style,
        heading: block.heading,
        paragraphs: block.text.split(/\n{2,}/u).map((paragraph) => paragraph.trim()).filter(Boolean),
        image: image.src,
        imageAlt: image.alt,
        imagePosition,
      };
    }
    return block;
  });

  // 2) Fehlende Vertrauens- und Bild-Abschnitte ergänzen
  const additions: CityServiceBlock[] = [];
  if (!withImages.some((block) => block.type === "testimonials")) {
    additions.push({ ...createCityServiceBlock("testimonials"), id: "city-reviews" });
  }
  const hasGallery = withImages.some((block) => ["gallery", "imageCollage", "beforeAfter"].includes(block.type));
  if (!hasGallery && options.images.length >= GALLERY_MIN_IMAGES) {
    const gallery = createCityServiceBlock("gallery");
    if (gallery.type === "gallery") {
      additions.push({
        ...gallery,
        id: "city-gallery",
        heading: `Einblicke in unsere Arbeit rund um ${options.cityName}`,
        intro: "",
        columns: 3,
        aspectRatio: "landscape",
        // Zuerst Bilder, die weiter oben noch nicht vorkommen
        images: [...fresh.slice(freshCursor), ...options.images.filter((image) => !fresh.slice(freshCursor).includes(image))]
          .slice(0, GALLERY_MAX_IMAGES)
          .map((image) => ({ src: image.src, alt: image.alt })),
      });
    }
  }
  if (!withImages.some((block) => block.id === ABOUT_BLOCK_ID)) {
    additions.push({
      id: ABOUT_BLOCK_ID,
      type: "imageText",
      enabled: true,
      tone: "white",
      headingLevel: 2,
      eyebrow: "Ihr Team",
      heading: `Persönlich für Sie da – ${options.serviceLabel} in ${options.cityName}`,
      paragraphs: [
        "Bei den Umzugshelden sprechen Sie mit echten Ansprechpartnern statt mit einem Callcenter. Wir begleiten Ihre Anfrage persönlich – von der ersten Planung bis zum Abschluss.",
        "Erzählen Sie uns kurz, was Sie vorhaben. Wir rufen zurück, klären die Details und erstellen Ihnen ein transparentes, unverbindliches Angebot.",
      ],
      image: options.aboutImage.src,
      imageAlt: options.aboutImage.alt,
      imagePosition: "left",
      ctaLabel: "Jetzt Rückruf anfordern",
      ctaUrl: `#${LEAD_FORM_ANCHOR}`,
    });
  }

  // 3) Stabil nach Rang sortieren (Inhalte behalten ihre Reihenfolge)
  const ordered = [...withImages, ...additions]
    .map((block, index) => ({ block, index }))
    .sort((left, right) => rankOf(left.block) - rankOf(right.block) || left.index - right.index)
    .map(({ block }) => block);

  // 4) Hell/grau im Wechsel, damit Abschnitte klar getrennt sind
  let stripe = 0;
  return ordered.map((block) => {
    if (block.type === "hero" || block.tone === "navy" || block.tone === "accent") return block;
    const tone: CityServiceBlockTone = stripe++ % 2 === 0 ? "white" : "muted";
    return { ...block, tone };
  });
}
