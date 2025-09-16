import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { findContractById } from '@/actions/contractActions';
import { fetchCoordinates } from '@/actions/userActions';
import { getAllCompanies } from '@/actions/companyActions';
import { CompanyType } from '@/types/RegisterTypye';

type Coordinates = { latitude: number; longitude: number };

// Haversine-Formel (in Metern)
function haversineDistance(a: Coordinates, b: Coordinates): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371e3; // Erde in Metern
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δφ = toRad(b.latitude - a.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const s = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

// Robust center resolver: prefer stored coords, then Nominatim (postal only), then Open-Meteo, then legacy fetchCoordinates
async function resolveCenter(zip?: number, fallbackCity?: string): Promise<{ center: Coordinates | null; source: string }>{
  if (!zip) return { center: null, source: 'none' };

  // Try Nominatim by postal code + country (no city to avoid generic center)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(String(zip))}&country=DE&format=json&limit=1`;
    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'landschaftshelden.io/1.0 (support@landschaftshelden.io)'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        return {
          center: { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) },
          source: 'nominatim:postal'
        };
      }
    }
  } catch {
    // non-fatal
  }

  // Try Open-Meteo with just the postal code
  try {
    const meteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(zip))}&count=1&language=de&format=json`;
    const res = await fetch(meteoUrl);
    if (res.ok) {
      const data = await res.json();
      if (data?.results?.length) {
        const m = data.results[0];
        return {
          center: { latitude: m.latitude, longitude: m.longitude },
          source: 'open-meteo:postal'
        };
      }
    }
  } catch {
    // non-fatal
  }

  // Legacy fallback using our shared function (city + zip) if provided
  try {
    const coords = await fetchCoordinates(fallbackCity || 'Deutschland', String(zip));
    if (coords) return { center: coords as Coordinates, source: 'legacy:fetchCoordinates' };
  } catch {
    // non-fatal
  }

  return { center: null, source: 'failed' };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
  const contractId = searchParams.get('contractId');
  const radiusKm = Number(searchParams.get('radiusKm') || 50);
  const preferStoredParam = searchParams.get('preferStored');
  const preferStored = preferStoredParam === null ? true : !(preferStoredParam === '0' || preferStoredParam?.toLowerCase() === 'false');

    if (!contractId) {
      return NextResponse.json({ success: false, error: 'contractId ist erforderlich' }, { status: 400 });
    }

    const contract = await findContractById(contractId);
    console.log('Contract geladen:', contract ? `(${contract.latitude} ,${contract.longitude})` : 'nicht gefunden');
    if (!contract) {
      return NextResponse.json({ success: false, error: 'Contract nicht gefunden' }, { status: 404 });
    }

    // Koordinaten des Contracts bestimmen (bevorzugt gespeicherte Koordinaten)
    let center: Coordinates | null = null;
    let centerSource = 'stored';
    if (preferStored && contract.latitude && contract.longitude) {
      center = { latitude: contract.latitude, longitude: contract.longitude };
    } else {
      const resolved = await resolveCenter(contract.zip);
      center = resolved.center;
      centerSource = resolved.source;
    }

    if (!center) {
      return NextResponse.json({ success: false, error: 'Koordinaten des Contracts konnten nicht ermittelt werden' }, { status: 500 });
    }

    const allCompanies: CompanyType[] = await getAllCompanies(true);
    const within = (allCompanies || []).filter(c => c.latitude && c.longitude).map(c => {
      const distM = haversineDistance(
        { latitude: c.latitude!, longitude: c.longitude! },
        center as Coordinates
      );
      return {
        id: c.id || null,
        companyName: c.companyName || null,
        email: c.email || null,
        city: c.city || null,
        latitude: c.latitude!,
        longitude: c.longitude!,
        distanceKm: Math.round((distM / 1000) * 10) / 10,
      };
    }).filter(item => item.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      center,
      centerSource,
      contractId,
      preferStored,
      contractZip: contract.zip ?? null,
      contractStored: {
        latitude: contract.latitude ?? null,
        longitude: contract.longitude ?? null,
      },
      radiusKm,
      count: within.length,
      companies: within,
    });
  } catch (error) {
    console.error('Fehler in /api/companies-in-radius:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' }, { status: 500 });
  }
}
