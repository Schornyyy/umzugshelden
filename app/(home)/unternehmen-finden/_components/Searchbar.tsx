"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  onSearch?: (city: string, zip: string, radius: number, service: string) => void;
  loading?: boolean;
  styling?: { shadow: boolean };
}

const galbauServices = [
  "Gartenplanung und -gestaltung",
  "Pflasterarbeiten",
  "Rasen- und Rollrasenverlegung",
  "Baum- und Gehölzpflege",
  "Teich- und Wasseranlagenbau",
  "Zaun- und Sichtschutzbau",
  "Beet- und Pflanzarbeiten",
  "Dachbegrünung",
  "Bewässerungsanlagen",
  "Terrassenbau",
  "Erdarbeiten und Bodenbearbeitung",
  "Winterdienst",
  "Natursteinmauern und Trockenmauern",
  "Beleuchtungskonzepte",
  "Spielplatzbau und -pflege",
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading, styling }) => {
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(10); // Radius in km

  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname === "/unternehmen-finden") {
      const params = new URLSearchParams(window.location.search);
      const cityParam = params.get("city") || "";
      const zipParam = params.get("plz") || "";
      const serviceParam = params.get("service") || "";
      const radiusParam = params.get("km") || "10";

      setCity(cityParam);
      setZip(zipParam);
      setService(serviceParam);
      setRadius(Number(radiusParam));
    }
  }, [router]);

  const handleSearchClick = () => {
    if (!city || !zip || !service) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }
    if (onSearch) {
      onSearch(city, zip, radius, service);
      router.push(`/unternehmen-finden?city=${city}&plz=${zip}&service=${service}&km=${radius}`);
    } else {
      router.push(`/unternehmen-finden?city=${city}&plz=${zip}&service=${service}&km=${radius}`);
    }
  };

  return (
    <div className={"bg-white p-4 rounded-md" + (styling?.shadow ? " shadow-md" : "")}>
      <h2 className="text-lg font-bold mb-4">Unternehmenssuche</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Dienstleistung (Dropdown) */}
        <div>
          <label className="block text-sm font-medium">Dienstleistung</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="" disabled>
              Dienstleistung auswählen
            </option>
            {galbauServices.map((serviceOption, index) => (
              <option key={index} value={serviceOption.toLowerCase()}>
                {serviceOption}
              </option>
            ))}
          </select>
        </div>

        {/* Stadt */}
        <div>
          <label className="block text-sm font-medium">Stadt</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Stadt eingeben"
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* Postleitzahl */}
        <div>
          <label className="block text-sm font-medium">Postleitzahl</label>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="PLZ eingeben"
            className="w-full p-2 border rounded-md"
          />
        </div>

        {/* Radius */}
        <div>
          <label className="block text-sm font-medium">Radius (km)</label>
          <input
            type="number"
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            placeholder="Radius eingeben"
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>

      <button
        onClick={handleSearchClick}
        disabled={loading}
        className={`w-full mt-4 p-2 rounded-md ${
          loading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {loading ? "Suche läuft..." : "Suchen"}
      </button>
    </div>
  );
};

export default SearchBar;
