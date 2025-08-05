"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cities } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";

// Schema für strukturierte Daten
const generateCityListSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Garten- und Landschaftsbau Städte in Deutschland",
    description:
      "Alle verfügbaren Städte für Garten- und Landschaftsbau Services auf Landschaftshelden.io",
    url: "https://landschaftshelden.io/stadt",
    numberOfItems: cities.length,
    itemListElement: cities.slice(0, 50).map((city, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        name: city,
        url: `https://landschaftshelden.io/stadt/${slugify(city)}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: city,
          addressCountry: "DE",
        },
      },
    })),
  };
};

const formSchema = z.object({
  query: z.string().min(1, "Bitte eine Stadt eingeben"),
});

type FormData = z.infer<typeof formSchema>;

const Page = () => {
  const [filteredCities, setFilteredCities] = useState<string[]>(cities);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    const query = data.query.toLowerCase();
    const results = cities.filter((city) => city.toLowerCase().includes(query));
    setFilteredCities(results);
  };

  return (
    <div className='max-w-7xl mx-auto py-12 px-4'>
      {/* SEO Schema JSON-LD */}
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateCityListSchema()).replace(
            /</g,
            "\\u003c"
          ),
        }}
      />

      {/* SEO-optimized Hero Section */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl md:text-5xl font-bold mb-4'>
          Garten- und Landschaftsbau in über {cities.length} deutschen Städten
        </h1>
        <p className='text-xl text-gray-600 mb-8 max-w-4xl mx-auto'>
          Finden Sie die besten{" "}
          <strong>Garten- und Landschaftsbauer in Ihrer Stadt</strong>.
          Erstellen Sie kostenlos einen Auftrag und erhalten Sie bis zu 5
          professionelle Angebote von geprüften Galabau-Betrieben aus Ihrer
          Region.
        </p>

        {/* Primary CTA */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center mb-8'>
          <Link
            href='/auftrag-erstellen'
            className='bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-colors inline-flex items-center justify-center'>
            🚀 Kostenlosen Auftrag erstellen
          </Link>
          <Link
            href='/unternehmen-finden'
            className='border-2 border-green-600 text-green-600 hover:bg-green-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-flex items-center justify-center'>
            📋 Alle Anbieter durchsuchen
          </Link>
        </div>
      </div>

      {/* Search Section */}
      <div className='max-w-2xl mx-auto mb-12'>
        <div className='bg-white border-2 border-green-200 rounded-xl p-6 shadow-lg'>
          <h2 className='text-2xl font-semibold mb-4 text-center'>
            Ihre Stadt finden
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <Input
                placeholder='Stadt eingeben (z.B. Berlin, München, Hamburg...)'
                {...register("query")}
                className='h-12 text-lg'
              />
              {errors.query && (
                <p className='text-sm text-red-500 mt-1'>
                  {errors.query.message}
                </p>
              )}
            </div>
            <Button
              type='submit'
              className='w-full h-12 text-lg bg-green-600 hover:bg-green-700'>
              Stadt finden
            </Button>
          </form>
        </div>
      </div>

      {/* Featured Cities */}
      <div className='mb-12'>
        <h2 className='text-2xl font-semibold mb-8 text-center'>
          Beliebte Städte für Garten- und Landschaftsbau
        </h2>
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8'>
          {cities.slice(0, 24).map((city) => (
            <Link
              key={city}
              href={`/stadt/${slugify(city)}`}
              className='bg-green-500 hover:bg-green-600 p-4 rounded-xl text-center transition-colors group'>
              <span className='text-white font-semibold text-sm md:text-base group-hover:scale-105 transition-transform inline-block'>
                {city}
              </span>
            </Link>
          ))}
        </div>

        {filteredCities.length !== cities.length && (
          <div className='text-center'>
            <Button
              onClick={() => setFilteredCities(cities)}
              variant='outline'
              className='border-green-600 text-green-600 hover:bg-green-50'>
              Alle {cities.length} Städte anzeigen
            </Button>
          </div>
        )}
      </div>

      {/* Filtered Results */}
      {filteredCities.length > 0 && filteredCities.length !== cities.length && (
        <div className='mb-12'>
          <h3 className='text-xl font-semibold mb-6'>
            Suchergebnisse ({filteredCities.length} Städte gefunden)
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3'>
            {filteredCities.map((city) => (
              <Link
                key={city}
                href={`/stadt/${slugify(city)}`}
                className='bg-white border border-gray-200 hover:border-green-500 p-3 rounded-lg text-center transition-all duration-200 hover:shadow-md group'>
                <span className='text-gray-900 group-hover:text-green-600 transition-colors font-medium'>
                  {city}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Complete City List */}
      {filteredCities.length === cities.length && (
        <div className='mb-12'>
          <h3 className='text-xl font-semibold mb-6'>
            Alle {cities.length} verfügbaren Städte
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
            {filteredCities.map((city) => (
              <Link
                key={city}
                href={`/stadt/${slugify(city)}`}
                className='text-green-600 hover:text-green-700 hover:underline p-2 transition-colors text-sm'>
                {city}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SEO Content Section */}
      <div className='prose max-w-none mb-12'>
        <h2>
          Deutschlandweiter Garten- und Landschaftsbau – Ihr lokaler Partner
          wartet
        </h2>
        <p>
          <strong>Landschaftshelden.io</strong> verbindet Sie mit qualifizierten
          Garten- und Landschaftsbauern in über {cities.length} deutschen
          Städten. Egal ob Großstadt oder Kleinstadt – wir haben den passenden
          Galabau-Betrieb für Ihr Projekt.
        </p>

        <div className='bg-green-50 border border-green-200 rounded-lg p-6 my-8'>
          <h3 className='text-green-800 font-semibold mb-4'>
            🌱 Warum Landschaftshelden.io für Ihre Stadt?
          </h3>
          <div className='grid md:grid-cols-2 gap-4 text-green-700'>
            <ul className='space-y-2'>
              <li>
                ✅ <strong>Über {cities.length} Städte</strong> abgedeckt
              </li>
              <li>
                ✅ <strong>Lokale Experten</strong> in jeder Region
              </li>
              <li>
                ✅ <strong>Kostenlose Angebote</strong> – Keine versteckten
                Gebühren
              </li>
            </ul>
            <ul className='space-y-2'>
              <li>
                ✅ <strong>Geprüfte Betriebe</strong> – Nur seriöse Partner
              </li>
              <li>
                ✅ <strong>Bis zu 5 Angebote</strong> zum Vergleichen
              </li>
              <li>
                ✅ <strong>Schnelle Vermittlung</strong> – Angebote in 24h
              </li>
            </ul>
          </div>
        </div>

        <h3>So funktioniert&apos;s in Ihrer Stadt</h3>
        <p>
          Wählen Sie Ihre Stadt aus unserer Liste von über {cities.length}{" "}
          deutschen Städten. Anschließend können Sie entweder direkt einen
          kostenlosen Auftrag erstellen oder sich die verfügbaren Garten- und
          Landschaftsbauer in Ihrer Region ansehen.
        </p>
      </div>

      {/* Call-to-Action Section */}
      <div className='bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-8 text-white text-center'>
        <h2 className='text-2xl md:text-3xl font-bold mb-4'>
          Bereit für Ihr Garten-Projekt?
        </h2>
        <p className='text-xl mb-6 opacity-90'>
          In jeder Stadt · Kostenlos · Unverbindlich
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <Link
            href='/auftrag-erstellen'
            className='bg-white text-green-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-bold shadow-lg transition-colors inline-block'>
            Jetzt kostenlosen Auftrag erstellen
          </Link>
          <Link
            href='/unternehmen-finden'
            className='border-2 border-white text-white hover:bg-white hover:text-green-600 px-8 py-4 rounded-lg text-lg font-bold transition-colors inline-block'>
            Alle Anbieter durchsuchen
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Page;
