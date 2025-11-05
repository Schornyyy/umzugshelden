import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Footer = () => {
  return (
    <div className='py-12 bg-blue-950 rounded-t-[50px]'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col md:flex-row justify-between mb-6 max-md:justify-center max-md:items-center gap-6'>
          <p className='text-4xl text-white max-md:text-center'>
            Du willst endlich <span className='text-primary'>gefunden</span>{" "}
            werden?
          </p>
          <Link href='/kontakt'>
            <Button className='flex flex-row gap-2 text-2xl py-6 rounded-3xl px-6'>
              Jetzt kontaktieren{" "}
              <ArrowRight color='white' width={24} height={24} />{" "}
            </Button>
          </Link>
        </div>
        <Separator color='white' className='mb-6' />

        {/* Footer Links */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-center md:text-left'>
          {/* Infos Section */}
          <div>
            <div className='flex flex-col gap-2'>
              <Link href='/impressum' className='text-white hover:text-primary'>
                Impressum
              </Link>
              <Link
                href='/datenschutz'
                className='text-white hover:text-primary'>
                Datenschutz
              </Link>
              <Link href='/kontakt' className='text-white hover:text-primary'>
                Kontakt
              </Link>
            </div>
          </div>

          {/* Für Unternehmen Section */}
          <div>
            <div className='flex flex-col gap-2'>
              <Link href='/blog' className='text-white hover:text-primary'>
                Blog
              </Link>
              <Link
                href='/dienstleistung'
                className='text-white hover:text-primary'>
                Unsere Dienstleistungen
              </Link>
              <Link
                href='/referenzen'
                className='text-white hover:text-primary'>
                Unsere Referenzen
              </Link>
              <Link href='/kontakt' className='text-white hover:text-primary'>
                Kontakt
              </Link>
            </div>
          </div>

          {/* Für Auftraggeber Section */}
          <div>
            <div className='flex flex-col gap-2 max-md:items-center'>
              <p className='text-white'>
                E-Mail:{" "}
                <Link
                  href={"mailto: kontakt@gs-creatives.de"}
                  className='text-primary'>
                  kontakt@creatives.de
                </Link>
              </p>
              <p className='text-white'>
                Telefon:{" "}
                <Link href={"tel:+49 151 68567708"} className='text-primary'>
                  +49 151 68567708
                </Link>
              </p>
              <div className='flex flex-row gap-4'>
                <Link
                  target='_blank'
                  href={"https://www.tiktok.com/@gscreatives_de"}
                  className='p-1 rounded-full bg-primary'>
                  <Image
                    src={"/icons/tiktok.svg"}
                    alt='GS Creatives Tiktok'
                    height={24}
                    width={24}
                  />
                </Link>
                <Link
                  target='_blank'
                  href={
                    "https://www.facebook.com/profile.php?id=61557011049116&locale=de_DE"
                  }
                  className='p-1 rounded-full bg-primary'>
                  <Image
                    src={"/icons/facebook.svg"}
                    alt='GS Creatives Facebook'
                    height={24}
                    width={24}
                  />
                </Link>
                <Link
                  target='_blank'
                  href={"https://www.instagram.com/gs_creatives_de/"}
                  className='p-1 rounded-full bg-primary'>
                  <Image
                    src={"/icons/instagram.svg"}
                    alt='GS Creatives Instagram'
                    height={24}
                    width={24}
                  />
                </Link>
                <Link
                  target='_blank'
                  href={"https://www.youtube.com/@GS-Creatives-de"}
                  className='p-1 rounded-full bg-primary'>
                  <Image
                    src={"/icons/youtube.svg"}
                    alt='GS Creatives Youtube'
                    height={24}
                    width={24}
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
