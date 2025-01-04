import { createContext, ReactNode, useState } from "react";
import { CompanyType } from "@/types/RegisterTypye";

interface RegisterDataContextType {
  data: CompanyType | undefined;
  updateData: (newData: CompanyType) => void;
  step: StepsName,
  updateStep: (newValue: StepsName) => void;
}

type StepsName = "choose" | "register" | "companyRegister" | "service";

export const RegisterDataContext = createContext<RegisterDataContextType | undefined>(undefined);

export const RegisterDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<CompanyType | undefined>(undefined);
  const [step, setStep] = useState<StepsName>("companyRegister");

  const updateData = (newData: CompanyType) => setData(newData);
  const updateStep = (newValue: StepsName) => setStep(newValue)

  return (
    <RegisterDataContext.Provider value={{ data, updateData, step, updateStep }}>
      {children}
    </RegisterDataContext.Provider> 
  );
};