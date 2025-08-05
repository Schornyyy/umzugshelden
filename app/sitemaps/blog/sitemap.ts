
import { getPostsByCategory } from "@/actions/blogActions";
import type { MetadataRoute } from "next";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogs = await getPostsByCategory("landschaftshelden")


  const blogPages = blogs.map((blog) => ({
        url: `https://landschaftshelden.io/blog/${blog.slug}`,
    lastModified: new Date(blog.date), // Das Datum des Blogs verwenden
    priority: 0.8,
    alternates: {
      languages: {
        de: `https://landschaftshelden.io/blog/${blog.slug}`,
      },
    },
  }));



  return [...blogPages]
}
