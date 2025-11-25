import { redirect } from "next/navigation";
import { rawCities } from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import { ClockIcon, MailIcon, PhoneIcon } from "lucide-react";

// Whitelist-Check gegen erlaubte Städte
function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase()
  );
}

// Service Konfiguration mit Inhalten
const serviceConfig = {
  hausmeisterservice: {
    name: "Hausmeisterservice",
    title: "Professioneller Hausmeisterservice",
    description:
      "Von Reparaturen und Wartungen bis zu regelmäßigen Kontrollen – unser Hausmeisterservice kümmert sich um Ihre Immobilie.",
    features: [
      "Handwerkliche Reparaturen",
      "Haustechnik-Kontrollen",
      "Regelmäßige Objektbetreuung",
      "24/7 Notfallservice",
      "Instandhaltungsmanagement",
      "Wartung und Instandsetzung",
    ],
    benefits: [
      "Schnelle und zuverlässige Reparaturen vor Ort",
      "Professionelle Haustechniker mit langjähriger Erfahrung",
      "Transparente Kostenkalkulationen",
      "Flexible und anpassbare Service-Pakete",
      "Regelmäßige Kontrollen zur Schadensvorbeugung",
    ],
  },
  gebäudereinigung: {
    name: "Gebäudereinigung",
    title: "Professionelle Gebäudereinigung",
    description:
      "Hygienische und gründliche Reinigung Ihrer Gebäude – vom Treppenhaus bis zum Büro.",
    features: [
      "Treppenhausreinigung",
      "Büroreinigung",
      "Glasreinigung",
      "Fensterreinigung",
      "Fassadenreinigung",
      "Desinfektion",
    ],
    benefits: [
      "Saubere und hygienische Räume für Mieter und Kunden",
      "Professionelle Reinigungsteams mit modernem Equipment",
      "Umweltfreundliche Reinigungsmittel",
      "Flexible Reinigungsintervalle",
      "Zuverlässigkeit und Diskretion",
    ],
  },
  grundstückspflege: {
    name: "Grundstückspflege",
    title: "Umfassende Grundstückspflege",
    description:
      "Professionelle Pflege Ihrer Außenbereiche – Rasenmähen, Heckenschnitt und mehr.",
    features: [
      "Rasenmähen und Rasenpflege",
      "Heckenschnitt",
      "Baumschnitt",
      "Laubentsorgung",
      "Schneeräumung",
      "Wegeunterhalt",
    ],
    benefits: [
      "Gepflegte und attraktive Außenflächen",
      "Sichere Wege und Zufahrten",
      "Professionelle Gartenpflege das ganze Jahr über",
      "Bedarfsgerechte Pflegepläne",
      "Umweltbewusste Arbeitsweise",
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

  // City dekodieren und normalisieren
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);

  // Service dekodieren und normalisieren
  const serviceSlugRaw = service.trim().toLowerCase();
  let serviceDecoded = serviceSlugRaw;
  try {
    serviceDecoded = decodeURIComponent(serviceSlugRaw);
  } catch {}

  // Validate city
  if (!isAllowedCity(cityName)) {
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);
  }

  // Validate service
  if (!(serviceDecoded in serviceConfig)) {
    redirect(`/stadt/${encodeURIComponent(slugRaw)}`);
  }

  const config = serviceConfig[serviceDecoded as ServiceKey];

  return (
    <div className='flex flex-col'>
      {/* Hero Section */}
      <div
        style={{
          backgroundImage: "url('/images/Hero_background.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          backgroundSize: "fill",
        }}>
        <div className='container mx-auto px-4 py-32'>
          <div className='flex flex-col gap-6 w-full items-center'>
            <Headings
              level={1}
              className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
              {config.title} in {cityName}
            </Headings>
            <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
              {config.description}
            </p>
            <div className='flex flex-col md:flex-row gap-4 md:gap-12 w-full px-4 md:px-0 md:w-auto'>
              <Link href={"#kontakt"} className='w-full md:w-auto'>
                <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                  Angebot erhalten
                </Button>
              </Link>
              <Link
                href={`/stadt/${encodeURIComponent(cityName)}`}
                className='w-full md:w-auto'>
                <Button
                  variant={"outline"}
                  className='bg-transparent text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                  Zurück zu Dienstleistungen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className='container mx-auto py-20 md:py-40 px-4 md:px-0'>
        <div className='flex flex-col gap-12'>
          <div className='flex flex-col gap-4'>
            <Headings level={2} className='text-3xl md:text-4xl lg:text-5xl'>
              Unsere Leistungen
            </Headings>
            <p className='text-base md:text-lg text-gray-700'>
              Alles aus einer Hand für {config.name.toLowerCase()} in {cityName}
              .
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {config.features.map((feature, idx) => (
              <div
                key={idx}
                className='flex flex-col gap-3 p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow'>
                <div className='text-2xl'>✓</div>
                <h3 className='text-lg font-semibold'>{feature}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className='container mx-auto py-20 md:py-40 px-4 md:px-0'>
        <div className='flex flex-col gap-12'>
          <div className='flex flex-col gap-4'>
            <Headings level={2} className='text-3xl md:text-4xl lg:text-5xl'>
              Warum Hausmeisterservice Weiß in {cityName}?
            </Headings>
            <p className='text-base md:text-lg text-gray-700'>
              Diese Vorteile bekommen Sie mit uns.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {config.benefits.map((benefit, idx) => (
              <div
                key={idx}
                className='flex flex-col gap-3 p-6 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='text-2xl font-bold text-primary'>
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <p className='text-base md:text-lg'>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process Section */}
      <div className='container mx-auto py-20 md:py-40 px-4 md:px-0'>
        <div className='flex flex-col gap-12'>
          <Headings level={2} className='text-3xl md:text-4xl lg:text-5xl'>
            So funktioniert unser Service
          </Headings>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='flex flex-col gap-4 text-center'>
              <div className='text-4xl mb-2'>📞</div>
              <h3 className='font-semibold text-lg'>1. Anfrage</h3>
              <p className='text-gray-700'>
                Sie kontaktieren uns und beschreiben Ihr Anliegen.
              </p>
            </div>
            <div className='flex flex-col gap-4 text-center'>
              <div className='text-4xl mb-2'>📋</div>
              <h3 className='font-semibold text-lg'>2. Angebot</h3>
              <p className='text-gray-700'>
                Wir erstellen ein maßgeschneidertes Angebot für Sie.
              </p>
            </div>
            <div className='flex flex-col gap-4 text-center'>
              <div className='text-4xl mb-2'>🛠️</div>
              <h3 className='font-semibold text-lg'>3. Durchführung</h3>
              <p className='text-gray-700'>
                Unsere Profis erledigen die Arbeit zuverlässig.
              </p>
            </div>
            <div className='flex flex-col gap-4 text-center'>
              <div className='text-4xl mb-2'>✅</div>
              <h3 className='font-semibold text-lg'>4. Zufriedenheit</h3>
              <p className='text-gray-700'>
                Sie sind zufrieden – das ist unser Ziel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div
        className='flex flex-col py-12'
        id='kontakt'
        style={{
          backgroundImage: "url('/images/Kontakt_background.png')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "fill",
          backgroundPosition: "top",
        }}>
        <div className='container max-w-6xl flex flex-col gap-6 bg-white shadow-md p-6 md:p-12 rounded-lg items-center mx-4 md:mx-auto'>
          <div className='flex flex-col items-center gap-4 text-center'>
            <p className='text-2xl md:text-4xl font-bold'>
              Schnell und einfach Kontakt aufnehmen
            </p>
            <p className='text-base md:text-lg px-4 md:px-0'>
              Sie haben Fragen oder möchten ein unverbindliches Angebot für{" "}
              {config.name.toLowerCase()} in {cityName}? Schreiben Sie uns oder
              rufen Sie direkt an – wir sind für Sie da.
            </p>
          </div>
          <div className='flex flex-col md:flex-row gap-8 md:gap-4 items-start md:items-center justify-between w-full'>
            <div className='w-full md:w-1/2'>
              <ContactForm />
            </div>
            <div className='flex flex-col gap-6 w-full md:w-1/2 md:pl-24 justify-center'>
              <div className='flex flex-row gap-2 items-center'>
                <PhoneIcon
                  color='black'
                  height={24}
                  width={24}
                  className='flex-shrink-0'
                />
                <Link
                  href={"tel:+492084458875"}
                  className='hover:text-primary text-sm md:text-base'>
                  +49 208 4458875
                </Link>
              </div>
              <div className='flex flex-row gap-2 items-center'>
                <MailIcon
                  color='black'
                  height={24}
                  width={24}
                  className='flex-shrink-0'
                />
                <Link
                  href={"mailto:info@weiss-hausmeisterservice.de"}
                  className='hover:text-primary text-sm md:text-base break-all'>
                  info@weiss-hausmeisterservice.de
                </Link>
              </div>
              <div className='flex flex-row gap-2 items-start'>
                <ClockIcon
                  color='black'
                  width={24}
                  height={24}
                  className='flex-shrink-0'
                />
                <div className='flex flex-col text-sm md:text-base'>
                  <p>Öffnungszeiten:</p>
                  <p>Mo.: 08:00 - 17:00</p>
                  <p>Di. - Fr.: 09:00 - 17:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; service: string }>;
}) {
  const { city, service } = await params;

  // City dekodieren
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);

  // Service dekodieren
  const serviceSlugRaw = service.trim().toLowerCase();
  let serviceDecoded = serviceSlugRaw;
  try {
    serviceDecoded = decodeURIComponent(serviceSlugRaw);
  } catch {}

  // Validierung
  if (!isAllowedCity(cityName) || !(serviceDecoded in serviceConfig)) {
    return {
      title: "Hausmeisterservice",
    };
  }

  const config = serviceConfig[serviceDecoded as ServiceKey];

  return {
    title: `${config.name} ${cityName} ▷ Professionell & Zuverlässig | Hausmeisterservice Weiß`,
    description: `${config.title} in ${cityName}. ${config.description} ✓ Jetzt kostenlos anfragen!`,
    keywords: [
      `${config.name} ${cityName}`,
      `${config.name} in ${cityName}`,
      `Professionelle ${config.name.toLowerCase()}`,
      "Hausmeisterservice Weiß",
    ],
    openGraph: {
      title: `${config.name} ${cityName} | Hausmeisterservice Weiß`,
      description: `Professioneller Service: ${config.name} in ${cityName}. Zuverlässig, fair und schnell.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://weiss-hausmeisterservice.de/stadt/${encodeURIComponent(
        cityName
      )}/${serviceDecoded}`,
    },
  };
}
