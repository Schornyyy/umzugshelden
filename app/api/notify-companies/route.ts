// API Route für automatische Unternehmen-Benachrichtigungen
// Sendet E-Mails an alle Unternehmen im 50km Umkreis eines neuen Auftrags

import { NextRequest, NextResponse } from 'next/server';
import { findContractById } from '@/actions/contractActions';
import { fetchCoordinates } from '@/actions/userActions';
import { sendCustomEmail } from '@/actions/emailActions';
import { collection, query, getDocs, limit, where, doc, updateDoc, increment, setDoc, getDoc, addDoc, serverTimestamp, orderBy, startAfter, QueryDocumentSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore';
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

// Lädt bis zu 5.000 Unternehmen in Batches (erst Cache, dann Firestore)
const MAX_COMPANIES = 5000;
const FETCH_BATCH_SIZE = 500; // pro Firestore-Abfrage (Kosten & Limits beachten)
// Einfache In-Memory Cache Nutzung (globale CacheManager könnte integriert werden)
// Für Service-Filter separater Key
import { cacheManager, CACHE_KEYS } from '@/lib/cache';

const getCompaniesBatched = async (service?: string): Promise<CompanyType[]> => {
  const cacheKey = service ? `all-companies:service:${service}` : CACHE_KEYS.ALL_COMPANIES;
  const cached = cacheManager.get<CompanyType[]>(cacheKey) || [];
  if (cached.length >= MAX_COMPANIES) {
    return cached.slice(0, MAX_COMPANIES);
  }

  const companies: CompanyType[] = [...cached];
  const seen = new Set(companies.map(c => c.id));

  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
  let fetchedAny = true;

  while (companies.length < MAX_COMPANIES && fetchedAny) {
    const baseConstraints: QueryConstraint[] = [orderBy('__name__'), limit(FETCH_BATCH_SIZE)];
    if (service) baseConstraints.push(where('services', 'array-contains', service));
    if (lastDoc) baseConstraints.push(startAfter(lastDoc));
    const q = query(collection(database, 'users'), ...baseConstraints);
    const snap = await getDocs(q);
    if (snap.empty) {
      fetchedAny = false;
      break;
    }
    let added = 0;
    snap.docs.forEach(d => {
      if (!seen.has(d.id)) {
        const data = d.data() as CompanyType;
        companies.push({ ...data, id: d.id });
        seen.add(d.id);
        added++;
      }
    });
    lastDoc = snap.docs[snap.docs.length - 1];
    if (added === 0) {
      // Keine neuen Datensätze -> Abbruch um Endlosschleifen zu vermeiden
      break;
    }
  }

  // In Cache schreiben (einfach, ohne TTL-Anpassung hier)
  cacheManager.set(cacheKey, companies);

  return companies.slice(0, MAX_COMPANIES);
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

// Hilfsfunktionen für Labels
function mapContractSize(size: Contract['contractSize']): string {
  switch (size) {
    case 'new':
      return 'Neuanlage';
    case 'small changes':
      return 'Kleine Änderungen';
    case 'request':
      return 'Beratung/Anfrage';
    default:
      return String(size);
  }
}

function mapProjectBegin(p: Contract['projektBeginn']): string {
  switch (p) {
    case 'fast':
      return 'Schnellstmöglich';
    case '2weeks':
      return 'In ca. 2 Wochen';
    case '1month':
      return 'In ca. 1 Monat';
    case 'fewmonths':
      return 'In den nächsten Monaten';
    case 'request':
      return 'Nach Absprache';
    default:
      return String(p);
  }
}

function yesNo(v: boolean | undefined): string { return v ? 'Ja' : 'Nein'; }
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Funktion zum Senden der E-Mail-Benachrichtigung (mit emailActions Template-System)
async function sendEmailNotification(company: CompanyType, contract: Contract, contractId: string) {
  try {
    // Prüfe ob Unternehmen eine E-Mail-Adresse hat
    if (!company.email) {
      throw new Error('Keine E-Mail-Adresse vorhanden');
    }


    // Erstelle Replacements für das Template
  const trackingBase = process.env.NEXT_PUBLIC_URL || '';
  const trackedLink = `${trackingBase}/api/email/track/click?contractId=${encodeURIComponent(String(contractId))}&target=${encodeURIComponent(`${trackingBase}/login`)}${company.email ? `&companyEmail=${encodeURIComponent(company.email)}` : ''}`;

    const replacements = {
      // Link in die App (kann später auf eine spezifische Contract-Detailseite geändert werden)
      contractLink: `${process.env.NEXT_PUBLIC_URL}/login`,
      trackedContractLink: trackedLink,
      contractTypeLabel: String(contract.type),
      zip: String(contract.zip ?? ''),
      gardenSize: String(contract.gardenSize ?? ''),
      contractSizeLabel: mapContractSize(contract.contractSize),
      planningLabel: yesNo(contract.planningAvaillable),
      repeatLabel: yesNo(contract.repeatService),
      projectBeginLabel: mapProjectBegin(contract.projektBeginn),
      description: escapeHtml((contract.description || '').slice(0, 600)),
    } as Record<string, string>;

    // Verwende das Template-System aus emailActions
    const result = await sendCustomEmail({
      to: company.email,
      subject: `🎯 Neuer ${contract.type}-Auftrag${contract.zip ? ' (' + contract.zip + ')' : ''} in Ihrer Nähe verfügbar!`,
      replacements: replacements,
      templatePath: 'CompanyContractEmail.html',
      tracking: { contractId, companyEmail: company.email }
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
  const { contractId, cursor = 0, limit = 40 } = await request.json();

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

    // Bestimme Koordinaten des Contracts (wie in CompanySearchPage -> vorhandene Lat/Lng bevorzugen)
    const contractZip = contract.zip?.toString() || '';

    if (!contractZip) {
      return NextResponse.json({ success: false, error: 'PLZ des Contracts nicht verfügbar' }, { status: 400 });
    }

    // Falls der Contract bereits Koordinaten besitzt, nutze diese; sonst per ZIP (und optional Stadt) holen
    // CompanySearchPage ruft fetchCoordinates(city, zip) auf. Ein Contract speichert aktuell keine Stadt,
    // daher fallback auf 'Deutschland' wie bestehender Code – kann später erweitert werden, wenn city verfügbar ist.
    const contractCoords = (contract.latitude && contract.longitude)
      ? { latitude: contract.latitude, longitude: contract.longitude }
      : await fetchCoordinates('Deutschland', contractZip); // TODO: city hinzufügen sobald im Contract vorhanden

    if (!contractCoords) {
      console.error('Koordinaten für Contract konnten nicht ermittelt werden');
      return NextResponse.json({ success: false, error: 'Koordinaten konnten nicht ermittelt werden' }, { status: 500 });
    }

  // Lade bis zu 5.000 Unternehmen (Batch + Cache)
  const allCompanies = await getCompaniesBatched(contract.type);
    
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

    // Sortiere nach Distanz (wie in CompanySearchPage) für deterministische Reihenfolge
    const companiesSorted = companiesInRange
      .map(c => ({
        company: c,
        distance: haversineDistance(
          { latitude: c.latitude!, longitude: c.longitude! },
          contractCoords
        )
      }))
      .sort((a, b) => a.distance - b.distance)
      .map(c => c.company);

    console.log(`${companiesSorted.length} Unternehmen im 50km Umkreis gefunden (sortiert nach Distanz)`);

    if (companiesInRange.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine Unternehmen im 50km Umkreis für diesen Service gefunden',
        stats: { total: 0, notified: 0, errors: 0 }
      });
    }

    // Unternehmen ohne gültige E-Mail überspringen (nicht als Fehler zählen)
  const companiesToNotify = companiesSorted.filter(c => c.email && c.email.trim() !== '');
  const skipped = companiesSorted.length - companiesToNotify.length;

    if (companiesToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Keine Unternehmen mit gültiger E-Mail-Adresse im Radius',
        stats: { total: 0, notified: 0, errors: 0, skipped }
      });
    }

    // Cursor / limit gesteuerte Verarbeitung zur Vermeidung von Timeouts
    const startIndex = Math.max(0, Number(cursor) || 0);
    const slice = companiesToNotify.slice(startIndex, startIndex + Math.min(Number(limit) || 40, 250));

    // Innerhalb des Slices mit begrenzter Parallelität senden
    const CONCURRENCY = 6;
    const results: Array<{ success: boolean, company: string, email?: string, error?: string }> = [];
    let pointer = 0;
    async function runNext(): Promise<void> {
      if (pointer >= slice.length) return;
      const current = slice[pointer++];
      // contract ist hier garantiert vorhanden (vorher geprüft)
      const r = await sendEmailNotification(current, contract as Contract, contractId);
      results.push(r);
      return runNext();
    }
    // Starte Worker
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, slice.length) }, () => runNext()));

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

  console.log(`E-Mail-Benachrichtigungen abgeschlossen: ${successful}/${companiesToNotify.length} erfolgreich (übersprungen ohne E-Mail: ${skipped})`);

    if (failed.length > 0) {
      console.error('Fehlgeschlagene E-Mails:', failed);
    }

    const nextCursor = startIndex + slice.length < companiesToNotify.length ? startIndex + slice.length : null;

    return NextResponse.json({
      success: true,
      message: `Batch verarbeitet (${slice.length} Einträge)` ,
      partial: nextCursor !== null,
      nextCursor,
      total: companiesToNotify.length,
      processed: startIndex + slice.length,
      batchSize: slice.length,
      stats: {
        total: companiesToNotify.length,
        notified: successful,
        errors: failed.length,
        skipped,
        startIndex,
        endIndex: startIndex + slice.length - 1
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
