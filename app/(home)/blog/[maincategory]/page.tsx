import { listBlogSubcategories } from "@/actions/blogSubcategoryActions";
import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import Link from "next/link";
import { notFound } from "next/navigation";

// Define allowed main categories (must match type)
const MAIN_CATEGORY_INFO: Record<
  AdminBlogMainCategory,
  { label: string; description: string }
> = {
  unternehmen: {
    label: "Unternehmen",
    description: "Tipps & Wissen für Firmen",
  },
  partner: {
    label: "Partner",
    description: "Informationen für Kooperationspartner",
  },
  ratgeber: { label: "Ratgeber", description: "Guides, Hilfe & Wissen" },
  ereignisse: {
    label: "Ereignisse",
    description: "Aktuelles & Veranstaltungen",
  },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ maincategory: string }>; // params delivered async (Next.js requirement)
}

export default async function MainCategoryOverview({ params }: Props) {
  const { maincategory } = await params; // await the params promise
  const key = maincategory as AdminBlogMainCategory;
  if (!Object.keys(MAIN_CATEGORY_INFO).includes(key)) {
    notFound();
  }

  const info = MAIN_CATEGORY_INFO[key];
  const all = await listBlogSubcategories();
  const subs = all.filter((s) => s.mainCategory === key);

  return (
    <div className='max-w-5xl mx-auto px-4 py-10 space-y-10'>
      <header className='space-y-3'>
        <h1 className='text-3xl font-semibold'>{info.label}</h1>
        <p className='text-slate-600 text-sm'>{info.description}</p>
        <nav className='text-xs flex gap-2 text-slate-500'>
          <Link
            href='/blog/unternehmen'
            className={
              key === "unternehmen"
                ? "font-semibold text-blue-600"
                : "hover:text-blue-600"
            }>
            Unternehmen
          </Link>
          <span>|</span>
          <Link
            href='/blog/partner'
            className={
              key === "partner"
                ? "font-semibold text-blue-600"
                : "hover:text-blue-600"
            }>
            Partner
          </Link>
          <span>|</span>
          <Link
            href='/blog/ratgeber'
            className={
              key === "ratgeber"
                ? "font-semibold text-blue-600"
                : "hover:text-blue-600"
            }>
            Ratgeber
          </Link>
          <span>|</span>
          <Link
            href='/blog/ereignisse'
            className={
              key === "ereignisse"
                ? "font-semibold text-blue-600"
                : "hover:text-blue-600"
            }>
            Ereignisse
          </Link>
        </nav>
      </header>
      {subs.length === 0 && (
        <p className='text-sm text-slate-500'>
          Noch keine Unterkategorien vorhanden.
        </p>
      )}
      {subs.length > 0 && (
        <ul className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {subs.map((s) => (
            <li
              key={s.id}
              className='border rounded-lg p-4 bg-white flex flex-col gap-3'>
              {s.thumbnailUrl && (
                <div className='aspect-video w-full overflow-hidden rounded-md bg-slate-100'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.thumbnailUrl}
                    alt={s.name}
                    className='object-cover w-full h-full'
                  />
                </div>
              )}
              <div className='space-y-1'>
                <h2 className='font-medium text-lg'>{s.name}</h2>
              </div>
              <div>
                <Link
                  href={`/blog/${key}/${s.slug}`}
                  className='text-sm text-blue-600 hover:underline'>
                  Beiträge ansehen
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
