import Image from 'next/image'
import React from 'react'
import SearchBar from './unternehmen-finden/_components/Searchbar'
import { bulletPointsCard } from '@/statics/Lists'
import Link from 'next/link'

export async function generateMetadata() {
  // Hier kannst du auch dynamisch Metadaten erstellen, z. B. aus einer Datenquelle
  return {
    title: 'JobSmith - Jetzt den passenden Garten- & Landschaftsbauer finden',
    description: 'Finden Sie den besten Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Einfach, schnell und zuverlässig!',
    openGraph: {
      title: 'JobSmith - Jetzt den passenden Garten- & Landschaftsbauer finden',
      description: 'Finden Sie den besten Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Einfach, schnell und zuverlässig!',
      url: 'https://jobsmith.de',
      images: [
        {
          url: '/images/JobSmith_hero.png',
          width: 750,
          height: 350,
          alt: 'JobSmith Hero',
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'JobSmith - Jetzt den passenden Garten- & Landschaftsbauer finden',
      description: 'Finden Sie den besten Garten- & Landschaftsbauer in Ihrer Nähe mit JobSmith. Einfach, schnell und zuverlässig!',
      image: '/images/JobSmith_hero.png',
    },
  }
}

const page = () => {
  return (
    <>
      <div className="container mx-auto flex flex-col gap-12 px-4 md:py-24 max-md:mt-12">
        {/* Hero Section */}
        <div className="flex flex-col-reverse lg:flex-row gap-12 lg:items-center">
          <div className="flex flex-col gap-4 lg:w-1/2">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center lg:text-left">
              Jetzt den passenden Garten- & Landschaftsbauer finden!
            </h1>
            <SearchBar />
          </div>
          <div className="flex justify-center items-center lg:w-1/2">
            <Image 
              alt="JobSmith Hero" 
              src="/images/JobSmith_Hero.png" 
              width={750} 
              height={350} 
              className="object-cover w-full max-w-lg lg:max-w-none" 
            />
          </div>
        </div>

        {/* Bullet Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-12 justify-items-center">
          {bulletPointsCard.map((item, index) => (
            <div 
              key={index} 
              className="flex flex-col gap-4 p-4 rounded-md shadow-2xl bg-white w-full max-w-[300px]" 
            >
              <h3 className="text-xl font-bold text-center">{item.title}</h3>
              <p className="text-base text-center">{item.description}</p>
              <Image 
                alt={item.title} 
                src={item.iconPath} 
                width={32} 
                height={32} 
              />
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col gap-24 my-32">
          <div className="text-center">
            <h3 className="font-bold text-3xl md:text-5xl mb-6">
              Willkommen beim einfachsten Weg, Garten- & Landschaftsbauer zu finden
            </h3>
            <p className="text-base md:text-lg w-full md:w-2/3 mx-auto">
              Einen passenden Garten- & Landschaftsbauer zu finden, kann lange dauern und nervig sein. 
              JobSmith ist der einfachste Weg, um den passenden Handwerker zu finden.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12">
            <div className="flex flex-col gap-8 lg:w-1/2">
              <div>
                <h4 className="font-bold text-2xl md:text-3xl flex items-start gap-4">
                  <span className="w-2 h-10 bg-green-500 rounded-md"></span>
                  Die Garten- und Landschaftsbauer, die Sie benötigen
                </h4>
                <p className="text-base md:text-lg mt-2">
                  Erstellen Sie kostenfrei einen Auftrag und erhalten Sie Anfragen von Garten- 
                  & Landschaftsbauern in Ihrer Umgebung. Wählen Sie den passenden Handwerker 
                  für Ihr Projekt.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-2xl md:text-3xl flex items-start gap-4">
                  <span className="w-2 h-10 bg-green-500 rounded-md"></span>
                  Sie behalten die Kontrolle
                </h4>
                <p className="text-base md:text-lg mt-2">
                  Sehen Sie sich Unternehmen aus Ihrer Region an und entscheiden Sie selbst, wer der 
                  passende Handwerker für Ihr Projekt ist.
                </p>
              </div>
              <div className="text-center">
                <h5 className="font-bold text-xl md:text-4xl mb-4">
                  Sind Sie bereit, den passenden Handwerker zu finden?
                </h5>
                <Link 
                  href="/unternehmen-finden" 
                  className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Jetzt Handwerker finden
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:w-1/2">
              <Image 
                alt="JobSmith Handwerker finden" 
                src="/images/JobSmith_CTA_Card.png" 
                width={512} 
                height={512} 
                className="object-cover w-full max-w-xs lg:max-w-xl" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Für Unternehmen */}
      <div className="py-12 bg-green-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
            <div className="flex justify-center lg:w-1/2">
              <Image 
                alt="JobSmith Aufträge erhalten" 
                src="/images/JobSmith_gefunden_werden.png" 
                height={512} 
                width={512} 
                className="object-cover w-full max-w-sm lg:max-w-none" 
              />
            </div>
            <div className="flex flex-col gap-6 lg:w-1/2 max-md:items-center">
              <h5 className="font-bold text-3xl md:text-5xl">
                Suchen Sie Aufträge?
              </h5>
              <p className="text-base md:text-lg">
                Erhalten Sie planbar neue Aufträge für Ihren Betrieb mit JobSmith.
              </p>
              <p className="text-base md:text-lg">
                JobSmith ist der einfachste Weg, planbar und zuverlässig neue Aufträge 
                für Ihren Betrieb zu gewinnen. Registrieren Sie sich jetzt, um direkt 
                Aufträge in Ihrer Nähe zu finden.
              </p>
              <Link 
                href="/register" 
                className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 w-fit"
              >
                Jetzt registrieren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default page;
