import type { AdminBlogMainCategory } from './AdminBlogCategory';

export interface BlogPageSection {
  titel: string;            // section heading
  text: string;             // draft-js raw JSON string
  image?: string;           // optional image URL from Mediathek
  link?: string;            // optional outbound or internal link (validated as URL when saving if present)
}

export interface BlogPageFAQEntry {
  question: string;
  answer: string;           // draft-js raw JSON string
}

export type BlogBlockType =
  | "heading"
  | "richText"
  | "image"
  | "imageText"
  | "quote"
  | "button"
  | "divider"
  | "spacer";

export interface BlogBlockStyle {
  backgroundColor?: string;
  textColor?: string;
  alignment?: "left" | "center" | "right";
  width?: "narrow" | "normal" | "wide" | "full";
  padding?: "none" | "small" | "medium" | "large";
  borderRadius?: "none" | "small" | "medium" | "large";
}

export interface BlogPageBlock {
  id: string;
  type: BlogBlockType;
  heading?: string;
  headingLevel?: 2 | 3 | 4;
  content?: string;
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
  imagePosition?: "left" | "right" | "full";
  quote?: string;
  attribution?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  buttonStyle?: "primary" | "secondary" | "outline";
  spacerHeight?: number;
  style?: BlogBlockStyle;
}

export interface BlogPageSettings {
  contentWidth: "narrow" | "normal" | "wide";
  fontFamily: "sans" | "serif";
  pageBackground: string;
  contentBackground: string;
  textColor: string;
  headingColor: string;
  accentColor: string;
  showBreadcrumbs: boolean;
  showThumbnail: boolean;
  showCta: boolean;
  ctaTitle: string;
  ctaText: string;
  ctaLabel: string;
  ctaUrl: string;
}

export interface BlogPage {
  id: string;               // Firestore doc id
  slug: string;             // stable slug (derived from initial titel)
  titel: string;            // display title
  description: string;      // short description / teaser
  subcategorySlug: string;  // parent subcategory reference
  mainCategory: AdminBlogMainCategory; // denormalized for querying
  thumbnailUrl?: string;    // preview image
  keywords?: string[];      // SEO keywords
  meta_description?: string;// SEO meta description
  sections: BlogPageSection[]; // ordered sections
  faq: BlogPageFAQEntry[];  // FAQ entries
  blocks?: BlogPageBlock[];  // visual builder blocks; legacy sections remain supported
  settings?: BlogPageSettings;
  visible: boolean;         // publish flag
  createdAt: number;        // epoch ms
  updatedAt: number;        // epoch ms
}

export type { AdminBlogMainCategory };
