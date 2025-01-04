import { useRegisterData } from '@/customHooks/useRegisterData';
import { CompanyType } from '@/types/RegisterTypye';
import React, { useState } from 'react';

const ChooseStep = () => {
  const { updateStep,  updateData, data } = useRegisterData();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handlePrivatPersonData = () => {
    const d: CompanyType = { ...data, email: data?.email || '', type: 'privatPerson' };
    updateData(d);
    setSelectedType('privatPerson');
  };

  const handleCompanyData = () => {
    const d: CompanyType = { ...data, email: data?.email || '', type: 'company' };
    updateData(d);
    setSelectedType('company');
  };

  const handleChoosenStep = (step: number) => {
    switch (step) {
      case 0:
        handlePrivatPersonData();
        break;
      case 1:
        handleCompanyData();
        break;
    }
  };

  return (
    <div className="flex flex-col gap-12 container mx-auto">
      <div className="flex flex-row gap-12 justify-center">
        <div
          className={`flex flex-col justify-center items-center border border-gray-200 rounded-[15px] p-48 cursor-pointer duration-300 ${
            selectedType === 'privatPerson' ? 'bg-green-500' : 'hover:bg-green-300'
          }`}
          onClick={() => handleChoosenStep(0)}
        >
          Privatperson
        </div>
        <div
          className={`flex flex-col justify-center items-center border border-gray-200 rounded-[15px] p-48 cursor-pointer duration-300 ${
            selectedType === 'company' ? 'bg-green-500' : 'hover:bg-green-300'
          }`}
          onClick={() => handleChoosenStep(1)}
        >
          Unternehmen
        </div>
      </div>
      <div className="flex flex-row items-end justify-end">
        <button
          className="bg-green-700 text-white font-bold py-3 px-7 rounded-md disabled:bg-green-300 disabled:cursor-not-allowed"
          disabled={!selectedType}
          onClick={() => updateStep(selectedType === 'privatPerson' ? 'register' : "companyRegister")}
        >
          Nächster Schritt
        </button>
      </div>
    </div>
  );
};

export default ChooseStep;
