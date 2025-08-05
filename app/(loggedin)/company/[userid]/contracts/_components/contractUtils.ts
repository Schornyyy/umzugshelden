"use client";

import { ContractPreview } from "@/actions/contractActions";

// Berechne Contract-Preis
export const calculateContractPrice = (contract: ContractPreview): number => {
  let basePrice = 25; // Grundpreis in Euro

  // Preis basierend auf Gartengröße
  if (contract.gardenSize > 500) {
    basePrice += 25;
  } else if (contract.gardenSize > 200) {
    basePrice += 10;
  } else if (contract.gardenSize > 100) {
    basePrice += 5;
  }

  // Preis basierend auf Projektumfang
  switch (contract.contractSize) {
    case "new":
      basePrice += 25;
      break;
    case "small changes":
      basePrice += 10;
      break;
    case "request":
      basePrice += 0; // Nur Beratung
      break;
  }

  // Zusätzliche Services
  if (contract.planningAvaillable) {
    basePrice += 0;
  }

  if (contract.repeatService) {
    basePrice += 15;
  }

  return basePrice;
};

export const formatTimeAgo = (timestamp: Date | undefined): string => {
  if (!timestamp) return "Unbekannt";

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return "Vor wenigen Minuten";
  if (diffInHours < 24) return `Vor ${diffInHours} Stunden`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `Vor ${diffInDays} Tag${diffInDays !== 1 ? "en" : ""}`;
};

export const calculateContractValue = (contract: ContractPreview): string => {
  let value = "Mittel";

  if (contract.gardenSize > 500 || contract.contractSize === "new") {
    value = "Hoch";
  } else if (
    contract.gardenSize < 100 ||
    contract.contractSize === "request"
  ) {
    value = "Niedrig";
  }

  return value;
};
