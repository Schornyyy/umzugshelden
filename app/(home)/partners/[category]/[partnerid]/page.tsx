import { Metadata } from "next";
import Image from "next/image";
import Script from "next/script";
import RichText from "./_components/RichText";
import {
  findCatalogByProfileId,
  getPartnerProfile,
  ensureProfileForCatalogPartner,
  getPartner,
} from "@/actions/partnerActions";

export const revalidate = 3600; // 1h cache

function safeText(s?: string) {
  return (s || "").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; partnerid: string }>;
}): Promise<Metadata> {
  const { category, partnerid } = await params;
  // Resolve partnerid that may be a profileId or a catalogId
  let profile = await getPartnerProfile(partnerid);
  let catalog = profile ? await findCatalogByProfileId(profile.id) : null;
  if (!profile) {
    try {
      const profileId = await ensureProfileForCatalogPartner(partnerid);
      profile = await getPartnerProfile(profileId);
      if (!catalog) {
        catalog = await findCatalogByProfileId(profileId);
      }
      if (!catalog) {
        // Fallback: use the catalog doc directly if available
        catalog = await getPartner(partnerid);
      }
    } catch {
      // ignore and continue with whatever we have
    }
  }

  const name = catalog?.name || profile?.contactPerson || "Partner";
  const description =
    catalog?.description ||
    safeText(profile?.texts?.[0]) ||
    "Partnerprofil im Garten- und Landschaftsbau.";
  const title = `${name} – ${category.replace(
    /-/g,
    " "
  )} | Landschaftshelden.io`;

  const ogImage = profile?.logo || profile?.images?.[0] || catalog?.logo;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://landschaftshelden.io/partners/${category}/${partnerid}`,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    alternates: {
      canonical: `https://landschaftshelden.io/partners/${category}/${partnerid}`,
    },
    robots: { index: true, follow: true },
  };
}

export default async function PartnerDetailPage({
  params,
}: {
  params: Promise<{ category: string; partnerid: string }>;
}) {
  const { category, partnerid } = await params;
  // Resolve partnerid that may be a profileId or a catalogId
  let profile = await getPartnerProfile(partnerid);
  let catalog = profile ? await findCatalogByProfileId(profile.id) : null;
  if (!profile) {
    try {
      const profileId = await ensureProfileForCatalogPartner(partnerid);
      profile = await getPartnerProfile(profileId);
      if (!catalog) {
        catalog = await findCatalogByProfileId(profileId);
      }
      if (!catalog) {
        catalog = await getPartner(partnerid);
      }
    } catch {
      // ignore
    }
  }

  if (!profile) {
    return (
      <main className='px-4 py-10 max-w-5xl mx-auto'>
        <h1 className='text-2xl font-bold mb-2'>Partner nicht gefunden</h1>
        <p className='text-slate-600'>
          Das angeforderte Partnerprofil existiert nicht.
        </p>
      </main>
    );
  }

  const catName = (catalog?.category || category || "Partner").replace(
    /-/g,
    " "
  );
  const title = catalog?.name || profile.contactPerson || "Partner";
  const heroImage = profile.logo || profile.images?.[0] || undefined;

  const blocks = [
    { image: profile.images?.[0], text: safeText(profile.texts?.[0]) },
    { image: profile.images?.[1], text: safeText(profile.texts?.[1]) },
    { image: profile.images?.[2], text: safeText(profile.texts?.[2]) },
  ].filter((b) => b.image || b.text);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: title,
    url: `https://landschaftshelden.io/partners/${category}/${partnerid}`,
    image: heroImage || undefined,
    email: profile.email || undefined,
    telephone: profile.phone || undefined,
    sameAs: catalog?.link ? [catalog.link] : undefined,
    description:
      catalog?.description || safeText(profile.texts?.[0]) || undefined,
  } as Record<string, unknown>;

  return (
    <main className='px-4 py-10 md:py-14 max-w-5xl mx-auto'>
      <header className='mb-8'>
        <h1 className='text-3xl md:text-4xl font-extrabold tracking-tight'>
          {title}
        </h1>
        <p className='mt-2 text-slate-600'>{catName}</p>
      </header>

      {heroImage && (
        <div className='mb-8'>
          <Image
            src={heroImage}
            alt={title}
            width={1200}
            height={630}
            className='w-full h-auto rounded-xl border object-cover'
          />
        </div>
      )}

      <section className='space-y-10'>
        {blocks.map((b, idx) => (
          <div
            key={idx}
            className={`grid md:grid-cols-2 gap-6 items-center ${
              idx % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
            }`}>
            <div>
              {b.image ? (
                <Image
                  src={b.image}
                  alt={`${title} Bild ${idx + 1}`}
                  width={900}
                  height={600}
                  className='w-full h-auto rounded-xl border object-cover'
                />
              ) : (
                <div className='w-full aspect-[3/2] rounded-xl border bg-slate-100' />
              )}
            </div>
            <div>
              {b.text ? (
                <div className='prose prose-slate max-w-none'>
                  <RichText content={b.text} />
                </div>
              ) : (
                <div className='text-slate-500 text-sm'>
                  Keine Beschreibung vorhanden.
                </div>
              )}
            </div>
          </div>
        ))}
      </section>

      {catalog?.link && (
        <div className='mt-12'>
          <a
            href={`/api/partner-click/${catalog.id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex items-center justify-center rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2'>
            Zum Partner
          </a>
        </div>
      )}

      <Script id='partner-organization' type='application/ld+json'>
        {JSON.stringify(orgJsonLd)}
      </Script>
    </main>
  );
}
