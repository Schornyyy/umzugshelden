import { CheckCircle2, Phone } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const PHONE_HREF = "tel:+4915168567708";
const PHONE_LABEL = "+49 151 68567708";

export default function LandingpageLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white pb-16 text-slate-950 md:pb-0">
      <div className="bg-navy px-4 py-2 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 text-center text-xs font-semibold sm:text-sm">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Kostenlose Besichtigung
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Verbindlicher Festpreis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-primary" />
            Diskret &amp; besenrein
          </span>
        </div>
      </div>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3" aria-label="Umzugshelden">
            <Image
              src="/images/Umzugshelden.png"
              alt=""
              width={52}
              height={52}
              priority
              className="h-11 w-11 object-contain"
            />
            <span>
              <span className="block font-sans text-lg font-bold leading-none text-navy">
                Umzugshelden
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Entrümpelung aus einer Hand
              </span>
            </span>
          </div>
          <a
            href={PHONE_HREF}
            className="hidden items-center gap-3 rounded-lg px-3 py-2 text-right transition hover:bg-slate-50 sm:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <Phone size={19} />
            </span>
            <span>
              <span className="block text-xs font-medium text-slate-500">
                Jetzt direkt anrufen
              </span>
              <span className="block font-sans text-lg font-bold text-navy">
                {PHONE_LABEL}
              </span>
            </span>
          </a>
        </div>
      </header>

      {children}

      <a
        href={PHONE_HREF}
        className="fixed inset-x-0 bottom-0 z-50 flex min-h-14 items-center justify-center gap-2 bg-primary px-4 font-sans text-base font-bold text-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)] md:hidden">
        <Phone size={20} /> Kostenlos anrufen
      </a>
    </div>
  );
}
