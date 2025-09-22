import { Metadata } from "next";
import Image from "next/image";
import { getPartner } from "@/actions/partnerActions";
import { RichTextRender } from "@/components/RichTextRender";
import { PartnerInteractionTracker } from "@/components/PartnerInteractionTracker";
import Link from "next/link";
import Headings from "@/components/Headings";
import { Separator } from "@/components/ui/separator";
import { MailIcon, PhoneIcon, UserCircleIcon } from "lucide-react";

export const revalidate = 3600; // 1h cache

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; partnerid: string }>;
}): Promise<Metadata> {
  const { category, partnerid } = await params;
  const partner = await getPartner(partnerid);
  if (!partner) {
    return { title: "Partner nicht gefunden" };
  }
  const catName = (partner.category || category || "Partner").replace(
    /-/g,
    " "
  );
  const title = `${partner.company.name} – ${catName} | Landschaftshelden.io`;
  const description =
    partner.shortDescription ||
    partner.companyBenefits ||
    `Partnerprofil ${partner.company.name}`;
  const ogImage = partner.infos.logoPath;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
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
  const partner = await getPartner(partnerid);
  if (!partner) {
    return (
      <main className='px-4 py-10 max-w-5xl mx-auto'>
        <h1 className='text-2xl font-bold mb-2'>Partner nicht gefunden</h1>
        <p className='text-slate-600'>Das Partnerprofil existiert nicht.</p>
      </main>
    );
  }
  const catName = (partner.category || category || "Partner").replace(
    /-/g,
    " "
  );
  // siteInfos array
  const siteInfos = (partner.siteInfos || []).filter(
    (b) => b.headline || b.text || b.image
  );
  // stats intentionally not displayed publicly; only interaction tracking occurs.

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: partner.company.name,
    url: `https://landschaftshelden.io/partners/${category}/${partnerid}`,
    image: partner.infos.logoPath || undefined,
    email: partner.contact.email || undefined,
    telephone: partner.contact.phone || undefined,
    address:
      partner.company.city || partner.company.street
        ? {
            "@type": "PostalAddress",
            streetAddress: partner.company.street || undefined,
            postalCode: partner.company.zip || undefined,
            addressLocality: partner.company.city || undefined,
            addressCountry: "DE",
          }
        : undefined,
    sameAs: partner.infos.website ? [partner.infos.website] : undefined,
    description:
      partner.shortDescription || partner.companyBenefits || undefined,
  };

  return (
    <main
      className='px-4 py-8 md:py-12 max-md:px-6 md:max-w-7xl mx-auto'
      role='main'>
      <PartnerInteractionTracker partnerId={partner.id} />
      {/* Breadcrumb */}
      <nav
        aria-label='Breadcrumb'
        className='mb-6 text-xs text-slate-500 flex flex-wrap gap-1'>
        <Link
          href='/partners'
          className='hover:text-slate-700 transition-colors'>
          Partner
        </Link>
        <span>/</span>
        <Link
          href={`/partners/${category}`}
          className='hover:text-slate-700 transition-colors'>
          {catName}
        </Link>
        <span>/</span>
        <span aria-current='page' className='text-slate-700 font-medium'>
          {partner.company.name}
        </span>
      </nav>

      <header className='grid grid-cols-2 grid-rows-1 gap-6 max-w-7xl mb-12'>
        <div className='flex items-center justify-center'>
          {partner.infos.logoPath ? (
            <Image
              src={partner.infos.logoPath}
              alt={partner.company.name}
              width={200}
              height={200}
              loading='eager'
              className='w-44 h-44 object-contain rounded-xl border bg-white p-3 shadow-sm'
            />
          ) : (
            <div className='w-44 h-44 flex items-center justify-center rounded-xl border bg-slate-100 text-slate-400 text-xs'>
              Kein Logo
            </div>
          )}
        </div>
        <div className='flex flex-col gap-3'>
          <p className='self-start text-xs font-medium rounded-full bg-green-50 text-green-700 px-3 py-1 border border-green-200 hover:bg-green-100 transition-colors'>
            {catName}
          </p>
          <Headings level={1}>{partner.company.name}</Headings>
          <p>{partner.shortDescription}</p>
        </div>
      </header>
      <div className='flex flex-row gap-12 max-w-7xl mb-12'>
        {/** Kontaktinformationen */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col'>
            <Headings level={3}>Kontakt</Headings>
            <Separator />
          </div>
          <p className='flex flex-row gap-2'>
            {" "}
            <UserCircleIcon className='h-6 w-6 text-green-500' />{" "}
            {partner.contact.person}
          </p>
          <Link
            href={`mailto:${partner.contact.email}`}
            className='flex flex-row gap-2 text-green-500 hover:text-green-400'>
            <MailIcon className='h-6 w-6 text-green-500' />
            {partner.contact.email}
          </Link>
          <p className='flex flex-row gap-2'>
            <PhoneIcon className='h-6 w-6 text-green-500' />
            {partner.contact.phone}
          </p>
        </div>
        {/** Firmeninformationen */}
        <div className='flex flex-col gap-4'>
          <div className='flex flex-col'>
            <Headings level={3}>Firma</Headings>
            <Separator />
          </div>
          <p className='flex flex-row gap-2'>{partner.company.name}</p>
          <p className='flex flex-row gap-2'>
            {partner.company.zip}, {partner.company.city}
          </p>
          <p className='flex flex-row gap-2'>{partner.company.street}</p>
        </div>
      </div>

      {siteInfos.length > 0 && (
        <section className='space-y-20' aria-label='Unternehmensinformationen'>
          {siteInfos.map((block, idx) => {
            const imageEl = block.image ? (
              <figure className='m-0'>
                <Image
                  src={block.image}
                  alt={block.headline || partner.company.name}
                  width={900}
                  height={600}
                  loading='lazy'
                  className='w-full h-auto rounded-xl border object-cover shadow-sm'
                />
                {block.headline && (
                  <figcaption className='sr-only'>{block.headline}</figcaption>
                )}
              </figure>
            ) : (
              <div className='w-full aspect-[3/2] rounded-xl border bg-slate-100' />
            );
            const textEl = (
              <div className='space-y-4'>
                {block.headline && (
                  <h2 className='text-xl font-semibold text-slate-800'>
                    {block.headline}
                  </h2>
                )}
                {block.text ? (
                  <RichTextRender value={block.text} />
                ) : (
                  <p className='text-sm text-slate-500'>Keine Beschreibung.</p>
                )}
              </div>
            );
            const swap = idx % 2 === 1; // alternate
            return (
              <div
                key={idx}
                className='grid md:grid-cols-2 gap-10 items-center'>
                {swap ? textEl : imageEl}
                {swap ? imageEl : textEl}
              </div>
            );
          })}
        </section>
      )}
      <script type='application/ld+json' suppressHydrationWarning>
        {JSON.stringify(orgJsonLd)}
      </script>
    </main>
  );
}
