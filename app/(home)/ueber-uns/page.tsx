import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div className='container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-12 py-24'>
      <div className='flex flex-col md:flex-row gap-6 md:gap-12 items-center'>
        <Image
          src={"/images/Team.png"}
          alt='GS-Creatives Team'
          height={750}
          width={750}
          className='w-full md:w-1/2 h-auto object-contain'
        />
        <div className='flex flex-col gap-6 md:w-1/2'>
          <Headings level={1}>
            Wir digitalisieren das Handwerk – mit System, Erfahrung & echtem
            Verständnis.
          </Headings>
          <p className='text-slate-600'>
            Wir helfen Handwerksbetrieben, online regelmäßig neue Kunden zu
            gewinnen – ganz ohne Werbung. Statt kurzfristiger Marketing-Tricks
            setzen wir auf Systeme, die langfristig Anfragen bringen. Dabei
            kombinieren wir modernes Webdesign mit bewährter SEO-Strategie. So
            entsteht für jeden Betrieb eine Website, die arbeitet wie ein
            zusätzlicher Mitarbeiter – nur digital.
          </p>
          <p className='text-slate-600'>
            Hinter GS-Creatives stehen Lukas Schornstein und Muhammed Güngör.
            Lukas ist seit über sieben Jahren im Webdesign tätig, gelernter
            Webentwickler und hat Schulungen bei Sistrix, einem der führenden
            SEO-Tools, absolviert. Muhammed ist erfahrener Software-Entwickler
            und kümmert sich um die technischen Prozesse und Backends. Gemeinsam
            verbinden wir Design, Technik und Strategie zu einem
            funktionierenden Gesamtsystem.
          </p>
          <p className='text-slate-600'>
            Neben Kundenprojekten betreiben wir selbst Plattformen wie
            Landschaftshelden.io und Reinigungshelden.io – Portale, über die
            Handwerker echte Aufträge erhalten. Diese Systeme basieren auf
            demselben Prinzip, das wir auch für unsere Kunden umsetzen: maximale
            Sichtbarkeit, planbare Anfragen und digitale Prozesse, die
            funktionieren. Genau dieses Know-how geben wir an jeden unserer
            Partnerbetriebe weiter.
          </p>
          <Link href={"/website-check"}>
            <Button className='bg-primary text-white rounded-md px-6 py-3 md:px-8 md:py-6 w-full md:w-auto'>
              Kostenloser Website check
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default page;
