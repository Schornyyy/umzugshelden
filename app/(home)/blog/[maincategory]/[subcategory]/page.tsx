import { listBlogPagesBySubcategory } from "@/actions/blogPageActions";
import { getBlogSubcategoryBySlug } from "@/actions/blogSubcategoryActions";
import type { AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ maincategory: string; subcategory: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ maincategory: string; subcategory: string }>;
}): Promise<Metadata> {
  const { maincategory, subcategory } = await params;
  const sub = await getBlogSubcategoryBySlug(subcategory);
  if (!sub || sub.mainCategory !== (maincategory as AdminBlogMainCategory)) {
    return { title: "Kategorie nicht gefunden" };
  }
  const humanMain =
    maincategory.charAt(0).toUpperCase() + maincategory.slice(1);
  const title = `${sub.name} – ${humanMain} | Blog`;
  const description = `Alle Artikel der Unterkategorie ${sub.name} in der Hauptkategorie ${humanMain}. Finde hilfreiche Inhalte, Tipps & Ressourcen.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: sub.thumbnailUrl
        ? [{ url: sub.thumbnailUrl, alt: sub.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: sub.thumbnailUrl ? [sub.thumbnailUrl] : undefined,
    },
  };
}

const PAGE_SIZE = 12;

export default async function SubcategoryPublicPage({
  params,
  searchParams,
}: Props) {
  const { maincategory, subcategory } = await params;
  const { page: pageStr } = await searchParams;
  const pageParam = parseInt(pageStr || "1", 10);
  const page = Number.isNaN(pageParam) ? 1 : pageParam;

  // Load subcategory to validate and get its mainCategory
  const sub = await getBlogSubcategoryBySlug(subcategory);
  if (!sub) {
    notFound();
  }
  if (sub.mainCategory !== (maincategory as AdminBlogMainCategory)) {
    // mismatch between route segments
    notFound();
  }

  // Load pages (cached bulk) and filter only visible for public display
  const all = await listBlogPagesBySubcategory(sub.slug);
  const visiblePages = all.filter((p) => p.visible);
  const totalVisible = visiblePages.length;
  const totalPages = Math.max(1, Math.ceil(totalVisible / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const items = visiblePages.slice(start, start + PAGE_SIZE);

  return (
    <div className='max-w-5xl mx-auto px-4 py-10 space-y-8'>
      <header className='space-y-2'>
        <nav className='text-xs text-slate-500 flex gap-1 flex-wrap'>
          <Link href='/blog/unternehmen' className='hover:underline'>
            Unternehmen
          </Link>
          <span>/</span>
          <Link
            href={`/blog/${maincategory}`}
            className='hover:underline capitalize'>
            {maincategory}
          </Link>
          <span>/</span>
          <span className='text-slate-700 font-medium'>{sub.name}</span>
        </nav>
        <h1 className='text-2xl font-semibold'>{sub.name}</h1>
      </header>

      {items.length === 0 && (
        <p className='text-sm text-slate-500'>Noch keine Beiträge vorhanden.</p>
      )}
      {items.length > 0 && (
        <ul className='grid md:grid-cols-2 gap-6'>
          {items.map((p) => (
            <li
              key={p.id}
              className='border rounded-lg p-4 bg-white flex flex-col gap-3'>
              {p.thumbnailUrl && (
                <div className='aspect-video w-full overflow-hidden rounded-md bg-slate-100'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnailUrl}
                    alt={p.titel}
                    className='object-cover w-full h-full'
                  />
                </div>
              )}
              <div className='space-y-1'>
                <h2 className='font-medium text-lg'>
                  <Link href={`/blog/${maincategory}/${subcategory}/${p.slug}`}>
                    {p.titel}
                  </Link>
                </h2>
                <p className='text-xs text-slate-500 line-clamp-3'>
                  {p.description}
                </p>
              </div>
              <div>
                <Link
                  href={`/blog/${maincategory}/${subcategory}/${p.slug}`}
                  className='text-sm text-green-600 hover:underline'>
                  Weiter lesen
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <Pagination
          current={safePage}
          totalPages={totalPages}
          basePath={`/blog/${maincategory}/${subcategory}`}
        />
      )}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `${sub.name} – ${maincategory}`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: items.map((p, idx) => ({
                "@type": "ListItem",
                position: start + idx + 1,
                url: `/blog/${maincategory}/${subcategory}/${p.slug}`,
                name: p.titel,
                description: p.description,
              })),
              numberOfItems: items.length,
            },
          }),
        }}
      />
    </div>
  );
}

interface PaginationProps {
  current: number;
  totalPages: number;
  basePath: string;
}
function Pagination({ current, totalPages, basePath }: PaginationProps) {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return (
    <div className='flex flex-wrap items-center gap-2 pt-4'>
      {pages.map((p) => (
        <Link
          key={p}
          href={p === 1 ? basePath : `${basePath}?page=${p}`}
          className={
            "px-3 py-1 rounded border text-sm " +
            (p === current
              ? "bg-green-600 border-green-600 text-white"
              : "hover:bg-slate-100")
          }>
          {p}
        </Link>
      ))}
    </div>
  );
}
