import { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import { listPartnersByCategory } from "@/actions/partnerActions";
import { PartnerType } from "@/types/PartnerType";
import { slugify, deslugify } from "@/utils/slugify";
import Link from "next/link";

export const revalidate = 3600; // 1h

function titleCase(input: string): string {
  return input
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function categoryDisplayFromSlug(slug: string): string {
  const name = deslugify(slug).trim();
  return titleCase(name);
}

type LegacyPartner = {
  id: string;
  name?: string;
  logo?: string;
  link?: string;
  benefit?: string;
  description?: string;
  category?: string;
  active?: boolean;
  priority?: number;
};
type NewPartner = PartnerType;
interface NormalizedPartner {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  benefit: string;
  category?: string;
  active?: boolean;
  priority?: number;
}
function normalize(p: LegacyPartner | NewPartner): NormalizedPartner {
  const name =
    (p as NewPartner).company?.name || (p as LegacyPartner).name || "Partner";
  const logo = (p as NewPartner).infos?.logoPath || (p as LegacyPartner).logo;
  const website = (p as NewPartner).infos?.website || (p as LegacyPartner).link;
  const benefit =
    (p as NewPartner).companyBenefits ||
    (p as LegacyPartner).benefit ||
    (p as LegacyPartner).description ||
    "";
  return {
    id: p.id,
    name,
    logo,
    website,
    benefit,
    category: p.category,
    active: p.active,
    priority: p.priority ?? 100,
  };
}

function toItemListJsonLd(
  partners: Array<LegacyPartner | NewPartner>,
  categoryName: string
) {
  const itemListElement = partners.map((raw, idx) => {
    const p = normalize(raw);
    return {
      "@type": "ListItem",
      position: idx + 1,
      url:
        p.website ||
        `https://landschaftshelden.io/partners/${slugify(
          categoryName
        )}#${encodeURIComponent(p.id)}`,
      name: p.name,
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Partnerverzeichnis ${categoryName}`,
    itemListElement,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const display = categoryDisplayFromSlug(category);
  const title = `${display} Partner | Landschaftshelden.io`;
  const description = `Alle ${display}-Partner für Garten- und Landschaftsbau: geprüfte Anbieter, Tools, Lieferanten & Services – übersichtlich nach Kategorie.`;

  const baseKeywords = [
    `${display} Partner`,
    `${display} Anbieter`,
    `${display} Gartenbau`,
    `${display} Landschaftsbau`,
    `GaLaBau ${display}`,
    `Partner ${display} Verzeichnis`,
  ];

  return {
    title,
    description,
    keywords: baseKeywords,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "de_DE",
      url: `https://landschaftshelden.io/partners/${category}`,
      siteName: "Landschaftshelden.io",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://landschaftshelden.io/partners/${category}`,
    },
  };
}

export default async function PartnersCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const display = categoryDisplayFromSlug(category);

  const raw = await listPartnersByCategory(category);
  const partners = raw.map(normalize);

  const jsonLd = toItemListJsonLd(partners, display);
  const faqs = [
    {
      q: `Was ist die Kategorie \"${display}\" und für wen eignet sie sich?`,
      a: `In der Kategorie \"${display}\" finden Sie spezialisierte Anbieter und Partner, die Lösungen und Services für Betriebe im Garten- und Landschaftsbau bereitstellen. Geeignet für Unternehmen, die gezielt nach ${display}-Leistungen suchen.`,
    },
    {
      q: `Wie wähle ich den passenden ${display}-Partner aus?`,
      a: `Achten Sie auf Kernleistungen, Referenzen, Integrationen und Support. Nutzen Sie unseren Partner-Link, um Details einzusehen oder einen Termin zu vereinbaren.`,
    },
    {
      q: `Sind die hier gelisteten ${display}-Anbieter geprüft?`,
      a: `Partner werden redaktionell kuratiert. Angaben stammen von den Anbietern; wir prüfen auffällige Änderungen regelmäßig.`,
    },
    {
      q: `Kostet die Kontaktaufnahme über Landschaftshelden.io Gebühren?`,
      a: `Nein. Die Weiterleitung zu Partnern ist für Besucher kostenlos. Eventuelle Kosten entstehen direkt beim Anbieter.`,
    },
    {
      q: `Wie kann ich mein Unternehmen als ${display}-Partner listen lassen?`,
      a: `Kontaktieren Sie uns über die Partneranfrage. Wir prüfen Eignung, Kategorie und Sichtbarkeit und melden uns zeitnah zurück.`,
    },
  ];

  return (
    <main className='px-4 py-10 md:py-14 max-w-6xl mx-auto'>
      <header className='mb-8 md:mb-10'>
        <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>
          {display} Partner
        </h1>
        <p className='mt-3 text-slate-600 max-w-3xl'>
          Entdecken Sie führende {display}-Anbieter für den Garten- und
          Landschaftsbau. Finden Sie geprüfte Partner, die Ihren Betrieb mit
          passenden Lösungen unterstützen.
        </p>
      </header>

      {partners.length === 0 ? (
        <p className='text-sm text-slate-600'>
          Aktuell keine Partner in dieser Kategorie verfügbar.
        </p>
      ) : (
        <section aria-label={`Alle ${display}-Partner`} className='mb-16'>
          <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {partners.map((p) => (
              <article
                key={p.id}
                id={p.id}
                className='bg-white border rounded-xl p-5 flex flex-col'>
                <div className='flex items-center gap-3 mb-4'>
                  {p.logo ? (
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={60}
                      height={60}
                      className='h-12 w-12 object-contain rounded bg-slate-50 border'
                    />
                  ) : (
                    <div className='h-12 w-12 rounded bg-slate-100 border' />
                  )}
                  <div>
                    <h3 className='font-semibold text-lg leading-snug'>
                      {p.name}
                    </h3>
                    <p className='text-xs text-slate-500'>
                      {p.category || "Allgemein"}
                    </p>
                  </div>
                </div>
                <p className='text-sm text-slate-700 flex-1'>{p.benefit}</p>
                <div className='mt-4'>
                  {p.website ? (
                    <Link
                      href={`/partners/${p.category}/${p.id}`}
                      className='inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2'>
                      Zum Partner
                    </Link>
                  ) : (
                    <span className='inline-flex rounded-md bg-slate-100 text-slate-500 text-sm px-3 py-2'>
                      Kein Link verfügbar
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Structured Data */}
      <Script id='partners-category-itemlist' type='application/ld+json'>
        {JSON.stringify(jsonLd)}
      </Script>

      {/* FAQ Section */}
      <section aria-label='Häufige Fragen' className='mt-10'>
        <h2 className='text-xl font-semibold mb-4'>Häufige Fragen (FAQ)</h2>
        <div className='space-y-4'>
          {faqs.map((f) => (
            <details key={f.q} className='bg-white border rounded-lg p-4'>
              <summary className='font-medium cursor-pointer'>{f.q}</summary>
              <p className='mt-2 text-sm text-slate-700'>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FAQ Structured Data */}
      <Script id='partners-category-faq' type='application/ld+json'>
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        })}
      </Script>
    </main>
  );
}
