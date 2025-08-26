import { bulletPointsCompanyyCard } from "@/statics/Lists";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import RoiCalculator from "./_components/RoiCalculator";

// Kleine Hilfs-Card für Abschnitts-Überschriften
function SectionHeading({
  kicker,
  title,
  center = false,
}: {
  kicker?: string;
  title: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 ${center ? "text-center" : ""}`}>
      {kicker && (
        <p className='text-xs tracking-widest font-semibold text-green-600 uppercase mb-2'>
          {kicker}
        </p>
      )}
      <h2 className='text-2xl md:text-3xl font-bold leading-tight text-slate-800'>
        {title}
      </h2>
    </div>
  );
}

// ROI Rechner (Client) – einfacher Kalkulationsplatzhalter
// The RoiCalculator component has been moved to a separate file.

export async function generateMetadata() {
  return {
    title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
    description:
      "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
    openGraph: {
      title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
      description:
        "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
      url: "https://jobsmith.de/gartenlandschaftsbau",
      images: [
        {
          url: "/images/fuer_unternehemen_hero.png",
          width: 750,
          height: 350,
          alt: "Garten- & Landschaftsbau Aufträge in meiner Nähe",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Finde Garten- & Landschaftsbau Aufträge in deiner Nähe",
      description:
        "Du bist im Garten- und Landschaftsbau tätig und suchst nach Aufträgen? Finde jetzt passende Galabau-Aufträge direkt in deiner Nähe mit JobSmith.",
      image: "/images/fuer_unternehemen_hero.png",
    },
  };
}

const page = async () => {
  return (
    <div className='flex flex-col w-full'>
      {/* HERO */}
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-br from-green-600 via-green-700 to-emerald-800' />
        <div className='relative container mx-auto px-4 py-24 md:py-28'>
          <div className='grid lg:grid-cols-2 gap-14 items-center'>
            <div>
              <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight'>
                Planbar neue Garten- & Landschaftsbau Aufträge gewinnen
              </h1>
              <p className='mt-6 text-base md:text-lg text-emerald-50 max-w-xl'>
                JobSmith bringt qualifizierte private und gewerbliche Anfragen
                direkt zu Ihrem Betrieb – ohne Kaltakquise, ohne teure
                Streuverluste. Sie fokussieren sich auf Umsetzung & Qualität,
                wir liefern Ihnen Auftragschancen.
              </p>
              <div className='mt-8 flex flex-col sm:flex-row gap-4'>
                <Link
                  href='/register/company'
                  className='inline-flex items-center justify-center rounded-lg bg-white text-green-700 font-semibold px-6 py-3 shadow hover:bg-emerald-50 transition'>
                  Jetzt kostenlos starten
                </Link>
                <Link
                  href='/kontakt'
                  className='inline-flex items-center justify-center rounded-lg border border-white/40 text-white font-medium px-6 py-3 hover:bg-white/10 transition'>
                  Beratungsgespräch anfragen
                </Link>
              </div>
              <p className='mt-4 text-[12px] tracking-wide uppercase text-emerald-200 font-medium'>
                Kostenlos registrieren – keine versteckten Gebühren
              </p>
            </div>
            <div className='relative'>
              <div className='relative rounded-xl overflow-hidden ring-4 ring-white/10 shadow-2xl'>
                <Image
                  src='/images/fuer_unternehemen_hero.png'
                  alt='Aufträge für Garten- & Landschaftsbau Betriebe'
                  width={900}
                  height={700}
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className='bg-slate-50 py-12 md:py-16'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
            <p className='text-sm text-slate-600 md:max-w-xs font-medium'>
              Vertrauenswürdig & effizient – entwickelt gemeinsam mit Betrieben
              aus dem GaLaBau.
            </p>
            <div className='flex flex-wrap items-center gap-x-10 gap-y-4 opacity-70'>
              {/* Platzhalter für Logos */}
              {["Qualität", "Transparenz", "Support", "DSGVO"].map((t) => (
                <div
                  key={t}
                  className='text-xs font-semibold tracking-wider uppercase text-slate-500'>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className='container mx-auto px-4 py-20'>
        <div className='grid lg:grid-cols-2 gap-14 items-start'>
          <div>
            <SectionHeading
              kicker='Warum JobSmith'
              title='Weniger Leerlauf. Mehr passende Anfragen.'
            />
            <div className='space-y-5 text-slate-600 leading-relaxed'>
              <p>
                Viele Betriebe verlieren Zeit mit unqualifizierten Anfragen,
                spontanen Preisvergleichen oder teurer Werbung ohne messbare
                Resultate. Gleichzeitig schwanken Auslastung und
                Planungssicherheit.
              </p>
              <p>
                JobSmith filtert und strukturiert Nachfrage: Auftraggeber geben
                Bedarf sauber strukturiert an – Sie sehen sofort, ob es passt
                und können schnell reagieren.
              </p>
              <ul className='space-y-2 mt-4'>
                <li className='flex gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>Zielgerichtete Aufträge nach Region & Service</span>
                </li>
                <li className='flex gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>Sichtbarkeit bei kaufbereiten Kunden</span>
                </li>
                <li className='flex gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>Transparente, klare Anfrageinformationen</span>
                </li>
                <li className='flex gap-2'>
                  <span className='text-green-600 font-bold'>•</span>
                  <span>Kein Streuverlust – Fokus auf Umsetzung</span>
                </li>
              </ul>
              <div className='mt-8 flex gap-4'>
                <Link
                  href='/register/company'
                  className='px-5 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow'>
                  Jetzt kostenlos registrieren
                </Link>
              </div>
            </div>
          </div>
          <div className='grid sm:grid-cols-2 gap-6'>
            {bulletPointsCompanyyCard.map((item, i) => (
              <div
                key={i}
                className='rounded-xl border bg-white p-5 shadow-sm hover:shadow transition group'>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='h-10 w-10 rounded-md bg-green-50 flex items-center justify-center ring-1 ring-green-100'>
                    <Image
                      alt={item.title}
                      src={item.iconPath}
                      width={28}
                      height={28}
                    />
                  </div>
                  <h3 className='font-semibold text-slate-800 text-sm'>
                    {item.title}
                  </h3>
                </div>
                <p className='text-xs text-slate-600 leading-relaxed'>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className='bg-white py-20 border-t'>
        <div className='container mx-auto px-4'>
          <SectionHeading
            center
            kicker='So funktioniert es'
            title='In 3 Schritten zu neuen Aufträgen'
          />
          <div className='grid md:grid-cols-3 gap-10'>
            {[
              {
                t: "1. Profil anlegen",
                d: "Kostenlos registrieren & Leistungen hinterlegen. Sichtbar für regionale Auftraggeber.",
              },
              {
                t: "2. Passende Anfragen erhalten",
                d: "Wir benachrichtigen Sie bei relevanten Aufträgen in Ihrem Umkreis.",
              },
              {
                t: "3. Angebot abgeben & gewinnen",
                d: "Schnell reagieren, professionell auftreten – Auftrag sichern.",
              },
            ].map((s, i) => (
              <div
                key={i}
                className='relative p-6 bg-slate-50 rounded-xl border'>
                <div className='absolute -top-4 left-6 h-8 w-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shadow'>
                  {i + 1}
                </div>
                <h3 className='mt-4 font-semibold text-slate-800 mb-2 text-base'>
                  {s.t}
                </h3>
                <p className='text-sm text-slate-600 leading-relaxed'>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI & VALUE */}
      <section className='container mx-auto px-4 py-24'>
        <div className='grid lg:grid-cols-2 gap-14 items-start'>
          <div>
            <SectionHeading
              kicker='Wirtschaftlicher Nutzen'
              title='Mehr Umsatz – ohne zusätzliche Fixkosten'
            />
            <p className='text-slate-600 leading-relaxed mb-5'>
              Statt in ineffiziente Werbung oder Plattformen mit hoher Gebühr
              einzuzahlen, nutzen Sie eine Infrastruktur, die echten Mehrwert
              liefert: strukturierte Leads – planbarer Zufluss – bessere
              Auslastung.
            </p>
            <ul className='space-y-2 text-sm text-slate-600'>
              <li className='flex gap-2'>
                <span className='text-green-600 font-bold'>✓</span>
                <span>
                  Direkte Benachrichtigung bei Aufträgen in Ihrem Radius
                </span>
              </li>
              <li className='flex gap-2'>
                <span className='text-green-600 font-bold'>✓</span>
                <span>Klare Angaben: Umfang, Größe, Startzeitpunkt</span>
              </li>
              <li className='flex gap-2'>
                <span className='text-green-600 font-bold'>✓</span>
                <span>Focus: Projekte statt Plattform-Verwaltung</span>
              </li>
            </ul>
            <div className='mt-8'>
              <Link
                href='/register/company'
                className='inline-flex items-center px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow'>
                Jetzt Profil erstellen
              </Link>
            </div>
          </div>
          <RoiCalculator />
        </div>
      </section>

      {/* FINAL CTA */}
      <section className='bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24'>
        <div className='container mx-auto px-4 text-center'>
          <h2 className='text-3xl md:text-4xl font-bold text-white mb-6'>
            Werden Sie jetzt Teil der Plattform
          </h2>
          <p className='text-slate-300 max-w-2xl mx-auto mb-10'>
            Erhalten Sie strukturierte Anfragen & steigern Sie Ihre Auslastung
            nachhaltig. Ihr Profil ist in wenigen Minuten online.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Link
              href='/register/company'
              className='px-6 py-3 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold shadow'>
              Kostenlos starten
            </Link>
            <Link
              href='/kontakt'
              className='px-6 py-3 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 font-medium'>
              Fragen? Kontakt aufnehmen
            </Link>
          </div>
          <p className='text-[10px] uppercase tracking-wider text-slate-500 mt-8'>
            100% Eigenständigkeit – Sie behalten Ihre Kundenbeziehung
          </p>
        </div>
      </section>
    </div>
  );
};

export default page;
