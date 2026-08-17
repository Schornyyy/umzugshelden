import { redirect } from "next/navigation";
import { rawCities } from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import FAQBlock from "@/components/utils/FAQBlock";
import { FAQType } from "@/types/utils/FAQType";
import { CheckIcon, MailIcon, PhoneIcon } from "lucide-react";

function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase(),
  );
}

export default async function CityServicePage({
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

  if (!isAllowedCity(cityName)) redirect("/");

  const cityFaqs: FAQType[] = [
    {
      question: `Welche Leistungen bieten Sie in ${cityName} an?`,
      answer: `In ${cityName} übernehmen wir Umzüge, Seniorenumzüge, Entrümpelungen, Anstricharbeiten sowie Möbel Ab- und Aufbau. Welche Leistungen sinnvoll sind, klären wir vorab kostenlos mit Ihnen.`,
    },
    {
      question: `Was kostet ein Umzugsservice in ${cityName}?`,
      answer: `Der Preis hängt vom Umfang, den Zugangswegen, der Entfernung und den gewünschten Zusatzleistungen ab. Nach einer Beratung oder Besichtigung erhalten Sie ein transparentes Festpreisangebot.`,
    },
    {
      question: `Können Sie auch kurzfristig nach ${cityName} kommen?`,
      answer: `Wir versuchen auch bei kurzfristigen Anfragen einen passenden Termin zu ermöglichen. Teilen Sie uns Ihren Wunschtermin und den Umfang mit, damit wir schnell prüfen können, was möglich ist.`,
    },
    {
      question: `Muss ich für das Angebot schon alles genau wissen?`,
      answer: `Nein. Für eine erste Einschätzung reichen die wichtigsten Angaben zu Leistung, Termin und Adresse. Fotos und zusätzliche Hinweise im Formular helfen uns, das Angebot noch genauer vorzubereiten.`,
    },
  ];

  const services = [
    {
      slug: "umzugsservice",
      name: "Umzugsservice",
      description:
        "Wohnungs-, Firmen- und Regionalumzug – zuverlässig und zu fairen Festpreisen.",
      image: "/images/Umzugsunternhemen_olpe.png",
    },
    {
      slug: "anstricharbeiten",
      name: "Anstricharbeiten",
      description:
        "Streichen, Tapezieren, Schönheitsreparaturen – perfekt für die Wohnungsübergabe.",
      image: "/images/anstricharbeiten.webp",
    },
    {
      slug: "moebel-service",
      name: "Möbel Ab- & Aufbau",
      description:
        "IKEA, Einbauküche, Schrankwände – wir montieren und demontieren schnell und sorgfältig.",
      image: "/images/möbel aufbau service.webp",
    },
    {
      slug: "senior-umzug",
      name: "Seniorenumzug",
      description:
        "Einfühlsame Umzugshilfe mit Zeit, Sorgfalt und persönlicher Begleitung für Senioren und Angehörige.",
      image: "/images/senioren_umzüge.webp",
    },
    {
      slug: "entruempelung",
      name: "Entrümpelung",
      description:
        "Wohnungen, Häuser, Keller und Gewerberäume fachgerecht räumen, verwerten und besenrein übergeben.",
      image: "/images/entrümpelung.webp",
    },
  ];

  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section
        className='relative min-h-[480px] flex items-center'
        style={{
          backgroundImage: "url('/images/Umzugsunternehmen_Olpe.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className='absolute inset-0 bg-navy/85' />
        <div className='relative z-10 container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl'>
            <span className='text-primary'>Umzugsservice</span> in {cityName}
          </h1>
          <p className='font-body text-gray-300 text-lg max-w-2xl'>
            Umzug, Anstrich oder Möbelmontage – die Umzugshelden sind im Kreis
            Olpe und Umgebung für Sie da. Schnell, zuverlässig und günstig.
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='#kontakt'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold'>
                Kostenloses Angebot anfordern!
              </Button>
            </Link>
            <Link href='#services'>
              <Button
                variant='outline'
                className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold'>
                Dienstleistungen ansehen
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className='bg-white py-20'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 items-start gap-12 lg:grid-cols-2'>
            <div className='flex flex-col gap-5'>
              <h2 className='font-sans text-3xl font-bold leading-tight text-navy md:text-4xl'>
                Ihr Umzugs- und Renovierungsservice in {cityName}
              </h2>
              <p className='font-body leading-relaxed text-gray-600'>
                Ob Wohnungswechsel, Haushaltsauflösung oder die Renovierung vor
                einer Übergabe: In {cityName} erhalten Sie bei Umzugshelden eine
                persönliche Planung und ein Team, das die Arbeit zuverlässig
                erledigt. Wir stimmen den Umfang mit Ihnen ab, berücksichtigen
                Zugangswege und Termine und machen den Ablauf für Sie planbar.
              </p>
              <p className='font-body leading-relaxed text-gray-600'>
                Sie entscheiden, wie viel Unterstützung Sie benötigen. Vom
                einzelnen Möbelaufbau bis zum Komplettumzug mit Verpackung,
                Transport und Aufbau kombinieren wir die passenden Leistungen zu
                einem klaren Angebot.
              </p>
            </div>
            <div className='border border-primary/20 bg-primary/10 p-6 rounded'>
              <h3 className='font-sans text-xl font-semibold text-navy'>
                Kostenlos planen, transparent entscheiden
              </h3>
              <p className='mt-3 font-body text-sm leading-relaxed text-gray-600'>
                Nach Ihrer Anfrage sprechen wir kurz über Ihren Bedarf in
                {" "}{cityName}. Bei umfangreicheren Aufträgen besichtigen wir
                die Situation vor Ort, damit im Angebot alle Leistungen,
                Materialien und Entsorgungskosten nachvollziehbar enthalten sind.
              </p>
              <Link href='#kontakt' className='mt-5 inline-block'>
                <Button className='font-sans bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90 rounded'>
                  Angebot anfordern
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className='py-20 bg-white' id='services'>
        <div className='container mx-auto px-4'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy mb-12'>
            Unsere Leistungen in {cityName}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {services.map((s) => (
              <div
                key={s.slug}
                className='bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col'>
                <Image
                  src={s.image}
                  alt={s.name}
                  width={400}
                  height={220}
                  className='w-full h-48 object-cover'
                />
                <div className='p-6 flex flex-col gap-3 flex-grow'>
                  <h3 className='font-sans font-semibold text-xl text-navy'>
                    {s.name}
                  </h3>
                  <p className='font-body text-gray-600 text-sm leading-relaxed flex-grow'>
                    {s.description}
                  </p>
                  <Link
                    href={`/stadt/${encodeURIComponent(slugify(cityName))}/${s.slug}`}>
                    <Button className='font-sans w-full bg-primary hover:bg-primary/90 text-white rounded font-semibold'>
                      Mehr erfahren
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='bg-gray-50 py-20'>
        <div className='container mx-auto px-4'>
          <div className='mx-auto max-w-3xl text-center'>
            <h2 className='font-sans text-3xl font-bold text-navy md:text-4xl'>
              So erhalten Sie Ihr Angebot in {cityName}
            </h2>
            <p className='mt-3 font-body text-gray-600'>
              Ein klarer Ablauf sorgt dafür, dass Aufwand, Termin und Preis von
              Anfang an zusammenpassen.
            </p>
          </div>
          <ol className='mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {[
              {
                title: "Anfrage senden",
                text: "Wählen Sie die gewünschte Leistung, Ihren Wunschtermin und geben Sie die wichtigsten Informationen an.",
              },
              {
                title: "Bedarf abstimmen",
                text: "Wir melden uns zeitnah und klären Umfang, Zugänge, Adressen und mögliche Zusatzleistungen.",
              },
              {
                title: "Festpreis erhalten",
                text: "Sie erhalten ein transparentes Angebot mit den vereinbarten Leistungen und nachvollziehbaren Kosten.",
              },
              {
                title: "Termin umsetzen",
                text: "Unser Team kommt vorbereitet nach {cityName} und führt den Auftrag zum abgestimmten Termin durch.",
              },
            ].map((step, index) => (
              <li key={step.title} className='border border-gray-100 bg-white p-6 shadow-sm rounded'>
                <span className='font-sans text-3xl font-bold text-primary'>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className='mt-3 font-sans text-lg font-semibold text-navy'>
                  {step.title}
                </h3>
                <p className='mt-2 font-body text-sm leading-relaxed text-gray-600'>
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='bg-white py-16'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 gap-12 lg:grid-cols-2'>
            <div>
              <h2 className='font-sans text-3xl font-bold text-navy'>
                Im Einsatz in {cityName} und Umgebung
              </h2>
              <p className='mt-4 font-body leading-relaxed text-gray-600'>
                Als regionales Team im Kreis Olpe planen wir Einsätze in
                {" "}{cityName} flexibel und berücksichtigen die konkrete
                Situation vor Ort. Ob enge Treppenhäuser, fehlende Aufzüge,
                begrenzte Parkmöglichkeiten oder ein fester Übergabetermin: Je
                mehr wir vorab wissen, desto präziser können wir den Auftrag
                vorbereiten.
              </p>
              <p className='mt-4 font-body leading-relaxed text-gray-600'>
                Auch Anfragen aus dem nahen Umkreis prüfen wir gern. Fotos,
                Adressen und Hinweise zu besonderen Gegenständen können direkt
                über das Formular übermittelt werden.
              </p>
            </div>
            <div className='flex flex-col gap-4'>
              {[
                "Termin, Adresse und gewünschten Leistungsumfang nennen",
                "Stockwerke, Aufzug und Parksituation vorab mitteilen",
                "Fotos bei Möbelmontage, Entrümpelung oder Schäden hochladen",
                "Zusatzleistungen wie Verpackung, Entsorgung oder Anstrich direkt angeben",
              ].map((tip) => (
                <div key={tip} className='flex gap-3 border border-gray-100 bg-gray-50 p-4 rounded'>
                  <CheckIcon className='mt-0.5 shrink-0 text-primary' size={20} />
                  <p className='font-body text-sm leading-relaxed text-gray-700'>{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className='py-16 bg-navy'>
        <div className='container mx-auto px-4'>
          <h2 className='font-sans font-bold text-3xl text-white mb-8'>
            Warum Umzugshelden in {cityName}?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[
              {
                t: "Feste Preise",
                d: "Keine bösen Überraschungen – Sie erhalten ein klares Festpreisangebot.",
              },
              {
                t: "Lokaler Service",
                d: "Wir sind im Kreis Olpe und 25 km Umkreis schnell vor Ort.",
              },
              {
                t: "Erfahrenes Team",
                d: "Geschulte Mitarbeiter, die sorgfältig und zügig arbeiten.",
              },
              {
                t: "Alles aus einer Hand",
                d: "Umzug, Streichen, Möbelmontage – wir erledigen alles.",
              },
              {
                t: "Flexible Termine",
                d: "Auch kurzfristig und am Wochenende verfügbar.",
              },
              {
                t: "Persönliche Beratung",
                d: "Wir nehmen uns Zeit für Ihre Fragen und Wünsche.",
              },
            ].map((w) => (
              <div key={w.t} className='flex gap-3 items-start'>
                <CheckIcon
                  className='text-primary flex-shrink-0 mt-1'
                  size={20}
                />
                <div>
                  <p className='font-sans font-semibold text-white'>{w.t}</p>
                  <p className='font-body text-gray-300 text-sm'>{w.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQBlock
        faqs={cityFaqs}
        title={`Häufige Fragen zu Umzugshelden in ${cityName}`}
      />

      {/* Contact */}
      <section className='py-16 bg-white' id='kontakt'>
        <div className='container mx-auto px-4 max-w-5xl'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
            <div className='flex flex-col gap-6'>
              <h2 className='font-sans font-bold text-3xl text-navy'>
                Jetzt Angebot anfordern
              </h2>
              <p className='font-body text-gray-600'>
                Kontaktieren Sie uns für ein kostenloses und unverbindliches
                Angebot für Ihren Umzug oder Ihre Renovierung in {cityName}.
              </p>
              <div className='flex flex-col gap-4'>
                <div className='flex gap-3 items-center'>
                  <PhoneIcon className='text-primary flex-shrink-0' size={20} />
                  <Link
                    href='tel:+4915168567708'
                    className='font-body text-gray-600 hover:text-primary'>
                    +49 151 68567708
                  </Link>
                </div>
                <div className='flex gap-3 items-center'>
                  <MailIcon className='text-primary flex-shrink-0' size={20} />
                  <Link
                    href='mailto:info@umzugshelden.io'
                    className='font-body text-gray-600 hover:text-primary'>
                    info@umzugshelden.io
                  </Link>
                </div>
              </div>
            </div>
            <div className='bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-100'>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

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

  if (!isAllowedCity(cityName)) return { title: "Umzugshelden" };

  return {
    title: `Umzugsservice ${cityName} ▷ Schnell & zuverlässig | Umzugshelden`,
    description: `Professioneller Umzugsservice in ${cityName}: Privatumzug, Firmenumzug, Anstricharbeiten & Möbelmontage. Jetzt kostenlos anfragen!`,
    openGraph: {
      title: `Umzugsservice ${cityName} | Umzugshelden`,
      description: `Ihr lokaler Umzugsservice in ${cityName}: zügig, sorgfältig, fair.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://umzugshelden.de/stadt/${encodeURIComponent(slugify(cityName))}`,
    },
  };
}
