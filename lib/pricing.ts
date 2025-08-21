import { Contract } from "@/types/Contract";

// Shared pricing logic: halve and clamp to 10–30 €
export function calculateContractPriceFromData(data: {
  gardenSize: number;
  contractSize: Contract["contractSize"];
  planningAvaillable: boolean;
  repeatService: boolean;
}): number {
  let basePrice = 25; // Grundpreis in Euro

  // Preis basierend auf Gartengröße
  if (data.gardenSize > 500) {
    basePrice += 25;
  } else if (data.gardenSize > 200) {
    basePrice += 10;
  } else if (data.gardenSize > 100) {
    basePrice += 5;
  }

  // Preis basierend auf Projektumfang
  switch (data.contractSize) {
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
  if (data.planningAvaillable) {
    basePrice += 0;
  }

  if (data.repeatService) {
    basePrice += 25;
  }

  // Preis halbieren und in Preisspanne 10–30 € begrenzen
  const halved = basePrice * 0.5;
  const clamped = Math.max(10, Math.min(30, halved));
  return Math.round(clamped * 100) / 100;
}
