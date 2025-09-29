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
  visible: boolean;         // publish flag
  createdAt: number;        // epoch ms
  updatedAt: number;        // epoch ms
}

export type { AdminBlogMainCategory };
