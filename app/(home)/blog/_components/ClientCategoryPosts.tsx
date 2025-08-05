"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Headings from "@/components/Headings";
import { WPPost } from "@/types/wordpressTypes";
import { getPostsByCategory } from "@/actions/blogActions";

const ClientCategoryPosts = ({ categorySlug }: { categorySlug: string }) => {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getPostsByCategory(categorySlug);
      setPosts(res);
      setLoading(false);
    }
    load();
  }, [categorySlug]);

  if (loading) return <div>Lade Beiträge...</div>;

  if (!posts.length) return <div>Keine Beiträge gefunden.</div>;

  return (
    <ul className='flex flex-col md:flex-row gap-12 md:gap-8'>
      {posts.map((post) => (
        <li
          key={post.id}
          className='mb-8 border-b pb-4 w-full md:w-1/3 bg-white p-3 rounded-lg shadow hover:shadow-lg transition-shadow duration-300'>
          <Link href={`/blog/${post.slug}`}>
            {post.acf?.featured_image?.url && (
              <Image
                src={post.acf.featured_image.url}
                alt={post.acf.featured_image.alt || "Beitragsbild"}
                width={700}
                height={250}
                className='rounded-lg mb-2'
              />
            )}
            <Headings level={3}>{post.title.rendered}</Headings>
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default ClientCategoryPosts;
