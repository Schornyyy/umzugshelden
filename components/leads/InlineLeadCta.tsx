import { ArrowRight, Phone } from "lucide-react";
import { CALLBACK_PROMISE, LEAD_FORM_ANCHOR, LEAD_PHONE_HREF, LEAD_PHONE_LABEL } from "@/lib/leadContact";

/** Kompakter Anfrage-Block zwischen Inhaltsabschnitten. */
export default function InlineLeadCta({
  heading,
  formAnchor = LEAD_FORM_ANCHOR,
}: {
  heading: string;
  formAnchor?: string;
}) {
  return (
    <section className='bg-navy px-4 py-8 text-white sm:py-10'>
      <div className='container mx-auto flex max-w-6xl flex-col gap-5 md:flex-row md:items-center md:justify-between'>
        <div>
          <p className='font-sans text-xl font-bold sm:text-2xl'>{heading}</p>
          <p className='mt-1 font-body text-sm text-gray-300'>
            Kostenlos & unverbindlich – {CALLBACK_PROMISE.toLowerCase()}.
          </p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row'>
          <a
            href={`#${formAnchor}`}
            className='inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 font-sans text-sm font-bold text-white hover:bg-orange-600'>
            Rückruf anfordern <ArrowRight size={18} />
          </a>
          <a
            href={LEAD_PHONE_HREF}
            data-analytics-label='Inline-CTA Anruf'
            className='inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/40 px-6 font-sans text-sm font-bold text-white hover:bg-white/10'>
            <Phone size={17} /> {LEAD_PHONE_LABEL}
          </a>
        </div>
      </div>
    </section>
  );
}
