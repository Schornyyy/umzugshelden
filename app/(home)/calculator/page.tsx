import React from "react";
import PriceCalculator from "./_components/PriceCalculator";

export const metadata = {
  title: "Kosten Kalkulator Garten- & Landschaftsbau | Landschaftshelden",
  description:
    "Berechnen Sie unverbindlich Richtwerte für GaLaBau-Leistungen: Pflasterarbeiten, Rollrasen, Terrassenbau, Zaunbau u.v.m. – mit Mengen, Material & Komplexität.",
  robots: { index: true, follow: true },
};

const CalculatorPage = async () => {
  return <PriceCalculator />;
};

export default CalculatorPage;
