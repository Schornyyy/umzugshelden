import { getBlogPageBySlug } from "@/actions/blogPageActions";
import { getBlogSubcategoryBySlug } from "@/actions/blogSubcategoryActions";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlogPageSection } from "@/types/blog/BlogPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AdminBlogMainCategory } from "@/types/blog/BlogSubcategory";

export const dynamic = "force-dynamic";

interface ParamsPromise {
  params: Promise<{ maincategory: string; subcategory: string; slug: string }>; // Next passes promise (latest behavior)
}

export async function generateMetadata({
  params,
}: ParamsPromise): Promise<Metadata> {
  const { maincategory, subcategory, slug } = await params;
  const page = await getBlogPageBySlug(subcategory, slug);
  if (
    !page ||
    !page.visible ||
    page.mainCategory !== (maincategory as AdminBlogMainCategory)
  ) {
    return { title: "Beitrag nicht gefunden" };
  }
  const title = `${page.titel} | ${page.subcategorySlug}`;
  const description = page.meta_description || page.description.slice(0, 155);
  return {
    title,
    description,
    keywords: page.keywords,
    openGraph: {
      title,
      description,
      type: "article",
      images: page.thumbnailUrl
        ? [{ url: page.thumbnailUrl, alt: page.titel }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: page.thumbnailUrl ? [page.thumbnailUrl] : undefined,
    },
  };
}

interface DraftRawBlock {
  key: string;
  text: string;
  type: string;
  [k: string]: unknown;
}

function renderDraftRaw(raw: string) {
  // Minimal renderer for stored draft-js raw JSON (unstyled paragraphs + basic blocks)
  try {
    const parsed = JSON.parse(raw);
    const blocks: DraftRawBlock[] = parsed.blocks || [];
    return blocks.map((b) => {
      const text = b.text || "";
      if (!text.trim()) return null;
      // basic type mapping
      const key = b.key;
      switch (b.type) {
        case "header-one":
          return (
            <h2 key={key} className='text-2xl font-semibold mt-6 mb-3'>
              {text}
            </h2>
          );
        case "header-two":
          return (
            <h3 key={key} className='text-xl font-semibold mt-5 mb-2'>
              {text}
            </h3>
          );
        case "header-three":
          return (
            <h4 key={key} className='text-lg font-semibold mt-4 mb-2'>
              {text}
            </h4>
          );
        case "unordered-list-item":
        case "ordered-list-item":
          // We'll build lists in a simple pass (group sequential). Simplicity: just paragraphs with bullet.
          return (
            <p
              key={key}
              className="pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-600">
              {text}
            </p>
          );
        default:
          return (
            <p key={key} className='leading-relaxed mb-4'>
              {text}
            </p>
          );
      }
    });
  } catch {
    return (
      <p className='text-slate-500 italic'>
        (Inhalt konnte nicht geladen werden)
      </p>
    );
  }
}

function Section({
  section,
  imageLeft,
}: {
  section: BlogPageSection;
  imageLeft: boolean;
}) {
  const hasImage = !!section.image;
  return (
    <div className='flex flex-col md:flex-row gap-8 md:items-center'>
      {hasImage && imageLeft && (
        <div className='md:w-1/2'>
          <div className='w-full aspect-video rounded-lg overflow-hidden bg-slate-100'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={section.image!}
              alt={section.titel}
              className='object-cover w-full h-full'
            />
          </div>
        </div>
      )}
      <div className={hasImage ? "md:w-1/2" : "w-full"}>
        <h2 className='text-xl font-semibold mb-4'>{section.titel}</h2>
        <div className='prose max-w-none'>{renderDraftRaw(section.text)}</div>
        {section.link && (
          <p className='mt-4'>
            <a
              href={section.link}
              className='text-green-600 hover:underline text-sm'
              rel='noopener noreferrer'
              target='_blank'>
              Mehr erfahren
            </a>
          </p>
        )}
      </div>
      {hasImage && !imageLeft && (
        <div className='md:w-1/2 md:order-none'>
          <div className='w-full aspect-video rounded-lg overflow-hidden bg-slate-100'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={section.image!}
              alt={section.titel}
              className='object-cover w-full h-full'
            />
          </div>
        </div>
      )}
    </div>
  );
}

// FAQ accordion handled inline below

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ maincategory: string; subcategory: string; slug: string }>;
}) {
  const { maincategory, subcategory, slug } = await params;
  const sub = await getBlogSubcategoryBySlug(subcategory);
  if (!sub || sub.mainCategory !== (maincategory as AdminBlogMainCategory)) {
    notFound();
  }
  const page = await getBlogPageBySlug(subcategory, slug);
  if (!page || !page.visible || page.mainCategory !== sub.mainCategory) {
    notFound();
  }

  return (
    <article className='max-w-5xl mx-auto px-4 py-10 space-y-14'>
      <header className='space-y-4'>
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
          <Link
            href={`/blog/${maincategory}/${subcategory}`}
            className='hover:underline'>
            {sub.name}
          </Link>
          <span>/</span>
          <span className='text-slate-700 font-medium text-center'>
            {page.titel}
          </span>
        </nav>
        <h1 className='text-3xl font-bold tracking-tight text-center'>
          {page.titel}
        </h1>
        <p className='text-slate-600 text-sm  text-center'>
          {page.description}
        </p>
      </header>

      {/* Sections */}
      <section className='space-y-16'>
        {(() => {
          let imageCounter = 0;
          return page.sections.map((s, i) => {
            let imageLeft = false;
            if (s.image) {
              imageLeft = imageCounter % 2 === 0; // first image left
              imageCounter++;
            }
            return <Section key={i} section={s} imageLeft={imageLeft} />;
          });
        })()}
      </section>

      {/* FAQ */}
      {page.faq && page.faq.length > 0 && (
        <section className='space-y-4' id='faq'>
          <h2 className='text-2xl font-semibold'>Häufige Fragen</h2>
          <Accordion
            type='single'
            collapsible
            className='w-full border rounded-lg bg-white'>
            {page.faq.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className='ml-3'>
                  {f.question}
                </AccordionTrigger>
                <AccordionContent>
                  <div className='text-sm leading-relaxed space-y-2 ml-3'>
                    {renderDraftRaw(f.answer)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* CTA */}
      <section className='bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-8 flex flex-col md:flex-row md:items-center gap-6'>
        <div className='flex-1 space-y-2'>
          <h2 className='text-xl font-semibold'>
            Jetzt unverbindlichen Auftrag erstellen
          </h2>
          <p className='text-sm opacity-90'>
            Erhalte passende Angebote und profitiere von unserem Netzwerk.
          </p>
        </div>
        <div>
          <Link
            href='/auftrag-erstellen'
            className='inline-block bg-white text-green-700 font-medium px-5 py-3 rounded-lg hover:bg-slate-100 transition text-sm'>
            Auftrag erstellen
          </Link>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: page.titel,
            description: page.meta_description || page.description,
            image: page.thumbnailUrl || undefined,
            keywords: page.keywords?.join(", "),
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `/blog/${maincategory}/${subcategory}/${page.slug}`,
            },
            articleSection: page.subcategorySlug,
            datePublished: new Date(page.createdAt).toISOString(),
            dateModified: new Date(page.updatedAt).toISOString(),
          }),
        }}
      />
    </article>
  );
}
