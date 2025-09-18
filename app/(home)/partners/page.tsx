import { Metadata } from "next";
import Script from "next/script";
import Image from "next/image";
import { listPartners } from "@/actions/partnerActions";
import { PartnerType } from "@/types/PartnerType";
import PartnerCategoryList from "./_components/PartnerCategoryList";

export const revalidate = 3600; // cache page for 1h

// Primary SEO focus: Partnerverzeichnis für Garten- und Landschaftsbau (B2B)
export const metadata: Metadata = {
  title:
    "Partnerverzeichnis für Garten- und Landschaftsbau | Landschaftshelden.io",
  description:
    "Alle Partner und Anbieter für Garten- und Landschaftsbau auf einen Blick: Software, Lieferanten, Werkzeuge, Marketing & mehr. Jetzt Partner entdecken und Ihr Unternehmen stärken.",
  keywords: [
    // Core
    "Partner Gartenbau",
    "Partner Landschaftsbau",
    "GaLaBau Partner",
    "Partnerverzeichnis Gartenbau",
    "Kooperationen Garten- und Landschaftsbau",
    // Leads & Marketing
    "Gartenbau Leads",
    "Handwerker Leads",
    "Kundenakquise Gartenbau",
    "Online Marketing Handwerk",
    // Tools & Software
    "Handwerkersoftware",
    "Angebotssoftware Gartenbau",
    "Zeiterfassung Handwerk",
    // Lieferanten & Materialien
    "Baustofflieferant Gartenbau",
    "Pflanzen Großhandel",
    "Gartengeräte Hersteller",
  ],
  openGraph: {
    title: "Partnerverzeichnis für Garten- und Landschaftsbau",
    description:
      "Finden Sie geprüfte Partner: Software, Lieferanten, Werkzeuge, Marketing & mehr – speziell für Garten- und Landschaftsbau.",
    type: "website",
    locale: "de_DE",
    url: "https://landschaftshelden.io/partner",
    siteName: "Landschaftshelden.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "Partner für Garten- und Landschaftsbau",
    description:
      "Alle Partner und Anbieter für den GaLaBau – zentral an einem Ort.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "https://landschaftshelden.io/partner" },
};

function toItemListJsonLd(partners: PartnerType[]) {
  const itemListElement = partners.map((p, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    url:
      p.link ||
      `https://landschaftshelden.io/partner#${encodeURIComponent(p.id)}`,
    name: p.name,
  }));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Partnerverzeichnis Garten- und Landschaftsbau",
    itemListElement,
  };
}

export default async function PartnersLandingPage() {
  const all = await listPartners();
  const partners = all
    .filter((p) => p.active !== true)
    .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
  const categories: string[] = partners
    .map((p) => p.category)
    .filter((c): c is string => typeof c === "string");

  const jsonLd = toItemListJsonLd(partners);

  return (
    <main className='px-4 py-10 md:py-14 max-w-6xl mx-auto'>
      <header className='mb-8 md:mb-10'>
        <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>
          Partnerverzeichnis für Garten- und Landschaftsbau
        </h1>
        <p className='mt-3 text-slate-600 max-w-3xl'>
          Finden Sie passende Partner und Anbieter für Ihren GaLaBau-Betrieb:
          Software, Lieferanten, Werkzeuge, Marketing & mehr. Alle Partner auf
          einen Blick – geprüft und übersichtlich.
        </p>
      </header>

      {/* Categories */}
      <PartnerCategoryList categories={categories!} />

      {/* Partners grid */}
      <section aria-label='Alle Partner' className='mb-16'>
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
                {p.link ? (
                  <a
                    href={`/api/partner-click/${p.id}`}
                    className='inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2'
                    rel='noopener noreferrer'
                    target='_blank'
                    aria-label={`Zum Partner ${p.name}`}>
                    Zum Partner
                  </a>
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

      <section aria-label='Hinweis' className='text-xs text-slate-500'>
        Alle Angaben ohne Gewähr. Partnerangaben stammen von den Anbietern.
      </section>

      {/* Structured Data */}
      <Script id='partners-itemlist' type='application/ld+json'>
        {JSON.stringify(jsonLd)}
      </Script>
    </main>
  );
}
