import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  CalendarCheck,
  Check,
  ClipboardCheck,
  Hammer,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import Image from "next/image";
import UmzugLeadFunnel from "./UmzugLeadFunnel";

const PHONE_HREF = "tel:+4915168567708";
const PHONE_LABEL = "+49 151 68567708";

const promises = [
  {
    icon: ClipboardCheck,
    title: "Klare Planung",
    text: "Wir erfassen Ihren Umzug persönlich und planen Fahrzeuge, Team und Leistungen passend zu Ihrem Bedarf.",
  },
  {
    icon: ShieldCheck,
    title: "Sicherer Transport",
    text: "Möbeldecken, Gurte und professionelles Equipment schützen Ihr Umzugsgut auf der gesamten Strecke.",
  },
  {
    icon: CalendarCheck,
    title: "Verlässlicher Termin",
    text: "Sie erhalten eine klare Terminabstimmung und einen festen Ansprechpartner für Ihren Umzug.",
  },
];

const processSteps = [
  {
    icon: MapPin,
    title: "Umzugsdaten senden",
    text: "Start, Ziel, Umfang und Wunschtermin in wenigen Schritten angeben.",
  },
  {
    icon: ClipboardCheck,
    title: "Beratung & Angebot",
    text: "Wir klären die Details und erstellen ein transparentes Angebot.",
  },
  {
    icon: Truck,
    title: "Entspannt umziehen",
    text: "Unser Team übernimmt Transport und gebuchte Zusatzleistungen.",
  },
];

const services = [
  {
    icon: Truck,
    title: "Privat- & Firmenumzüge",
    text: "Vom einzelnen Haushalt bis zum Büro planen wir den Ablauf passend zu Ihrem Zeitfenster.",
  },
  {
    icon: Box,
    title: "Verpackungsservice",
    text: "Auf Wunsch liefern wir Packmaterial und verpacken Ihr Inventar transportsicher.",
  },
  {
    icon: Hammer,
    title: "Möbelmontage",
    text: "Wir demontieren Möbel fachgerecht und bauen sie am Zielort wieder auf.",
  },
  {
    icon: PackageCheck,
    title: "Be- und Entladung",
    text: "Unser Team trägt, sichert und verstaut Ihr Umzugsgut sorgfältig im Fahrzeug.",
  },
  {
    icon: ShieldCheck,
    title: "Versicherter Transport",
    text: "Ihr Umzugsgut wird mit professioneller Ausrüstung und entsprechender Absicherung transportiert.",
  },
  {
    icon: Users,
    title: "Persönlicher Kontakt",
    text: "Sie sprechen direkt mit uns und haben während der Planung einen festen Ansprechpartner.",
  },
];

const faqs = [
  {
    question: "Was kostet ein professioneller Umzug?",
    answer:
      "Der Preis richtet sich nach Umfang, Entfernung, Etagen, Laufwegen und den gewünschten Zusatzleistungen. Nach Klärung dieser Angaben erhalten Sie ein transparentes, auf Ihren Umzug abgestimmtes Angebot.",
  },
  {
    question: "Wie früh sollte ich meinen Umzug anfragen?",
    answer:
      "Idealerweise fragen Sie vier bis sechs Wochen vor dem Wunschtermin an. Besonders Monatsenden und Wochenenden sind schnell belegt. Auch bei kurzfristigen Umzügen prüfen wir gerne, was möglich ist.",
  },
  {
    question: "Übernehmen Sie auch das Verpacken?",
    answer:
      "Ja. Wir können geeignetes Packmaterial bereitstellen und Ihr Inventar fachgerecht verpacken. Der Umfang wird vorab besprochen und im Angebot festgehalten.",
  },
  {
    question: "Bauen Sie Möbel ab und wieder auf?",
    answer:
      "Möbeldemontage und -montage können als Zusatzleistung vereinbart werden. Teilen Sie uns bei der Anfrage mit, welche Möbel betroffen sind, damit wir den Aufwand korrekt einplanen.",
  },
  {
    question: "Sind auch Umzüge über größere Entfernungen möglich?",
    answer:
      "Ja. Neben regionalen Umzügen übernehmen wir nach Absprache auch längere Strecken. Start- und Zielort können Sie direkt im Anfrage-Funnel angeben.",
  },
];

export default function UmzugLandingPage() {
  return (
    <main>
      <section className="overflow-hidden bg-navy text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] lg:items-start lg:gap-12 lg:px-8 lg:py-16">
          <div className="lg:sticky lg:top-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em] text-orange-200">
              <BadgeCheck size={16} /> Direkt von den Gründern begleitet
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.06] sm:text-5xl lg:text-6xl">
              Entspannt umziehen.
              <span className="block text-primary">
                Wir kümmern uns darum.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
              Persönlich geplant, sorgfältig transportiert und passend zu Ihrem
              Bedarf kalkuliert. Fordern Sie jetzt kostenlos Ihr individuelles
              Umzugsangebot an.
            </p>
            <div className="mt-5 grid gap-2.5 text-sm text-slate-100 sm:grid-cols-2">
              {[
                "Kostenlos & unverbindlich",
                "Fester Ansprechpartner",
                "Transparente Leistungen",
                "Auf Wunsch Komplettservice",
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
              className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 font-sans text-base font-bold text-white shadow-xl shadow-black/20 transition hover:bg-orange-600 sm:w-auto">
              Kostenloses Angebot starten <ArrowRight size={19} />
            </a>
            <p className="mt-3 text-center text-xs font-medium text-slate-300 sm:text-left">
              In ca. 2 Minuten ausgefüllt · Keine versteckten Kosten
            </p>

            <figure className="relative mt-7 overflow-hidden rounded-2xl border border-white/15 bg-slate-800 shadow-2xl">
              <Image
                src="/images/person/gruender_vor_auto.jpeg"
                alt="Die Gründer der Umzugshelden vor ihrem folierten Fahrzeug"
                width={900}
                height={1600}
                priority
                className="h-[320px] w-full object-cover object-[center_42%] sm:h-[430px] lg:h-[390px]"
                sizes="(max-width: 1024px) 100vw, 52vw"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/90 to-transparent px-5 pb-5 pt-14">
                <span className="block font-sans text-lg font-bold">
                  Echte Ansprechpartner statt Callcenter
                </span>
                <span className="mt-1 block text-sm text-slate-200">
                  Wir begleiten Ihre Anfrage persönlich von der Planung bis zum
                  Umzug.
                </span>
              </figcaption>
            </figure>
          </div>

          <div className="scroll-mt-4" id="angebot">
            <div className="rounded-2xl bg-white p-5 text-slate-950 shadow-2xl sm:p-7">
              <div className="mb-5 border-b border-slate-100 pb-4">
                <p className="font-sans text-lg font-bold text-navy">
                  Jetzt kostenloses Angebot anfordern
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Wenige Angaben genügen für Ihre persönliche Rückmeldung.
                </p>
              </div>
              <UmzugLeadFunnel />
            </div>
            <a
              href="#kundenstimmen"
              className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white transition hover:bg-white/15">
              <span>
                <span className="flex gap-0.5 text-amber-400" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={16} fill="currentColor" />
                  ))}
                </span>
                <span className="mt-1 block text-sm font-bold">
                  Bewertungen unserer Kunden
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-200">
                Ansehen <ArrowRight size={15} />
              </span>
            </a>
          </div>
        </div>
      </section>

      <div id="kundenstimmen" className="scroll-mt-4">
        <ReviewCarousel />
      </div>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {promises.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-50 text-primary">
                <Icon size={22} />
              </span>
              <div>
                <h2 className="font-bold text-navy">{title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Alles aus einer Hand
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              So viel Unterstützung, wie Sie brauchen
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Sie wählen die Leistungen. Wir stellen Team, Fahrzeug und
              Ausrüstung passend zu Ihrem Umzug zusammen.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Icon size={30} className="text-primary" />
                <h3 className="mt-4 text-xl font-bold text-navy">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Einfacher Ablauf
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              In 3 Schritten zu Ihrem Umzug
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Von der ersten Anfrage bis zum Umzugstag wissen Sie, wie es
              weitergeht und wer Ihr Ansprechpartner ist.
            </p>
            <div className="mt-8 space-y-6">
              {processSteps.map(({ icon: Icon, title, text }, index) => (
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
              Umzug anfragen <ArrowRight size={18} />
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl bg-slate-100 shadow-xl">
            <Image
              src="/images/Umzugsunternhemen_olpe.png"
              alt="Umzugsfahrzeug der Umzugshelden"
              width={700}
              height={700}
              className="h-full max-h-[560px] w-full object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      <section className="bg-navy py-16 text-white sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-orange-300">
              Sorgfalt, die mitfährt
            </p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Ihr Eigentum in guten Händen
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-200">
              Wir schützen Möbel und Inventar mit geeigneten Materialien,
              sichern die Ladung fachgerecht und stimmen besondere
              Transportanforderungen vorab mit Ihnen ab.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <PackageCheck className="text-primary" size={28} />
                <h3 className="mt-3 font-bold">Professionelle Sicherung</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Möbeldecken, Gurte und Verpackungsmaterial passend zum
                  Umzugsgut.
                </p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/5 p-5">
                <Users className="text-primary" size={28} />
                <h3 className="mt-3 font-bold">Erfahrenes Team</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sorgfältiges Tragen, Verladen und Aufstellen am gewünschten
                  Platz.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 text-slate-950 sm:p-8">
            <ShieldCheck size={40} className="text-primary" />
            <h3 className="mt-4 text-2xl font-bold text-navy">
              Persönlich beraten
            </h3>
            <p className="mt-3 leading-7 text-slate-600">
              Besondere Möbel, schwierige Laufwege oder ein enger Zeitplan?
              Sprechen Sie direkt mit uns. Wir klären, was für einen sicheren
              und reibungslosen Ablauf erforderlich ist.
            </p>
            <a
              href={PHONE_HREF}
              className="mt-6 inline-flex items-center gap-2 font-sans font-bold text-primary hover:underline">
              <Phone size={18} /> Direkt sprechen: {PHONE_LABEL}
            </a>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Klare Antworten
            </p>
            <h2 className="mt-3 text-3xl font-bold text-navy sm:text-4xl">
              Häufige Fragen zum Umzug
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
          Bereit für einen entspannten Umzug?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-orange-50">
          Senden Sie uns jetzt die wichtigsten Eckdaten. Wir melden uns
          persönlich und besprechen die nächsten Schritte.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href="#angebot"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 font-sans text-sm font-bold text-primary hover:bg-orange-50">
            Kostenlos anfragen <ArrowRight size={18} />
          </a>
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-6 font-sans text-sm font-bold text-white hover:bg-white/10">
            <Phone size={18} /> {PHONE_LABEL}
          </a>
        </div>
      </section>
    </main>
  );
}
