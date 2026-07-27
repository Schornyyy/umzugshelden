"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cities } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";

const Page = () => {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? cities.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : cities;

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-navy py-20">
        <div className="container mx-auto px-4 text-center flex flex-col gap-6 items-center">
          <h1 className="font-sans font-bold text-4xl md:text-5xl text-white max-w-3xl leading-tight">
            Umzugsservice im{" "}
            <span className="text-primary">Kreis Olpe</span> und Umgebung
          </h1>
          <p className="font-body text-gray-300 text-lg max-w-2xl">
            Finden Sie Ihren lokalen Umzugsservice � wir sind in{" "}
            {cities.length} St�dten und Gemeinden im Einsatz.
          </p>
          <Link href="/#anfrage">
            <Button className="font-sans bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded font-semibold text-base">
              Kostenloses Angebot anfordern!
            </Button>
          </Link>
        </div>
      </section>

      {/* Search */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-xl">
          <h2 className="font-sans font-bold text-2xl text-navy text-center mb-6">
            Ihre Stadt finden
          </h2>
          <div className="flex gap-3">
            <Input
              placeholder="Stadt eingeben (z.B. Olpe, Attendorn�)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 font-body"
            />
            {query && (
              <Button
                variant="outline"
                onClick={() => setQuery("")}
                className="font-sans h-12 px-4 border-primary text-primary hover:bg-primary/10">
                Zur�cksetzen
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* City Grid */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-4">
          {filtered.length === 0 ? (
            <p className="font-body text-gray-500 text-center py-8">
              Keine Stadt gefunden. Bitte versuchen Sie eine andere Suchanfrage.
            </p>
          ) : (
            <>
              <p className="font-body text-gray-500 text-sm mb-6 text-center">
                {filtered.length} {filtered.length === 1 ? "Stadt" : "St�dte"} gefunden
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filtered.map((city) => (
                  <Link
                    key={city}
                    href={`/stadt/${slugify(city)}`}
                    className="bg-gray-50 border border-gray-100 hover:border-primary hover:bg-primary/5 rounded-xl p-4 text-center transition-all duration-200 hover:shadow-sm group">
                    <span className="font-sans font-medium text-navy group-hover:text-primary transition-colors text-sm">
                      {city}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* SEO text */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="font-sans font-bold text-2xl md:text-3xl text-navy mb-6">
            Ihr Umzugsservice im Kreis Olpe und Umgebung
          </h2>
          <div className="font-body text-gray-600 leading-relaxed space-y-4">
            <p>
              Die <strong className="text-navy">Umzugshelden</strong> sind Ihr
              zuverl�ssiger Partner f�r Umz�ge, Anstricharbeiten und
              M�belmontage im Kreis Olpe und einem Umkreis von 25 km.
              Egal ob Olpe, Attendorn, Drolshagen oder Siegen � wir sind
              schnell und zuverl�ssig vor Ort.
            </p>
            <p>
              Nutzen Sie unsere Stadtseiten, um sich �ber unsere Leistungen
              in Ihrer Gemeinde zu informieren und ein kostenloses Angebot
              anzufordern.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
