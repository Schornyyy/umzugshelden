/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// Switched to <img> to avoid remote host restrictions with next/image
import Headings from "@/components/Headings";
import { WPPost } from "@/types/wordpressTypes";
import { getPostsByCategory, getPosts } from "@/actions/blogActions";

const ClientCategoryPosts = ({ categorySlug }: { categorySlug: string }) => {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const byCat = await getPostsByCategory(categorySlug);
        if (byCat.length > 0) {
          setPosts(byCat);
          return;
        }
        console.warn(
          "[Blog][ClientCategoryPosts] Keine Beiträge in Kategorie",
          { categorySlug }
        );
        setNotice(
          "Keine Beiträge in der ausgewählten Kategorie gefunden. Zeige neueste Beiträge."
        );
        const latest = await getPosts();
        setPosts(latest);
      } catch (e) {
        console.error(
          "[Blog][ClientCategoryPosts] Fehler beim Laden der Beiträge",
          e
        );
        setNotice("Beiträge konnten nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [categorySlug]);

  if (loading) return <div>Lade Beiträge...</div>;

  if (!posts.length) return <div>Keine Beiträge gefunden.</div>;

  return (
    <>
      {notice && (
        <div className='mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3'>
          {notice}
        </div>
      )}
      <ul className='flex flex-col md:flex-row gap-12 md:gap-8'>
        {posts.map((post) => (
          <li
            key={post.id}
            className='mb-8 border-b pb-4 w-full md:w-1/3 bg-white p-3 rounded-lg shadow hover:shadow-lg transition-shadow duration-300'>
            <Link href={`/blog/${post.slug}`}>
              {post.acf?.featured_image?.url && (
                <img
                  src={post.acf.featured_image.url}
                  alt={post.acf.featured_image.alt || "Beitragsbild"}
                  className='rounded-lg mb-2 h-[250px] w-full object-cover'
                  loading='lazy'
                />
              )}
              <Headings level={3}>{post.title.rendered}</Headings>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};

export default ClientCategoryPosts;
