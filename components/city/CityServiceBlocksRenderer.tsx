import ContactForm from "@/components/ContactForm";
import CityServiceBeforeAfter from "@/components/city/CityServiceBeforeAfter";
import CityServiceCarousel from "@/components/city/CityServiceCarousel";
import { Button } from "@/components/ui/button";
import FAQBlock from "@/components/utils/FAQBlock";
import {
  getDefaultCityServiceName,
  getDefaultCityServiceSummary,
} from "@/lib/cityServiceDefaults";
import type { CityServiceSeoContent } from "@/lib/cityServiceSeo";
import {
  resolveCityServiceText,
  type CityServiceTemplateContext,
} from "@/lib/cityServiceTemplate";
import { getNearbyCities } from "@/statics/Lists";
import {
  CITY_SERVICE_KEYS,
  type CityServiceBlock,
  type CityServiceKey,
} from "@/types/city/CityServicePage";
import type { FAQType } from "@/types/utils/FAQType";
import { slugify } from "@/utils/slugify";
import {
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QuoteIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

type Props = {
  blocks: CityServiceBlock[];
  cityName: string;
  citySlug: string;
  serviceKey?: CityServiceKey;
  context: CityServiceTemplateContext;
  localSeo: CityServiceSeoContent;
  editorMode?: boolean;
  selectedBlockId?: string | null;
};

const sectionTone = {
  white: "bg-white",
  muted: "bg-gray-50",
  navy: "bg-navy",
  accent: "bg-[#eef3f7]",
} as const;

const cardColumns = {
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
} as const;

const checkColumns = {
  1: "grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
} as const;

const singleToTripleColumns = {
  1: "grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
} as const;

const logoColumns = {
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
} as const;

const galleryAspect = {
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
} as const;

function getVideoEmbedUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname === "youtu.be") {
      return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.split("/").at(-1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (url.hostname.endsWith("vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).at(-1);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function BlockStyleBoundary({
  block,
  children,
  editorMode,
  selected,
}: {
  block: CityServiceBlock;
  children: ReactNode;
  editorMode: boolean;
  selected: boolean;
}) {
  const style = block.style;
  const variables = {
    ...(style?.backgroundColor
      ? { "--builder-background-color": style.backgroundColor }
      : {}),
    ...(style?.backgroundImage
      ? { "--builder-background-image": `url(${JSON.stringify(style.backgroundImage)})` }
      : {}),
    ...(style?.backgroundPosition
      ? { "--builder-background-position": style.backgroundPosition }
      : {}),
    ...(style?.overlayColor
      ? { "--builder-overlay-color": style.overlayColor }
      : {}),
    ...(style?.overlayOpacity !== undefined
      ? { "--builder-overlay-opacity": `${style.overlayOpacity}%` }
      : {}),
    ...(style?.textColor ? { "--builder-text-color": style.textColor } : {}),
    ...(style?.accentColor
      ? { "--builder-accent-color": style.accentColor }
      : {}),
    ...(style?.textAlign
      ? { "--builder-text-align": style.textAlign }
      : {}),
    ...(style?.headingSize
      ? { "--builder-heading-size": `${style.headingSize}px` }
      : {}),
    ...(style?.textSize
      ? { "--builder-text-size": `${style.textSize}px` }
      : {}),
    ...(style?.paddingTop !== undefined
      ? { "--builder-padding-top": `${style.paddingTop}px` }
      : {}),
    ...(style?.paddingBottom !== undefined
      ? { "--builder-padding-bottom": `${style.paddingBottom}px` }
      : {}),
    ...(style?.marginTop !== undefined
      ? { "--builder-margin-top": `${style.marginTop}px` }
      : {}),
    ...(style?.marginBottom !== undefined
      ? { "--builder-margin-bottom": `${style.marginBottom}px` }
      : {}),
    ...(style?.minHeight !== undefined
      ? { "--builder-min-height": `${style.minHeight}px` }
      : {}),
    ...(style?.borderRadius !== undefined
      ? { "--builder-border-radius": `${style.borderRadius}px` }
      : {}),
    ...(style?.contentWidth
      ? {
          "--builder-content-width": {
            narrow: "768px",
            boxed: "1152px",
            wide: "1440px",
            full: "100%",
          }[style.contentWidth],
        }
      : {}),
  } as CSSProperties;

  return (
    <div
      data-city-block-id={block.id}
      data-background-color={style?.backgroundColor ? "true" : undefined}
      data-background-image={style?.backgroundImage ? "true" : undefined}
      data-text-color={style?.textColor ? "true" : undefined}
      data-accent-color={style?.accentColor ? "true" : undefined}
      data-text-align={style?.textAlign ? "true" : undefined}
      data-heading-size={style?.headingSize ? "true" : undefined}
      data-text-size={style?.textSize ? "true" : undefined}
      data-padding-top={style?.paddingTop !== undefined ? "true" : undefined}
      data-padding-bottom={style?.paddingBottom !== undefined ? "true" : undefined}
      data-min-height={style?.minHeight !== undefined ? "true" : undefined}
      data-content-width={style?.contentWidth ? "true" : undefined}
      data-hide-desktop={style?.hideOnDesktop ? "true" : undefined}
      data-hide-tablet={style?.hideOnTablet ? "true" : undefined}
      data-hide-mobile={style?.hideOnMobile ? "true" : undefined}
      className={`city-service-builder-block ${
        editorMode
          ? selected
            ? "relative z-10 outline outline-2 outline-offset-[-2px] outline-emerald-500"
            : "relative cursor-pointer outline outline-1 outline-offset-[-1px] outline-transparent hover:outline-emerald-300"
          : ""
      }`}
      style={{
        ...variables,
        marginTop: style?.marginTop,
        marginBottom: style?.marginBottom,
        borderRadius: style?.borderRadius,
      }}>
      {children}
    </div>
  );
}

function HeroTitle({
  title,
  primaryKeyword,
}: {
  title: string;
  primaryKeyword: string;
}) {
  const keywordIndex = title.indexOf(primaryKeyword);
  if (keywordIndex < 0) return title;

  return (
    <>
      {title.slice(0, keywordIndex)}
      <span className='text-primary'>{primaryKeyword}</span>
      {title.slice(keywordIndex + primaryKeyword.length)}
    </>
  );
}

export default function CityServiceBlocksRenderer({
  blocks,
  cityName,
  citySlug,
  serviceKey,
  context,
  localSeo,
  editorMode = false,
  selectedBlockId,
}: Props) {
  const text = (value: string) => resolveCityServiceText(value, context);
  const visibleBlocks = blocks.filter((block) => block.enabled);

  return (
    <div className='flex flex-col'>
      {visibleBlocks
        .map((block) => {
          if (block.type === "hero") {
            const title = text(block.title);
            return (
              <section
                key={block.id}
                className='relative flex min-h-[600px] items-center overflow-hidden'>
                <Image
                  src={block.image}
                  alt={text(block.imageAlt)}
                  fill
                  priority
                  sizes='100vw'
                  className='object-cover'
                />
                <div className='absolute inset-0 bg-navy/85' />
                <div className='relative z-10 container mx-auto px-4 py-16'>
                  <nav
                    aria-label='Breadcrumb'
                    className='mb-8 font-body text-sm text-gray-300'>
                    <ol className='flex flex-wrap items-center gap-2'>
                      <li>
                        <Link href='/' className='hover:text-white'>
                          Startseite
                        </Link>
                      </li>
                      <li aria-hidden='true'>/</li>
                      <li>
                        <Link
                          href={`/stadt/${encodeURIComponent(citySlug)}`}
                          className='hover:text-white'>
                          {cityName}
                        </Link>
                      </li>
                      {serviceKey && (
                        <>
                          <li aria-hidden='true'>/</li>
                          <li aria-current='page' className='text-white'>
                            {context.service}
                          </li>
                        </>
                      )}
                    </ol>
                  </nav>
                  <div className='grid grid-cols-1 items-center gap-12 lg:grid-cols-2'>
                    <div className='order-2 rounded border border-white/10 bg-[#0b1f3a] p-6 shadow-2xl lg:order-1 lg:p-8'>
                      <h2 className='mb-3 font-sans text-xl font-semibold text-white'>
                        {text(block.formTitle)}
                      </h2>
                      <p className='mb-5 font-body text-sm text-gray-300'>
                        {text(block.formText)}
                      </p>
                      <ContactForm dark />
                    </div>
                    <div className='order-1 flex flex-col gap-6 text-center lg:order-2 lg:text-left'>
                      <h1 className='break-words font-sans text-4xl font-bold leading-tight text-white md:text-5xl'>
                        <HeroTitle
                          title={title}
                          primaryKeyword={context.primaryKeyword}
                        />
                      </h1>
                      <p className='font-body text-lg text-gray-300'>
                        {text(block.description)}
                      </p>
                      <div>
                        <Link
                          href={
                            serviceKey
                              ? `/stadt/${encodeURIComponent(citySlug)}`
                              : "#services"
                          }>
                          <Button
                            variant='outline'
                            className='rounded border-white bg-transparent px-8 py-4 font-sans font-semibold text-white hover:bg-white/10'>
                            {serviceKey
                              ? "Zurück zur Übersicht"
                              : "Dienstleistungen ansehen"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "intro") {
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-16`}>
                <div className='container mx-auto max-w-3xl px-4 text-center'>
                  <h2 className='font-sans text-3xl font-bold text-navy'>
                    {text(block.heading)}
                  </h2>
                  <p className='mt-5 font-body text-lg leading-relaxed text-gray-600'>
                    {text(block.text)}
                  </p>
                </div>
              </section>
            );
          }

          if (block.type === "imageText") {
            const imageRight = block.imagePosition === "right";
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16'>
                  <div
                    className={`relative aspect-[4/3] overflow-hidden rounded-md shadow-lg ${imageRight ? "lg:order-2" : ""}`}>
                    <Image
                      src={block.image}
                      alt={text(block.imageAlt)}
                      fill
                      sizes='(max-width: 1024px) 100vw, 45vw'
                      className='object-cover'
                    />
                  </div>
                  <div className={imageRight ? "lg:order-1" : ""}>
                    {block.eyebrow && (
                      <p className='font-sans text-sm font-semibold uppercase text-primary'>
                        {text(block.eyebrow)}
                      </p>
                    )}
                    <h2 className='mt-3 font-sans text-3xl font-bold leading-tight text-navy md:text-4xl'>
                      {text(block.heading)}
                    </h2>
                    <div className='mt-6 space-y-4 font-body leading-relaxed text-gray-600'>
                      {block.paragraphs.map((paragraph, index) => (
                        <p key={`${block.id}-paragraph-${index}`}>
                          {text(paragraph)}
                        </p>
                      ))}
                    </div>
                    {block.ctaLabel && block.ctaUrl && (
                      <Link
                        href={block.ctaUrl}
                        className='mt-7 inline-flex font-sans font-semibold text-primary hover:underline'>
                        {text(block.ctaLabel)}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "localArea") {
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-[1.2fr_0.8fr] lg:items-start'>
                  <div>
                    <p className='font-sans text-sm font-semibold uppercase text-primary'>
                      {text(block.eyebrow)}
                    </p>
                    <h2 className='mt-3 font-sans text-3xl font-bold leading-tight text-navy md:text-4xl'>
                      {text(block.heading)}
                    </h2>
                    <div className='mt-6 space-y-4 font-body leading-relaxed text-gray-600'>
                      {localSeo.localParagraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                  {block.showFacts && (
                    <dl className='border-l-4 border-primary bg-white px-6 py-2 shadow-sm'>
                      {localSeo.localFacts.map((fact) => (
                        <div
                          key={fact.label}
                          className='border-b border-gray-100 py-5 last:border-b-0'>
                          <dt className='font-sans text-sm font-semibold uppercase text-primary'>
                            {fact.label}
                          </dt>
                          <dd className='mt-2 font-body leading-relaxed text-gray-700'>
                            {fact.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
            );
          }

          if (block.type === "cardGrid") {
            const isNavy = block.tone === "navy";
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <div className={block.numbered ? "max-w-3xl" : "mx-auto max-w-3xl text-center"}>
                    {block.eyebrow && (
                      <p className='font-sans text-sm font-semibold uppercase text-primary'>
                        {text(block.eyebrow)}
                      </p>
                    )}
                    <h2
                      className={`mt-3 font-sans text-3xl font-bold md:text-4xl ${isNavy ? "text-white" : "text-navy"}`}>
                      {text(block.heading)}
                    </h2>
                    {block.intro && (
                      <p
                        className={`mt-3 font-body ${isNavy ? "text-gray-300" : "text-gray-600"}`}>
                        {text(block.intro)}
                      </p>
                    )}
                  </div>
                  <div
                    className={`mt-10 grid grid-cols-1 gap-6 ${cardColumns[block.columns]}`}>
                    {block.cards.map((card, index) => (
                      <article
                        key={`${block.id}-card-${index}`}
                        className={
                          isNavy
                            ? "border border-white/10 bg-white/5 p-6"
                            : block.numbered
                            ? "border-t-4 border-primary bg-gray-50 p-6"
                            : "rounded border border-gray-100 bg-gray-50 p-6 shadow-sm"
                        }>
                        {block.numbered && (
                          <span className='font-sans text-sm font-bold text-primary'>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        )}
                        <h3
                          className={`mt-3 font-sans text-xl font-semibold ${isNavy ? "text-white" : "text-navy"}`}>
                          {text(card.title)}
                        </h3>
                        <p
                          className={`mt-3 font-body text-sm leading-relaxed ${isNavy ? "text-gray-300" : "text-gray-600"}`}>
                          {text(card.text)}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "checkList") {
            const isNavy = block.tone === "navy";
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto px-4'>
                  <h2
                    className={`font-sans text-3xl font-bold md:text-4xl ${isNavy ? "text-white" : "text-navy"}`}>
                    {text(block.heading)}
                  </h2>
                  {block.intro && (
                    <p
                      className={`mt-3 font-body ${isNavy ? "text-gray-300" : "text-gray-600"}`}>
                      {text(block.intro)}
                    </p>
                  )}
                  <ul
                    className={`mt-8 grid gap-4 ${checkColumns[block.columns]}`}>
                    {block.items.map((item, index) => (
                      <li
                        key={`${block.id}-item-${index}`}
                        className={`flex items-start gap-3 ${isNavy ? "" : "rounded bg-white p-5 shadow-sm"}`}>
                        <CheckIcon
                          className='mt-0.5 shrink-0 text-primary'
                          size={20}
                        />
                        <span
                          className={`font-body leading-relaxed ${isNavy ? "text-gray-300" : "text-gray-700"}`}>
                          {text(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          if (block.type === "process") {
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto px-4'>
                  <div className='mx-auto max-w-3xl text-center'>
                    <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
                      {text(block.heading)}
                    </h2>
                    {block.intro && (
                      <p className='mt-3 font-body text-gray-600'>
                        {text(block.intro)}
                      </p>
                    )}
                  </div>
                  <ol className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
                    {block.steps.map((step, index) => (
                      <li
                        key={`${block.id}-step-${index}`}
                        className='rounded border border-gray-100 bg-gray-50 p-6 shadow-sm'>
                        <span className='font-sans text-3xl font-bold text-primary'>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className='mt-3 font-sans font-semibold text-navy'>
                          {text(step)}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            );
          }

          if (block.type === "pricing") {
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-2 lg:items-center'>
                  <div>
                    {block.eyebrow && (
                      <p className='font-sans text-sm font-semibold uppercase text-primary'>
                        {text(block.eyebrow)}
                      </p>
                    )}
                    <h2 className='mt-3 font-sans text-3xl font-bold text-navy md:text-4xl'>
                      {text(block.heading)}
                    </h2>
                    <p className='mt-5 font-body leading-relaxed text-gray-600'>
                      {text(block.text)}
                    </p>
                    <ul className='mt-7 space-y-4'>
                      {block.factors.map((factor, index) => (
                        <li
                          key={`${block.id}-factor-${index}`}
                          className='flex items-start gap-3'>
                          <CheckIcon
                            className='mt-0.5 shrink-0 text-primary'
                            size={20}
                          />
                          <span className='font-body text-gray-700'>
                            {text(factor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='bg-white p-7 shadow-sm'>
                    <h3 className='font-sans text-2xl font-semibold text-navy'>
                      {text(block.ctaTitle)}
                    </h3>
                    <p className='mt-3 font-body leading-relaxed text-gray-600'>
                      {text(block.ctaText)}
                    </p>
                    <Link href='#kontakt'>
                      <Button className='mt-6 rounded bg-primary px-6 py-3 font-sans font-semibold text-white hover:bg-primary/90'>
                        {text(block.ctaLabel)}
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "faq") {
            const faqs = block.items.map((item) => ({
              question: text(item.question),
              answer: text(item.answer),
            }));
            if (block.includeLocalQuestion) faqs.push(localSeo.localFaq);
            return (
              <FAQBlock
                key={block.id}
                faqs={faqs as FAQType[]}
                title={text(block.heading)}
              />
            );
          }

          if (block.type === "contact") {
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-16`}
                id='kontakt'>
                <div className='container mx-auto max-w-5xl px-4'>
                  <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-2'>
                    <div className='flex flex-col gap-6'>
                      <h2 className='font-sans text-3xl font-bold text-navy'>
                        {text(block.heading)}
                      </h2>
                      <p className='font-body text-gray-600'>
                        {text(block.text)}
                      </p>
                      <div className='flex flex-col gap-4'>
                        {block.showPhone && (
                          <div className='flex items-center gap-3'>
                            <PhoneIcon
                              className='shrink-0 text-primary'
                              size={20}
                            />
                            <Link
                              href='tel:+4915168567708'
                              className='font-body text-gray-600 hover:text-primary'>
                              +49 151 68567708
                            </Link>
                          </div>
                        )}
                        {block.showEmail && (
                          <div className='flex items-center gap-3'>
                            <MailIcon
                              className='shrink-0 text-primary'
                              size={20}
                            />
                            <Link
                              href='mailto:info@umzugshelden.io'
                              className='font-body text-gray-600 hover:text-primary'>
                              info@umzugshelden.io
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                    {block.showForm && (
                      <div className='rounded-xl border border-gray-100 bg-gray-50 p-8 shadow-sm'>
                        <ContactForm />
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "nearbyCities") {
            const nearbyCities = getNearbyCities(
              cityName,
              block.limit,
              block.radiusKm,
            );
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-16`}>
                <div className='container mx-auto px-4'>
                  <h2 className='font-sans text-3xl font-bold text-navy'>
                    {text(block.heading)}
                  </h2>
                  <p className='mt-3 font-body text-gray-600'>
                    {text(block.intro)}
                  </p>
                  <ul className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {nearbyCities.map((nearby) => (
                      <li key={nearby.name}>
                        <Link
                          href={
                            serviceKey
                              ? `/stadt/${encodeURIComponent(slugify(nearby.name))}/${serviceKey}`
                              : `/stadt/${encodeURIComponent(slugify(nearby.name))}`
                          }
                          className='flex items-center justify-between gap-3 rounded border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md'>
                          <span className='flex items-center gap-2'>
                            <MapPinIcon
                              className='shrink-0 text-primary'
                              size={18}
                            />
                            <span className='font-sans font-semibold text-navy'>
                              {serviceKey
                                ? `${context.service} ${nearby.name}`
                                : `Umzugshelden ${nearby.name}`}
                            </span>
                          </span>
                          {block.showDistance && nearby.distanceKm > 0 && (
                            <span className='font-body text-sm text-gray-500'>
                              ca. {nearby.distanceKm} km
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          if (block.type === "otherServices") {
            const otherServices = CITY_SERVICE_KEYS.filter(
              (key) => key !== serviceKey,
            );
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} pb-16`}>
                <div className='container mx-auto px-4'>
                  <h2 className='font-sans text-2xl font-bold text-navy'>
                    {text(block.heading)}
                  </h2>
                  <ul className='mt-6 flex flex-wrap gap-3'>
                    {otherServices.map((key) => (
                      <li key={key}>
                        <Link
                          href={`/stadt/${encodeURIComponent(citySlug)}/${key}`}
                          className='inline-flex items-center gap-2 rounded border border-gray-100 bg-white px-4 py-2 font-sans text-sm font-semibold text-navy shadow-sm transition-all hover:border-primary/40 hover:shadow-md'>
                          <CheckIcon className='text-primary' size={16} />
                          {getDefaultCityServiceName(key)} in {cityName}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          }

          if (block.type === "cta") {
            const isNavy = block.tone === "navy";
            return (
              <section
                key={block.id}
                className={`${sectionTone[block.tone]} py-16`}>
                <div className='container mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 lg:flex-row lg:items-center lg:justify-between'>
                  <div className='max-w-3xl'>
                    {block.eyebrow && (
                      <p className='font-sans text-sm font-semibold uppercase text-primary'>
                        {text(block.eyebrow)}
                      </p>
                    )}
                    <h2 className={`mt-2 font-sans text-3xl font-bold md:text-4xl ${isNavy ? "text-white" : "text-navy"}`}>
                      {text(block.heading)}
                    </h2>
                    <p className={`mt-4 font-body leading-relaxed ${isNavy ? "text-gray-300" : "text-gray-600"}`}>
                      {text(block.text)}
                    </p>
                  </div>
                  <div className='flex shrink-0 flex-wrap gap-3'>
                    <Link href={block.primaryUrl}>
                      <Button className='rounded bg-primary px-6 font-sans font-semibold text-white hover:bg-primary/90'>
                        {text(block.primaryLabel)}
                      </Button>
                    </Link>
                    {block.secondaryLabel && block.secondaryUrl && (
                      <Link href={block.secondaryUrl}>
                        <Button variant='outline' className={`rounded px-6 font-sans font-semibold ${isNavy ? "border-white bg-transparent text-white hover:bg-white/10" : "border-navy bg-transparent text-navy"}`}>
                          {text(block.secondaryLabel)}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "stats") {
            const isNavy = block.tone === "navy";
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-16`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  {block.heading && (
                    <h2 className={`mb-10 text-center font-sans text-3xl font-bold ${isNavy ? "text-white" : "text-navy"}`}>
                      {text(block.heading)}
                    </h2>
                  )}
                  <dl className={`grid grid-cols-2 gap-px overflow-hidden rounded bg-slate-200 ${cardColumns[block.columns]}`}>
                    {block.items.map((item, index) => (
                      <div key={`${block.id}-stat-${index}`} className={isNavy ? "bg-navy-light p-6 text-center" : "bg-white p-6 text-center"}>
                        <dt className='font-sans text-3xl font-bold text-primary md:text-4xl'>{text(item.value)}</dt>
                        <dd className={`mt-2 font-body text-sm ${isNavy ? "text-gray-300" : "text-gray-600"}`}>{text(item.label)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </section>
            );
          }

          if (block.type === "testimonials") {
            const isNavy = block.tone === "navy";
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <h2 className={`text-center font-sans text-3xl font-bold md:text-4xl ${isNavy ? "text-white" : "text-navy"}`}>{text(block.heading)}</h2>
                  <div className={`mt-10 grid gap-6 ${singleToTripleColumns[block.columns]}`}>
                    {block.items.map((item, index) => (
                      <figure key={`${block.id}-testimonial-${index}`} className={isNavy ? "border border-white/10 bg-white/5 p-6" : "border border-gray-100 bg-white p-6 shadow-sm"}>
                        <QuoteIcon className='h-8 w-8 text-primary' aria-hidden='true' />
                        <div className='mt-4 flex gap-1' aria-label={`${item.rating} von 5 Sternen`}>
                          {Array.from({ length: 5 }, (_, starIndex) => (
                            <StarIcon key={starIndex} className={`h-4 w-4 ${starIndex < item.rating ? "fill-primary text-primary" : "text-gray-300"}`} />
                          ))}
                        </div>
                        <blockquote className={`mt-4 font-body leading-relaxed ${isNavy ? "text-gray-200" : "text-gray-700"}`}>„{text(item.quote)}“</blockquote>
                        <figcaption className='mt-5 flex items-center gap-3'>
                          {item.avatar && (
                            <Image src={item.avatar} alt={text(item.name)} width={48} height={48} className='h-12 w-12 rounded-full object-cover' />
                          )}
                          <span>
                            <strong className={`block font-sans text-sm ${isNavy ? "text-white" : "text-navy"}`}>{text(item.name)}</strong>
                            {(item.role || item.source) && <span className={`mt-1 block text-xs ${isNavy ? "text-gray-400" : "text-gray-500"}`}>{[item.role, item.source].filter(Boolean).map((value) => text(value!)).join(" · ")}</span>}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "gallery") {
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <div className='mx-auto max-w-3xl text-center'>
                    <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                    {block.intro && <p className='mt-3 font-body text-gray-600'>{text(block.intro)}</p>}
                  </div>
                  <div className={`mt-10 grid grid-cols-1 gap-4 ${cardColumns[block.columns]}`}>
                    {block.images.map((image, index) => (
                      <figure key={`${block.id}-image-${index}`}>
                        <div className={`relative overflow-hidden rounded ${galleryAspect[block.aspectRatio]}`}>
                          <Image src={image.src} alt={text(image.alt)} fill sizes='(max-width: 768px) 100vw, 33vw' className='object-cover' />
                        </div>
                        {image.caption && <figcaption className='mt-2 font-body text-sm text-gray-500'>{text(image.caption)}</figcaption>}
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "video") {
            const embedUrl = getVideoEmbedUrl(block.videoUrl);
            const isLocalVideo = block.videoUrl.startsWith("/") || /\.(mp4|webm|ogg)(?:\?.*)?$/i.test(block.videoUrl);
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-5xl px-4'>
                  <div className='mx-auto max-w-3xl text-center'>
                    <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                    {block.text && <p className='mt-3 font-body text-gray-600'>{text(block.text)}</p>}
                  </div>
                  {(embedUrl || isLocalVideo || editorMode) && (
                    <div className='mt-8 aspect-video overflow-hidden rounded bg-slate-950 shadow-lg'>
                      {embedUrl ? (
                        <iframe src={embedUrl} title={text(block.heading)} loading='lazy' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen className='h-full w-full border-0' />
                      ) : isLocalVideo ? (
                        <video src={block.videoUrl} poster={block.poster} controls playsInline preload='metadata' className='h-full w-full object-cover' />
                      ) : (
                        <div className='flex h-full items-center justify-center px-6 text-center font-body text-sm text-slate-400'>Video-URL im Inspector eintragen</div>
                      )}
                    </div>
                  )}
                  {block.caption && <p className='mt-3 text-center font-body text-sm text-gray-500'>{text(block.caption)}</p>}
                </div>
              </section>
            );
          }

          if (block.type === "logoCloud") {
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-14`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <h2 className='text-center font-sans text-2xl font-bold text-navy'>{text(block.heading)}</h2>
                  <div className={`mt-8 grid items-center gap-6 ${logoColumns[block.columns]}`}>
                    {block.logos.map((logo, index) => {
                      const image = <Image src={logo.src} alt={text(logo.alt)} width={240} height={100} className='mx-auto h-16 w-full object-contain' />;
                      return logo.url ? (
                        <Link key={`${block.id}-logo-${index}`} href={logo.url} className='block rounded bg-white p-4 grayscale transition hover:grayscale-0'>{image}</Link>
                      ) : (
                        <div key={`${block.id}-logo-${index}`} className='rounded bg-white p-4 grayscale'>{image}</div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "accordion") {
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-4xl px-4'>
                  <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                  {block.intro && <p className='mt-3 font-body text-gray-600'>{text(block.intro)}</p>}
                  <div className='mt-8 divide-y divide-slate-200 border-y border-slate-200'>
                    {block.items.map((item, index) => (
                      <details key={`${block.id}-accordion-${index}`} className='group bg-white px-5 py-1'>
                        <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-sans font-semibold text-navy'>
                          {text(item.title)}
                          <ChevronDownIcon className='h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180' />
                        </summary>
                        <p className='pb-5 font-body leading-relaxed text-gray-600'>{text(item.content)}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "spacer") {
            return (
              <section key={block.id} className={sectionTone[block.tone]} aria-hidden='true'>
                <div className='container mx-auto flex items-center px-4' style={{ height: block.height }}>
                  {block.showDivider && <hr className='w-full' style={{ borderColor: block.dividerColor, borderTopWidth: block.dividerWidth }} />}
                </div>
              </section>
            );
          }

          if (block.type === "carousel") {
            return (
              <CityServiceCarousel
                key={block.id}
                block={block}
                context={context}
              />
            );
          }

          if (block.type === "imageCollage") {
            const imageRight = block.imagePosition === "right";
            const collage = block.layout === "mosaic" ? (
              <div className='grid min-h-[420px] grid-cols-2 gap-3'>
                {block.images.map((image, index) => (
                  <div key={`${block.id}-collage-${index}`} className={`relative min-h-44 overflow-hidden rounded ${index === 0 ? "row-span-2" : ""}`}>
                    <Image src={image.src} alt={text(image.alt)} fill sizes='(max-width: 1024px) 50vw, 30vw' className='object-cover' />
                  </div>
                ))}
              </div>
            ) : (
              <div className='relative min-h-[440px]'>
                {block.images.slice(0, 5).map((image, index) => {
                  const positions = [
                    { width: "72%", left: "0%", top: "0%", zIndex: 5, transform: block.layout === "fan" ? "rotate(-4deg)" : "none" },
                    { width: "64%", left: "34%", top: "22%", zIndex: 4, transform: block.layout === "fan" ? "rotate(5deg)" : "none" },
                    { width: "48%", left: "4%", top: "52%", zIndex: 3, transform: block.layout === "fan" ? "rotate(-7deg)" : "none" },
                    { width: "42%", left: "54%", top: "2%", zIndex: 2, transform: block.layout === "fan" ? "rotate(8deg)" : "none" },
                    { width: "38%", left: "31%", top: "63%", zIndex: 6, transform: block.layout === "fan" ? "rotate(2deg)" : "none" },
                  ][index];
                  return (
                    <div key={`${block.id}-collage-${index}`} className='absolute aspect-[4/3] overflow-hidden rounded border-4 border-white shadow-xl' style={positions}>
                      <Image src={image.src} alt={text(image.alt)} fill sizes='(max-width: 1024px) 70vw, 35vw' className='object-cover' />
                    </div>
                  );
                })}
              </div>
            );
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2'>
                  <div className={imageRight ? "lg:order-2" : ""}>{collage}</div>
                  <div className={imageRight ? "lg:order-1" : ""}>
                    {block.eyebrow && <p className='font-sans text-sm font-semibold uppercase text-primary'>{text(block.eyebrow)}</p>}
                    <h2 className='mt-3 font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                    <p className='mt-5 font-body leading-relaxed text-gray-600'>{text(block.text)}</p>
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "beforeAfter") {
            return (
              <CityServiceBeforeAfter
                key={block.id}
                block={block}
                context={context}
              />
            );
          }

          if (block.type === "imageCards") {
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <div className='mx-auto max-w-3xl text-center'>
                    <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                    {block.intro && <p className='mt-3 font-body text-gray-600'>{text(block.intro)}</p>}
                  </div>
                  <div className={`mt-10 grid grid-cols-1 gap-6 ${cardColumns[block.columns]}`}>
                    {block.cards.map((card, index) => (
                      <article key={`${block.id}-image-card-${index}`} className={block.overlay ? "relative min-h-96 overflow-hidden rounded" : "overflow-hidden rounded border border-gray-100 bg-white shadow-sm"}>
                        <div className={block.overlay ? "absolute inset-0" : "relative aspect-[4/3]"}>
                          <Image src={card.image} alt={text(card.imageAlt)} fill sizes='(max-width: 768px) 100vw, 33vw' className='object-cover' />
                        </div>
                        <div className={block.overlay ? "absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/20 to-transparent p-6 text-white" : "p-6"}>
                          <h3 className={`font-sans text-xl font-semibold ${block.overlay ? "text-white" : "text-navy"}`}>{text(card.title)}</h3>
                          <p className={`mt-3 font-body text-sm leading-relaxed ${block.overlay ? "text-white/80" : "text-gray-600"}`}>{text(card.text)}</p>
                          {card.linkLabel && card.linkUrl && <Link href={card.linkUrl} className='mt-4 font-sans text-sm font-semibold text-primary hover:underline'>{text(card.linkLabel)}</Link>}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "team") {
            return (
              <section key={block.id} className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto max-w-6xl px-4'>
                  <div className='mx-auto max-w-3xl text-center'>
                    <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>{text(block.heading)}</h2>
                    {block.intro && <p className='mt-3 font-body text-gray-600'>{text(block.intro)}</p>}
                  </div>
                  <div className={`mt-10 grid grid-cols-1 gap-6 ${cardColumns[block.columns]}`}>
                    {block.members.map((member, index) => (
                      <article key={`${block.id}-member-${index}`} className='overflow-hidden rounded bg-white shadow-sm'>
                        <div className='relative aspect-[4/5] overflow-hidden bg-slate-100'>
                          <Image src={member.image} alt={text(member.imageAlt)} fill sizes='(max-width: 768px) 100vw, 33vw' className='object-cover' />
                        </div>
                        <div className='p-5 text-center'>
                          <h3 className='font-sans text-lg font-semibold text-navy'>{text(member.name)}</h3>
                          <p className='mt-1 font-sans text-sm font-semibold text-primary'>{text(member.role)}</p>
                          {member.text && <p className='mt-3 font-body text-sm leading-relaxed text-gray-600'>{text(member.text)}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            );
          }

          if (block.type === "serviceCards") {
            return (
              <section
                key={block.id}
                id='services'
                className={`${sectionTone[block.tone]} py-20`}>
                <div className='container mx-auto px-4'>
                  <h2 className='mb-12 font-sans text-3xl font-bold text-navy md:text-4xl'>
                    {text(block.heading)}
                  </h2>
                  <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
                    {block.serviceKeys.map((key) => {
                      const service = getDefaultCityServiceSummary(key);
                      return (
                        <article
                          key={key}
                          className='flex flex-col overflow-hidden rounded-md border border-gray-100 bg-gray-50 shadow-sm transition-shadow hover:shadow-md'>
                          <Image
                            src={service.image}
                            alt={`${service.name} in ${cityName}`}
                            width={480}
                            height={270}
                            className='h-48 w-full object-cover'
                          />
                          <div className='flex flex-1 flex-col gap-3 p-6'>
                            <h3 className='font-sans text-xl font-semibold text-navy'>
                              {service.name}
                            </h3>
                            <p className='flex-1 font-body text-sm leading-relaxed text-gray-600'>
                              {service.description}
                            </p>
                            <Link
                              href={`/stadt/${encodeURIComponent(citySlug)}/${key}`}>
                              <Button className='w-full rounded bg-primary font-sans font-semibold text-white hover:bg-primary/90'>
                                Mehr erfahren
                              </Button>
                            </Link>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          }

          return null;
        })
        .map((content, index) => {
          const block = visibleBlocks[index];
          return (
            <BlockStyleBoundary
              key={block.id}
              block={block}
              editorMode={editorMode}
              selected={selectedBlockId === block.id}>
              {content}
            </BlockStyleBoundary>
          );
        })}
    </div>
  );
}