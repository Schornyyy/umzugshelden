import ReviewCarousel from "@/components/reviews/ReviewCarousel";
import type { LandingPage } from "@/lib/landingPageSettings";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import GeneratedLandingPageForm from "./GeneratedLandingPageForm";

const PHONE_HREF = "tel:+4915168567708";
const PHONE_LABEL = "+49 151 68567708";

export default function GeneratedLandingPage({
  page,
}: {
  page: LandingPage;
}) {
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
              <BadgeCheck size={16} /> {page.serviceName} aus einer Hand
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-5xl lg:text-6xl">
              {page.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
              {page.subtitle}
            </p>
            <div className="mt-6 grid gap-3 text-sm text-slate-100">
              {page.benefits.map((benefit) => (
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
              Jetzt kostenlos anfragen <ArrowRight size={19} />
            </a>
          </div>

          <div
            id="angebot"
            className="scroll-mt-6 rounded-2xl bg-white p-5 text-slate-950 shadow-2xl sm:p-7">
            <GeneratedLandingPageForm page={page} />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            {
              icon: ClipboardCheck,
              title: "Klare Abstimmung",
              text: "Wir prüfen Ihre Angaben und besprechen den konkreten Leistungsumfang.",
            },
            {
              icon: ShieldCheck,
              title: "Verlässliche Ausführung",
              text: "Unser Team arbeitet sorgfältig, verbindlich und mit professioneller Ausrüstung.",
            },
            {
              icon: Sparkles,
              title: "Persönlicher Service",
              text: "Sie erhalten ein passendes Angebot und einen direkten Ansprechpartner.",
            },
          ].map(({ icon: Icon, title, text }) => (
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

      <ReviewCarousel />

      <section className="bg-navy py-14 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold">
            Sie möchten Ihr Vorhaben persönlich besprechen?
          </h2>
          <p className="max-w-2xl text-slate-300">
            Rufen Sie uns an oder senden Sie die Anfrage über das Formular. Wir
            melden uns schnellstmöglich bei Ihnen.
          </p>
          <a
            href={PHONE_HREF}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-primary px-6 font-bold text-white hover:bg-orange-600">
            <Phone size={18} /> {PHONE_LABEL}
          </a>
        </div>
      </section>
    </main>
  );
}
