import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";

export async function generateMetadata() {
  return {
    title: "Umzugshelden — Ihr zuverlässiger Umzugsservice",
    description:
      "Umzugshelden – Ihr Umzugsservice im Kreis Olpe und 25 km Umkreis: schnell, zuverlässig und günstig. Kostenlose Anfrage stellen!",
    openGraph: {
      title: "Umzugshelden — Ihr zuverlässiger Umzugsservice",
      description:
        "Professioneller Umzugsservice – schnelle Reaktionen und faire Preise. Kostenloses Angebot anfordern!",
      url: "https://umzugshelden.de",
      images: [
        {
          url: "/images/Umzugsunternhemen_olpe.png",
          width: 1200,
          height: 630,
          alt: "Umzugshelden Fahrzeug",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Umzugshelden — Ihr zuverlässiger Umzugsservice",
      description:
        "Professioneller Umzugsservice – schnell, zuverlässig und günstig.",
      image: "/images/Umzugsunternhemen_olpe.png",
    },
  };
}

const page = () => {
  return (
    <div className='flex flex-col'>
      <Hero />
      <WhyUsSection />
      <ServicesSection />
      <AboutSection />
      <ReviewsSection />
      <CTASection />
    </div>
  );
};

export default page;

/* ─────────────────────────── HERO ─────────────────────────── */
const Hero = () => {
  return (
    <section
      id='anfrage'
      className='relative min-h-[600px] flex items-center'
      style={{
        backgroundImage: "url('/images/Umzugsunternehmen_Olpe.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}>
      {/* Dark overlay */}
      <div className='absolute inset-0 bg-navy/80' />

      <div className='relative z-10 container mx-auto px-4 py-20'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
          {/* Left: Request form card */}
          <div className='bg-[#0b1f3a] rounded-xl p-8 shadow-2xl border border-white/10'>
            <h2 className='font-sans font-semibold text-white text-xl mb-4'>
              Jetzt kostenlose Anfrage stellen!
            </h2>
            <p className='font-body text-gray-400 text-sm mb-6'>
              Wir rufen Sie innerhalb der nächsten 24 Stunden an und besprechen
              gemeinsam Ihren Umzug.
            </p>
            <form className='flex flex-col gap-4'>
              <input
                type='text'
                placeholder='Name'
                className='font-body w-full px-4 py-3 rounded bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm'
              />
              <input
                type='email'
                placeholder='E-Mail'
                className='font-body w-full px-4 py-3 rounded bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm'
              />
              <input
                type='tel'
                placeholder='Telefonnummer'
                className='font-body w-full px-4 py-3 rounded bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm'
              />
              <textarea
                rows={3}
                placeholder='Ihre Nachricht (optional)'
                className='font-body w-full px-4 py-3 rounded bg-white/90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none'
              />
              <Button className='w-full font-sans bg-primary hover:bg-primary/90 text-white py-3 rounded text-sm font-semibold'>
                Kostenloses Angebot anfordern!
              </Button>
            </form>
          </div>

          {/* Right: Heading + CTA */}
          <div className='flex flex-col gap-6'>
            <h1 className='font-sans font-bold text-4xl md:text-5xl lg:text-6xl text-primary leading-tight'>
              Ihr zuverlässiger Umzugsservice im Kreis Olpe &amp; Umgebung!
            </h1>
            <p className='font-body text-gray-200 text-lg leading-relaxed'>
              Ob Wohnungsumzug, Firmenumzug oder Umzug innerhalb der Region –
              wir packen an. Mit erfahrenem Team, modernem Fuhrpark und fairen
              Preisen sind wir Ihr starker Partner im Kreis Olpe.
            </p>
            <p className='font-body text-gray-300'>
              Vertrauen Sie auf Umzugshelden: Hunderte erfolgreiche Umzüge,
              glückliche Kunden und ein Service, der sich wirklich um Sie
              kümmert.
            </p>
            <Link href='/#anfrage' className='w-full md:w-auto'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded text-base font-semibold w-full md:w-auto'>
                Kostenloses Angebot anfordern!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── WHY US ─────────────────────────── */
const WhyUsSection = () => {
  return (
    <section className='py-24 bg-white' id='einsatzgebiet'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-16 items-start'>
          <div>
            <h2 className='font-sans font-bold text-4xl md:text-5xl text-navy leading-tight'>
              Ihr zuverlässiger Partner für stressfreie Umzüge im Kreis Olpe und
              Umgebung
            </h2>
          </div>
          <div className='pt-2'>
            <p className='font-body text-gray-600 text-lg leading-relaxed'>
              Bei Umzugshelden stehen Sie im Mittelpunkt. Wir bieten Ihnen ein
              umfassendes Umzugspaket – von der sorgfältigen Planung über den
              professionellen Transport bis hin zum Aufbau in Ihrem neuen
              Zuhause. Unser eingespieltes Team sorgt dafür, dass Ihr Umzug
              reibungslos verläuft – pünktlich, sicher und zu einem fairen
              Preis.
            </p>
            <p className='font-body text-gray-600 text-lg leading-relaxed mt-4'>
              Vertrauen Sie einem erfahrenen Team: Wir behandeln Ihr Eigentum
              wie unseres – mit Sorgfalt, Respekt und echtem Engagement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── SERVICES ─────────────────────────── */
const services = [
  {
    number: "01",
    title: "Umzugsservice",
    description:
      "Von der ersten Beratung bis zum letzten Karton – wir planen und führen Ihren Umzug im Kreis Olpe und Umgebung professionell durch.",
    href: "/umzugsservice",
  },
  {
    number: "02",
    title: "Anstricharbeiten",
    description:
      "Wände streichen, Decken renovieren, Schönheitsreparaturen – wir bereiten Ihre Wohnung optimal und termingerecht für die Übergabe vor.",
    href: "/anstricharbeiten",
  },
  {
    number: "03",
    title: "Möbel Ab- & Aufbau",
    description:
      "IKEA, Einbauküche oder Schrankwand – wir demontieren und montieren Ihre Möbel schnell, sorgfältig und ohne Kratzer.",
    href: "/moebel-service",
  },
];

const ServicesSection = () => {
  return (
    <section className='py-20 bg-gray-50' id='services'>
      <div className='container mx-auto px-4'>
        <div className='flex justify-end mb-12'>
          <div className='w-full md:w-1/2 text-right'>
            <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy'>
              Unsere Dienstleistungen
            </h2>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {services.map((s) => (
            <div
              key={s.number}
              className='bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow'>
              <span className='font-sans font-black text-8xl text-gray-100 leading-none select-none'>
                {s.number}
              </span>
              <h3 className='font-sans font-semibold text-xl text-navy'>
                {s.title}
              </h3>
              <p className='font-body text-gray-600 text-sm leading-relaxed flex-grow'>
                {s.description}
              </p>
              <Link
                href={s.href}
                className='font-sans text-primary text-sm font-medium hover:underline'>
                Mehr ansehen »
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── ABOUT / STATS ─────────────────────────── */
const stats = [
  { value: "10+", label: "Erfolgreiche Umzüge" },
  { value: "24 H", label: "Schnelle Umzüge" },
  { value: "Günstig", label: "Günstige Preisgestaltung" },
];

const AboutSection = () => {
  return (
    <section className='py-20 bg-navy'>
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
          {/* Image */}
          <div className='rounded-xl overflow-hidden shadow-2xl'>
            <Image
              src='/images/Umzugsunternhemen_olpe.png'
              alt='Umzugshelden Fahrzeug'
              width={700}
              height={500}
              className='w-full object-cover'
            />
          </div>

          {/* Text + stats */}
          <div className='flex flex-col gap-6'>
            <h2 className='font-sans font-bold text-3xl md:text-4xl text-white leading-snug'>
              Zuverlässig, schnell und mit fairen Preisen an Ihrer Seite
            </h2>
            <p className='font-body text-gray-300 leading-relaxed'>
              Als Umzugshelden sind wir seit Jahren erfolgreich in der
              Umzugsbranche tätig. Unser erfahrenes Team sorgt dafür, dass jeder
              Umzug – ob groß oder klein – reibungslos und stressfrei verläuft.
              Wir behandeln Ihr Eigentum wie unseres.
            </p>

            {/* Stats */}
            <div className='grid grid-cols-3 gap-4 mt-4'>
              {stats.map((stat) => (
                <div
                  key={stat.value}
                  className='flex flex-col items-center gap-1 text-center'>
                  <span className='font-sans font-bold text-2xl md:text-3xl text-primary'>
                    {stat.value}
                  </span>
                  <span className='font-body text-gray-300 text-xs'>
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>

            <Link href='/#anfrage' className='mt-2'>
              <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded font-semibold'>
                Kostenloses Angebot anfordern!
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── REVIEWS ─────────────────────────── */
const reviews = [
  {
    name: "Oliver W.",
    rating: 5,
    text: "Absolut reibungsloser Umzug! Das Team war pünktlich, professionell und hat alles sicher transportiert. Sehr empfehlenswert!",
  },
  {
    name: "Ahmet D.",
    rating: 5,
    text: "Bester Umzugsservice den ich je erlebt habe! Top Arbeit geleistet und vor allem alles sauber hinterlassen. Sehr freundlich und absolut fairer Preis!",
  },
  {
    name: "Anke R.",
    rating: 5,
    text: "Nettes, fleißiges Team das sauber und schnell arbeitet. Unser Umzug hat deutlich weniger Zeit in Anspruch genommen als erwartet.",
  },
];

const ReviewsSection = () => {
  return (
    <section className='py-20 bg-white'>
      <div className='container mx-auto px-4'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-navy text-center mb-12'>
          Was unsere Kunden sagen
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          {reviews.map((review) => (
            <div
              key={review.name}
              className='bg-gray-50 rounded-xl p-8 shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow'>
              {/* Stars */}
              <div className='flex gap-1'>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <StarIcon
                    key={i}
                    className='text-primary fill-primary'
                    size={18}
                  />
                ))}
              </div>
              <h4 className='font-sans font-semibold text-navy'>
                {review.name}
              </h4>
              <p className='font-body text-gray-600 text-sm leading-relaxed'>
                {review.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────── CTA ─────────────────────────── */
const CTASection = () => {
  return (
    <section className='py-20 bg-navy'>
      <div className='container mx-auto px-4 flex flex-col items-center gap-6 text-center'>
        <h2 className='font-sans font-bold text-3xl md:text-4xl text-white max-w-2xl leading-snug'>
          Bereit für einen stressfreien Umzug mit den Umzugshelden?
        </h2>
        <p className='font-body text-gray-300 max-w-xl'>
          Fordern Sie jetzt Ihr kostenloses und unverbindliches Angebot an – wir
          melden uns innerhalb von 24 Stunden bei Ihnen.
        </p>
        <Link href='/#anfrage'>
          <Button className='font-sans bg-primary hover:bg-primary/90 text-white px-10 py-4 rounded text-base font-semibold'>
            Kostenloses Angebot anfordern!
          </Button>
        </Link>
      </div>
    </section>
  );
};
