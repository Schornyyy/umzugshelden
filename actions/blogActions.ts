"use server";

// lib/actions/posts.ts
'use server';

import { WPPost } from "@/types/wordpressTypes";

function getAuthHeaders() {
  const user = process.env.WP_REST_USER;
  const appPwd = process.env.WP_REST_APP_PWD;
  if (user && appPwd) {
    const token = Buffer.from(`${user}:${appPwd}`).toString('base64');
    return { Authorization: `Basic ${token}` } as Record<string, string>;
  }
  return {} as Record<string, string>;
}

export async function getPosts(): Promise<WPPost[]> {
  const res = await fetch(
    'https://gs-creatives.de/wp-json/wp/v2/posts?per_page=9&acf_format=standard&_fields=id,slug,title,excerpt,date,acf',
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) throw new Error('Fehler beim Laden der Beiträge');

  return res.json() as Promise<WPPost[]>;
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const publicRes = await fetch(
    `https://gs-creatives.de/wp-json/wp/v2/posts?slug=${slug}&acf_format=standard&_fields=id,slug,title,content,excerpt,date,acf`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!publicRes.ok) throw new Error('Fehler beim Laden des Beitrags');

  const posts = (await publicRes.json()) as WPPost[];
  let base = posts[0] ?? null;

  if (!base) return null;

  const contentLen = base?.content?.rendered?.length ?? 0;

  // Optional: authenticated refetch if content is empty, using context=edit
  if (contentLen === 0) {
    try {
      const headers = getAuthHeaders();
      if (headers.Authorization) {
        const authRes = await fetch(
          `https://gs-creatives.de/wp-json/wp/v2/posts/${base.id}?context=edit&acf_format=standard&_fields=id,slug,title,content,excerpt,date,acf`,
          {
            headers,
            next: { revalidate: 0 },
          }
        );
        if (authRes.ok) {
          const authPost = (await authRes.json()) as {
            id?: number;
            content?: { rendered?: string; raw?: string };
            acf?: unknown;
          };
          // Merge content (raw or rendered) if present
          const mergedContent = authPost?.content?.rendered || authPost?.content?.raw || '';
          if (typeof mergedContent === 'string' && mergedContent.trim().length > 0) {
            base = { ...base, content: { rendered: mergedContent } } as WPPost;
          }
          // Merge ACF via v3 if missing
          if (!base.acf || (typeof base.acf === 'object' && Object.keys(base.acf).length === 0)) {
            try {
              const acfRes = await fetch(
                `https://gs-creatives.de/wp-json/acf/v3/posts/${base.id}`,
                { headers, next: { revalidate: 0 } }
              );
              if (acfRes.ok) {
                const acfData = await acfRes.json();
                let mergedAcf: Record<string, unknown> = {};
                if (acfData && typeof acfData === 'object') {
                  const acfObj = acfData as Record<string, unknown>;
                  mergedAcf = (acfObj.acf as Record<string, unknown>) ?? acfObj;
                }
                base = { ...base, acf: mergedAcf } as WPPost;
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  // Wenn keine ACF-Felder vorhanden sind, versuche sie über die ACF v3 API nachzuladen
  if (!base.acf || (typeof base.acf === 'object' && Object.keys(base.acf).length === 0)) {
    try {
      const acfRes = await fetch(
        `https://gs-creatives.de/wp-json/acf/v3/posts/${base.id}`,
        { next: { revalidate: 60 } }
      );
      if (acfRes.ok) {
        const acfData = (await acfRes.json()) as unknown;
        let mergedAcf: Record<string, unknown> = {};
        if (acfData && typeof acfData === 'object') {
          const acfObj = acfData as Record<string, unknown>;
          mergedAcf = (acfObj.acf as Record<string, unknown>) ?? acfObj;
        }
        const merged: WPPost = { ...base, acf: mergedAcf };
        return merged;
      }
    } catch {
      // ACF API nicht verfügbar; fahre mit Basis-Post fort
    }
  }

  return base;
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
  if (!categories.length) {
    console.warn('[Blog][getPostsByCategory] Keine Kategorie gefunden', { categorySlug });
    return [];
  }

  const categoryId = categories[0].id;

  // Reduzierte Felder, um Payload klein zu halten
  const postsRes = await fetch(
    `https://gs-creatives.de/wp-json/wp/v2/posts?categories=${categoryId}&per_page=9&acf_format=standard&_fields=id,slug,title,excerpt,date,acf`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!postsRes.ok) {
    throw new Error('Fehler beim Laden der Beiträge zur Kategorie');
  }

  const posts = await postsRes.json();
  console.log('[Blog][getPostsByCategory] geladen', { categorySlug, categoryId, count: Array.isArray(posts) ? posts.length : 0 });
  
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
          let mergedAcf: Record<string, unknown> = {};
          if (acfData && typeof acfData === 'object') {
            const acfObj = acfData as Record<string, unknown>;
            mergedAcf = (acfObj.acf as Record<string, unknown>) ?? acfObj;
          }
          return { ...post, acf: mergedAcf } as WPPost;
        }
      } catch {
        // ACF API nicht verfügbar - verwende Standard-Post
      }
      
      return post;
    })
  );

  return postsWithACF;
}

