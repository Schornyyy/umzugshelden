
export function getServices(): string[] {
  return [
    "umzugsservice",
    "anstricharbeiten",
    "moebel-service"
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
