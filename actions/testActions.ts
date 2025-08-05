"use server";

import { createContract, updateContractStatus, getAllContracts } from "./contractActions";
import { Contract } from "@/types/Contract";
import { fetchCoordinates } from "./userActions";
import { database } from "@/config/firebase";
import { doc, updateDoc } from "firebase/firestore";

// 🔹 TEST-CONTRACTS ERSTELLEN (nur für Entwicklung)
export const createTestContracts = async (): Promise<void> => {
  try {
    const testContracts: Omit<Contract, 'verified'>[] = [
      {
        type: "Gartenplanung und -gestaltung",
        zip: 10115,
        gardenSize: 200,
        contractSize: "new",
        gardenLocation: "front",
        projektBeginn: "request",
        description: "Komplette Neugestaltung des Vorgartens mit modernen Elementen",
        planningAvaillable: true,
        repeatService: false,
        contact: {
          firstName: "Max",
          lastName: "Mustermann",
          email: "max.mustermann@test.de",
          phone: 4903012345678
        },
        files: []
      },
      {
        type: "Rasen- und Rollrasenverlegung",
        zip: 10117,
        gardenSize: 150,
        contractSize: "small changes", 
        gardenLocation: "back",
        projektBeginn: "fast",
        description: "Regelmäßige Rasenpflege und Unkrautentfernung für kleine Gartenfläche",
        planningAvaillable: false,
        repeatService: true,
        contact: {
          firstName: "Anna",
          lastName: "Schmidt",
          email: "anna.schmidt@test.de", 
          phone: 4903087654321
        },
        files: []
      },
      {
        type: "Baum- und Gehölzpflege",
        zip: 10119,
        gardenSize: 300,
        contractSize: "request",
        gardenLocation: "back", 
        projektBeginn: "2weeks",
        description: "Fällung einer großen Eiche, die zu nah am Haus steht",
        planningAvaillable: true,
        repeatService: false,
        contact: {
          firstName: "Peter",
          lastName: "Weber",
          email: "peter.weber@test.de",
          phone: 4903055555555
        },
        files: []
      }
    ];

    console.log("Erstelle Test-Contracts...");

    for (const contract of testContracts) {
      try {
        const contractId = await createContract(contract);
        console.log(`Test-Contract erstellt: ${contractId} - ${contract.type}`);
        
        // Verifiziere Contract automatisch (für Testzwecke)
        try {
          await updateContractStatus(contractId, 'verified');
          console.log(`Test-Contract ${contractId} automatisch verifiziert`);
        } catch (verifyError) {
          console.error(`Fehler beim Verifizieren von Contract ${contractId}:`, verifyError);
        }
      } catch (error) {
        console.error(`Fehler beim Erstellen von Test-Contract ${contract.type}:`, error);
      }
    }

    console.log("Test-Contracts erfolgreich erstellt!");
  } catch (error) {
    console.error("Fehler beim Erstellen der Test-Contracts:", error);
  }
};

// 🔹 BESTEHENDE CONTRACTS MIT KOORDINATEN AKTUALISIEREN
export const fixContractCoordinates = async (): Promise<void> => {
  try {
    console.log("Lade alle Contracts ohne Koordinaten...");
    
    // Lade alle Contracts
    const contracts = await getAllContracts();
    
    for (const contract of contracts) {
      if (!contract.latitude || !contract.longitude) {
        console.log(`Aktualisiere Koordinaten für Contract ${contract.id} (PLZ: ${contract.zip})`);
        
        try {
          // Hole Koordinaten basierend auf PLZ
          const coordinates = await fetchCoordinates(contract.zip.toString(), contract.zip.toString());
          
          if (coordinates) {
            // Aktualisiere Contract mit Koordinaten
            const contractRef = doc(database, "contracts", contract.id!);
            await updateDoc(contractRef, {
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              updatedAt: new Date()
            });
            
            console.log(`✅ Koordinaten für Contract ${contract.id} aktualisiert:`, coordinates);
          } else {
            console.warn(`❌ Keine Koordinaten für PLZ ${contract.zip} gefunden`);
          }
        } catch (error) {
          console.error(`Fehler beim Aktualisieren von Contract ${contract.id}:`, error);
        }
      } else {
        console.log(`✓ Contract ${contract.id} hat bereits Koordinaten`);
      }
    }
    
    console.log("Koordinaten-Update abgeschlossen!");
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Contract-Koordinaten:", error);
  }
};
