import type {
  BlogBlockType,
  BlogPageBlock,
  BlogPageSection,
  BlogPageSettings,
} from "@/types/blog/BlogPage";

export const DEFAULT_BLOG_PAGE_SETTINGS: BlogPageSettings = {
  contentWidth: "normal",
  fontFamily: "sans",
  pageBackground: "#ffffff",
  contentBackground: "#ffffff",
  textColor: "#334155",
  headingColor: "#0f172a",
  accentColor: "#16a34a",
  showBreadcrumbs: true,
  showThumbnail: true,
  showCta: true,
  ctaTitle: "Jetzt unverbindlichen Auftrag erstellen",
  ctaText: "Erhalte passende Angebote und profitiere von unserem Netzwerk.",
  ctaLabel: "Auftrag erstellen",
  ctaUrl: "/auftrag-erstellen",
};

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createBlogBlock(type: BlogBlockType): BlogPageBlock {
  const base: BlogPageBlock = {
    id: createId(),
    type,
    style: {
      alignment: "left",
      width: "normal",
      padding: "medium",
      borderRadius: "none",
    },
  };

  switch (type) {
    case "heading":
      return { ...base, heading: "Neue Überschrift", headingLevel: 2 };
    case "richText":
      return { ...base, content: "" };
    case "image":
      return { ...base, imageAlt: "", caption: "" };
    case "imageText":
      return {
        ...base,
        heading: "Neue Sektion",
        content: "",
        imageAlt: "",
        imagePosition: "left",
      };
    case "quote":
      return { ...base, quote: "Neues Zitat", attribution: "" };
    case "button":
      return {
        ...base,
        buttonLabel: "Mehr erfahren",
        buttonUrl: "/",
        buttonStyle: "primary",
        style: { ...base.style, alignment: "center" },
      };
    case "spacer":
      return { ...base, spacerHeight: 48, style: { padding: "none" } };
    case "divider":
      return { ...base, style: { ...base.style, padding: "small" } };
  }
}

export function legacySectionsToBlocks(
  sections: BlogPageSection[]
): BlogPageBlock[] {
  return sections.map((section, index) => ({
    id: `legacy-section-${index}`,
    type: section.image ? "imageText" : "richText",
    heading: section.titel,
    content: section.text,
    imageUrl: section.image,
    imageAlt: section.titel,
    imagePosition: index % 2 === 0 ? "left" : "right",
    buttonLabel: section.link ? "Mehr erfahren" : undefined,
    buttonUrl: section.link,
    buttonStyle: "outline",
    style: {
      alignment: section.image ? "left" : "center",
      width: "normal",
      padding: "large",
      borderRadius: "none",
    },
  }));
}

export function normalizeBlogPageSettings(
  settings?: Partial<BlogPageSettings>
): BlogPageSettings {
  return { ...DEFAULT_BLOG_PAGE_SETTINGS, ...settings };
}
