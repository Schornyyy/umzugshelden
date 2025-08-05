// lib/types/wp-types.ts

export interface WPPost {
  id: number;
  slug: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt?: {
    rendered: string;
  };
  date: string;
  categories: number[];
  featured_media: number;
  yoast_head_json?: {
    og_image?: Array<{
      url: string;
      width?: number;
      height?: number;
    }>;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      id: number;
      source_url: string;
      alt_text?: string;
      media_details?: {
        sizes?: {
          [key: string]: {
            source_url: string;
            width: number;
            height: number;
          };
        };
      };
    }>;
  };
  acf?: {
    featured_image?: {
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    };
    hero_image?: {
      url: string;
      alt?: string;
      width?: number;
      height?: number;
    };
    meta_description?: string;
    keywords?: string;
    [key: string]: unknown; // Für weitere ACF-Felder
  };
}

export interface WPCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
}
