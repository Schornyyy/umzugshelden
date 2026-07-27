import { redirect } from "next/navigation";
import { rawCities } from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { CheckIcon, MailIcon, PhoneIcon } from "lucide-react";

function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase(),
  );
}

const serviceConfig = {
  umzugsservice: {
    name: "Umzugsservice",
    title: "Professioneller Umzugsservice",
    description:
      "Wohnungs-, Firmen- und Regionalumzug – zuverlässig, termingerecht und zu fairen Festpreisen.",
    features: [
      "Privatumzug",
      "Firmenumzug",
      "Verpackungsservice",
      "Möbelmontage",
      "Schwertransporte",
      "Kurzfristige Umzüge",
    ],
    benefits: [
      "Festes Preisangebot – keine versteckten Kosten",
      "Erfahrenes und freundliches Team",
      "Moderne Fahrzeuge & professionelles Equipment",
      "Flexibel bei Terminen, auch am Wochenende",
      "Komplett-Service aus einer Hand",
    ],
  },
  anstricharbeiten: {
    name: "Anstricharbeiten",
    title: "Anstricharbeiten für die Wohnungsübergabe",
    description:
      "Streichen, Tapezieren und Schönheitsreparaturen – wir bereiten Ihre Wohnung termingerecht für die Übergabe vor.",
    features: [
      "Wände streichen",
      "Decken renovieren",
      "Tapezieren",
      "Lackierarbeiten",
      "Schönheitsreparaturen",
      "Spachteln & Schleifen",
    ],
    benefits: [
      "Termingerecht zur Wohnungsübergabe",
      "Hochwertige Materialien inklusive",
      "Saubere und ordentliche Arbeitsweise",
      "Faire Festpreise ohne Überraschungen",
      "Erfahrene Handwerker",
    ],
  },
  "moebel-service": {
    name: "Möbel Ab- & Aufbau",
    title: "Möbel Ab- und Aufbauservice",
    description:
      "Von IKEA bis zur Einbauküche – wir demontieren und montieren Ihre Möbel schnell, sicher und ohne Kratzer.",
    features: [
      "IKEA & Möbelhaus-Möbel",
      "Einbauküchen",
      "Schrankwände & Regale",
      "Betten & Matratzen",
      "Büromöbel",
      "Sonstige Möbel",
    ],
    benefits: [
      "Kein Stress beim Umziehen",
      "Erfahrenes Montageteam",
      "Kein Werkzeug nötig – wir bringen alles mit",
      "Schonender Umgang mit Ihren Möbeln",
      "Kombination mit Umzugsservice möglich",
    ],
  },
};

type ServiceKey = keyof typeof serviceConfig;

export default async function ServicePage({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;

  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);

  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);
  if (!(serviceKey in serviceConfig))
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);

  const config = serviceConfig[serviceKey];

  return (
    <div className='flex flex-col'>
      {/* Hero */}
      <section
        className='relative min-h-[480px] flex items-center'
        style={{
          backgroundImage: "url('/images/Hero_background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className='absolute inset-0 bg-navy/85' />
        <div className='relative z-10 container mx-auto px-4 py-24 flex flex-col items-center text-center gap-6'>
          <h1 className='font-sans font-bold text-4xl md:text-6xl text-white leading-tight max-w-4xl'>
            <span className='text-primary'>{config.title}</span> in {cityName}
          </h1>
          <p className='font-body text-gray-300 text-lg max-w-2xl'>
            {config.description}
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Link href='#kontakt'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold'>
                Kostenloses Angebot anfordern!
              </Button>
            </Link>
            <Link href={`/stadt/${encodeURIComponent(slugify(cityName))}`}>
              <Button
                variant='outline'
                className='font-sans bg-transparent border-white text-white hover:bg-white/10 px-8 py-4 rounded font-semibold'>
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className='py-20 bg-gray-50'>
        <div className='container mx-auto px-4'>
          <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy mb-12'>
            Unsere Leistungen: {config.name} in {cityName}
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {config.features.map((feature) => (
              <div
                key={feature}
                className='bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex gap-4 items-start'>
                <CheckIcon
                  className='text-primary flex-shrink-0 mt-1'
                  size={20}
                />
                <p className='font-sans font-semibold text-navy'>{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className='py-20 bg-navy'>
        <div className='container mx-auto px-4'>
          <h2 className='font-sans font-bold text-3xl text-white mb-8'>
            Warum Umzugshelden für {config.name} in {cityName}?
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {config.benefits.map((benefit) => (
              <div key={benefit} className='flex gap-3 items-start'>
                <CheckIcon
                  className='text-primary flex-shrink-0 mt-1'
                  size={20}
                />
                <p className='font-body text-gray-300'>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className='py-16 bg-white' id='kontakt'>
        <div className='container mx-auto px-4 max-w-5xl'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
            <div className='flex flex-col gap-6'>
              <h2 className='font-sans font-bold text-3xl text-navy'>
                Kostenloses Angebot für {config.name} in {cityName}
              </h2>
              <p className='font-body text-gray-600'>
                Wir melden uns innerhalb von 24 Stunden mit einem
                unverbindlichen Angebot bei Ihnen.
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
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);
  const serviceKey = service.trim().toLowerCase() as ServiceKey;

  if (!isAllowedCity(cityName) || !(serviceKey in serviceConfig)) {
    return { title: "Umzugshelden" };
  }

  const config = serviceConfig[serviceKey];
  return {
    title: `${config.name} ${cityName} ▷ Professionell & günstig | Umzugshelden`,
    description: `${config.name} in ${cityName}: ${config.description} Jetzt kostenlos anfragen!`,
    openGraph: {
      title: `${config.name} ${cityName} | Umzugshelden`,
      description: config.description,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://umzugshelden.de/stadt/${encodeURIComponent(slugify(cityName))}/${service}`,
    },
  };
}
