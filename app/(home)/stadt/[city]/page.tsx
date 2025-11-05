import { getCityContent, buildFAQSchema } from "@/lib/cityContent";
import {
  getCityPage,
  getCityPageByCity,
} from "@/actions/cityActions/customerCityAction";
import { ReactNode } from "react";
import { deslugify } from "@/utils/slugify";
import ReferenceBlock from "@/components/blocks/ReferenceBlock";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from "next/image";
// Image intentionally omitted here; use Next/Image in other components if needed

type FAQItem = { question: string; answer: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);

  return {
    title: `${cityName} — Webdesign von GS-Creatives | Agentur für Websites`,
    description: `GS-Creatives bietet professionelle Webdesign-Leistungen in ${cityName}. Wir bauen moderne Websites, Landingpages und Online-Shops — direkt von der Agentur.`,
    keywords: [
      `Webdesign ${cityName}`,
      `Webagentur ${cityName}`,
      `Website erstellen ${cityName}`,
    ],
    openGraph: {
      title: `${cityName} — Webdesign von GS-Creatives`,
      description: `Professionelles Webdesign in ${cityName} von GS-Creatives — Agenturleistung, keine Vermittlung.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://gs-creatives.io/stadt/${encodeURIComponent(
        cityName
      )}`,
    },
  };
}

const Page = async ({ params }: { params: Promise<{ city: string }> }) => {
  const { city } = await params;
  const slug = city.trim();
  let cityDisplay = deslugify(slug);
  try {
    cityDisplay = decodeURIComponent(cityDisplay);
  } catch {}

  try {
    // Load optional CityPage overrides from DB
    let cityPage = await getCityPage(slug);
    if (!cityPage) cityPage = await getCityPageByCity(cityDisplay);

    const { faq: staticFaq = [] } = getCityContent(cityDisplay);

    // merge DB FAQ with static FAQ without duplicates
    let faq: FAQItem[] = staticFaq as FAQItem[];
    if (cityPage?.faq && (cityPage.faq as FAQItem[]).length > 0) {
      const existing = new Set(
        (cityPage.faq as FAQItem[]).map((f) => f.question.trim().toLowerCase())
      );
      const additional = (staticFaq as FAQItem[]).filter(
        (f) => !existing.has(f.question.trim().toLowerCase())
      );
      faq = [...(cityPage.faq as FAQItem[]), ...additional];
    }

    function renderDraft(raw?: string): ReactNode {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : [];
        type RawBlock = { text?: string };
        return blocks.map((b: RawBlock, i: number) => {
          const text: string = b && typeof b.text === "string" ? b.text : "";
          if (!text.trim()) return <p key={i} />;
          return <p key={i}>{text}</p>;
        });
      } catch {
        return <p>{raw}</p>;
      }
    }

    const pageIntro =
      cityPage?.description?.trim() ||
      `GS-Creatives bietet individuelle Webdesign-Leistungen in ${cityDisplay}. Wir sind eine Webdesign-Agentur und realisieren Ihre Website direkt für Sie — von Beratung über Design bis zur technischen Umsetzung und Betreuung.`;

    return (
      <main className='mx-auto container flex flex-col gap-24 py-12 px-4'>
        {/* 2. Header / Hero */}
        <header className='grid grid-cols-1 md:grid-cols-2 gap-8 items-center'>
          <div>
            <h1 className='text-4xl md:text-5xl font-extrabold mb-4'>
              Webdesign für {cityDisplay} – Websites, die verkaufen.
            </h1>
            <div className='text-lg text-gray-700 mb-6'>
              {renderDraft(pageIntro as string)}
            </div>

            <div className='flex flex-wrap gap-4 items-center'>
              <Link
                href='/kontakt'
                className='bg-primary text-white px-5 py-3 rounded-md font-semibold'>
                Kostenloses Erstgespräch sichern
              </Link>
            </div>
          </div>
          <Image
            src={"/images/figma.png"}
            alt={`webdesign in ${cityDisplay}`}
            height={700}
            width={700}
          />
        </header>

        {/* 3. Problem → Lösung */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-4'>
            Warum deine Website in {cityDisplay} mehr leisten sollte als nur gut
            aussehen.
          </h2>
          <div className='grid md:grid-cols-2 gap-6'>
            <div>
              <h3 className='font-semibold mb-2'>Typische Probleme</h3>
              <ul className='list-disc pl-5 text-gray-700'>
                <li>Schlechte Sichtbarkeit in Google</li>
                <li>Keine oder schlechte Lead-Generierung</li>
                <li>Langsame Ladezeiten und schlechte Mobile-Experience</li>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold mb-2'>Unsere Lösung</h3>
              <div className='text-gray-700'>
                Wir kombinieren conversion-optimiertes Design, technische
                Performance und SEO-Strategie, damit deine Website Besucher in
                zahlende Kunden verwandelt.
              </div>
            </div>
          </div>
        </section>

        {/* 4. Unsere Lösung / Leistungen */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-4'>
            Unsere Webdesign-Leistungen für {cityDisplay} im Überblick
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>Webdesign &amp; UX/UI</h4>
              <p className='text-sm text-gray-600'>
                Conversion-orientiertes Design & Prototyping.
              </p>
            </div>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>SEO &amp; Google-Optimierung</h4>
              <p className='text-sm text-gray-600'>
                On-Page SEO, Tech-Audit und Content-Strategie.
              </p>
            </div>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>Content-Erstellung</h4>
              <p className='text-sm text-gray-600'>
                Texte, Bildsprache und Content-Workflows.
              </p>
            </div>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>Technische Umsetzung</h4>
              <p className='text-sm text-gray-600'>
                WordPress, Webflow, Headless-Setups und moderne Frameworks.
              </p>
            </div>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>Betreuung &amp; Wartung</h4>
              <p className='text-sm text-gray-600'>
                Langfristige Betreuung, Security & Performance.
              </p>
            </div>
            <div className='p-6 border rounded-lg'>
              <h4 className='font-semibold'>Detailseiten</h4>
              <p className='text-sm text-gray-600'>
                Mehr Infos zu einzelnen Leistungen auf Anfrage.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Referenzen */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-6'>
            Websites, die für {cityDisplay} Ergebnisse liefern
          </h2>
          <ReferenceBlock
            maxReferences={3}
            title='Mehr als 10 Erfolgreiche Handwerksbetriebe'
            subtext='Es geht nicht um Klicks - sondern Anfragen.'
          />
        </section>

        {/* 6. cityPage local argument */}
        <section className='mb-12 bg-gray-50 p-6 rounded-lg'>
          <h2 className='text-2xl font-semibold mb-3'>
            Warum wir die richtige Webdesign-Agentur für {cityDisplay} sind
          </h2>
          <div className='prose max-w-none text-gray-700'>
            <p>
              {cityDisplay} ist digital, kreativ und schnelllebig – wir helfen
              dir, online herauszustechen. Wir haben Erfahrung mit Berliner
              Kunden und kennen die regionale Konkurrenz und Erwartungen.
            </p>
            <p>
              Unsere Projekte für lokale Unternehmen zeigen, wie wir
              Sichtbarkeit und Leads steigern – direkt aus der Agentur heraus.
            </p>
          </div>
        </section>

        {/* 7. Prozess / Ablauf */}
        <section className='mb-12'>
          <h2 className='text-2xl font-semibold mb-4'>
            So läuft unser Webdesign-Prozess ab
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4 text-center'>
            <div className='p-4'>
              <div className='text-3xl mb-2'>🔎</div>
              <div className='font-semibold'>Analyse &amp; Beratung</div>
            </div>
            <div className='p-4'>
              <div className='text-3xl mb-2'>🧭</div>
              <div className='font-semibold'>Konzept &amp; Design</div>
            </div>
            <div className='p-4'>
              <div className='text-3xl mb-2'>🛠️</div>
              <div className='font-semibold'>Umsetzung</div>
            </div>
            <div className='p-4'>
              <div className='text-3xl mb-2'>⚙️</div>
              <div className='font-semibold'>SEO-Optimierung</div>
            </div>
            <div className='p-4'>
              <div className='text-3xl mb-2'>🚀</div>
              <div className='font-semibold'>Launch &amp; Betreuung</div>
            </div>
          </div>
        </section>

        {/* 9. CTA / Angebotssektion */}
        <section className='mb-12 text-center'>
          <h2 className='text-2xl font-semibold mb-4'>
            Bereit für eine Website, die Kunden bringt?
          </h2>
          <div className='flex items-center justify-center gap-4 mb-4'>
            <Link
              href='/website-check'
              className='bg-primary text-white px-6 py-3 rounded-md font-semibold'>
              Kostenloser Website Check
            </Link>
          </div>
        </section>

        {/* 10. FAQ-Bereich (SEO) */}
        <section className='mb-12 '>
          <h2 className='text-2xl font-semibold mb-6 text-center'>
            Häufige Fragen zum Thema Webdesign in {cityDisplay}
          </h2>
          {faq.length > 0 && (
            <Accordion type='single' collapsible className='max-w-4xl mx-auto'>
              {faq.map((item: FAQItem, i: number) => (
                <AccordionItem key={i} value={`it-${i}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <p>{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          {faq.length > 0 && (
            <script
              type='application/ld+json'
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(buildFAQSchema(faq)),
              }}
            />
          )}
        </section>
      </main>
    );
  } catch (error) {
    console.error("Fehler beim Laden der Daten:", error);
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Fehler beim Laden der Daten</h1>
        <p className='text-gray-600 mt-4'>
          Es gab einen Fehler. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }
};

export default Page;
