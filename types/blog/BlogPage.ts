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
  | "carousel"
  | "divider"
  | "spacer";

export interface BlogBlockStyle {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: "top" | "center" | "bottom";
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  accentColor?: string;
  alignment?: "left" | "center" | "right";
  width?: "narrow" | "normal" | "wide" | "full";
  padding?: "none" | "small" | "medium" | "large";
  borderRadius?: "none" | "small" | "medium" | "large";
  headingSize?: number;
  textSize?: number;
  paddingTop?: number;
  paddingBottom?: number;
  marginTop?: number;
  marginBottom?: number;
  minHeight?: number;
  borderRadiusPx?: number;
  hideOnDesktop?: boolean;
  hideOnTablet?: boolean;
  hideOnMobile?: boolean;
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
  carouselSlides?: {
    imageUrl: string;
    imageAlt: string;
    heading?: string;
    text?: string;
    linkLabel?: string;
    linkUrl?: string;
  }[];
  carouselAutoplay?: boolean;
  carouselInterval?: number;
  carouselShowArrows?: boolean;
  carouselShowDots?: boolean;
  slides?: {
    image: string;
    imageAlt: string;
    imageTitle?: string;
    imageCaption?: string;
    heading?: string;
    text?: string;
    linkLabel?: string;
    linkUrl?: string;
  }[];
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
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
  slug: string;             // editable final URL segment
  path?: string;            // complete path below /blog, without leading slash
  parentId?: string | null; // optional parent page for arbitrary nesting
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
