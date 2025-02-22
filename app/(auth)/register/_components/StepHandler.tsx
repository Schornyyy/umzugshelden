import { useRegisterData } from "@/customHooks/useRegisterData";
import React from "react";
import ChooseStep from "./ChooseStep";
import RegisterStep from "./RegisterStep";
import CompanyRegister from "./CompanyRegister";
import ServiceSelector from "./ServiceSelector";
import CompanyInfoStep from "./CompanyInfoStep";

const StepHandler = () => {
  const { step } = useRegisterData();

  function handleShowenStep() {
    switch (step) {
      case "choose":
        return <ChooseStep />;
      case "register":
        return <RegisterStep />;
      case "companyRegister":
        return <CompanyRegister />;
      case "service":
        return <ServiceSelector />;
      case "companyInfos":
        return <CompanyInfoStep />;
      default:
        return <p>Step: {step}</p>;
    }
  }

  return (
    <div className='w-full min-h-screen flex justify-center items-center'>
      {handleShowenStep()}
    </div>
  );
};

export default StepHandler;
