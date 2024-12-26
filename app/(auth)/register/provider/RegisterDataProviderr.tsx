import { createContext, ReactNode, useState } from "react";
import { Registertype } from "@/types/RegisterTypye";

interface RegisterDataContextType {
  data: Registertype | undefined;
  updateData: (newData: Registertype) => void;
  step: number,
  updateStep: (newValue: number) => void;
}

export const RegisterDataContext = createContext<RegisterDataContextType | undefined>(undefined);

export const RegisterDataProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<Registertype | undefined>(undefined);
  const [step, setStep] = useState<number>(0);

  const updateData = (newData: Registertype) => setData(newData);
  const updateStep = (newValue: number) => setStep(newValue)

  return (
    <RegisterDataContext.Provider value={{ data, updateData, step, updateStep }}>
      {children}
    </RegisterDataContext.Provider> 
  );
};