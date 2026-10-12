export interface SeoPageMetrics {
  url: string;
  finalUrl: string;
  statusCode: number;
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  canonical: string;
  robots: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  wordCount: number;
  topKeywords: Array<{ keyword: string; count: number }>;
  trackedKeywords: Array<{ keyword: string; count: number }>;
  schemaTypes: string[];
  images: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  score: number;
}

export interface SeoRecommendation {
  priority: "hoch" | "mittel" | "niedrig";
  area: string;
  finding: string;
  action: string;
  competitorExample?: string;
}

export interface SeoPageBlueprintSection {
  order: number;
  sectionType: string;
  headingLevel: "H1" | "H2" | "H3" | "ohne Überschrift";
  heading: string;
  purpose: string;
  contentBrief: string;
  keyPoints: string[];
  targetWordCount: number;
  keywords: string[];
  cta?: string;
}

export interface SeoPageBlueprint {
  searchIntent: string;
  targetAudience: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  recommendedWordCount: number;
  tone: string;
  sections: SeoPageBlueprintSection[];
  primaryCta: string;
  secondaryCta: string;
  trustElements: string[];
  internalLinkSuggestions: Array<{
    anchorText: string;
    targetPage: string;
    sectionOrder?: number;
  }>;
  schemaRecommendations: string[];
}

export interface SeoAiReport {
  summary: string;
  strengths: string[];
  competitorAdvantages: string[];
  recommendations: SeoRecommendation[];
  suggestedTitle: string;
  suggestedMetaDescription: string;
  suggestedH1: string;
  contentOutline: Array<{ heading: string; goal: string; keywords: string[] }>;
  suggestedFaqs: Array<{ question: string; answerGuidance: string }>;
  pageBlueprint?: SeoPageBlueprint;
}

export interface SeoFetchFailure {
  url: string;
  error: string;
}

export interface SeoAnalysisRun {
  id: string;
  ownerId: string;
  citySlug: string;
  urls: string[];
  keywords: string[];
  pages: SeoPageMetrics[];
  failures: SeoFetchFailure[];
  report: SeoAiReport;
  targetRank?: number;
  createdAt: string;
}
