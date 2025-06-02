import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  const cietieLinks = [
    "Berlin",
    "Hamburg",
    "München",
    "Köln",
    "Frankfurt",
    "Stuttgart",
    "Düsseldorf",
    "Dortmund",
    "Essen",
    "Leipzig",
  ];

  return (
    <div className='py-12 bg-green-950'>
      <div className='container mx-auto px-4'>
        {/* Logo */}
        <div className='flex mb-8 max-md:justify-center'>
          <Image
            alt='JobSmith'
            src={"/images/JobSmith_Logo.png"}
            height={256}
            width={256}
            className='object-cover'
          />
        </div>

        {/* Footer Links */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-left'>
          {/* Infos Section */}
          <div>
            <h6 className='font-bold text-xl text-white mb-4'>Infos</h6>
            <div className='w-12 h-[2px] bg-green-100 mb-4 mx-auto md:mx-0'></div>
            <div className='flex flex-col gap-2'>
              <Link
                href='/impressum'
                className='text-white hover:text-green-400'>
                Impressum
              </Link>
              <Link
                href='/datenschutz'
                className='text-white hover:text-green-400'>
                Datenschutz
              </Link>
              <Link href='/kontakt' className='text-white hover:text-green-400'>
                Kontakt
              </Link>
            </div>
          </div>

          {/* Für Unternehmen Section */}
          <div>
            <h6 className='font-bold text-xl text-white mb-4'>
              Für Unternehmen
            </h6>
            <div className='w-12 h-[2px] bg-green-100 mb-4 mx-auto md:mx-0'></div>
            <div className='flex flex-col gap-2'>
              <Link href='/login' className='text-white hover:text-green-400'>
                Anmelden
              </Link>
              <Link
                href='/register/company'
                className='text-white hover:text-green-400'>
                Registrieren
              </Link>
              <Link
                href='/fuer-unternehmen'
                className='text-white hover:text-green-400'>
                Für Unternehmen
              </Link>
            </div>
          </div>

          {/* Für Auftraggeber Section */}
          <div>
            <h6 className='font-bold text-xl text-white mb-4'>
              Für Auftraggeber
            </h6>
            <div className='w-12 h-[2px] bg-green-100 mb-4 mx-auto md:mx-0'></div>
            <div className='flex flex-col gap-2'>
              <Link
                href='/unternehmen-finden'
                className='text-white hover:text-green-400'>
                Unternehmen finden
              </Link>
              <Link href='/kontakt' className='text-white hover:text-green-400'>
                Kontakt
              </Link>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <h6 className='font-bold text-xl text-white mb-4'>Städte</h6>
            <div className='w-12 h-[2px] bg-green-100 mb-4 mx-auto md:mx-0'></div>
            <div className='flex flex-col gap-2'>
              {cietieLinks.map((city, index) => (
                <Link
                  key={index}
                  href={`/stadt/${city.toLowerCase()}`}
                  className='text-white hover:text-green-400'>
                  Garten- und Landschaftsbauer in {city}
                </Link>
              ))}
              <Link href={`/stadt`} className='text-white hover:text-green-400'>
                Weitere Städte
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
