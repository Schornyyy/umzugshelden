"use client";

import React from "react";
import ContractMultiStepForm from "@/components/ContractMultiStepForm";

export default function AuftragErstellenPage() {
  return (
    <div className='min-h-screen bg-gray-50 py-10'>
      <div className='container mx-auto px-4 max-w-5xl'>
        <header className='text-center mb-8'>
          <h1 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>
            Auftrag erstellen
          </h1>
          <p className='text-gray-600 text-sm md:text-base'>
            Beschreiben Sie Ihr Projekt & erhalten Sie mehrere Rückmeldungen –
            kostenlos & unverbindlich.
          </p>
        </header>
        <ContractMultiStepForm variant='full' showHeader={true} />
      </div>
    </div>
  );
}
