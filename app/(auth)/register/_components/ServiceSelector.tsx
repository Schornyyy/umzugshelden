"use client"

import { useRegisterData } from "@/customHooks/useRegisterData";
import React, { useState } from "react";

const services = [
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

const ServiceSelector: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const {updateStep, data, updateData} = useRegisterData();
  const [showError, setShowError] = useState<"error" | "idle" | "sucess">("idle");

  const toggleService = (service: string) => {
    setSelectedServices((prevSelected) =>
      prevSelected.includes(service.toLowerCase())
        ? prevSelected.filter((s) => s.toLowerCase() !== service.toLowerCase())
        : [...prevSelected, service.toLowerCase()]
    );
  };

  const handleBack = () => {
    updateStep('companyRegister')
  }

  const submitServices = () => {
    if(selectedServices.length === 0) {
        setShowError("error");
        return;
    }

    setShowError("sucess");

    updateData({...data!, services: selectedServices});
    updateStep("register");
  }

  return (
    <div className="mx-auto container my-24">
      <h1 className="text-2xl font-bold text-center mb-6">
        Wählen Sie Ihre Dienstleistungen
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <div
            key={index}
            className={`p-4 text-center rounded-lg cursor-pointer transition-transform duration-200 shadow-lg ${
              selectedServices.includes(service.toLowerCase())
                ? "bg-green-500 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
            onClick={() => toggleService(service)}
          >
            {service}
          </div>
        ))}
      </div>
      <div className="mt-8">
      <div className="flex flex-row justify-between">
      <button className='py-2 px-4 rounded text-white bg-blue-600 disabled:bg-blue-400 hover:bg-blue-700' onClick={() => handleBack()}>
          Zurück
        </button>

        <button
        onClick={() => submitServices()}
          className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
          disabled={selectedServices.length === 0}
        >
          Weiter
        </button>
      </div>
        {showError === "error" && <p className="text-red-500">Bitte wählen Sie mindestens eine Dienstleistung aus</p>}
        {showError === "sucess" && <p className="text-green-500">Dienstleistungen erfolgreich ausgewählt</p>}
      </div>
    </div>
  );
};

export default ServiceSelector;
