import { findCompanyById } from "@/actions/companyActions";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import CompanyInfos from "./_components/CompanyInfos";
import CompanyContractForm from "./_components/CompanyContactForm";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ companyid: string }>;
}) {
  const { companyid } = await params;
  const companyData = await findCompanyById(companyid);

  if (!companyData) {
    return {
      title: "Unternehmen nicht gefunden",
      description: "Dieses Unternehmen konnte nicht gefunden werden.",
    };
  }

  const getCompanyServiceKeywords = () => {
    const list: string[] = [];

    if (companyData.services) {
      companyData.services.map((service) => {
        list.push(`${service} in ${companyData.city}`);
        list.push(`${service} in ${companyData.zip}`);
      });
    }
    return list;
  };

  return {
    title: `${companyData.companyName} - Landschaftshelden.io`,
    description: `${companyData.companyName} | ${companyData.city} Garten & Landschaftsbau Unternehmen auf Landschaftshelden.io`,
    keywords: [
      companyData.services,
      `GalaBau Unternehmen in ${companyData.city}`,
      `Garten- und Landschaftsbau in ${companyData.city}`,
      "Garten- und Landschaftsbau",
      "Garten- und Landschaftsbau Unternehmen",
      "Garten- und Landschaftsbau Firmen",
      "Garten- und Landschaftsbau Dienstleister",
      "Garten- und Landschaftsbau Services",
      "Garten- und Landschaftsbau Dienstleistungen",
      "Garten- und Landschaftsbau Firmen in Deutschland",
      "Garten und Landschaftsbau",
      "landschaftshelden.io",
      "landschaftshelden",
      getCompanyServiceKeywords(),
    ],
  };
}

// Main page component
const Page = async ({ params }: { params: Promise<{ companyid: string }> }) => {
  const { companyid } = await params;

  try {
    const companyData = await findCompanyById(companyid);

    if (!companyData) {
      return (
        <div className='container mx-auto py-24 text-center'>
          <h1 className='text-2xl font-bold'>Unternehmen nicht gefunden</h1>
          <p className='text-gray-600 mt-4'>
            Wir konnten dieses Unternehmen nicht finden. Bitte überprüfen Sie
            die URL.
          </p>
          <Link href='/' className='text-green-500 underline mt-6'>
            Zurück zur Startseite
          </Link>
        </div>
      );
    }

    return (
      <div className='container mx-auto pt-24 flex flex-col gap-24 px-4'>
        {/* Hero Section */}
        <CompanyInfos companyData={companyData} />
        <CompanyContractForm company={companyData} />

        {/* Call-to-action Sections */}
        <div className='flex flex-col gap-24 my-24'>
          <div className='text-center'>
            <h3 className='font-bold text-2xl md:text-4xl mb-4'>
              Willkommen beim einfachsten Weg, Garten- & Landschaftsbauer in{" "}
              {companyData.city} zu finden
            </h3>
            <p className='text-sm sm:text-base md:text-lg w-full md:w-2/3 mx-auto'>
              Einen passenden Garten- & Landschaftsbauer zu finden, kann lange
              dauern und nervig sein. JobSmith ist der einfachste Weg, um den
              passenden Handwerker zu finden.
            </p>
          </div>
          <div className='flex flex-col lg:flex-row items-center lg:items-start gap-12'>
            <div className='flex flex-col gap-8 lg:w-1/2'>
              <div>
                <h3 className='font-bold text-xl md:text-2xl flex items-start gap-4'>
                  <span className='w-2 h-14 bg-green-500 rounded-md'></span>
                  Finden Sie den passenden Garten- & Landschaftsbauer für Ihr
                  Projekt in {companyData.city}
                </h3>
                <p className='text-sm md:text-base mt-2'>
                  Suchen Sie auf JobSmith nach Garten- & Landschaftsbauern in
                  Ihrer Nähe und finden Sie den passenden Handwerker für Ihr
                  Projekt.
                </p>
              </div>
              <div>
                <h4 className='font-bold text-xl md:text-2xl flex items-start gap-4'>
                  <span className='w-2 h-14 bg-green-500 rounded-md'></span>
                  Vergleichen Sie Angebote von Garten- & Landschaftsbauern in{" "}
                  {companyData.city}
                </h4>
                <p className='text-sm md:text-base mt-2'>
                  Erhalten Sie von Garten- & Landschaftsbauern in Ihrer Umgebung
                  Angebote für Ihr Projekt und vergleichen Sie die Angebote.
                </p>
              </div>
              <div className='text-center'>
                <h5 className='font-bold text-lg md:text-2xl mb-4'>
                  Sind Sie bereit, den passenden Handwerker in{" "}
                  {companyData.city} zu finden?
                </h5>
                <Link
                  href={`/unternehmen-finden?city=${companyData.city}&plz=${companyData.zip}&km=10`}
                  className='py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600'>
                  Jetzt Handwerker finden
                </Link>
              </div>
            </div>
            <div className='flex justify-center lg:w-1/2'>
              <Image
                alt='JobSmith Handwerker finden'
                src='/images/JobSmith_CTA_Card.png'
                width={512}
                height={512}
                className='object-cover w-full max-w-xs lg:max-w-lg'
              />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Fehler beim Laden der Unternehmensdaten:", error);
    return (
      <div className='container mx-auto py-24 text-center'>
        <h1 className='text-2xl font-bold'>Fehler beim Laden der Daten</h1>
        <p className='text-gray-600 mt-4'>
          Es gab einen Fehler. Bitte versuchen Sie es später erneut.
        </p>
      </div>
    );
  }
};

export default Page;
