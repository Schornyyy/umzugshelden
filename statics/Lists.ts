
export function getServices(): string[] {
  return [
    "umzugsservice",
    "anstricharbeiten",
    "moebel-service",
    "senior-umzug",
    "entruempelung",
  ];
}

// Staedte im Kreis Olpe und ca. 25 km Umkreis
export const rawCities = [
  'Olpe', 'Attendorn', 'Lennestadt', 'Finnentrop', 'Kirchhundem', 'Drolshagen', 'Wenden',
  'Plettenberg', 'Neuenrade', 'Meinerzhagen', 'Balve',
  'Siegen', 'Kreuztal', 'Netphen', 'Hilchenbach', 'Freudenberg',
  'Schmallenberg', 'Sundern', 'Meschede',
];

export const cities: string[] = [...new Set(rawCities)].sort();

// Ungefaehre Koordinaten fuer die Umkreis-Sortierung
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Olpe: { lat: 51.0289, lng: 7.8515 },
  Attendorn: { lat: 51.1262, lng: 7.9022 },
  Lennestadt: { lat: 51.1173, lng: 8.0672 },
  Finnentrop: { lat: 51.169, lng: 7.973 },
  Kirchhundem: { lat: 51.0906, lng: 8.0908 },
  Drolshagen: { lat: 51.0244, lng: 7.771 },
  Wenden: { lat: 50.965, lng: 7.869 },
  Plettenberg: { lat: 51.2103, lng: 7.8722 },
  Neuenrade: { lat: 51.2839, lng: 7.78 },
  Meinerzhagen: { lat: 51.1079, lng: 7.6432 },
  Balve: { lat: 51.332, lng: 7.8641 },
  Siegen: { lat: 50.8748, lng: 8.0243 },
  Kreuztal: { lat: 50.967, lng: 7.988 },
  Netphen: { lat: 50.9145, lng: 8.1 },
  Hilchenbach: { lat: 50.9977, lng: 8.1104 },
  Freudenberg: { lat: 50.8983, lng: 7.8712 },
  Schmallenberg: { lat: 51.1547, lng: 8.2841 },
  Sundern: { lat: 51.328, lng: 8.0 },
  Meschede: { lat: 51.3502, lng: 8.2836 },
};

export type NearbyCity = { name: string; distanceKm: number };

export function getNearbyCities(cityName: string, limit?: number): NearbyCity[] {
  const canonical =
    cities.find((c) => c.toLowerCase() === cityName.toLowerCase()) ?? cityName;
  const origin = cityCoordinates[canonical];
  const others = cities.filter((c) => c !== canonical);
  if (!origin) {
    const fallback = others.map((name) => ({ name, distanceKm: 0 }));
    return limit ? fallback.slice(0, limit) : fallback;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const result = others
    .map((name) => {
      const coords = cityCoordinates[name];
      if (!coords) return { name, distanceKm: Number.MAX_SAFE_INTEGER };
      const dLat = toRad(coords.lat - origin.lat);
      const dLng = toRad(coords.lng - origin.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(origin.lat)) *
          Math.cos(toRad(coords.lat)) *
          Math.sin(dLng / 2) ** 2;
      const distanceKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return { name, distanceKm: Math.round(distanceKm) };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return limit ? result.slice(0, limit) : result;
}
