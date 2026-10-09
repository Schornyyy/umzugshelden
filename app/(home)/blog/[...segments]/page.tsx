import {
  getBlogPageByPath,
  listAllBlogPages,
  listBlogPagesBySubcategory,
} from "@/actions/blogPageActions";
import {
  getBlogSubcategoryBySlug,
  listBlogSubcategories,
} from "@/actions/blogSubcategoryActions";
import { BlogBlocksRenderer } from "@/components/blog/BlogBlockRenderer";
import { RichTextRender } from "@/components/RichTextRender";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { normalizeBlogPageSettings } from "@/lib/blogBuilder";
import type { AdminBlogMainCategory } from "@/types/blog/AdminBlogCategory";
import type { BlogPage } from "@/types/blog/BlogPage";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const MAIN_CATEGORY_INFO: Record<
  AdminBlogMainCategory,
  { label: string; description: string }
> = {
  umzug: {
    label: "Umzug",
    description: "Planung, Vorbereitung und praktische Tipps für den Umzug",
  },
  streicharbeit: {
    label: "Streicharbeiten",
    description: "Wissen rund um Renovierung, Farben und saubere Übergaben",
  },
  ratgeber: { label: "Ratgeber", description: "Guides, Hilfe & Wissen" },
  entrümpelung: {
    label: "Entrümpelung",
    description: "Tipps für Haushaltsauflösung, Entsorgung und Werterhalt",
  },
};

type Props = {
  params: Promise<{ segments: string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { segments } = await params;
  const page = await getBlogPageByPath(segments.join("/"));
  if (page?.visible) {
    const description = page.meta_description || page.description.slice(0, 155);
    return {
      title: page.titel,
      description,
      keywords: page.keywords,
      openGraph: {
        title: page.titel,
        description,
        type: "article",
        images: page.thumbnailUrl
          ? [{ url: page.thumbnailUrl, alt: page.titel }]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: page.titel,
        description,
        images: page.thumbnailUrl ? [page.thumbnailUrl] : undefined,
      },
    };
  }

  if (segments.length === 1) {
    const info = MAIN_CATEGORY_INFO[segments[0] as AdminBlogMainCategory];
    if (info) return { title: `${info.label} | Blog`, description: info.description };
  }

  if (segments.length === 2) {
    const subcategory = await getBlogSubcategoryBySlug(segments[1]);
    if (subcategory?.mainCategory === segments[0]) {
      return {
        title: `${subcategory.name} | Blog`,
        description: `Tipps, Wissen und Beiträge rund um ${subcategory.name}.`,
      };
    }
  }

  return { title: "Blogseite nicht gefunden" };
}

function PageCard({ page }: { page: BlogPage }) {
  const href = `/blog/${page.path || `${page.mainCategory}/${page.subcategorySlug}/${page.slug}`}`;
  return (
    <li className='flex flex-col gap-3 rounded-lg border bg-white p-4'>
      {page.thumbnailUrl && (
        <div className='aspect-video overflow-hidden rounded-md bg-slate-100'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={page.thumbnailUrl} alt={page.titel} className='h-full w-full object-cover' />
        </div>
      )}
      <h2 className='text-lg font-medium'><Link href={href}>{page.titel}</Link></h2>
      <p className='line-clamp-3 text-sm text-slate-600'>{page.description}</p>
      <Link href={href} className='mt-auto text-sm font-medium text-green-700 hover:underline'>
        Weiterlesen
      </Link>
    </li>
  );
}

async function LegacyOverview({ segments }: { segments: string[] }) {
  if (segments.length === 1) {
    const category = segments[0] as AdminBlogMainCategory;
    const info = MAIN_CATEGORY_INFO[category];
    if (!info) notFound();
    const subcategories = (await listBlogSubcategories()).filter(
      (subcategory) => subcategory.mainCategory === category,
    );
    return (
      <main className='mx-auto max-w-5xl space-y-8 px-4 py-10'>
        <header className='space-y-2'>
          <h1 className='text-3xl font-semibold'>{info.label}</h1>
          <p className='text-slate-600'>{info.description}</p>
        </header>
        <ul className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {subcategories.map((subcategory) => (
            <li key={subcategory.id} className='rounded-lg border bg-white p-4'>
              <h2 className='text-lg font-medium'>{subcategory.name}</h2>
              <Link href={`/blog/${category}/${subcategory.slug}`} className='mt-3 inline-block text-sm text-green-700 hover:underline'>
                Beiträge ansehen
              </Link>
            </li>
          ))}
        </ul>
      </main>
    );
  }

  if (segments.length === 2) {
    const subcategory = await getBlogSubcategoryBySlug(segments[1]);
    if (!subcategory || subcategory.mainCategory !== segments[0]) notFound();
    const pages = (await listBlogPagesBySubcategory(subcategory.slug)).filter(
      (page) => page.visible,
    );
    return (
      <main className='mx-auto max-w-5xl space-y-8 px-4 py-10'>
        <nav className='text-xs text-slate-500'>
          <Link href='/blog'>Blog</Link> / <Link href={`/blog/${segments[0]}`}>{segments[0]}</Link> / {subcategory.name}
        </nav>
        <h1 className='text-3xl font-semibold'>{subcategory.name}</h1>
        {pages.length ? (
          <ul className='grid gap-6 md:grid-cols-2'>{pages.map((page) => <PageCard key={page.id} page={page} />)}</ul>
        ) : (
          <p className='text-sm text-slate-500'>Noch keine Beiträge vorhanden.</p>
        )}
      </main>
    );
  }

  notFound();
}

async function BlogPageView({ page }: { page: BlogPage }) {
  const settings = normalizeBlogPageSettings(page.settings);
  const path = page.path || `${page.mainCategory}/${page.subcategorySlug}/${page.slug}`;
  const segments = path.split("/");
  const allPages = await listAllBlogPages();
  const labels = new Map(allPages.map((item) => [item.path, item.titel]));
  const contentWidthClass = {
    narrow: "max-w-4xl",
    normal: "max-w-6xl",
    wide: "max-w-7xl",
  }[settings.contentWidth];

  return (
    <div
      className={`min-h-screen px-3 py-8 sm:px-6 sm:py-12 ${settings.fontFamily === "serif" ? "font-serif" : "font-sans"}`}
      style={{ backgroundColor: settings.pageBackground, color: settings.textColor }}>
      <article
        className={`${contentWidthClass} mx-auto flex flex-col gap-12 overflow-hidden`}
        style={{ backgroundColor: settings.contentBackground }}>
        <header className='mx-auto w-full max-w-4xl space-y-5 px-5 pb-10 pt-6 text-center sm:px-10 sm:pt-10'>
          {settings.showBreadcrumbs && (
            <nav className='mb-10 flex flex-wrap justify-center gap-1 text-xs opacity-70'>
              <Link href='/blog'>Blog</Link>
              {segments.map((segment, index) => {
                const currentPath = segments.slice(0, index + 1).join("/");
                const isCurrent = index === segments.length - 1;
                return (
                  <span key={currentPath} className='flex gap-1'>
                    <span>/</span>
                    {isCurrent ? (
                      <span className='font-medium'>{page.titel}</span>
                    ) : (
                      <Link href={`/blog/${currentPath}`} className='hover:underline'>
                        {labels.get(currentPath) || segment.replaceAll("-", " ")}
                      </Link>
                    )}
                  </span>
                );
              })}
            </nav>
          )}
          <h1 className='text-3xl font-bold tracking-tight sm:text-4xl' style={{ color: settings.headingColor }}>
            {page.titel}
          </h1>
          <p className='mx-auto max-w-2xl text-sm leading-6 opacity-80'>{page.description}</p>
          {settings.showThumbnail && page.thumbnailUrl && (
            <div className='mx-auto mt-8 aspect-video w-full max-w-3xl overflow-hidden rounded-md bg-slate-100'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={page.thumbnailUrl} alt={page.titel} className='h-full w-full object-cover' />
            </div>
          )}
        </header>

        {page.blocks?.length ? (
          <BlogBlocksRenderer blocks={page.blocks} accentColor={settings.accentColor} headingColor={settings.headingColor} />
        ) : (
          <div className='mx-auto w-full max-w-4xl space-y-12 px-5 sm:px-10'>
            {page.sections.map((section, index) => (
              <section key={`${section.titel}-${index}`} className='space-y-4'>
                <h2 className='text-2xl font-semibold' style={{ color: settings.headingColor }}>{section.titel}</h2>
                {section.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={section.image} alt={section.titel} className='w-full rounded object-cover' />
                )}
                <RichTextRender value={section.text} />
              </section>
            ))}
          </div>
        )}

        {!!page.faq?.length && (
          <section className='mx-auto w-full max-w-4xl space-y-4 px-5 py-8 sm:px-10'>
            <h2 className='text-2xl font-semibold' style={{ color: settings.headingColor }}>Häufige Fragen</h2>
            <Accordion type='single' collapsible className='rounded-md border bg-white px-3 text-slate-800'>
              {page.faq.map((entry, index) => (
                <AccordionItem key={`${entry.question}-${index}`} value={`faq-${index}`}>
                  <AccordionTrigger>{entry.question}</AccordionTrigger>
                  <AccordionContent><RichTextRender value={entry.answer} /></AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {settings.showCta && (
          <section className='mx-5 mb-10 flex flex-col gap-6 rounded-md p-8 text-white md:mx-10 md:flex-row md:items-center' style={{ backgroundColor: settings.accentColor }}>
            <div className='flex-1 space-y-2'>
              <h2 className='text-xl font-semibold'>{settings.ctaTitle}</h2>
              <p className='text-sm opacity-90'>{settings.ctaText}</p>
            </div>
            <Link href={settings.ctaUrl} className='rounded bg-white px-5 py-3 text-sm font-medium text-slate-900'>{settings.ctaLabel}</Link>
          </section>
        )}
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: page.titel,
              description: page.meta_description || page.description,
              image: page.thumbnailUrl || undefined,
              mainEntityOfPage: { "@type": "WebPage", "@id": `/blog/${path}` },
              datePublished: new Date(page.createdAt).toISOString(),
              dateModified: new Date(page.updatedAt).toISOString(),
            }),
          }}
        />
      </article>
    </div>
  );
}

export default async function DynamicBlogPage({ params }: Props) {
  const { segments } = await params;
  const page = await getBlogPageByPath(segments.join("/"));
  if (page) {
    if (!page.visible) notFound();
    return <BlogPageView page={page} />;
  }
  return <LegacyOverview segments={segments} />;
}
