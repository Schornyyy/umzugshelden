import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Eye,
  HeartHandshake,
  KeyRound,
  Phone,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Truck,
  Video,
} from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import AblaufVergleich from "./AblaufVergleich";
import EntruempelungLeadFunnel from "./EntruempelungLeadFunnel";

const PHONE_HREF = "tel:+4915168567708";
const PHONE_LABEL = "+49 151 68567708";

export const metadata: Metadata = {
  title: "Entrümpelung zum Festpreis | Kostenlose Besichtigung",
  description:
    "Professionelle Entrümpelung: diskret, besenrein und zum verbindlichen Festpreis. Jetzt kostenlos und unverbindlich anfragen.",
  alternates: {
    canonical: "https://www.umzugshelden.io/landingpage/entrümpelung",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const promises = [
  {
    icon: Video,
    title: "Kostenlose Besichtigung",
    text: "Vor Ort oder flexibel per Video. Sie entscheiden erst danach – ohne Verpflichtung.",
  },
  {
    icon: ShieldCheck,
    title: "Verbindlicher Festpreis",
    text: "Alle vereinbarten Leistungen stehen transparent im Angebot. Der vereinbarte Preis gilt.",
  },
  {
    icon: PiggyBank,
    title: "Faire Wertanrechnung",
    text: "Verwertbare Möbel und Gegenstände können nach Prüfung direkt angerechnet werden.",
  },
];

const process = [
  {
    icon: Calculator,
    title: "Angebot anfordern",
    text: "Drei kurze Fragen beantworten oder direkt anrufen.",
  },
  {
    icon: Eye,
    title: "Besichtigung & Festpreis",
    text: "Kostenlose Einschätzung vor Ort oder per WhatsApp-Video.",
  },
  {
    icon: Sparkles,
    title: "Besenreine Übergabe",
    text: "Wir räumen, sortieren, entsorgen und übergeben sauber.",
  },
];

const faqs = [
  {
    question: "Was kostet eine Entrümpelung?",
    answer:
      "Der Preis hängt vor allem von Menge und Art des Hausrats, Zugänglichkeit, Etage, Laufwegen und Entsorgungsaufwand ab. Nach der kostenlosen Besichtigung erhalten Sie ein verbindliches Festpreisangebot. Verwertbare Gegenstände können nach Prüfung angerechnet werden.",
  },
  {
    question: "Muss ich während der Räumung vor Ort sein?",
    answer:
      "Nein. Eine abgestimmte Schlüsselübergabe reicht aus. Wir dokumentieren den Ablauf und melden uns, sobald das Objekt übergabebereit ist.",
  },
  {
    question: "Was bedeutet „besenrein“?",
    answer:
      "Alle vereinbarten Gegenstände werden entfernt, die Räume werden durchgefegt und grobe Verschmutzungen sowie Spinnweben werden beseitigt. Zusätzliche Reinigungsleistungen können separat vereinbart werden.",
  },
  {
    question: "Wie wird der Sperrmüll entsorgt?",
    answer:
      "Wir trennen die Materialien und führen sie den vorgesehenen regionalen Entsorgungs- und Recyclingwegen zu. Sonderabfälle werden nur über dafür geeignete Stellen entsorgt.",
  },
];

function sanitizeCity(value: string | string[] | undefined) {
  const city = Array.isArray(value) ? value[0] : value;
  if (!city) return "Olpe & Umgebung";
  const normalized = city.trim().replace(/[^\p{L}\p{M}\s-]/gu, "");
  return normalized.slice(0, 60) || "Olpe & Umgebung";
}

function normalizeServiceSlug(value: string) {
  try {
    return decodeURIComponent(value).normalize("NFC");
  } catch (error) {
    if (error instanceof URIError) return "";
    throw error;
  }
}

export default async function EntruempelungLandingpage({
  params,
  searchParams,
}: {
  params: Promise<{ service: string }>;
  searchParams: Promise<{ stadt?: string | string[] }>;
}) {
  const [{ service }, { stadt }] = await Promise.all([params, searchParams]);
  const normalizedService = normalizeServiceSlug(service);
  if (
    normalizedService !== "entrümpelung" &&
    normalizedService !== "entruempelung"
  ) {
    notFound();
  }
  const city = sanitizeCity(stadt);

  return (
    <main>
      <section className="relative overflow-hidden bg-navy text-white">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/images/Umzugsunternehmen_Olpe.png"
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/95 to-navy/70" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:items-center lg:px-8 lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-orange-200">
              <BadgeCheck size={16} /> Regional für Sie im Einsatz
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              Professionelle Entrümpelung in{" "}
              <span className="text-primary">{city}</span>
              <span className="block text-white">
                Besenrein &amp; zum verbindlichen Festpreis.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              Wir übernehmen die komplette Räumung und fachgerechte Entsorgung.
              Transparent kalkuliert, ohne unnötige Eigenleistung und inklusive
              möglicher Wertanrechnung.
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-100 sm:grid-cols-2">
              {[
                "Kostenlose Besichtigung",
                "Keine versteckten Zusatzleistungen",
                "Diskreter Umgang",
                "Besenreine Übergabe",
              ].map((benefit) => (
                <span key={benefit} className="flex items-center gap-2">
                  <Check
                    size={18}
                    className="shrink-0 text-primary"
                    strokeWidth={3}
                  />
                  {benefit}
                </span>
              ))}
            </div>
            <a
              href="#angebot"
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-sans text-base font-bold text-white shadow-xl shadow-black/20 transition hover:bg-orange-600">
              Jetzt kostenloses Angebot anfordern <ArrowRight size={19} />
            </a>
            <p className="mt-3 text-xs font-medium text-slate-300">
              ✓ 100 % unverbindlich &nbsp; ✓ In etwa 1 Minute ausgefüllt
            </p>
          </div>

          <div
            id="angebot"
            className="scroll-mt-6 rounded-2xl bg-white p-5 text-slate-950 shadow-2xl sm:p-7">
            <EntruempelungLeadFunnel />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { icon: CalendarCheck, text: "Flexible Terminabstimmung" },
            { icon: ClipboardCheck, text: "Transparentes Festpreisangebot" },
            { icon: Truck, text: "Räumung & Entsorgung aus einer Hand" },
          ].map(({ icon: Icon, text }) => (
            <div
              key={text}
              className="flex items-center justify-center gap-3 text-center text-sm font-bold text-navy">
              <Icon size={22} className="shrink-0 text-primary" /> {text}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Transparenz statt Unsicherheit
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Unser 3-Punkte-Versprechen
            </h2>
            <p className="mt-4 text-slate-600">
              Sie wissen vor Beginn, welche Leistungen enthalten sind und
              womit Sie rechnen können.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {promises.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-primary">
                    <Icon size={25} />
                  </span>
                  <span className="font-sans text-4xl font-black text-slate-100">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-xl font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Einfacher Ablauf
              </p>
              <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
                In 3 Schritten zum freien Objekt
              </h2>
              <p className="mt-4 text-slate-600">
                Sie müssen nichts vorsortieren oder vorbereiten. Wir übernehmen
                den Ablauf von der ersten Einschätzung bis zur Übergabe.
              </p>
              <div className="mt-8 space-y-6">
                {process.map(({ icon: Icon, title, text }, index) => (
                  <div key={title} className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-white">
                      <Icon size={22} />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Schritt {index + 1}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-navy">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <a
                href="#angebot"
                className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-white hover:bg-orange-600">
                Angebot berechnen <ArrowRight size={18} />
              </a>
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-xl">
              <Image
                src="/images/Umzugsunternhemen_olpe.png"
                alt="Einsatzfahrzeug für Entrümpelungen in Olpe und Umgebung"
                width={700}
                height={700}
                className="h-full max-h-[560px] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
              Diskretion ohne Urteil
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Auch bei sensiblen Situationen an Ihrer Seite
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Todesfall, Messie-Haushalt oder Zwangsräumung: Wir behandeln jede
              Situation respektvoll, ruhig und vertraulich. Niemand muss sich
              erklären oder schämen.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <HeartHandshake className="text-primary" size={28} />
                <h3 className="mt-3 font-bold">Einfühlsamer Umgang</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Respektvoller Umgang mit persönlichen Gegenständen und
                  schwierigen Lebenssituationen.
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <KeyRound className="text-primary" size={28} />
                <h3 className="mt-3 font-bold">Keine Eigenleistung nötig</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Schlüsselübergabe genügt. Vorsortieren und Tragen übernehmen
                  wir nach Vereinbarung.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 text-slate-950 sm:p-8">
            <ShieldCheck size={40} className="text-primary" />
            <h3 className="mt-4 text-2xl font-bold text-navy">
              Diskretions-Garantie
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              Wir arbeiten diskret und ohne Urteil. Unser Team stimmt den Ablauf
              individuell mit Ihnen ab und schützt Ihre Privatsphäre während
              der gesamten Räumung.
            </p>
            <a
              href={PHONE_HREF}
              className="mt-6 inline-flex items-center gap-2 font-sans font-bold text-primary hover:underline">
              <Phone size={18} /> Vertraulich sprechen: {PHONE_LABEL}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Das Leistungsziel
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Vom vollen Raum zur besenreinen Übergabe
            </h2>
            <p className="mt-4 text-slate-600">
              Bewegen Sie den Regler und sehen Sie, was wir für Sie übernehmen.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <AblaufVergleich />
          </div>
        </div>
      </section>

      <ReviewCarousel />

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Klare Antworten
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Häufige Fragen zur Entrümpelung
            </h2>
          </div>
          <div className="mt-10 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-sans font-bold text-navy">
                  {faq.question}
                  <span className="text-2xl font-normal text-primary transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary px-4 py-14 text-center text-white sm:py-16">
        <Sparkles className="mx-auto" size={34} />
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-bold sm:text-4xl">
          Bereit für ein freies, aufgeräumtes Zuhause?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-orange-50">
          Fordern Sie jetzt Ihre kostenlose Besichtigung an und stimmen Sie
          Ihren Wunschtermin persönlich mit uns ab.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href="#angebot"
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-navy px-6 font-sans font-bold text-white hover:bg-navy-light">
            Jetzt Angebot berechnen <ArrowRight size={19} />
          </a>
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border-2 border-white bg-white px-6 font-sans font-bold text-navy hover:bg-orange-50">
            <Phone size={19} /> Jetzt direkt anrufen
          </a>
        </div>
      </section>

      <footer className="bg-navy px-4 py-6 text-center text-xs text-slate-400">
        <p>© {new Date().getFullYear()} Umzugshelden · Entrümpelung in Olpe und Umgebung</p>
      </footer>
    </main>
  );
}
