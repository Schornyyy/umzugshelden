// API Route für automatische Unternehmen-Benachrichtigungen
// Sendet E-Mails an alle Unternehmen im 50km Umkreis eines neuen Auftrags

import { NextRequest, NextResponse } from 'next/server';
import { findContractById } from '@/actions/contractActions';
import { fetchCoordinates } from '@/actions/userActions';
import { sendCustomEmail } from '@/actions/emailActions';
import { collection, query, getDocs, limit, where, doc, updateDoc, increment, setDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { CompanyType } from '@/types/RegisterTypye';
import { Contract } from '@/types/Contract';
import { database } from "@/config/firebase";

type Coordinates = {
  latitude: number;
  longitude: number;
};

// Haversine-Formel für präzise Distanzberechnung (wie in CompanySearchPage)
const haversineDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  const toRadians = (deg: number): number => (deg * Math.PI) / 180;

  const R = 6371e3; // Radius der Erde in Metern
  const φ1 = toRadians(point1.latitude);
  const φ2 = toRadians(point2.latitude);
  const Δφ = toRadians(point2.latitude - point1.latitude);
  const Δλ = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distanz in Metern
};

// Prüft ob ein Punkt innerhalb des Radius liegt (wie in CompanySearchPage)
const isPointWithinRadius = (
  point: Coordinates,
  center: Coordinates,
  radius: number
): boolean => {
  const distance = haversineDistance(point, center);
  return distance <= radius;
};

// Lädt alle Unternehmen aus Firebase (wie in CompanySearchPage)
const fetchCompaniesFromFirestore = async (service?: string) => {
  const ref = collection(database, "users");
  let baseQuery = query(ref, limit(500));

  if (service) {
    baseQuery = query(
      baseQuery,
      where("services", "array-contains", service)
    );
  }

  const querySnapshot = await getDocs(baseQuery);
  return querySnapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as CompanyType[];
};

// Filtert Unternehmen im angegebenen Radius (wie in CompanySearchPage)
const filterCompaniesByRadius = (
  companies: CompanyType[],
  centerCoordinates: { latitude: number; longitude: number },
  radius: number
) => {
  return companies.filter((company) => {
    if (!company.latitude || !company.longitude) return false;
    return isPointWithinRadius(
      { latitude: company.latitude, longitude: company.longitude },
      centerCoordinates,
      radius * 1000 // Radius in Metern
    );
  });
};

// Funktion zum Senden der E-Mail-Benachrichtigung (mit emailActions Template-System)
async function sendEmailNotification(company: CompanyType, contract: Contract) {
  try {
    // Prüfe ob Unternehmen eine E-Mail-Adresse hat
    if (!company.email) {
      throw new Error('Keine E-Mail-Adresse vorhanden');
    }

    // Erstelle Replacements für das Template
    const replacements = {
      // Link in die App (kann später auf eine spezifische Contract-Detailseite geändert werden)
      contractLink: `${process.env.NEXT_PUBLIC_BASE_URL}/login`,
    } as Record<string, string>;

    // Verwende das Template-System aus emailActions
    const result = await sendCustomEmail({
      to: company.email,
  subject: `🎯 Neuer ${contract.type}-Auftrag${contract.zip ? ' (' + contract.zip + ')' : ''} in Ihrer Nähe verfügbar!`,
  replacements: replacements,
  templatePath: 'CompanyContractEmail.html'
    });

    if (!result.success) {
      throw new Error('E-Mail-Versand fehlgeschlagen');
    }

  return { success: true, company: company.companyName || 'Unbekannt', email: company.email };
  } catch (error) {
    console.error(`Fehler beim Senden der E-Mail an ${company.companyName}:`, error);
  return { success: false, company: company.companyName || 'Unbekannt', error: error instanceof Error ? error.message : 'Unbekannter Fehler' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json({
        success: false,
        error: 'Contract ID ist erforderlich'
      }, { status: 400 });
    }

    console.log(`Starte E-Mail-Benachrichtigungen für Contract ${contractId}`);

    // Lade Contract-Details
    const contract = await findContractById(contractId);
    if (!contract) {
      return NextResponse.json({
        success: false,
        error: 'Contract nicht gefunden'
      }, { status: 404 });
    }

    // Hole die Koordinaten für die Contract-PLZ (wie in CompanySearchPage)
    const contractZip = contract.zip?.toString() || '';
    
    if (!contractZip) {
      return NextResponse.json({
        success: false,
        error: 'PLZ des Contracts nicht verfügbar'
      }, { status: 400 });
    }

    // Verwende eine Standard-Stadt für die PLZ-Koordinaten-Ermittlung
    const contractCoords = await fetchCoordinates('Deutschland', contractZip);
    if (!contractCoords) {
      console.error('Koordinaten für Contract PLZ konnten nicht ermittelt werden');
      return NextResponse.json({
        success: false,
        error: 'Koordinaten konnten nicht ermittelt werden'  
      }, { status: 500 });
    }

    // Lade alle Unternehmen aus Firebase (wie in CompanySearchPage)
    const allCompanies = await fetchCompaniesFromFirestore(contract.type);
    
    if (!allCompanies || allCompanies.length === 0) {
      console.log('Keine Unternehmen gefunden');
      return NextResponse.json({
        success: true,
        message: 'Keine Unternehmen für Benachrichtigung vorhanden',
        stats: { total: 0, notified: 0, errors: 0 }
      });
    }

    // Filtere Unternehmen im 50km Umkreis (wie in CompanySearchPage)
    const companiesInRange = filterCompaniesByRadius(
      allCompanies,
      contractCoords,
      50 // 50km Radius
    );

    console.log(`${companiesInRange.length} Unternehmen im 50km Umkreis gefunden`);

    if (companiesInRange.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine Unternehmen im 50km Umkreis für diesen Service gefunden',
        stats: { total: 0, notified: 0, errors: 0 }
      });
    }

    // Sende E-Mails parallel (aber mit Limit um Server nicht zu überlasten)
    const BATCH_SIZE = 5; // Maximal 5 E-Mails parallel
  const results: Array<{ success: boolean, company: string, email?: string, error?: string }> = [];

    for (let i = 0; i < companiesInRange.length; i += BATCH_SIZE) {
      const batch = companiesInRange.slice(i, i + BATCH_SIZE);
  const batchPromises = batch.map(company => sendEmailNotification(company, contract));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Kurze Pause zwischen Batches
      if (i + BATCH_SIZE < companiesInRange.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successfulResults = results.filter(r => r.success);
    const successful = successfulResults.length;
    const failed = results.filter(r => !r.success);

    // Log notify_sent events and increment notifiedCount
    if (successful > 0) {
      const statsRef = doc(database, 'contracts', contractId, 'metrics', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, { views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 }, { merge: true });
      }
      await updateDoc(statsRef, { notifiedCount: increment(successful) });

      const eventsCol = collection(database, 'contracts', contractId, 'events');
      await Promise.all(successfulResults.map((r) => addDoc(eventsCol, {
        type: 'notify_sent',
        companyEmail: r.email || null,
        companyId: null,
        meta: { company: r.company },
        createdAt: serverTimestamp(),
      })));
    }

    console.log(`E-Mail-Benachrichtigungen abgeschlossen: ${successful}/${companiesInRange.length} erfolgreich`);

    if (failed.length > 0) {
      console.error('Fehlgeschlagene E-Mails:', failed);
    }

    return NextResponse.json({
      success: true,
      message: `E-Mail-Benachrichtigungen versendet`,
      stats: {
        total: companiesInRange.length,
        notified: successful,
        errors: failed.length
      },
      errors: failed.map(f => ({ company: f.company, error: f.error }))
    });

  } catch (error) {
    console.error('Fehler bei E-Mail-Benachrichtigungen:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 });
  }
}
