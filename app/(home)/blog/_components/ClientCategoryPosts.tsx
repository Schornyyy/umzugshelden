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
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<WPPost[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const byCat = await getPostsByCategory(categorySlug);
        let base = byCat;
        if (byCat.length === 0) {
          console.warn(
            "[Blog][ClientCategoryPosts] Keine Beiträge in Kategorie",
            { categorySlug }
          );
          setNotice(
            "Keine Beiträge in der ausgewählten Kategorie gefunden. Zeige neueste Beiträge."
          );
          base = await getPosts();
        }
        setPosts(base);
        setFiltered(base);
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

  // Filter client-side to avoid extra requests
  useEffect(() => {
    let current = posts;
    if (activeLetter) {
      current = current.filter((p) =>
        (p.title?.rendered || "")
          .trim()
          .toLowerCase()
          .startsWith(activeLetter.toLowerCase())
      );
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      current = current.filter(
        (p) =>
          (p.title?.rendered || "").toLowerCase().includes(s) ||
          (p.excerpt?.rendered || "").toLowerCase().includes(s)
      );
    }
    setFiltered(current);
  }, [activeLetter, search, posts]);

  if (loading) return <div>Lade Beiträge...</div>;

  if (!posts.length) return <div>Keine Beiträge gefunden.</div>;

  const letters = Array.from(
    new Set(
      posts
        .map((p) => (p.title?.rendered || "").trim().charAt(0).toUpperCase())
        .filter((ch) => /[A-ZÄÖÜ]/i.test(ch))
    )
  ).sort();

  return (
    <>
      {notice && (
        <div className='mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3'>
          {notice}
        </div>
      )}
      {/* Alphabet Filter & Suche */}
      <div className='mb-6 flex flex-col gap-4'>
        <div className='flex flex-wrap gap-2'>
          {["Alle", ...letters].map((letter) => {
            const isActive =
              (letter === "Alle" && !activeLetter) || activeLetter === letter;
            return (
              <button
                key={letter}
                onClick={() =>
                  setActiveLetter(letter === "Alle" ? null : letter)
                }
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white hover:bg-green-50 border-gray-300 text-gray-700"
                }`}>
                {letter}
              </button>
            );
          })}
        </div>
        <div>
          <input
            type='text'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Suche nach Beiträgen...'
            className='w-full md:w-1/2 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
          />
        </div>
        <div className='text-sm text-gray-500'>
          {filtered.length} Beitrag{filtered.length !== 1 && "e"} angezeigt
        </div>
      </div>
      <ul className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {filtered.map((post) => (
          <li
            key={post.id}
            className='mb-8 border-b pb-4 w-full bg-white p-3 rounded-lg shadow hover:shadow-lg transition-shadow duration-300'>
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
