import Headings from "@/components/Headings";
import { Separator } from "@/components/ui/separator";
import { ClockIcon, MailIcon, PhoneIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className='py-12 bg-[#656565]'>
      <div className='container mx-auto flex flex-col max-md:gap-12 max-md:p-6 md:flex-row justify-between'>
        <div className='flex flex-col gap-6 w-full md:w-1/4'>
          <Image
            src={"/images/Hausmeisterservice-weiss-logo-weiss.png"}
            alt='Hausmeisterservice Weiss Logo'
            height={250}
            width={250}
            className='object-contain'
          />
          <p className='text-white'>
            Ob Haus, Garten oder Gebäude – wir kümmern uns drum. Schnell,
            gründlich und mit Herz.
          </p>
        </div>
        <div className='flex flex-col gap-6'>
          <Headings level={4} className='text-white'>
            Infos
          </Headings>
          <Separator color='white' />
          <div className='flex flex-col text-white'>
            <Link href={"/impressum"} className='hover:text-primary'>
              Impressum
            </Link>
            <Link href={"/datenschutz"} className='hover:text-primary'>
              Datenschutz
            </Link>
            <Link href={"/kontakt"} className='hover:text-primary'>
              Kontakt
            </Link>
            <Link href={"/jobs"} className='hover:text-primary'>
              Jobs
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-6'>
          <Headings level={4} className='text-white'>
            Dienstleistungen
          </Headings>
          <Separator color='white' />
          <div className='flex flex-col text-white'>
            <Link href={"/hausmeisterservices"} className='hover:text-primary'>
              Hausmeisterservices
            </Link>
            <Link href={"/grundstueckpflege"} className='hover:text-primary'>
              Garten- & Grundstückpflege
            </Link>
            <Link href={"/gebaeudereinigung"} className='hover:text-primary'>
              Gebäudereinigung
            </Link>
          </div>
        </div>
        <div className='flex flex-col gap-6'>
          <Headings level={4} className='text-white'>
            Kontakt
          </Headings>
          <Separator color='white' />
          <div className='flex flex-col gap-3 text-white'>
            <div className='flex flex-row gap-2 items-center'>
              <PhoneIcon color='white' height={16} width={16} />
              <Link href={"tel:+4920284458875"} className='hover:text-primary'>
                +49 2084 458875
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-center'>
              <MailIcon color='white' height={16} width={16} />
              <Link
                href={"mailto:info@weiss-hausmeisterservice.de"}
                className='hover:text-primary'>
                info@weiss-hausmeisterservice.de
              </Link>
            </div>
            <div className='flex flex-row gap-2 items-center'>
              <ClockIcon color='white' width={16} height={16} />
              <div className='flex flex-col '>
                <p>Öffnungszeiten:</p>
                <p>Mo.: 08:00 - 17:00</p>
                <p>Di. - Fr.: 09:00 - 17:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
