import React from "react";
import Image from "next/image";
import { listPartners } from "@/actions/partnerActions";
import { PartnerType } from "@/types/PartnerType";
import { PartnerViewTracker } from "@/components/PartnerViewTracker";

export const metadata = {
  title: "Partnerportal | Landschaftshelden",
};

const PartnerPortalPage = async () => {
  let partners: PartnerType[] = [];
  try {
    const all = await listPartners();
    partners = all.filter((p) => p.active !== false); // nur aktive anzeigen
  } catch {
    partners = [];
  }
  const categories = Array.from(
    new Set(partners.map((p) => p.category || "Allgemein"))
  );

  return (
    <div className='px-4 md:px-8 py-10 max-w-6xl mx-auto'>
      <header className='mb-12'>
        <h1 className='text-2xl md:text-3xl font-bold text-slate-800'>
          Partnerportal
        </h1>
        <p className='text-slate-600 mt-3 max-w-2xl text-sm md:text-base'>
          Exklusive Vorteile & Konditionen für Landschaftshelden Betriebe. Wir
          erweitern laufend unser Netzwerk mit Services, die euren Arbeitsalltag
          effizienter, günstiger oder einfacher machen.
        </p>
      </header>

      <section className='mb-10'>
        <h2 className='text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4'>
          Kategorien
        </h2>
        <div className='flex flex-wrap gap-2'>
          {categories.map((c) => (
            <span
              key={c}
              className='px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200'>
              {c}
            </span>
          ))}
        </div>
      </section>

      <section>
        {!partners.length && (
          <p className='text-sm text-slate-500'>
            Aktuell sind noch keine Partner hinterlegt.
          </p>
        )}
        <div className='grid sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {partners.map((p) => (
            <div
              key={p.id}
              className='group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col'>
              <PartnerViewTracker partnerId={p.id} />
              <div className='flex items-center gap-4 mb-4'>
                <div className='h-14 w-14 rounded-lg bg-slate-50 flex items-center justify-center ring-1 ring-slate-200 overflow-hidden'>
                  {p.infos?.logoPath && (
                    <Image
                      src={p.infos.logoPath}
                      alt={p.company?.name || "Logo"}
                      width={56}
                      height={56}
                      className='object-contain'
                    />
                  )}
                </div>
                <div>
                  <h3 className='font-semibold text-slate-800 text-sm md:text-base'>
                    {p.company?.name}
                  </h3>
                  {p.category && (
                    <p className='text-[11px] uppercase tracking-wide text-slate-400 font-medium'>
                      {p.category}
                    </p>
                  )}
                </div>
              </div>
              <p className='text-xs text-slate-600 leading-relaxed flex-1 whitespace-pre-wrap'>
                {p.companyBenefits}
              </p>
              {p.infos?.website && (
                <a
                  href={`/api/partner-click/${p.id}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='mt-4 inline-flex items-center text-green-700 hover:text-green-800 text-sm font-medium'>
                  Vorteil sichern →
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
      <section className='mt-14 border rounded-xl p-6 bg-slate-50 text-center'>
        <h2 className='font-semibold text-slate-800 mb-2'>Partner werden?</h2>
        <p className='text-xs md:text-sm text-slate-600 mb-4'>
          Bietest du einen klaren Mehrwert für den GaLaBau? Schreib uns kurz mit
          Stichpunkten an{" "}
          <a className='underline' href='mailto:support@landschaftshelden.io'>
            support@landschaftshelden.io
          </a>
          .
        </p>
      </section>
    </div>
  );
};

export default PartnerPortalPage;
