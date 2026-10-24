export type FurnitureCatalogItem = {
  id: string;
  name: string;
  category: string;
  volumeM3: number;
};

export type EmployeeVolumeRule = {
  id: string;
  upToVolumeM3: number | null;
  employees: number;
};

export type PackingBoxRule = {
  id: string;
  upToAreaM2: number | null;
  boxes: number;
};

export type PackingEmployeeRule = {
  id: string;
  upToBoxes: number | null;
  employees: number;
};

export type FixedSurchargeRule = {
  id: string;
  upToValue: number | null;
  amount: number;
};

export type VehiclePricingItem = {
  id: string;
  name: string;
  capacityM3: number;
  dailyRate: number;
};

export type FurnitureAssemblyCatalogItem = {
  id: string;
  name: string;
  category: string;
  assemblyMinutes: number;
  dismantlingMinutes: number;
  materialCost: number;
};

export type FurnitureAssemblyCalculationSettings = {
  catalog: FurnitureAssemblyCatalogItem[];
  minimumLaborHours: number;
  minimumEmployees: number;
  twoPersonThresholdMinutes: number;
  easyComplexityFactor: number;
  standardComplexityFactor: number;
  difficultComplexityFactor: number;
};

export type ClearanceCalculationSettings = {
  employeeRules: EmployeeVolumeRule[];
  minimumLaborHours: number;
  laborHoursPerM3: number;
  hazardousLaborHoursPerM3: number;
  heavyItemLaborHours: number;
  broomCleanMinimumHours: number;
  broomCleanHoursPerM3: number;
  easyComplexityFactor: number;
  standardComplexityFactor: number;
  difficultComplexityFactor: number;
  floorFactorWithoutElevator: number;
  floorFactorWithElevator: number;
  carryDistanceFactorPer100M: number;
  maximumCarryDistanceFactor: number;
};

export type PackingCalculationSettings = {
  boxRules: PackingBoxRule[];
  employeeRules: PackingEmployeeRule[];
  boxesPerPerson: number;
  boxesPerRoom: number;
  boxesPerVolumeM3: number;
  packingMinutesPerBox: number;
  unpackingMinutesPerBox: number;
  fragileMinutesPerItem: number;
  minimumLaborHours: number;
};

export type OfferPricingSettings = {
  employeeRules: EmployeeVolumeRule[];
  floorSurchargeRules: FixedSurchargeRule[];
  carryDistanceSurchargeRules: FixedSurchargeRule[];
  waiveFloorSurchargeWithElevator: boolean;
  furnitureCatalog: FurnitureCatalogItem[];
  vehicleCatalog: VehiclePricingItem[];
  furnitureAssembly: FurnitureAssemblyCalculationSettings;
  clearance: ClearanceCalculationSettings;
  packing: PackingCalculationSettings;
};

const furniture = (
  id: string,
  name: string,
  category: string,
  volumeM3: number
): FurnitureCatalogItem => ({ id, name, category, volumeM3 });

export const defaultFurnitureCatalog: FurnitureCatalogItem[] = [
  furniture("sofa-2", "Sofa, 2-Sitzer", "Wohnzimmer", 1.4),
  furniture("sofa-3", "Sofa, 3-Sitzer", "Wohnzimmer", 1.8),
  furniture("ecksofa", "Ecksofa", "Wohnzimmer", 2.8),
  furniture("sessel", "Sessel", "Wohnzimmer", 0.8),
  furniture("couchtisch", "Couchtisch", "Wohnzimmer", 0.4),
  furniture("tv-board", "TV-Board", "Wohnzimmer", 0.7),
  furniture("wohnwand", "Wohnwand", "Wohnzimmer", 2.2),
  furniture("regal-klein", "Regal, klein", "Wohnzimmer", 0.5),
  furniture("regal-gross", "Regal, groß", "Wohnzimmer", 1.2),
  furniture("esstisch", "Esstisch", "Esszimmer", 1),
  furniture("stuhl", "Stuhl", "Esszimmer", 0.2),
  furniture("sideboard", "Sideboard", "Esszimmer", 0.9),
  furniture("vitrine", "Vitrine", "Esszimmer", 0.8),
  furniture("bett-einzel", "Einzelbett", "Schlafzimmer", 1),
  furniture("bett-doppel", "Doppelbett", "Schlafzimmer", 1.6),
  furniture("nachttisch", "Nachttisch", "Schlafzimmer", 0.2),
  furniture("kleiderschrank-2", "Kleiderschrank, 2-türig", "Schlafzimmer", 1.4),
  furniture("kleiderschrank-4", "Kleiderschrank, 4-türig", "Schlafzimmer", 2.4),
  furniture("kommode", "Kommode", "Schlafzimmer", 0.7),
  furniture("schreibtisch", "Schreibtisch", "Büro", 0.8),
  furniture("buerostuhl", "Bürostuhl", "Büro", 0.3),
  furniture("aktenschrank", "Aktenschrank", "Büro", 1),
  furniture("kuechenschrank", "Küchenschrank", "Küche", 0.6),
  furniture("kuehlschrank", "Kühlschrank", "Küche", 0.8),
  furniture("gefrierschrank", "Gefrierschrank", "Küche", 0.8),
  furniture("geschirrspueler", "Geschirrspüler", "Küche", 0.4),
  furniture("herd", "Herd / Backofen", "Küche", 0.4),
  furniture("waschmaschine", "Waschmaschine", "Haushalt", 0.4),
  furniture("trockner", "Wäschetrockner", "Haushalt", 0.4),
  furniture("werkbank", "Werkbank", "Keller / Garage", 1.3),
  furniture("fahrrad", "Fahrrad", "Keller / Garage", 0.5),
  furniture("kinderwagen", "Kinderwagen", "Sonstiges", 0.5),
  furniture("klavier", "Klavier", "Spezialgegenstände", 1.8),
  furniture("fluegel", "Flügel", "Spezialgegenstände", 3),
  furniture("safe", "Tresor", "Spezialgegenstände", 0.5),
  furniture("umzugskarton", "Umzugskarton", "Kartons", 0.08),
  furniture("kleiderbox", "Kleiderbox", "Kartons", 0.25),
  furniture("gartenstuhl", "Gartenstuhl", "Garten", 0.25),
  furniture("gartentisch", "Gartentisch", "Garten", 0.8),
  furniture("grill", "Grill", "Garten", 0.5),
];

export const defaultFurnitureAssemblyCatalog: FurnitureAssemblyCatalogItem[] = [
  { id: "assembly-bed-single", name: "Einzelbett", category: "Betten", assemblyMinutes: 45, dismantlingMinutes: 30, materialCost: 3 },
  { id: "assembly-bed-double", name: "Doppelbett", category: "Betten", assemblyMinutes: 60, dismantlingMinutes: 40, materialCost: 5 },
  { id: "assembly-wardrobe-2", name: "Kleiderschrank, 2-türig", category: "Schränke", assemblyMinutes: 75, dismantlingMinutes: 45, materialCost: 5 },
  { id: "assembly-wardrobe-4", name: "Kleiderschrank, 4-türig", category: "Schränke", assemblyMinutes: 150, dismantlingMinutes: 90, materialCost: 10 },
  { id: "assembly-pax-meter", name: "PAX-Schrank je Meter", category: "Schränke", assemblyMinutes: 75, dismantlingMinutes: 45, materialCost: 6 },
  { id: "assembly-shelf-small", name: "Regal, klein", category: "Regale", assemblyMinutes: 30, dismantlingMinutes: 20, materialCost: 3 },
  { id: "assembly-shelf-large", name: "Regal, groß", category: "Regale", assemblyMinutes: 60, dismantlingMinutes: 35, materialCost: 5 },
  { id: "assembly-table", name: "Tisch / Schreibtisch", category: "Tische", assemblyMinutes: 30, dismantlingMinutes: 20, materialCost: 3 },
  { id: "assembly-sideboard", name: "Kommode / Sideboard", category: "Schränke", assemblyMinutes: 50, dismantlingMinutes: 30, materialCost: 4 },
  { id: "assembly-kitchen-cabinet", name: "Küchenschrank", category: "Küche", assemblyMinutes: 60, dismantlingMinutes: 40, materialCost: 8 },
  { id: "assembly-wall-cabinet", name: "Hängeschrank inkl. Befestigung", category: "Wandmontage", assemblyMinutes: 60, dismantlingMinutes: 30, materialCost: 12 },
  { id: "assembly-curtain", name: "Gardinenstange / Schiene", category: "Wandmontage", assemblyMinutes: 45, dismantlingMinutes: 20, materialCost: 10 },
];

export const defaultOfferPricingSettings: OfferPricingSettings = {
  employeeRules: [
    { id: "employees-15", upToVolumeM3: 15, employees: 2 },
    { id: "employees-30", upToVolumeM3: 30, employees: 3 },
    { id: "employees-open", upToVolumeM3: null, employees: 4 },
  ],
  floorSurchargeRules: [
    { id: "floor-0", upToValue: 0, amount: 0 },
    { id: "floor-1", upToValue: 1, amount: 20 },
    { id: "floor-2", upToValue: 2, amount: 40 },
    { id: "floor-3", upToValue: 3, amount: 60 },
    { id: "floor-open", upToValue: null, amount: 90 },
  ],
  carryDistanceSurchargeRules: [
    { id: "carry-15", upToValue: 15, amount: 0 },
    { id: "carry-30", upToValue: 30, amount: 20 },
    { id: "carry-open", upToValue: null, amount: 50 },
  ],
  waiveFloorSurchargeWithElevator: true,
  furnitureCatalog: defaultFurnitureCatalog,
  vehicleCatalog: [
    { id: "transporter", name: "Sprinter", capacityM3: 12, dailyRate: 120 },
    { id: "truck-3-5t", name: "3,5-t Koffer", capacityM3: 20, dailyRate: 95 },
    { id: "truck-7-5t", name: "7,5-t LKW", capacityM3: 35, dailyRate: 165 },
    { id: "truck-12t", name: "12-t LKW", capacityM3: 50, dailyRate: 235 },
  ],
  furnitureAssembly: {
    catalog: defaultFurnitureAssemblyCatalog,
    minimumLaborHours: 2,
    minimumEmployees: 1,
    twoPersonThresholdMinutes: 180,
    easyComplexityFactor: 0.85,
    standardComplexityFactor: 1,
    difficultComplexityFactor: 1.35,
  },
  clearance: {
    employeeRules: [
      { id: "clearance-employees-20", upToVolumeM3: 20, employees: 2 },
      { id: "clearance-employees-open", upToVolumeM3: null, employees: 3 },
    ],
    minimumLaborHours: 3,
    laborHoursPerM3: 0.45,
    hazardousLaborHoursPerM3: 0.45,
    heavyItemLaborHours: 0.75,
    broomCleanMinimumHours: 1,
    broomCleanHoursPerM3: 0.06,
    easyComplexityFactor: 0.85,
    standardComplexityFactor: 1,
    difficultComplexityFactor: 1.25,
    floorFactorWithoutElevator: 0.08,
    floorFactorWithElevator: 0.025,
    carryDistanceFactorPer100M: 1,
    maximumCarryDistanceFactor: 0.5,
  },
  packing: {
    boxRules: [
      { id: "packing-area-30", upToAreaM2: 30, boxes: 20 },
      { id: "packing-area-50", upToAreaM2: 50, boxes: 30 },
      { id: "packing-area-70", upToAreaM2: 70, boxes: 40 },
      { id: "packing-area-90", upToAreaM2: 90, boxes: 50 },
      { id: "packing-area-120", upToAreaM2: 120, boxes: 65 },
      { id: "packing-area-open", upToAreaM2: null, boxes: 80 },
    ],
    employeeRules: [
      { id: "packing-employees-40", upToBoxes: 40, employees: 1 },
      { id: "packing-employees-80", upToBoxes: 80, employees: 2 },
      { id: "packing-employees-open", upToBoxes: null, employees: 3 },
    ],
    boxesPerPerson: 12,
    boxesPerRoom: 10,
    boxesPerVolumeM3: 10,
    packingMinutesPerBox: 5,
    unpackingMinutesPerBox: 3,
    fragileMinutesPerItem: 5,
    minimumLaborHours: 1,
  },
};

function normalizeThresholdRules<T extends { id: string }>(
  value: unknown,
  fallback: T[]
): T[] {
  if (!Array.isArray(value) || value.length === 0) return fallback.map((rule) => ({ ...rule }));
  const rules = value.filter(
    (rule): rule is T =>
      Boolean(rule) &&
      typeof rule === "object" &&
      typeof (rule as T).id === "string"
  );
  return rules.length ? rules : fallback.map((rule) => ({ ...rule }));
}

export function normalizeOfferPricingSettings(
  value: unknown
): OfferPricingSettings {
  const raw =
    value && typeof value === "object"
      ? (value as Partial<OfferPricingSettings>)
      : {};
  const furnitureCatalog = Array.isArray(raw.furnitureCatalog)
    ? raw.furnitureCatalog.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.category === "string" &&
          typeof item.volumeM3 === "number" &&
          item.volumeM3 > 0
      )
    : [];
  const vehicleCatalog = Array.isArray(raw.vehicleCatalog)
    ? raw.vehicleCatalog.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.capacityM3 === "number" &&
          item.capacityM3 > 0 &&
          typeof item.dailyRate === "number" &&
          item.dailyRate >= 0
      )
    : [];
  const rawClearance =
    raw.clearance && typeof raw.clearance === "object"
      ? raw.clearance
      : defaultOfferPricingSettings.clearance;
  const rawFurnitureAssembly =
    raw.furnitureAssembly && typeof raw.furnitureAssembly === "object"
      ? raw.furnitureAssembly
      : defaultOfferPricingSettings.furnitureAssembly;
  const rawPacking =
    raw.packing && typeof raw.packing === "object"
      ? raw.packing
      : defaultOfferPricingSettings.packing;
  const furnitureAssemblyCatalog = Array.isArray(rawFurnitureAssembly.catalog)
    ? rawFurnitureAssembly.catalog.filter(
        (item) =>
          item &&
          typeof item.id === "string" &&
          typeof item.name === "string" &&
          typeof item.category === "string" &&
          typeof item.assemblyMinutes === "number" &&
          item.assemblyMinutes >= 0 &&
          typeof item.dismantlingMinutes === "number" &&
          item.dismantlingMinutes >= 0 &&
          typeof item.materialCost === "number" &&
          item.materialCost >= 0
      )
    : [];
  const nonNegative = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : fallback;
  const clearanceDefaults = defaultOfferPricingSettings.clearance;
  const packingDefaults = defaultOfferPricingSettings.packing;

  return {
    employeeRules: normalizeThresholdRules(
      raw.employeeRules,
      defaultOfferPricingSettings.employeeRules
    ),
    floorSurchargeRules: normalizeThresholdRules(
      raw.floorSurchargeRules,
      defaultOfferPricingSettings.floorSurchargeRules
    ),
    carryDistanceSurchargeRules: normalizeThresholdRules(
      raw.carryDistanceSurchargeRules,
      defaultOfferPricingSettings.carryDistanceSurchargeRules
    ),
    waiveFloorSurchargeWithElevator:
      raw.waiveFloorSurchargeWithElevator ?? true,
    furnitureCatalog:
      furnitureCatalog.length > 0
        ? furnitureCatalog
        : defaultFurnitureCatalog.map((item) => ({ ...item })),
    vehicleCatalog:
      vehicleCatalog.length > 0
        ? vehicleCatalog
        : defaultOfferPricingSettings.vehicleCatalog.map((item) => ({ ...item })),
    furnitureAssembly: {
      catalog:
        furnitureAssemblyCatalog.length > 0
          ? furnitureAssemblyCatalog
          : defaultFurnitureAssemblyCatalog.map((item) => ({ ...item })),
      minimumLaborHours: nonNegative(
        rawFurnitureAssembly.minimumLaborHours,
        defaultOfferPricingSettings.furnitureAssembly.minimumLaborHours
      ),
      minimumEmployees: Math.max(
        1,
        Math.round(
          nonNegative(
            rawFurnitureAssembly.minimumEmployees,
            defaultOfferPricingSettings.furnitureAssembly.minimumEmployees
          )
        )
      ),
      twoPersonThresholdMinutes: nonNegative(
        rawFurnitureAssembly.twoPersonThresholdMinutes,
        defaultOfferPricingSettings.furnitureAssembly.twoPersonThresholdMinutes
      ),
      easyComplexityFactor: nonNegative(
        rawFurnitureAssembly.easyComplexityFactor,
        defaultOfferPricingSettings.furnitureAssembly.easyComplexityFactor
      ),
      standardComplexityFactor: nonNegative(
        rawFurnitureAssembly.standardComplexityFactor,
        defaultOfferPricingSettings.furnitureAssembly.standardComplexityFactor
      ),
      difficultComplexityFactor: nonNegative(
        rawFurnitureAssembly.difficultComplexityFactor,
        defaultOfferPricingSettings.furnitureAssembly.difficultComplexityFactor
      ),
    },
    clearance: {
      employeeRules: normalizeThresholdRules(
        rawClearance.employeeRules,
        clearanceDefaults.employeeRules
      ),
      minimumLaborHours: nonNegative(
        rawClearance.minimumLaborHours,
        clearanceDefaults.minimumLaborHours
      ),
      laborHoursPerM3: nonNegative(
        rawClearance.laborHoursPerM3,
        clearanceDefaults.laborHoursPerM3
      ),
      hazardousLaborHoursPerM3: nonNegative(
        rawClearance.hazardousLaborHoursPerM3,
        clearanceDefaults.hazardousLaborHoursPerM3
      ),
      heavyItemLaborHours: nonNegative(
        rawClearance.heavyItemLaborHours,
        clearanceDefaults.heavyItemLaborHours
      ),
      broomCleanMinimumHours: nonNegative(
        rawClearance.broomCleanMinimumHours,
        clearanceDefaults.broomCleanMinimumHours
      ),
      broomCleanHoursPerM3: nonNegative(
        rawClearance.broomCleanHoursPerM3,
        clearanceDefaults.broomCleanHoursPerM3
      ),
      easyComplexityFactor: nonNegative(
        rawClearance.easyComplexityFactor,
        clearanceDefaults.easyComplexityFactor
      ),
      standardComplexityFactor: nonNegative(
        rawClearance.standardComplexityFactor,
        clearanceDefaults.standardComplexityFactor
      ),
      difficultComplexityFactor: nonNegative(
        rawClearance.difficultComplexityFactor,
        clearanceDefaults.difficultComplexityFactor
      ),
      floorFactorWithoutElevator: nonNegative(
        rawClearance.floorFactorWithoutElevator,
        clearanceDefaults.floorFactorWithoutElevator
      ),
      floorFactorWithElevator: nonNegative(
        rawClearance.floorFactorWithElevator,
        clearanceDefaults.floorFactorWithElevator
      ),
      carryDistanceFactorPer100M: nonNegative(
        rawClearance.carryDistanceFactorPer100M,
        clearanceDefaults.carryDistanceFactorPer100M
      ),
      maximumCarryDistanceFactor: nonNegative(
        rawClearance.maximumCarryDistanceFactor,
        clearanceDefaults.maximumCarryDistanceFactor
      ),
    },
    packing: {
      boxRules: normalizeThresholdRules(
        rawPacking.boxRules,
        packingDefaults.boxRules
      ),
      employeeRules: normalizeThresholdRules(
        rawPacking.employeeRules,
        packingDefaults.employeeRules
      ),
      boxesPerPerson: nonNegative(
        rawPacking.boxesPerPerson,
        packingDefaults.boxesPerPerson
      ),
      boxesPerRoom: nonNegative(
        rawPacking.boxesPerRoom,
        packingDefaults.boxesPerRoom
      ),
      boxesPerVolumeM3: nonNegative(
        rawPacking.boxesPerVolumeM3,
        packingDefaults.boxesPerVolumeM3
      ),
      packingMinutesPerBox: nonNegative(
        rawPacking.packingMinutesPerBox,
        packingDefaults.packingMinutesPerBox
      ),
      unpackingMinutesPerBox: nonNegative(
        rawPacking.unpackingMinutesPerBox,
        packingDefaults.unpackingMinutesPerBox
      ),
      fragileMinutesPerItem: nonNegative(
        rawPacking.fragileMinutesPerItem,
        packingDefaults.fragileMinutesPerItem
      ),
      minimumLaborHours: nonNegative(
        rawPacking.minimumLaborHours,
        packingDefaults.minimumLaborHours
      ),
    },
  };
}

function matchingRule<T extends { upToValue: number | null }>(
  value: number,
  rules: T[]
): T | undefined {
  return [...rules]
    .sort((left, right) => (left.upToValue ?? Infinity) - (right.upToValue ?? Infinity))
    .find((rule) => rule.upToValue === null || value <= rule.upToValue);
}

export function getEmployeesForVolume(
  volumeM3: number,
  settings: OfferPricingSettings
) {
  const rules = settings.employeeRules
    .map((rule) => ({ ...rule, upToValue: rule.upToVolumeM3 }))
    .sort((left, right) => (left.upToValue ?? Infinity) - (right.upToValue ?? Infinity));
  return matchingRule(volumeM3, rules)?.employees ?? 1;
}

export function getClearanceEmployeesForVolume(
  volumeM3: number,
  settings: OfferPricingSettings
) {
  const rules = settings.clearance.employeeRules
    .map((rule) => ({ ...rule, upToValue: rule.upToVolumeM3 }))
    .sort((left, right) => (left.upToValue ?? Infinity) - (right.upToValue ?? Infinity));
  return matchingRule(volumeM3, rules)?.employees ?? 1;
}

export function getPackingBoxEstimate(
  livingAreaM2: number,
  householdSize: number,
  roomCount: number,
  inventoryVolumeM3: number,
  settings: OfferPricingSettings
) {
  const packing = settings.packing;
  const areaRule = [...packing.boxRules]
    .map((rule) => ({ ...rule, upToValue: rule.upToAreaM2 }))
    .sort((left, right) => (left.upToValue ?? Infinity) - (right.upToValue ?? Infinity))
    .find((rule) => rule.upToValue === null || livingAreaM2 <= rule.upToValue);

  return Math.ceil(
    Math.max(
      livingAreaM2 > 0 ? areaRule?.boxes ?? 0 : 0,
      householdSize * packing.boxesPerPerson,
      roomCount * packing.boxesPerRoom,
      inventoryVolumeM3 * packing.boxesPerVolumeM3
    )
  );
}

export function getPackingEmployeesForBoxes(
  boxCount: number,
  settings: OfferPricingSettings
) {
  const rule = [...settings.packing.employeeRules]
    .map((item) => ({ ...item, upToValue: item.upToBoxes }))
    .sort((left, right) => (left.upToValue ?? Infinity) - (right.upToValue ?? Infinity))
    .find((item) => item.upToValue === null || boxCount <= item.upToValue);
  return rule?.employees ?? 1;
}

export function getFixedSurcharge(
  value: number,
  rules: FixedSurchargeRule[]
) {
  return matchingRule(Math.max(0, value), rules)?.amount ?? 0;
}

export function calculateConfiguredSurcharges(
  planning: {
    oldFloorLevel: number;
    newFloorLevel: number;
    oldElevator: boolean;
    newElevator: boolean;
    oldCarryDistanceM: number;
    newCarryDistanceM: number;
    carryDistanceM: number;
  },
  settings: OfferPricingSettings
) {
  const oldFloor =
    settings.waiveFloorSurchargeWithElevator && planning.oldElevator
      ? 0
      : getFixedSurcharge(planning.oldFloorLevel, settings.floorSurchargeRules);
  const newFloor =
    settings.waiveFloorSurchargeWithElevator && planning.newElevator
      ? 0
      : getFixedSurcharge(planning.newFloorLevel, settings.floorSurchargeRules);
  const carryDistance =
    planning.oldCarryDistanceM + planning.newCarryDistanceM ||
    planning.carryDistanceM;
  const carryDistanceSurcharge = getFixedSurcharge(
    carryDistance,
    settings.carryDistanceSurchargeRules
  );
  return {
    floorSurcharge: oldFloor + newFloor,
    carryDistanceSurcharge,
    total: oldFloor + newFloor + carryDistanceSurcharge,
  };
}
