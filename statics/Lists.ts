
export function getServices(): string[] {
  return [
    "umzugsservice",
    "anstricharbeiten",
    "moebel-service",
    "senior-umzug",
    "entruempelung",
  ];
}

export const SERVICE_RADIUS_KM = 50;

// Staedte und Gemeinden bis 50 km Luftlinie um Olpe
export const rawCities = [
  "Olpe",
  "Attendorn",
  "Lennestadt",
  "Finnentrop",
  "Kirchhundem",
  "Drolshagen",
  "Wenden",
  "Plettenberg",
  "Neuenrade",
  "Meinerzhagen",
  "Balve",
  "Siegen",
  "Kreuztal",
  "Netphen",
  "Hilchenbach",
  "Freudenberg",
  "Schmallenberg",
  "Sundern",
  "Meschede",
  "Altena",
  "Altenkirchen",
  "Arnsberg",
  "Bad Berleburg",
  "Bad Laasphe",
  "Bad Marienberg",
  "Bergneustadt",
  "Biedenkopf",
  "Breckerfeld",
  "Burbach",
  "Dillenburg",
  "Dietzhölztal",
  "Eitorf",
  "Engelskirchen",
  "Ennepetal",
  "Erndtebrück",
  "Eschenburg",
  "Eslohe",
  "Gevelsberg",
  "Gummersbach",
  "Hachenburg",
  "Hagen",
  "Haiger",
  "Halver",
  "Hemer",
  "Herscheid",
  "Hückeswagen",
  "Iserlohn",
  "Kierspe",
  "Kirchen",
  "Kürten",
  "Lindlar",
  "Lohmar",
  "Lüdenscheid",
  "Marienheide",
  "Menden",
  "Morsbach",
  "Much",
  "Nachrodt-Wiblingwerde",
  "Neunkirchen",
  "Nümbrecht",
  "Overath",
  "Radevormwald",
  "Reichshof",
  "Remscheid",
  "Rösrath",
  "Ruppichteroth",
  "Schalksmühle",
  "Schwelm",
  "Waldbröl",
  "Werdohl",
  "Wiehl",
  "Wilnsdorf",
  "Windeck",
  "Wipperfürth",
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
  Altena: { lat: 51.299, lng: 7.669 },
  Altenkirchen: { lat: 50.6872, lng: 7.6456 },
  Arnsberg: { lat: 51.3964, lng: 8.0646 },
  "Bad Berleburg": { lat: 51.052, lng: 8.392 },
  "Bad Laasphe": { lat: 50.9314, lng: 8.4148 },
  "Bad Marienberg": { lat: 50.6495, lng: 7.9513 },
  Bergneustadt: { lat: 51.024, lng: 7.648 },
  Biedenkopf: { lat: 50.911, lng: 8.53 },
  Breckerfeld: { lat: 51.2607, lng: 7.4681 },
  Burbach: { lat: 50.7518, lng: 8.0794 },
  Dillenburg: { lat: 50.7415, lng: 8.286 },
  Dietzhölztal: { lat: 50.833, lng: 8.317 },
  Eitorf: { lat: 50.7667, lng: 7.45 },
  Engelskirchen: { lat: 50.988, lng: 7.413 },
  Ennepetal: { lat: 51.298, lng: 7.362 },
  Erndtebrück: { lat: 50.989, lng: 8.252 },
  Eschenburg: { lat: 50.814, lng: 8.359 },
  Eslohe: { lat: 51.257, lng: 8.169 },
  Gevelsberg: { lat: 51.319, lng: 7.339 },
  Gummersbach: { lat: 51.026, lng: 7.565 },
  Hachenburg: { lat: 50.66, lng: 7.82 },
  Hagen: { lat: 51.367, lng: 7.463 },
  Haiger: { lat: 50.741, lng: 8.207 },
  Halver: { lat: 51.187, lng: 7.499 },
  Hemer: { lat: 51.386, lng: 7.77 },
  Herscheid: { lat: 51.177, lng: 7.743 },
  Hückeswagen: { lat: 51.149, lng: 7.344 },
  Iserlohn: { lat: 51.375, lng: 7.702 },
  Kierspe: { lat: 51.135, lng: 7.59 },
  Kirchen: { lat: 50.809, lng: 7.88 },
  Kürten: { lat: 51.053, lng: 7.266 },
  Lindlar: { lat: 51.019, lng: 7.377 },
  Lohmar: { lat: 50.838, lng: 7.214 },
  Lüdenscheid: { lat: 51.219, lng: 7.628 },
  Marienheide: { lat: 51.083, lng: 7.531 },
  Menden: { lat: 51.439, lng: 7.795 },
  Morsbach: { lat: 50.866, lng: 7.727 },
  Much: { lat: 50.904, lng: 7.403 },
  "Nachrodt-Wiblingwerde": { lat: 51.316, lng: 7.617 },
  Neunkirchen: { lat: 50.787, lng: 8.005 },
  Nümbrecht: { lat: 50.904, lng: 7.54 },
  Overath: { lat: 50.932, lng: 7.284 },
  Radevormwald: { lat: 51.202, lng: 7.357 },
  Reichshof: { lat: 50.955, lng: 7.69 },
  Remscheid: { lat: 51.179, lng: 7.19 },
  Rösrath: { lat: 50.9, lng: 7.182 },
  Ruppichteroth: { lat: 50.844, lng: 7.485 },
  Schalksmühle: { lat: 51.242, lng: 7.527 },
  Schwelm: { lat: 51.286, lng: 7.294 },
  Waldbröl: { lat: 50.876, lng: 7.617 },
  Werdohl: { lat: 51.26, lng: 7.766 },
  Wiehl: { lat: 50.949, lng: 7.55 },
  Wilnsdorf: { lat: 50.817, lng: 8.102 },
  Windeck: { lat: 50.8, lng: 7.575 },
  Wipperfürth: { lat: 51.117, lng: 7.398 },
};

export type NearbyCity = { name: string; distanceKm: number };

export function getNearbyCities(
  cityName: string,
  limit?: number,
  radiusKm = SERVICE_RADIUS_KM,
): NearbyCity[] {
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
    .filter((city) => city.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return limit ? result.slice(0, limit) : result;
}
