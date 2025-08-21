"use server";

import { database } from "@/config/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { ContractPreview } from "./contractActions";

// Interface für gekaufte Verträge (Server-Side)
export interface PurchasedContract {
  id?: string;
  contractId: string;
  companyId: string;
  companyName: string;
  contractTitle: string;
  contractType: string;
  contractZip: number;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled';
  purchasedAt: Timestamp;
  accessGrantedAt?: Timestamp;
  contractData?: Record<string, unknown>; // Vollständige Contract-Daten nach Kauf
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface für Client-Side (mit Date statt Timestamp)
export interface PurchasedContractClient {
  id?: string;
  contractId: string;
  companyId: string;
  companyName: string;
  contractTitle: string;
  contractType: string;
  contractZip: number;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  stripeSessionId?: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled';
  purchasedAt: Date;
  accessGrantedAt?: Date;
  contractData?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Preisberechnung basierend auf Contract-Daten
export const calculateContractPrice = async (contract: ContractPreview): Promise<number> => {
  // Vereinheitlichte Logik wie serverseitig: Basis 25€, Zuschläge und dann halbieren, Band 10–30€
  let basePrice = 25.0;

  if (contract.gardenSize > 500) {
    basePrice += 25;
  } else if (contract.gardenSize > 200) {
    basePrice += 10;
  } else if (contract.gardenSize > 100) {
    basePrice += 5;
  }

  switch (contract.contractSize) {
    case 'new':
      basePrice += 25;
      break;
    case 'small changes':
      basePrice += 10;
      break;
    case 'request':
      basePrice += 0;
      break;
  }

  if (contract.planningAvaillable) {
    basePrice += 0;
  }

  if (contract.repeatService) {
    basePrice += 15;
  }

  const halved = basePrice * 0.5;
  const clamped = Math.max(10, Math.min(30, halved));
  return Math.round(clamped * 100) / 100;
};

// Kauf initialisieren (erstellt echte Stripe Checkout-Session)
export const initiateContractPurchase = async (
  contract: ContractPreview,
  companyId: string,
  companyName: string
): Promise<{ sessionId: string; checkoutUrl: string }> => {
  try {
    const amount = await calculateContractPrice(contract);
    
    // Rufe die API auf, um eine echte Stripe Checkout Session zu erstellen
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractPreview: contract,
        companyId,
        companyName,
        amount: amount * 100, // Stripe erwartet Cent
        currency: 'EUR'
      })
    });

    if (!response.ok) {
      throw new Error('Fehler beim Erstellen der Checkout Session');
    }

    const { sessionId, url } = await response.json();
    
    return {
      sessionId,
      checkoutUrl: url
    };

  } catch (error) {
    console.error('Fehler beim Initialisieren des Kaufs:', error);
    throw new Error('Kauf konnte nicht initialisiert werden');
  }
};

// Zahlung simulieren (für Demo-Zwecke)
export const simulateSuccessfulPayment = async (sessionId: string): Promise<boolean> => {
  try {
    // Finde Purchase basierend auf Session-ID
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripeSessionId', '==', sessionId)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      throw new Error('Purchase nicht gefunden');
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Update Payment Status zu "succeeded"
    await updateDoc(purchaseRef, {
      paymentStatus: 'succeeded',
      accessGrantedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Zahlung erfolgreich simuliert für Session:', sessionId);
    return true;

  } catch (error) {
    console.error('Fehler beim Simulieren der Zahlung:', error);
    return false;
  }
};

// Zahlung bestätigen und Zugriff gewähren
export const confirmPaymentAndGrantAccess = async (
  sessionId: string,
): Promise<PurchasedContractClient | null> => {
  try {
    // Finde Purchase basierend auf Session-ID
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripeSessionId', '==', sessionId)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      console.error('Purchase nicht gefunden für Session:', sessionId);
      return null;
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseData = purchaseDoc.data() as PurchasedContract;
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Prüfe Payment Status
    if (purchaseData.paymentStatus !== 'succeeded') {
      console.error('Payment noch nicht erfolgreich:', purchaseData.paymentStatus);
      return null;
    }

    // Hier würde normalerweise die vollständige Contract-Info geladen werden
    // Für Demo-Zwecke simulieren wir das
    const fullContractData = {
      ...purchaseData.contractData,
      contact: {
        firstName: 'Max',
        lastName: 'Mustermann',
        phone: '+49 123 456789',
        email: 'max.mustermann@example.com'
      },
      files: [
        {
          name: 'Projektbeschreibung.pdf',
          url: '#',
          type: 'application/pdf'
        },
        {
          name: 'Gartenplan.jpg',
          url: '#',
          type: 'image/jpeg'
        }
      ]
    };

    // Update mit vollständigen Contract-Daten
    await updateDoc(purchaseRef, {
      contractData: fullContractData,
      updatedAt: serverTimestamp()
    });

    // Konvertiere zu Client-Format
    const clientPurchase: PurchasedContractClient = {
      id: purchaseDoc.id,
      contractId: purchaseData.contractId,
      companyId: purchaseData.companyId,
      companyName: purchaseData.companyName,
      contractTitle: purchaseData.contractTitle,
      contractType: purchaseData.contractType,
      contractZip: purchaseData.contractZip,
      amount: purchaseData.amount,
      currency: purchaseData.currency,
      stripePaymentIntentId: purchaseData.stripePaymentIntentId,
      stripeSessionId: purchaseData.stripeSessionId,
      paymentStatus: purchaseData.paymentStatus,
      purchasedAt: purchaseData.purchasedAt.toDate(),
      accessGrantedAt: purchaseData.accessGrantedAt?.toDate(),
      contractData: fullContractData,
      createdAt: purchaseData.createdAt.toDate(),
      updatedAt: new Date()
    };

    return clientPurchase;

  } catch (error) {
    console.error('Fehler beim Bestätigen der Zahlung:', error);
    return null;
  }
};

// Hilfsfunktion zum Konvertieren von Firebase Timestamps
const convertTimestampToDate = (timestamp: unknown): Date => {
  if (timestamp && typeof timestamp === 'object' && timestamp !== null) {
    const ts = timestamp as { toDate?: () => Date; seconds?: number; nanoseconds?: number };
    if (typeof ts.toDate === 'function') {
      return ts.toDate();
    }
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date();
};

// Alle gekauften Verträge einer Company laden
export const getPurchasedContractsByCompany = async (
  companyId: string
): Promise<PurchasedContractClient[]> => {
  try {
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('companyId', '==', companyId),
      where('paymentStatus', '==', 'succeeded'),
      orderBy('purchasedAt', 'desc')
    );

    const querySnapshot = await getDocs(purchasesQuery);
    
    const purchases: PurchasedContractClient[] = querySnapshot.docs.map(doc => {
      const data = doc.data() as PurchasedContract;
      
      // Konvertiere contractData Timestamps falls vorhanden
      let contractData = data.contractData;
      if (contractData && typeof contractData === 'object') {
        const contractDataObj = contractData as Record<string, unknown>;
        contractData = {
          ...contractData,
          createdAt: convertTimestampToDate(contractDataObj.createdAt),
          updatedAt: convertTimestampToDate(contractDataObj.updatedAt)
        };
      }
      
      return {
        id: doc.id,
        contractId: data.contractId,
        companyId: data.companyId,
        companyName: data.companyName,
        contractTitle: data.contractTitle,
        contractType: data.contractType,
        contractZip: data.contractZip,
        amount: data.amount,
        currency: data.currency,
        stripePaymentIntentId: data.stripePaymentIntentId,
        stripeSessionId: data.stripeSessionId,
        paymentStatus: data.paymentStatus,
        purchasedAt: data.purchasedAt.toDate(),
        accessGrantedAt: data.accessGrantedAt?.toDate(),
        contractData: contractData,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    });

    return purchases;

  } catch (error) {
    console.error('Fehler beim Laden der gekauften Verträge:', error);
    return [];
  }
};
