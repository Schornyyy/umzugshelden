import { Separator } from "@/components/ui/separator";
import { ClockIcon, MailIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <footer className='bg-navy py-12 flex flex-col'>
      <div className='container mx-auto flex flex-col max-md:gap-12 max-md:px-6 md:flex-row justify-between'>
        {/* Brand */}
        <div className='flex flex-col gap-4 w-full md:w-1/4'>
          <Link href='/' className='font-sans font-bold text-2xl text-primary'>
            Umzugshelden
          </Link>
          <p className='font-body text-gray-300 text-sm leading-relaxed'>
            Ihr zuverlässiger Partner für stressfreie Umzüge. Schnell, gründlich
            und günstig – im Kreis Olpe und einem 25 km Umkreis.
          </p>
        </div>

        {/* Unternehmen */}
        <div className='flex flex-col gap-4'>
          <h4 className='font-sans font-semibold text-white text-lg'>
            Unternehmen
          </h4>
          <Separator className='bg-white/20' />
          <nav className='flex flex-col gap-2 font-body text-gray-300 text-sm'>
            <Link
              href='/impressum'
              className='hover:text-primary transition-colors'>
              Impressum
            </Link>
            <Link
              href='/datenschutz'
              className='hover:text-primary transition-colors'>
              Datenschutz
            </Link>
            <Link href='/agb' className='hover:text-primary transition-colors'>
              AGB
            </Link>
          </nav>
        </div>

        {/* Dienstleistungen */}
        <div className='flex flex-col gap-4'>
          <h4 className='font-sans font-semibold text-white text-lg'>
            Dienstleistungen
          </h4>
          <Separator className='bg-white/20' />
          <nav className='flex flex-col gap-2 font-body text-gray-300 text-sm'>
            <Link
              href='/umzugsservice'
              className='hover:text-primary transition-colors'>
              Umzugsservice
            </Link>
            <Link
              href='/anstricharbeiten'
              className='hover:text-primary transition-colors'>
              Anstricharbeiten
            </Link>
            <Link
              href='/moebel-service'
              className='hover:text-primary transition-colors'>
              Möbel Ab- & Aufbau
            </Link>{" "}
          </nav>
        </div>

        {/* Infos */}
        <div className='flex flex-col gap-4'>
          <h4 className='font-sans font-semibold text-white text-lg'>Infos</h4>
          <Separator className='bg-white/20' />
          <nav className='flex flex-col gap-2 font-body text-gray-300 text-sm'>
            <Link
              href='/#services'
              className='hover:text-primary transition-colors'>
              Dienstleistungen
            </Link>
            <Link href='/faq' className='hover:text-primary transition-colors'>
              FAQ
            </Link>
            <Link
              href='/kontakt'
              className='hover:text-primary transition-colors'>
              Kontakt
            </Link>
          </nav>
        </div>

        {/* Gebiet */}
        <div className='flex flex-col gap-4'>
          <h4 className='font-sans font-semibold text-white text-lg'>
            Einsatzgebiet
          </h4>
          <Separator className='bg-white/20' />
          <nav className='flex flex-col gap-2 font-body text-gray-300 text-sm'>
            <Link
              href='/stadt/olpe'
              className='hover:text-primary transition-colors'>
              Olpe
            </Link>
            <Link
              href='/stadt/attendorn'
              className='hover:text-primary transition-colors'>
              Attendorn
            </Link>
            <Link
              href='/stadt/lennestadt'
              className='hover:text-primary transition-colors'>
              Lennestadt
            </Link>
            <Link
              href='/stadt/finnentrop'
              className='hover:text-primary transition-colors'>
              Finnentrop
            </Link>
            <Link
              href='/stadt/drolshagen'
              className='hover:text-primary transition-colors'>
              Drolshagen
            </Link>
            <Link
              href='/stadt/wenden'
              className='hover:text-primary transition-colors'>
              Wenden
            </Link>
            <Link
              href='/stadt/kirchhundem'
              className='hover:text-primary transition-colors'>
              Kirchhundem
            </Link>
            <Link
              href='/stadt/plettenberg'
              className='hover:text-primary transition-colors'>
              Plettenberg
            </Link>
          </nav>
        </div>

        {/* Kontakt */}
        <div className='flex flex-col gap-4'>
          <h4 className='font-sans font-semibold text-white text-lg'>
            Kontakt
          </h4>
          <Separator className='bg-white/20' />
          <div className='flex flex-col gap-3 font-body text-gray-300 text-sm'>
            <div className='flex flex-row gap-2 items-center'>
              <PhoneIcon
                className='text-primary flex-shrink-0'
                height={16}
                width={16}
              />
              <Link
                href='tel:+4915168567708'
                className='hover:text-primary transition-colors'>
                +49 151 68567708
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-center'>
              <MailIcon
                className='text-primary flex-shrink-0'
                height={16}
                width={16}
              />
              <Link
                href='mailto:info@umzugshelden.io'
                className='hover:text-primary transition-colors'>
                info@umzugshelden.io
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-start'>
              <ClockIcon
                className='text-primary flex-shrink-0 mt-0.5'
                width={16}
                height={16}
              />
              <div className='flex flex-col'>
                <p>Öffnungszeiten:</p>
                <p>Mo. – Fr.: 08:00 – 18:00</p>
                <p>Sa.: 09:00 – 15:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className='bg-white/10 my-8 container mx-auto' />

      <p className='text-center font-body text-gray-400 text-sm'>
        Copyright {new Date().getFullYear()} Designed and Developed by{" "}
        <Link
          href='https://www.gs-creatives.de/'
          target='_blank'
          className='text-primary hover:underline'>
          GS-Creatives
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
