"use server";

// lib/actions/posts.ts
'use server';

import { WPPost } from "@/types/wordpressTypes";



export async function getPosts(): Promise<WPPost[]> {
  const res = await fetch('https://gs-creatives.de/wp-json/wp/v2/posts?_embed&acf_format=standard', {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error('Fehler beim Laden der Beiträge');

  return res.json() as Promise<WPPost[]>;
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const res = await fetch(
    `https://gs-creatives.de/wp-json/wp/v2/posts?slug=${slug}&_embed&acf_format=standard`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) throw new Error('Fehler beim Laden des Beitrags');

  const posts = (await res.json()) as WPPost[];
  return posts[0] ?? null;
}

export async function getPostsByCategory(categorySlug: string): Promise<WPPost[]> {
  const catRes = await fetch(
    `https://gs-creatives.de/wp-json/wp/v2/categories?slug=${categorySlug}`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!catRes.ok) throw new Error('Fehler beim Laden der Kategorie');

  const categories = await catRes.json();
  if (!categories.length) return [];

  const categoryId = categories[0].id;

  // Standard WordPress API mit ACF-Parametern
  const postsRes = await fetch(
    `https://gs-creatives.de/wp-json/wp/v2/posts?categories=${categoryId}&per_page=9&_embed&acf_format=standard`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!postsRes.ok) {
    throw new Error('Fehler beim Laden der Beiträge zur Kategorie');
  }

  const posts = await postsRes.json();
  
  // Mit ACF to REST API Plugin ACF-Felder laden (falls verfügbar)
  const postsWithACF = await Promise.all(
    posts.map(async (post: WPPost) => {
      // Prüfe, ob ACF-Felder bereits vorhanden sind
      if (post.acf && typeof post.acf === 'object' && Object.keys(post.acf).length > 0) {
        return post;
      }

      try {
        // ACF REST API v3 verwenden
        const acfRes = await fetch(
          `https://gs-creatives.de/wp-json/acf/v3/posts/${post.id}`,
          { next: { revalidate: 60 } }
        );
        
        if (acfRes.ok) {
          const acfData = await acfRes.json();
          
          if (acfData && typeof acfData === 'object' && Object.keys(acfData).length > 0) {
            return { ...post, acf: acfData };
          }
        }
      } catch {
        // ACF API nicht verfügbar - verwende Standard-Post
      }
      
      return post;
    })
  );

  return postsWithACF;
}

