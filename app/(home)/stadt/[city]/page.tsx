import { redirect } from "next/navigation";
import { rawCities } from "@/statics/Lists";
import { slugify, deslugify } from "@/utils/slugify";
import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import { ClockIcon, MailIcon, PhoneIcon } from "lucide-react";

// Whitelist-Check gegen erlaubte Städte
function isAllowedCity(cityName: string): boolean {
  return rawCities.some(
    (c: string) => slugify(c).toLowerCase() === slugify(cityName).toLowerCase()
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

  // Validate city on server side and redirect if invalid
  if (!isAllowedCity(cityName)) {
    redirect("/");
  }

  const services = [
    {
      slug: "hausmeisterservice",
      name: "Hausmeisterservice",
      description:
        "Reparaturen, Kontrolle der Haustechnik und regelmäßige Objektpflege.",
    },
    {
      slug: "gebäudereinigung",
      name: "Gebäudereinigung",
      description:
        "Professionelle Reinigung von Treppenhäusern, Büros und Gebäuden.",
    },
    {
      slug: "grundstückspflege",
      name: "Grundstückspflege",
      description: "Rasenmähen, Heckenschnitt, Laubentsorgung und mehr.",
    },
  ];

  const images = [
    "/images/gebäude.png",
    "/images/pflege.png",
    "/images/glasreinigung.png",
  ];

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
        <div className='container mx-auto px-4 py-32 gap-12 items-center'>
          <div className='flex flex-col gap-6 w-full items-center'>
            <Headings
              level={1}
              className='text-white text-4xl md:text-6xl lg:text-8xl text-center'>
              Hausmeisterservice in {cityName}
            </Headings>
            <p className='text-white text-center text-lg md:text-xl lg:text-2xl px-4 md:px-0'>
              Schnell, zuverlässig & fair – Ihr Ansprechpartner vor Ort.
            </p>
            <div className='flex flex-col md:flex-row gap-4 md:gap-12 w-full px-4 md:px-0 md:w-auto'>
              <Link href={"#kontakt"} className='w-full md:w-auto'>
                <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                  Angebot erhalten
                </Button>
              </Link>
              <Link href={"#services"} className='w-full md:w-auto'>
                <Button
                  variant={"outline"}
                  className='bg-transparent text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center text-base md:text-lg'>
                  Dienstleistungen ansehen
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div
        className='container mx-auto py-20 md:py-40 flex flex-col gap-20 md:gap-40 px-4 md:px-0'
        id='services'>
        <div className='flex flex-col gap-2 w-full md:w-3/4'>
          <Headings level={2} className='text-3xl md:text-4xl lg:text-5xl'>
            Leistungen in {cityName}
          </Headings>
          <p className='text-base md:text-lg'>
            Von Reparaturen bis zur gründlichen Gebäudereinigung: Wir bieten ein
            Rundum-sorglos-Paket für Ihre Immobilie.
          </p>
        </div>

        {services.map((service, idx) => (
          <div
            key={service.slug}
            className={`flex ${
              idx % 2 === 0
                ? "flex-col-reverse md:flex-row"
                : "flex-col-reverse md:flex-row-reverse"
            } gap-8 md:gap-12 items-center`}>
            <Image
              src={images[idx]}
              alt={service.name}
              width={400}
              height={300}
              className='w-full md:w-1/3 object-cover rounded-xl shadow-md h-[250px]'
            />
            <div className='flex flex-col gap-4 w-full md:w-1/3'>
              <Headings level={3} className='text-2xl md:text-3xl'>
                {service.name}
              </Headings>
              <p className='text-base md:text-lg'>{service.description}</p>
              <Link
                href={`/stadt/${encodeURIComponent(cityName)}/${service.slug}`}
                className='w-full md:w-auto'>
                <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full text-center'>
                  Mehr Erfahren
                </Button>
              </Link>
            </div>
          </div>
        ))}
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
              Sie haben Fragen oder möchten ein unverbindliches Angebot?
              Schreiben Sie uns oder rufen Sie direkt an – wir sind für Sie da.
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
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const slugRaw = city.trim();
  let decoded = slugRaw;
  try {
    decoded = decodeURIComponent(slugRaw);
  } catch {}
  const cityName = deslugify(decoded);

  // Validierung: City muss in der Liste sein
  if (!isAllowedCity(cityName)) {
    return {
      title: "Hausmeisterservice",
    };
  }

  return {
    title: `Hausmeisterservice ${cityName} ▷ Schnell & zuverlässig | Hausmeisterservice Weiß`,
    description: `✓ Hausmeisterservice in ${cityName} ✓ Reparaturen ✓ Gebäudereinigung ✓ Grundstückspflege ► Jetzt kostenlos anfragen!`,
    keywords: [
      `Hausmeisterservice ${cityName}`,
      `Hausmeister ${cityName}`,
      `Gebäudereinigung ${cityName}`,
      `Grundstückspflege ${cityName}`,
    ],
    openGraph: {
      title: `Hausmeisterservice ${cityName} | Hausmeisterservice Weiß`,
      description: `Professioneller Hausmeisterservice in ${cityName}: Reparaturen, Reinigung, Grundstückspflege. Zuverlässig & fair.`,
      type: "website",
      locale: "de_DE",
    },
    alternates: {
      canonical: `https://weiss-hausmeisterservice.de/stadt/${encodeURIComponent(
        cityName
      )}`,
    },
  };
}
