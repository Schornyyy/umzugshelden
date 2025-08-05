"use server";

import { database, storage } from "@/config/firebase";
import { Contract } from "@/types/Contract";
import { fetchCoordinates } from "./userActions";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  startAfter,
  limit as firestoreLimit
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "firebase/storage";

// Contract mit Metadaten für Firebase
export interface ContractDocument extends Omit<Contract, 'verified'> {
  id?: string;
  verified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'verified' | 'assigned' | 'completed' | 'cancelled';
  verificationToken?: string;
  assignedTo?: string;
  assignedCompanyName?: string;
  assignedAt?: Timestamp;
  distance?: number; // Für Sortierung nach Entfernung
}

// Contract für Client Components (mit konvertierten Timestamps)
export interface ContractDocumentClient extends Omit<Contract, 'verified'> {
  id?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'verified' | 'assigned' | 'completed' | 'cancelled';
  verificationToken?: string;
  assignedTo?: string;
  assignedCompanyName?: string;
  assignedAt?: Date;
  distance?: number; // Für Sortierung nach Entfernung
}

// Contract Preview für nicht-gekaufte Contracts (ohne sensitive Daten)
export interface ContractPreview {
  id?: string;
  type: string;
  zip: number;
  latitude?: number;
  longitude?: number;
  gardenSize: number;
  contractSize: string;
  gardenLocation: string;
  projektBeginn: string;
  description: string;
  planningAvaillable: boolean;
  repeatService: boolean;
  createdAt: Date;
  distance?: number;
  // Keine Kontaktdaten, keine Files, keine internen Felder
}

// 🔹 NEUEN CONTRACT ERSTELLEN
export const createContract = async (
  contractData: Omit<Contract, 'verified'>,
  files?: File[]
): Promise<string> => {
  try {
    // Generiere Verifikations-Token
    const verificationToken = generateVerificationToken();
    
    // Hole Koordinaten basierend auf PLZ
    let coordinates = null;
    if (contractData.zip) {
      try {
        // Verwende die PLZ als Stadt-Parameter (Nominatim kann mit PLZ alleine arbeiten)
        coordinates = await fetchCoordinates(contractData.zip.toString(), contractData.zip.toString());
      } catch (error) {
        console.error("Fehler beim Abrufen der Koordinaten:", error);
        // Weiter ohne Koordinaten - nicht kritisch für Contract-Erstellung
      }
    }
    
    // Upload files to Firebase Storage if any
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      fileUrls = await uploadContractFiles(files, verificationToken);
    }
    
    // Erstelle Contract-Dokument mit Koordinaten
    const contractDocument: Omit<ContractDocument, 'id'> = {
      ...contractData,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude,
      files: fileUrls, // Firebase Storage URLs
      verified: false,
      status: 'pending',
      verificationToken,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    const docRef = await addDoc(collection(database, "contracts"), contractDocument);
    
    // Sende Verifikations-E-Mail
    await sendVerificationEmail(contractData.contact.email, verificationToken, docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error("Fehler beim Erstellen des Contracts:", error);
    throw new Error("Contract konnte nicht erstellt werden");
  }
};

// 🔹 CONTRACT VERIFIZIEREN
export const verifyContract = async (contractId: string, token: string): Promise<boolean> => {
  try {
    const contractRef = doc(database, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      throw new Error("Contract nicht gefunden");
    }

    const contractData = contractSnap.data() as ContractDocument;

    if (contractData.verificationToken !== token) {
      throw new Error("Ungültiger Verifikations-Token");
    }

    if (contractData.verified) {
      return true; // Bereits verifiziert
    }

    // Contract als verifiziert markieren
    await updateDoc(contractRef, {
      verified: true,
      status: 'verified',
      updatedAt: serverTimestamp(),
      verificationToken: null // Token löschen nach Verifikation
    });

    // Benachrichtige passende Unternehmen
    await notifyMatchingCompanies(contractId);

    return true;
  } catch (error) {
    console.error("Fehler beim Verifizieren des Contracts:", error);
    throw new Error("Contract konnte nicht verifiziert werden");
  }
};

// 🔹 CONTRACT NACH ID LADEN
export const getContractById = async (contractId: string): Promise<ContractDocument | null> => {
  try {
    const contractRef = doc(database, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      return null;
    }

    const data = contractSnap.data();
    
    // Konvertiere Firebase Timestamps zu Date-Objekten
    return {
      id: contractSnap.id,
      ...data,
      createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
        ? data.createdAt.toDate() 
        : data.createdAt instanceof Date 
          ? data.createdAt 
          : new Date(),
      updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
        ? data.updatedAt.toDate() 
        : data.updatedAt instanceof Date 
          ? data.updatedAt 
          : new Date()
    } as ContractDocument;
  } catch (error) {
    console.error("Fehler beim Laden des Contracts:", error);
    throw new Error("Contract konnte nicht geladen werden");
  }
};

// 🔹 ALLE CONTRACTS LADEN (mit Filtern)
export const getAllContracts = async (filters?: {
  verified?: boolean;
  status?: ContractDocument['status'];
  zip?: number;
  service?: string;
}): Promise<ContractDocument[]> => {
  try {
    let q = query(collection(database, "contracts"), orderBy("createdAt", "desc"));

    if (filters?.verified !== undefined) {
      q = query(q, where("verified", "==", filters.verified));
    }

    if (filters?.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters?.zip) {
      q = query(q, where("zip", "==", filters.zip));
    }

    if (filters?.service) {
      q = query(q, where("type", "==", filters.service));
    }

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return [];

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date(),
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
          ? data.updatedAt.toDate() 
          : data.updatedAt instanceof Date 
            ? data.updatedAt 
            : new Date()
      };
    }) as ContractDocument[];
  } catch (error) {
    console.error("Fehler beim Laden der Contracts:", error);
    throw new Error("Contracts konnten nicht geladen werden");
  }
};

// 🔹 CONTRACTS NACH EMAIL LADEN
export const getContractsByEmail = async (email: string): Promise<ContractDocument[]> => {
  try {
    const q = query(
      collection(database, "contracts"),
      where("contact.email", "==", email),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return [];

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date(),
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
          ? data.updatedAt.toDate() 
          : data.updatedAt instanceof Date 
            ? data.updatedAt 
            : new Date()
      };
    }) as ContractDocument[];
  } catch (error) {
    console.error("Fehler beim Laden der Contracts nach E-Mail:", error);
    throw new Error("Contracts konnten nicht geladen werden");
  }
};

// 🔹 CONTRACT STATUS AKTUALISIEREN
export const updateContractStatus = async (
  contractId: string, 
  status: ContractDocument['status']
): Promise<void> => {
  try {
    const contractRef = doc(database, "contracts", contractId);
    
    await updateDoc(contractRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Contract-Status:", error);
    throw new Error("Contract-Status konnte nicht aktualisiert werden");
  }
};

// 🔹 CONTRACT LÖSCHEN
export const deleteContract = async (contractId: string): Promise<void> => {
  try {
    // Lade Contract um Dateien zu löschen
    const contract = await getContractById(contractId);
    
    if (contract && contract.files.length > 0) {
      // Lösche alle zugehörigen Dateien
      await deleteContractFiles(contract.files);
    }
    
    // Lösche Contract aus Firestore
    const contractRef = doc(database, "contracts", contractId);
    await deleteDoc(contractRef);
  } catch (error) {
    console.error("Fehler beim Löschen des Contracts:", error);
    throw new Error("Contract konnte nicht gelöscht werden");
  }
};

// 🔹 CONTRACTS FÜR UNTERNEHMEN IM UMKREIS LADEN (nur Preview-Daten)
export const getContractPreviewsInRadius = async (
  companyLatitude: number,
  companyLongitude: number,
  radiusKm: number = 50,
  companyServices: string[],
  lastDocId?: string,
  limit: number = 20
): Promise<{
  contracts: ContractPreview[];
  hasMore: boolean;
  lastDocId?: string;
}> => {
  try {
    // Berechne Datum für 3-Monats-Filter (90 Tage)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const threeMonthsAgoTimestamp = Timestamp.fromDate(threeMonthsAgo);

    console.log(`Filtere Contracts älter als: ${threeMonthsAgo.toISOString()}`);

    // Lade alle verfügbaren Contracts (bereits mit Altersfilter)
    let q = query(
      collection(database, "contracts"),
      where("verified", "==", true),
      where("status", "==", "verified"),
      where("createdAt", ">=", threeMonthsAgoTimestamp), // Nur Contracts der letzten 3 Monate
      orderBy("createdAt", "desc")
    );

    // Pagination
    if (lastDocId) {
      const lastDoc = await getDoc(doc(database, "contracts", lastDocId));
      if (lastDoc.exists()) {
        q = query(q, startAfter(lastDoc));
      }
    }

    q = query(q, firestoreLimit(limit * 5)); // Lade mehr, da wir nach Service und Verfügbarkeit filtern

    const querySnapshot = await getDocs(q);
    console.log(`Gesamte Contracts gefunden: ${querySnapshot.docs.length}`);

    // Verarbeite alle Contracts asynchron mit Service- und Verfügbarkeitsprüfung
    const contractPromises = querySnapshot.docs.map(async (doc) => {
      const contractData = { id: doc.id, ...doc.data() } as ContractDocument;
      
      // Prüfe Service-Match
      const normalizedCompanyServices = companyServices.map(service => 
        service.toLowerCase().trim()
      );
      
      const contractServiceNormalized = contractData.type.toLowerCase().trim();
      const serviceMatches = normalizedCompanyServices.some(companyService => 
        companyService === contractServiceNormalized ||
        contractData.type === companyService ||
        contractData.type === companyService.charAt(0).toUpperCase() + companyService.slice(1)
      );

      // Falls Service nicht passt, überspringe Contract
      if (!serviceMatches) {
        return null;
      }
      
      // Prüfe Verfügbarkeit (Kaufanzahl)
      const isAvailable = await isContractAvailable(contractData);
      if (!isAvailable) {
        return null;
      }
      
      // Prüfe Distanz
      if (contractData.latitude && contractData.longitude) {
        if (isContractWithinRadius(
          contractData.latitude,
          contractData.longitude,
          companyLatitude,
          companyLongitude,
          radiusKm
        )) {
          const distance = calculateDistance(
            companyLatitude,
            companyLongitude,
            contractData.latitude,
            contractData.longitude
          );
          
          // Erstelle Preview ohne sensitive Daten
          const preview: ContractPreview = {
            id: contractData.id,
            type: contractData.type,
            zip: contractData.zip,
            latitude: contractData.latitude,
            longitude: contractData.longitude,
            gardenSize: contractData.gardenSize,
            contractSize: contractData.contractSize,
            gardenLocation: contractData.gardenLocation,
            projektBeginn: contractData.projektBeginn,
            description: contractData.description,
            planningAvaillable: contractData.planningAvaillable,
            repeatService: contractData.repeatService,
            createdAt: contractData.createdAt && typeof contractData.createdAt.toDate === 'function' 
              ? contractData.createdAt.toDate() 
              : contractData.createdAt instanceof Date 
                ? contractData.createdAt 
                : new Date(),
            distance: distance
          };
          
          return preview;
        }
      }
      return null;
    });

    // Warte auf alle Promises und filtere null-Werte heraus
    const validContracts = (await Promise.all(contractPromises))
      .filter(Boolean) as ContractPreview[];

    // Sortiere nach Distanz und limitiere Ergebnisse
    const sortedContracts = validContracts
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);

    console.log(`Endergebnis: ${sortedContracts.length} verfügbare Contract-Previews gefunden`);

    return {
      contracts: sortedContracts,
      hasMore: sortedContracts.length === limit,
      lastDocId: sortedContracts.length > 0 ? sortedContracts[sortedContracts.length - 1].id : undefined
    };
  } catch (error) {
    console.error("Fehler beim Laden der Contract-Previews im Umkreis:", error);
    throw new Error("Contract-Previews konnten nicht geladen werden");
  }
};

// 🔹 CONTRACTS FÜR UNTERNEHMEN IM UMKREIS LADEN (vollständige Daten)
export const getContractsInRadius = async (
  companyLatitude: number,
  companyLongitude: number,
  radiusKm: number = 50,
  companyServices: string[],
  lastDocId?: string,
  limit: number = 20
): Promise<{
  contracts: ContractDocumentClient[];
  hasMore: boolean;
  lastDocId?: string;
}> => {
  try {
    console.log("getContractsInRadius aufgerufen mit:", {
      companyLatitude,
      companyLongitude,
      radiusKm,
      companyServices,
      lastDocId,
      limit
    });

    // Berechne Datum für 3-Monats-Filter (90 Tage)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    const threeMonthsAgoTimestamp = Timestamp.fromDate(threeMonthsAgo);

    console.log(`Filtere Contracts älter als: ${threeMonthsAgo.toISOString()}`);

    // Lade alle verfügbaren Contracts (bereits mit Altersfilter)
    let q = query(
      collection(database, "contracts"),
      where("verified", "==", true),
      where("status", "==", "verified"),
      where("createdAt", ">=", threeMonthsAgoTimestamp), // Nur Contracts der letzten 3 Monate
      orderBy("createdAt", "desc")
    );

    // Pagination
    if (lastDocId) {
      const lastDoc = await getDoc(doc(database, "contracts", lastDocId));
      if (lastDoc.exists()) {
        q = query(q, startAfter(lastDoc));
      }
    }

    q = query(q, firestoreLimit(limit * 5)); // Lade mehr, da wir nach Service und Verfügbarkeit filtern

    const querySnapshot = await getDocs(q);
    console.log(`Gesamte Contracts gefunden: ${querySnapshot.docs.length}`);

    // Verarbeite alle Contracts asynchron mit Service- und Verfügbarkeitsprüfung
    const contractPromises = querySnapshot.docs.map(async (doc) => {
      const contractData = { id: doc.id, ...doc.data() } as ContractDocument;
      
      // Prüfe Service-Match
      const normalizedCompanyServices = companyServices.map(service => 
        service.toLowerCase().trim()
      );
      
      const contractServiceNormalized = contractData.type.toLowerCase().trim();
      const serviceMatches = normalizedCompanyServices.some(companyService => 
        companyService === contractServiceNormalized ||
        contractData.type === companyService ||
        contractData.type === companyService.charAt(0).toUpperCase() + companyService.slice(1)
      );

      // Falls Service nicht passt, überspringe Contract
      if (!serviceMatches) {
        return null;
      }
      
      // Prüfe Verfügbarkeit (Kaufanzahl)
      const isAvailable = await isContractAvailable(contractData);
      if (!isAvailable) {
        return null;
      }
      
      // Prüfe Distanz
      if (contractData.latitude && contractData.longitude) {
        if (isContractWithinRadius(
          contractData.latitude,
          contractData.longitude,
          companyLatitude,
          companyLongitude,
          radiusKm
        )) {
          const distance = calculateDistance(
            companyLatitude,
            companyLongitude,
            contractData.latitude,
            contractData.longitude
          );
          
          console.log(`Contract ${contractData.id} - Distanz: ${distance}km`);
          
          // Konvertiere zu Client-Format
          const clientContract: ContractDocumentClient = {
            ...contractData,
            createdAt: contractData.createdAt && typeof contractData.createdAt.toDate === 'function'
              ? contractData.createdAt.toDate()
              : contractData.createdAt instanceof Date
                ? contractData.createdAt
                : new Date(),
            updatedAt: contractData.updatedAt && typeof contractData.updatedAt.toDate === 'function'
              ? contractData.updatedAt.toDate()
              : contractData.updatedAt instanceof Date
                ? contractData.updatedAt
                : new Date(),
            assignedAt: contractData.assignedAt && typeof contractData.assignedAt.toDate === 'function'
              ? contractData.assignedAt.toDate()
              : undefined,
            distance
          };
          
          return clientContract;
        }
      } else {
        console.warn(`Contract ${contractData.id} hat keine Koordinaten`);
      }
      return null;
    });

    // Warte auf alle Promises und filtere null-Werte heraus
    const validContracts = (await Promise.all(contractPromises))
      .filter(Boolean) as ContractDocumentClient[];

    // Sortiere nach Distanz und limitiere Ergebnisse
    const sortedContracts = validContracts
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .slice(0, limit);

    console.log(`Endergebnis: ${sortedContracts.length} verfügbare Contracts gefunden`);

    return {
      contracts: sortedContracts,
      hasMore: sortedContracts.length === limit,
      lastDocId: sortedContracts.length > 0 ? sortedContracts[sortedContracts.length - 1].id : undefined
    };
  } catch (error) {
    console.error("Fehler beim Laden der Contracts im Umkreis:", error);
    throw new Error("Contracts konnten nicht geladen werden");
  }
};

// 🔹 CONTRACT KAUFEN/ZUWEISEN AN UNTERNEHMEN
export const purchaseContract = async (
  contractId: string,
  companyId: string,
  companyName: string
): Promise<boolean> => {
  try {
    const contractRef = doc(database, "contracts", contractId);
    const contractSnap = await getDoc(contractRef);

    if (!contractSnap.exists()) {
      throw new Error("Contract nicht gefunden");
    }

    const contractData = contractSnap.data() as ContractDocument;

    // Prüfe ob Contract bereits verkauft wurde
    if (contractData.status === 'assigned') {
      throw new Error("Dieser Auftrag wurde bereits vergeben");
    }

    // Prüfe ob Contract verifiziert ist
    if (!contractData.verified || contractData.status !== 'verified') {
      throw new Error("Dieser Auftrag ist nicht verfügbar");
    }

    // Aktualisiere Contract Status
    await updateDoc(contractRef, {
      status: 'assigned',
      assignedTo: companyId,
      assignedCompanyName: companyName,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Erstelle Purchase Record für Tracking
    await addDoc(collection(database, "purchases"), {
      contractId,
      companyId,
      companyName,
      purchasedAt: serverTimestamp(),
      amount: calculateContractPrice(contractData) // Berechne Preis basierend auf Contract
    });

    console.log(`Contract ${contractId} erfolgreich an ${companyName} verkauft`);
    return true;
  } catch (error) {
    console.error("Fehler beim Kauf des Contracts:", error);
    throw error;
  }
};

// 🔹 GEKAUFTE CONTRACTS FÜR UNTERNEHMEN LADEN
export const getPurchasedContracts = async (companyId: string): Promise<ContractDocumentClient[]> => {
  try {
    const q = query(
      collection(database, "contracts"),
      where("assignedTo", "==", companyId),
      orderBy("assignedAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const contract = {
        id: doc.id,
        ...doc.data()
      } as ContractDocument;
      
      // Konvertiere Firebase Timestamps zu einfachen Werten für Client Components
      return {
        ...contract,
        createdAt: contract.createdAt?.toDate?.() || new Date(),
        updatedAt: contract.updatedAt?.toDate?.() || new Date(),
        assignedAt: contract.assignedAt?.toDate?.() || undefined
      } as ContractDocumentClient;
    });
  } catch (error) {
    console.error("Fehler beim Laden der gekauften Contracts:", error);
    throw new Error("Gekaufte Contracts konnten nicht geladen werden");
  }
};

// 🔹 HILFSFUNKTIONEN

// Prüfe ob Contract noch verfügbar ist (nicht zu oft gekauft und nicht zu alt)
async function isContractAvailable(contractData: ContractDocument): Promise<boolean> {
  try {
    // Prüfe Alter des Contracts (nicht älter als 3 Monate)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90);
    
    const contractDate = contractData.createdAt instanceof Date 
      ? contractData.createdAt 
      : contractData.createdAt?.toDate?.() || new Date();
    
    if (contractDate < threeMonthsAgo) {
      return false; // Contract ist älter als 3 Monate
    }

    // Prüfe Anzahl der Käufe für diesen Contract
    const purchaseCount = await getContractPurchaseCount(contractData.id!);
    if (purchaseCount >= 5) {
      return false; // Contract wurde bereits 5-mal oder öfter gekauft
    }

    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der Contract-Verfügbarkeit:", error);
    return false;
  }
}

// Zähle wie oft ein Contract gekauft wurde
async function getContractPurchaseCount(contractId: string): Promise<number> {
  try {
    const q = query(
      collection(database, "purchasedContracts"),
      where("contractId", "==", contractId),
      where("paymentStatus", "==", "succeeded")
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Fehler beim Zählen der Contract-Käufe:", error);
    return 0;
  }
}

// Upload Contract Files zu Firebase Storage
async function uploadContractFiles(files: File[], contractToken: string): Promise<string[]> {
  try {
    const uploadPromises = files.map(async (file, index) => {
      // Erstelle eindeutigen Dateinamen
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `contract_${contractToken}_${timestamp}_${index}.${fileExtension}`;
      
      // Erstelle Storage Reference
      const storageRef = ref(storage, `contracts/${contractToken}/${fileName}`);
      
      // Upload File
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get Download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Fehler beim Upload der Dateien:", error);
    throw new Error("Dateien konnten nicht hochgeladen werden");
  }
}

// Lösche Contract Files aus Firebase Storage
async function deleteContractFiles(fileUrls: string[]): Promise<void> {
  try {
    const deletePromises = fileUrls.map(async (url) => {
      try {
        // Extrahiere Storage Reference aus URL
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
      } catch (error) {
        console.warn(`Datei konnte nicht gelöscht werden: ${url}`, error);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Fehler beim Löschen der Dateien:", error);
  }
}

// Generiere Verifikations-Token
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Sende Verifikations-E-Mail           
async function sendVerificationEmail(email: string, token: string, contractId: string): Promise<void> {
  try {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contract/verify?id=${contractId}&token=${token}`;
    
    // Hole Contract-Daten für das Template
    const contractDoc = await getDoc(doc(database, "contracts", contractId));
    const contractData = contractDoc.data() as Contract;
    
    // Erstelle Replacements für das Template
    const replacements = {
      customerName: `${contractData.contact.firstName} ${contractData.contact.lastName}` || "Kunde",
      verificationLink: verificationUrl,
      service: contractData.type || "Service nicht angegeben",
      location: contractData.zip ? `PLZ ${contractData.zip}` : "Standort nicht angegeben",
      contractId: contractId.substring(0, 8).toUpperCase()
    };

    // Sende E-Mail über die API Route
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: email,
        subject: "Auftrag bestätigen - Landschaftshelden.io",
        replacements,
        templatePath: "ContractVerificationEmail.html"
      })
    });

    if (!response.ok) {
      throw new Error(`E-Mail API Error: ${response.status}`);
    }

    console.log(`Verifikations-E-Mail erfolgreich an ${email} gesendet`);
    
  } catch (error) {
    console.error("Fehler beim Senden der Verifikations-E-Mail:", error);
    // E-Mail-Fehler sollen den Contract-Erstellungsprozess nicht blockieren
  }
}

// Benachrichtige passende Unternehmen über neuen Contract
async function notifyMatchingCompanies(contractId: string): Promise<void> {
  try {
    const contract = await getContractById(contractId);
    if (!contract) return;

    // Hier würde die Logik zur Benachrichtigung passender Unternehmen stehen
    console.log(`Benachrichtige Unternehmen über neuen Contract: ${contractId}`);
    console.log(`Service: ${contract.type}, PLZ: ${contract.zip}`);
    
    // TODO: Implementiere Unternehmens-Benachrichtigung
    // const matchingCompanies = await findMatchingCompanies(contract.zip, contract.type);
    // await notifyCompanies(matchingCompanies, contract);
    
  } catch (error) {
    console.error("Fehler beim Benachrichtigen der Unternehmen:", error);
  }
}

// Berechne Distanz zwischen zwei Koordinaten (Haversine-Formel) - präzise Version
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const R = 6371e3; // Radius der Erde in Metern
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const Δφ = toRadians(lat2 - lat1);
  const Δλ = toRadians(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceInMeters = R * c; // Distanz in Metern
  
  // Konvertiere zu Kilometern und runde auf 1 Dezimalstelle
  return Math.round((distanceInMeters / 1000) * 10) / 10;
}

// Prüfe ob ein Punkt innerhalb des Radius liegt (analog zur CompanySearchPage)
function isContractWithinRadius(
  contractLatitude: number,
  contractLongitude: number,
  companyLatitude: number,
  companyLongitude: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(
    companyLatitude,
    companyLongitude,
    contractLatitude,
    contractLongitude
  );
  return distance <= radiusKm;
}

// Berechne Contract-Preis basierend auf Eigenschaften
export async function calculateContractPrice(contract: ContractDocument): Promise<number> {
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
    case 'new':
      basePrice += 25;
      break;
    case 'small changes':
      basePrice += 10;
      break;
    case 'request':
      basePrice += 0; // Nur Beratung
      break;
  }
  
  // Zusätzliche Services
  if (contract.planningAvaillable) {
    basePrice += 0;
  }
  
  if (contract.repeatService) {
    basePrice += 25;
  }
  
  return basePrice;
}
