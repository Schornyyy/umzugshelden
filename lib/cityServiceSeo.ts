import type { NearbyCity } from "@/statics/Lists";

// Nur anheben, wenn sich veröffentlichte Stadt- oder Service-Inhalte ändern.
export const CITY_SERVICE_CONTENT_LAST_MODIFIED = "2026-09-30";

export type CityServiceKey =
  | "umzugsservice"
  | "anstricharbeiten"
  | "moebel-service"
  | "senior-umzug"
  | "entruempelung";

type RegionDefinition = {
  name: string;
  location: string;
  cities: readonly string[];
};

type ServiceLocalProfile = {
  planningDetails: string;
  regionalScope: string;
  metaPromise: string;
};

export type CityServiceSeoContent = {
  regionName: string;
  introHeading: string;
  introText: string;
  localHeading: string;
  localParagraphs: readonly [string, string];
  localFacts: readonly { label: string; value: string }[];
  localFaq: { question: string; answer: string };
  metaTitle: string;
  metaDescription: string;
  schemaDescription: string;
};

const regions: readonly RegionDefinition[] = [
  {
    name: "Kreis Olpe",
    location: "im Kreis Olpe in Nordrhein-Westfalen",
    cities: [
      "Olpe",
      "Attendorn",
      "Lennestadt",
      "Finnentrop",
      "Kirchhundem",
      "Drolshagen",
      "Wenden",
    ],
  },
  {
    name: "Märkischer Kreis",
    location: "im Märkischen Kreis in Nordrhein-Westfalen",
    cities: [
      "Plettenberg",
      "Neuenrade",
      "Meinerzhagen",
      "Balve",
      "Altena",
      "Halver",
      "Hemer",
      "Herscheid",
      "Iserlohn",
      "Kierspe",
      "Lüdenscheid",
      "Menden",
      "Nachrodt-Wiblingwerde",
      "Schalksmühle",
      "Werdohl",
    ],
  },
  {
    name: "Kreis Siegen-Wittgenstein",
    location: "im Kreis Siegen-Wittgenstein in Nordrhein-Westfalen",
    cities: [
      "Siegen",
      "Kreuztal",
      "Netphen",
      "Hilchenbach",
      "Freudenberg",
      "Bad Berleburg",
      "Bad Laasphe",
      "Burbach",
      "Erndtebrück",
      "Neunkirchen",
      "Wilnsdorf",
    ],
  },
  {
    name: "Hochsauerlandkreis",
    location: "im Hochsauerlandkreis in Nordrhein-Westfalen",
    cities: ["Schmallenberg", "Sundern", "Meschede", "Arnsberg", "Eslohe"],
  },
  {
    name: "Landkreis Altenkirchen",
    location: "im Landkreis Altenkirchen in Rheinland-Pfalz",
    cities: ["Altenkirchen", "Kirchen"],
  },
  {
    name: "Westerwaldkreis",
    location: "im Westerwaldkreis in Rheinland-Pfalz",
    cities: ["Bad Marienberg", "Hachenburg"],
  },
  {
    name: "Oberbergischer Kreis",
    location: "im Oberbergischen Kreis in Nordrhein-Westfalen",
    cities: [
      "Bergneustadt",
      "Engelskirchen",
      "Gummersbach",
      "Hückeswagen",
      "Lindlar",
      "Marienheide",
      "Morsbach",
      "Nümbrecht",
      "Radevormwald",
      "Reichshof",
      "Waldbröl",
      "Wiehl",
      "Wipperfürth",
    ],
  },
  {
    name: "Landkreis Marburg-Biedenkopf",
    location: "im Landkreis Marburg-Biedenkopf in Hessen",
    cities: ["Biedenkopf"],
  },
  {
    name: "Ennepe-Ruhr-Kreis",
    location: "im Ennepe-Ruhr-Kreis in Nordrhein-Westfalen",
    cities: ["Breckerfeld", "Ennepetal", "Gevelsberg", "Schwelm"],
  },
  {
    name: "Lahn-Dill-Kreis",
    location: "im Lahn-Dill-Kreis in Hessen",
    cities: ["Dillenburg", "Dietzhölztal", "Eschenburg", "Haiger"],
  },
  {
    name: "Rhein-Sieg-Kreis",
    location: "im Rhein-Sieg-Kreis in Nordrhein-Westfalen",
    cities: ["Eitorf", "Lohmar", "Much", "Ruppichteroth", "Windeck"],
  },
  {
    name: "Rheinisch-Bergischer Kreis",
    location: "im Rheinisch-Bergischen Kreis in Nordrhein-Westfalen",
    cities: ["Kürten", "Overath", "Rösrath"],
  },
  {
    name: "Hagen",
    location: "als kreisfreie Stadt in Nordrhein-Westfalen",
    cities: ["Hagen"],
  },
  {
    name: "Remscheid",
    location: "als kreisfreie Stadt in Nordrhein-Westfalen",
    cities: ["Remscheid"],
  },
];

const serviceProfiles: Record<CityServiceKey, ServiceLocalProfile> = {
  umzugsservice: {
    planningDetails:
      "Umzugsvolumen, Etagen, Aufzug, Tragewege, Haltemöglichkeiten und Zieladresse",
    regionalScope:
      "Beladung, Fahrt, Entladung und gewünschte Zusatzleistungen werden in einem festen Ablauf zusammengeführt",
    metaPromise:
      "Privat- und Firmenumzüge mit fester Planung und transparentem Angebot",
  },
  anstricharbeiten: {
    planningDetails:
      "Flächengröße, Untergrund, notwendige Vorarbeiten, Material und Fertigstellungstermin",
    regionalScope:
      "Anfahrt, Materialbedarf und Arbeitszeit werden passend zum Objekt und zum vereinbarten Abnahmetermin geplant",
    metaPromise:
      "Renovierung, Streichen und Schönheitsreparaturen zum klar vereinbarten Termin",
  },
  "moebel-service": {
    planningDetails:
      "Art und Anzahl der Möbel, Montageanleitungen, Zugangswege, Wandbefestigungen und Werkzeugbedarf",
    regionalScope:
      "Abbau, Transport und Wiederaufbau lassen sich als ein durchgängiger Auftrag koordinieren",
    metaPromise:
      "Möbelabbau und Möbelaufbau mit passendem Werkzeug und klarer Kalkulation",
  },
  "senior-umzug": {
    planningDetails:
      "Umfang des Hausrats, persönliche Unterstützung, Raumplanung, Einrichtungsvorgaben und Zeitfenster",
    regionalScope:
      "Angehörige und Einrichtungen können in die Abstimmung von Verpackung, Transport und Einrichtung einbezogen werden",
    metaPromise:
      "Persönlich begleitete Umzüge mit festen Ansprechpartnern und planbarem Ablauf",
  },
  entruempelung: {
    planningDetails:
      "Menge und Art des Hausrats, Etagen, Laufwege, Verwertung, Entsorgung und gewünschter Übergabezustand",
    regionalScope:
      "Räumung, Abtransport, Wertanrechnung und besenreine Übergabe werden vor Beginn eindeutig festgelegt",
    metaPromise:
      "Entrümpelung und Haushaltsauflösung mit Besichtigung und verbindlichem Angebot",
  },
};

const regionByCity = new Map<string, RegionDefinition>();

for (const region of regions) {
  for (const city of region.cities) {
    if (regionByCity.has(city)) {
      throw new Error(`Die Stadt ${city} ist mehreren SEO-Regionen zugeordnet.`);
    }
    regionByCity.set(city, region);
  }
}

function joinGerman(values: readonly string[]): string {
  if (values.length === 0) return "weitere Orte im Einsatzgebiet";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;
}

function getRegion(cityName: string): RegionDefinition {
  const region = regionByCity.get(cityName);
  if (!region) {
    throw new Error(
      `Für ${cityName} fehlt ein festes SEO-Standortprofil in lib/cityServiceSeo.ts.`,
    );
  }
  return region;
}

export function assertCitySeoCoverage(cityNames: readonly string[]) {
  const missing = cityNames.filter((city) => !regionByCity.has(city));
  const obsolete = [...regionByCity.keys()].filter(
    (city) => !cityNames.includes(city),
  );

  if (missing.length || obsolete.length) {
    throw new Error(
      `SEO-Standortprofile sind nicht synchron. Fehlend: ${missing.join(", ") || "keine"}. Nicht mehr verwendet: ${obsolete.join(", ") || "keine"}.`,
    );
  }
}

export function getCityServiceSeoContent({
  cityName,
  serviceKey,
  serviceName,
  primaryKeyword,
  nearbyCities,
  nearbyLimit = 3,
}: {
  cityName: string;
  serviceKey: CityServiceKey;
  serviceName: string;
  primaryKeyword: string;
  nearbyCities: readonly NearbyCity[];
  nearbyLimit?: number;
}): CityServiceSeoContent {
  const region = getRegion(cityName);
  const service = serviceProfiles[serviceKey];
  const closestCities = nearbyCities.slice(0, nearbyLimit);
  const closestCityNames = joinGerman(closestCities.map((city) => city.name));
  const closestCityDistances = joinGerman(
    closestCities.map((city) => `${city.name} (ca. ${city.distanceKm} km)`),
  );

  const introText = `Für ${serviceName} in ${cityName} klären wir ${service.planningDetails} vor dem Termin. So entsteht ein verbindlicher Leistungsumfang, der zur Adresse, zum Zeitplan und zum tatsächlichen Aufwand passt.`;
  const localParagraphs = [
    `${cityName} liegt ${region.location}. Zu den nächstgelegenen Orten in unserem Einsatzgebiet zählen ${closestCityDistances} Luftlinie. Diese Entfernungen helfen bei der ersten regionalen Einordnung; das konkrete Angebot basiert immer auf den tatsächlichen Adressen und Leistungen.`,
    `Für Aufträge in ${cityName} sowie in ${closestCityNames} gilt: ${service.regionalScope}. Sie erhalten dafür einen festen Ansprechpartner und ein nachvollziehbares Angebot.`,
  ] as const;
  const metaDescription = `${primaryKeyword} in ${cityName}, ${region.name}: ${service.metaPromise}. Kostenlos und unverbindlich anfragen.`;

  return {
    regionName: region.name,
    introHeading: `${primaryKeyword} in ${cityName}: regional und verbindlich geplant`,
    introText,
    localHeading: `${serviceName} in ${cityName} und der direkten Umgebung`,
    localParagraphs,
    localFacts: [
      { label: "Region", value: region.name },
      { label: "Nahe Einsatzorte", value: closestCityNames },
      { label: "Planungsbasis", value: service.planningDetails },
    ],
    localFaq: {
      question: `Ist ${serviceName} auch rund um ${cityName} möglich?`,
      answer: `Ja. Neben ${cityName} bedienen wir im regionalen Einsatzgebiet unter anderem ${closestCityNames}. Ob Ihr konkreter Auftrag möglich ist, prüfen wir anhand von Adresse, Termin und Leistungsumfang.`,
    },
    metaTitle: `${primaryKeyword} ${cityName} | Umzugshelden`,
    metaDescription,
    schemaDescription: `${primaryKeyword} in ${cityName}: ${service.metaPromise}. Einsatzgebiet ${region.name}.`,
  };
}