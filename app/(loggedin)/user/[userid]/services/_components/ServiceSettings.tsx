"use client"

import { updateCompanyInDatabase } from "@/actions/companyActions";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { getGalbauServices } from "@/statics/Lists";
import { CompanyType } from "@/types/RegisterTypye";
import React, { useEffect, useState } from "react";

const ServiceSettings: React.FC = () => {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showError, setShowError] = useState<"error" | "idle" | "sucess">("idle");
  const {companyData} = useCompanyData();

  useEffect(() => {
    if(companyData) {
      setSelectedServices(companyData.services!);
    }
  }, [companyData])

  const toggleService = (service: string) => {
    setSelectedServices((prevSelected) =>
      prevSelected.includes(service.toLowerCase())
        ? prevSelected.filter((s) => s.toLowerCase() !== service.toLowerCase())
        : [...prevSelected, service.toLowerCase()]
    );
  };

  const submitServices = async() => {
    if(selectedServices.length === 0) {
        setShowError("error");
        return;
    }

    const updatedData: CompanyType = {...companyData!, services: selectedServices};

    await updateCompanyInDatabase(updatedData).then(() => {
        setShowError("sucess");
    });
  }

  return (
    <div className="mx-auto container my-24">
      <h1 className="text-2xl font-bold text-center mb-6">
        Wählen Sie Ihre Dienstleistungen
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {getGalbauServices().map((service, index) => (
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

        <button
        onClick={() => submitServices()}
          className="bg-green-500 text-white px-4 py-2 rounded-lg disabled:bg-gray-300"
          disabled={selectedServices.length === 0}
        >
          Speichern
        </button>
      </div>
        {showError === "error" && <p className="text-red-500">Bitte wählen Sie mindestens eine Dienstleistung aus</p>}
        {showError === "sucess" && <p className="text-green-500">Dienstleistungen erfolgreich ausgewählt</p>}
      </div>
    </div>
  );
};

export default ServiceSettings;
