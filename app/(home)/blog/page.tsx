import {
  listPublicBlogPages,
  listPublicBlogSubcategories,
} from "@/lib/blogPublicData";
import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Ratgeber",
  description:
    "Alle Ratgeber und Blogbeiträge zu Umzug, Streicharbeiten, Möbelservice und Entrümpelung.",
};

const categories: Array<{
  key: AdminBlogMainCategory;
  label: string;
  description: string;
}> = [
  {
    key: "umzug",
    label: "Umzug",
    description: "Planung, Vorbereitung und praktische Umzugstipps",
  },
  {
    key: "streicharbeit",
    label: "Streicharbeiten",
    description: "Renovierung, Farben und saubere Übergaben",
  },
  {
    key: "ratgeber",
    label: "Ratgeber",
    description: "Hilfen und Wissen rund um unsere Leistungen",
  },
  {
    key: "entrümpelung",
    label: "Entrümpelung",
    description: "Haushaltsauflösung, Entsorgung und Werterhalt",
  },
];

export default async function BlogOverview() {
  const [pages, subcategories] = await Promise.all([
    listPublicBlogPages(),
    listPublicBlogSubcategories(),
  ]);
  const visiblePages = pages;

  return (
    <main className='mx-auto max-w-6xl space-y-10 px-4 py-10'>
      <header className='space-y-3'>
        <p className='text-sm font-semibold uppercase tracking-wide text-green-700'>
          Wissen & Planung
        </p>
        <h1 className='text-4xl font-bold text-slate-950'>Blog & Ratgeber</h1>
        <p className='max-w-3xl text-slate-600'>
          Entdecken Sie alle Beiträge zu Umzug, Renovierung, Möbelservice,
          Seniorenumzug und Entrümpelung.
        </p>
      </header>

      <section aria-labelledby='blog-kategorien'>
        <h2 id='blog-kategorien' className='mb-4 text-2xl font-semibold'>
          Themenbereiche
        </h2>
        <ul className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {categories.map((category) => {
            const articleCount = visiblePages.filter(
              (page) => page.mainCategory === category.key,
            ).length;
            const subcategoryCount = subcategories.filter(
              (subcategory) => subcategory.mainCategory === category.key,
            ).length;
            return (
              <li key={category.key}>
                <Link
                  href={`/blog/${category.key}`}
                  className='block h-full rounded-xl border bg-white p-5 transition hover:border-green-600 hover:shadow-sm'>
                  <h3 className='text-lg font-semibold'>{category.label}</h3>
                  <p className='mt-2 text-sm text-slate-600'>
                    {category.description}
                  </p>
                  <p className='mt-4 text-xs font-medium text-green-700'>
                    {articleCount} {articleCount === 1 ? "Beitrag" : "Beiträge"} ·{" "}
                    {subcategoryCount} Themen
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby='alle-blogbeitraege'>
        <h2 id='alle-blogbeitraege' className='mb-4 text-2xl font-semibold'>
          Alle Beiträge
        </h2>
        {visiblePages.length ? (
          <ul className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {visiblePages.map((page) => {
              const href = `/blog/${
                page.path ||
                `${page.mainCategory}/${page.subcategorySlug}/${page.slug}`
              }`;
              return (
                <li
                  key={page.id}
                  className='flex flex-col rounded-xl border bg-white p-5'>
                  <p className='text-xs font-semibold uppercase text-green-700'>
                    {categories.find(
                      (category) => category.key === page.mainCategory,
                    )?.label || page.mainCategory}
                  </p>
                  <h3 className='mt-2 text-lg font-semibold'>
                    <Link href={href}>{page.titel}</Link>
                  </h3>
                  <p className='mt-3 line-clamp-3 text-sm text-slate-600'>
                    {page.description}
                  </p>
                  <Link
                    href={href}
                    className='mt-5 text-sm font-semibold text-green-700 hover:underline'>
                    Weiterlesen
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className='text-sm text-slate-500'>
            Noch keine veröffentlichten Beiträge vorhanden.
          </p>
        )}
      </section>
    </main>
  );
}
