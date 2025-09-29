import type { AdminBlogMainCategory } from './AdminBlogCategory';

export interface BlogSubcategory {
  id: string;            // Firestore document ID
  name: string;          // Display name entered by admin
  slug: string;          // URL slug (unique per mainCategory)
  mainCategory: AdminBlogMainCategory; // parent main category
  thumbnailUrl?: string; // optional thumbnail for listings
  createdAt: number;     // epoch ms
  updatedAt: number;     // epoch ms
}

export type { AdminBlogMainCategory };
