"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getGalbauServices } from "@/statics/Lists";

interface SearchBarProps {
  onSearch?: (
    city: string,
    zip: string,
    radius: number,
    service: string
  ) => void;
  loading?: boolean;
  styling?: { shadow: boolean };
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  loading,
  styling,
}) => {
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState(10); // Standardwert: 10 km

  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname === "/unternehmen-finden") {
      const params = new URLSearchParams(window.location.search);
      setCity(params.get("city") || "");
      setZip(params.get("plz") || "");
      setService(params.get("service") || "");
      setRadius(Number(params.get("km")) || 10);
    }
  }, [router]);

  const handleSearchClick = () => {
    if (!city || !zip) {
      alert("Bitte alle Felder ausfüllen!");
      return;
    }

    if (onSearch) {
      onSearch(city, zip, radius, service);
    }

    router.push(
      `/unternehmen-finden?city=${city}&plz=${zip}&service=${service}&km=${radius}`
    );
  };

  return (
    <Card className={styling?.shadow ? "shadow-md" : ""}>
      <CardHeader>
        <CardTitle>Unternehmenssuche</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          {/* Dienstleistungsauswahl */}
          <div>
            <label className='text-sm font-medium'>Dienstleistung</label>
            <Select onValueChange={setService} value={service}>
              <SelectTrigger>
                <SelectValue placeholder='Dienstleistung auswählen' />
              </SelectTrigger>
              <SelectContent>
                {getGalbauServices().map((serviceOption, index) => (
                  <SelectItem key={index} value={serviceOption.toLowerCase()}>
                    {serviceOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stadt */}
          <div>
            <label className='text-sm font-medium'>Stadt</label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder='Stadt eingeben'
            />
          </div>

          {/* Postleitzahl */}
          <div>
            <label className='text-sm font-medium'>Postleitzahl</label>
            <Input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              placeholder='PLZ eingeben'
            />
          </div>

          {/* Radius */}
          <div>
            <label className='text-sm font-medium'>Radius (km)</label>
            <Select
              onValueChange={(value) => setRadius(Number(value))}
              value={radius.toString()}>
              <SelectTrigger>
                <SelectValue placeholder='Radius wählen' />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((km) => (
                  <SelectItem key={km} value={km.toString()}>
                    {km} km
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Suchbutton */}
        <Button
          variant={"default"}
          onClick={handleSearchClick}
          disabled={loading}
          className='w-full mt-4 bg-green-500'>
          {loading ? "Suche läuft..." : "Suchen"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SearchBar;
