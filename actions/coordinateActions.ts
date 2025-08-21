"use server";

import { database } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { fetchCoordinates } from "./userActions";

// 🔹 KOORDINATEN FÜR COMPANY BASIEREND AUF PLZ AKTUALISIEREN
export const updateCompanyCoordinates = async (
  companyId: string,
  zip: string
): Promise<{ latitude: number; longitude: number } | null> => {
  try {
    console.log(`Aktualisiere Koordinaten für Company ${companyId} mit PLZ: ${zip}`);
    
  // Hole Koordinaten robust basierend auf Land + PLZ
  const coordinates = await fetchCoordinates('Deutschland', zip);
    
    if (coordinates) {
      // Aktualisiere Company-Dokument mit Koordinaten
      const companyRef = doc(database, "users", companyId);
      await updateDoc(companyRef, {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Koordinaten erfolgreich aktualisiert:`, coordinates);
      return coordinates;
    } else {
      console.error("Keine Koordinaten gefunden für PLZ:", zip);
      return null;
    }
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Company-Koordinaten:", error);
    return null;
  }
};
