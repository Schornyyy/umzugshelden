export const CITY_SERVICE_KEYS = [
  "umzugsservice",
  "anstricharbeiten",
  "moebel-service",
  "senior-umzug",
  "entruempelung",
] as const;

export type CityServiceKey = (typeof CITY_SERVICE_KEYS)[number];

export type CityServiceBlockTone = "white" | "muted" | "navy" | "accent";
export type CityServiceHeadingLevel = 2 | 3 | 4;

export type CityServiceBlockStyle = {
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundPosition?: "top" | "center" | "bottom";
  overlayColor?: string;
  overlayOpacity?: number;
  textColor?: string;
  accentColor?: string;
  contentWidth?: "narrow" | "boxed" | "wide" | "full";
  textAlign?: "left" | "center" | "right";
  headingSize?: number;
  textSize?: number;
  paddingTop?: number;
  paddingBottom?: number;
  marginTop?: number;
  marginBottom?: number;
  minHeight?: number;
  borderRadius?: number;
  hideOnDesktop?: boolean;
  hideOnTablet?: boolean;
  hideOnMobile?: boolean;
};

type CityServiceBlockBase = {
  id: string;
  enabled: boolean;
  tone: CityServiceBlockTone;
  headingLevel?: CityServiceHeadingLevel;
  style?: CityServiceBlockStyle;
};

export type CityServiceHeroBlock = CityServiceBlockBase & {
  type: "hero";
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  imageTitle?: string;
  imageCaption?: string;
  formTitle: string;
  formText: string;
};

export type CityServiceIntroBlock = CityServiceBlockBase & {
  type: "intro";
  heading: string;
  text: string;
};

export type CityServiceImageTextBlock = CityServiceBlockBase & {
  type: "imageText";
  eyebrow?: string;
  heading: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
  imageTitle?: string;
  imageCaption?: string;
  imagePosition: "left" | "right";
  ctaLabel?: string;
  ctaUrl?: string;
};

export type CityServiceLocalAreaBlock = CityServiceBlockBase & {
  type: "localArea";
  heading: string;
  eyebrow: string;
  nearbyLimit: number;
  showFacts: boolean;
};

export type CityServiceCardGridBlock = CityServiceBlockBase & {
  type: "cardGrid";
  eyebrow?: string;
  heading: string;
  intro?: string;
  cards: { title: string; text: string }[];
  columns: 2 | 3 | 4;
  numbered: boolean;
};

export type CityServiceCheckListBlock = CityServiceBlockBase & {
  type: "checkList";
  heading: string;
  intro?: string;
  items: string[];
  columns: 1 | 2 | 3;
};

export type CityServiceProcessBlock = CityServiceBlockBase & {
  type: "process";
  heading: string;
  intro?: string;
  steps: string[];
};

export type CityServicePricingBlock = CityServiceBlockBase & {
  type: "pricing";
  eyebrow?: string;
  heading: string;
  text: string;
  factors: string[];
  ctaTitle: string;
  ctaText: string;
  ctaLabel: string;
};

export type CityServiceFaqBlock = CityServiceBlockBase & {
  type: "faq";
  heading: string;
  items: { question: string; answer: string }[];
  includeLocalQuestion: boolean;
};

export type CityServiceContactBlock = CityServiceBlockBase & {
  type: "contact";
  heading: string;
  text: string;
  showPhone: boolean;
  showEmail: boolean;
  showForm: boolean;
};

export type CityServiceNearbyCitiesBlock = CityServiceBlockBase & {
  type: "nearbyCities";
  heading: string;
  intro: string;
  limit: number;
  radiusKm: number;
  showDistance: boolean;
};

export type CityServiceOtherServicesBlock = CityServiceBlockBase & {
  type: "otherServices";
  heading: string;
};

export type CityServiceCardsBlock = CityServiceBlockBase & {
  type: "serviceCards";
  heading: string;
  serviceKeys: CityServiceKey[];
};

export type CityServiceCtaBlock = CityServiceBlockBase & {
  type: "cta";
  eyebrow?: string;
  heading: string;
  text: string;
  primaryLabel: string;
  primaryUrl: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
};

export type CityServiceStatsBlock = CityServiceBlockBase & {
  type: "stats";
  heading?: string;
  items: { value: string; label: string }[];
  columns: 2 | 3 | 4;
};

export type CityServiceTestimonialsBlock = CityServiceBlockBase & {
  type: "testimonials";
  heading: string;
  items: {
    quote: string;
    name: string;
    role?: string;
    avatar?: string;
    source?: string;
    rating: 1 | 2 | 3 | 4 | 5;
  }[];
  columns: 1 | 2 | 3;
};

export type CityServiceGalleryBlock = CityServiceBlockBase & {
  type: "gallery";
  heading: string;
  intro?: string;
  images: { src: string; alt: string; title?: string; caption?: string }[];
  columns: 2 | 3 | 4;
  aspectRatio: "square" | "landscape" | "portrait";
};

export type CityServiceVideoBlock = CityServiceBlockBase & {
  type: "video";
  heading: string;
  text?: string;
  videoUrl: string;
  poster?: string;
  caption?: string;
};

export type CityServiceLogoCloudBlock = CityServiceBlockBase & {
  type: "logoCloud";
  heading: string;
  logos: { src: string; alt: string; url?: string }[];
  columns: 3 | 4 | 5 | 6;
};

export type CityServiceAccordionBlock = CityServiceBlockBase & {
  type: "accordion";
  heading: string;
  intro?: string;
  items: { title: string; content: string }[];
};

export type CityServiceSpacerBlock = CityServiceBlockBase & {
  type: "spacer";
  height: number;
  showDivider: boolean;
  dividerColor: string;
  dividerWidth: 1 | 2 | 3;
};

export type CityServiceCarouselBlock = CityServiceBlockBase & {
  type: "carousel";
  heading?: string;
  intro?: string;
  slides: {
    image: string;
    imageAlt: string;
    imageTitle?: string;
    imageCaption?: string;
    heading?: string;
    text?: string;
    linkLabel?: string;
    linkUrl?: string;
  }[];
  autoplay: boolean;
  interval: number;
  showArrows: boolean;
  showDots: boolean;
};

export type CityServiceImageCollageBlock = CityServiceBlockBase & {
  type: "imageCollage";
  eyebrow?: string;
  heading: string;
  text: string;
  images: { src: string; alt: string; title?: string; caption?: string }[];
  imagePosition: "left" | "right";
  layout: "stacked" | "fan" | "mosaic";
};

export type CityServiceBeforeAfterBlock = CityServiceBlockBase & {
  type: "beforeAfter";
  heading: string;
  text?: string;
  beforeImage: string;
  beforeAlt: string;
  beforeLabel: string;
  afterImage: string;
  afterAlt: string;
  afterLabel: string;
};

export type CityServiceImageCardsBlock = CityServiceBlockBase & {
  type: "imageCards";
  heading: string;
  intro?: string;
  cards: {
    image: string;
    imageAlt: string;
    title: string;
    text: string;
    linkLabel?: string;
    linkUrl?: string;
  }[];
  columns: 2 | 3 | 4;
  overlay: boolean;
};

export type CityServiceTeamBlock = CityServiceBlockBase & {
  type: "team";
  heading: string;
  intro?: string;
  members: {
    image: string;
    imageAlt: string;
    name: string;
    role: string;
    text?: string;
  }[];
  columns: 2 | 3 | 4;
};

export type CityServiceBlock =
  | CityServiceHeroBlock
  | CityServiceIntroBlock
  | CityServiceImageTextBlock
  | CityServiceLocalAreaBlock
  | CityServiceCardGridBlock
  | CityServiceCheckListBlock
  | CityServiceProcessBlock
  | CityServicePricingBlock
  | CityServiceFaqBlock
  | CityServiceContactBlock
  | CityServiceNearbyCitiesBlock
  | CityServiceOtherServicesBlock
  | CityServiceCardsBlock
  | CityServiceCtaBlock
  | CityServiceStatsBlock
  | CityServiceTestimonialsBlock
  | CityServiceGalleryBlock
  | CityServiceVideoBlock
  | CityServiceLogoCloudBlock
  | CityServiceAccordionBlock
  | CityServiceSpacerBlock
  | CityServiceCarouselBlock
  | CityServiceImageCollageBlock
  | CityServiceBeforeAfterBlock
  | CityServiceImageCardsBlock
  | CityServiceTeamBlock;

export type CityServiceBlockType = CityServiceBlock["type"];

export type CityServiceSeoSettings = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  schemaDescription: string;
  keywords: string[];
};

export interface CityServiceTemplate {
  id: string;
  ownerId: string;
  serviceKey: CityServiceKey;
  serviceName: string;
  primaryKeyword: string;
  blocks: CityServiceBlock[];
  seo: CityServiceSeoSettings;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface CityServicePage {
  id: string;
  ownerId: string;
  cityName: string;
  citySlug: string;
  serviceKey: CityServiceKey;
  templateId: string;
  inheritTemplate: boolean;
  blocks?: CityServiceBlock[];
  seo?: Partial<CityServiceSeoSettings>;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  migratedAt?: number;
}

export interface ResolvedCityServicePage {
  page: CityServicePage;
  template: CityServiceTemplate;
  blocks: CityServiceBlock[];
  seo: CityServiceSeoSettings;
}

export interface CityLandingTemplate {
  id: string;
  ownerId: string;
  blocks: CityServiceBlock[];
  seo: CityServiceSeoSettings;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export interface CityLandingPage {
  id: string;
  ownerId: string;
  cityName: string;
  citySlug: string;
  templateId: string;
  inheritTemplate: boolean;
  blocks?: CityServiceBlock[];
  seo?: Partial<CityServiceSeoSettings>;
  published: boolean;
  createdAt: number;
  updatedAt: number;
  migratedAt?: number;
}

export interface ResolvedCityLandingPage {
  page: CityLandingPage;
  template: CityLandingTemplate;
  blocks: CityServiceBlock[];
  seo: CityServiceSeoSettings;
}