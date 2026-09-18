export type MaterialCalculationBasis =
  | "coatedAreaM2"
  | "surfaceAreaM2"
  | "protectionAreaM2"
  | "repairAreaM2"
  | "wallpaperAreaM2"
  | "packingBoxCount"
  | "fixed";

export type MaterialService = "painting" | "packing";

export type MaterialUnit = "l" | "kg" | "m" | "m²" | "Stk." | "Set";

export type MaterialType =
  | "wallPaint"
  | "primer"
  | "protectionFleece"
  | "maskingTape"
  | "coveringFilm"
  | "paintingTools"
  | "filler"
  | "wallpaper"
  | "packingBox"
  | "packingMaterial"
  | "other";

export type MaterialCatalogItem = {
  id: string;
  name: string;
  service: MaterialService;
  materialType: MaterialType;
  calculationBasis: MaterialCalculationBasis;
  unit: MaterialUnit;
  packageSize: number;
  widthM?: number;
  packageLabel: string;
  netPrice: number;
  enabled: boolean;
};

export type MaterialCalculationContext = Record<
  MaterialCalculationBasis,
  number
>;

export type CalculatedMaterial = MaterialCatalogItem & {
  basisAmount: number;
  requiredAmount: number;
  packageQuantity: number;
  netTotal: number;
};

export const materialBasisOptions: Array<{
  value: MaterialCalculationBasis;
  label: string;
}> = [
  { value: "coatedAreaM2", label: "Anstrichfläche inkl. Anstriche" },
  { value: "surfaceAreaM2", label: "Wand- und Deckenfläche" },
  { value: "protectionAreaM2", label: "Abzudeckende Bodenfläche" },
  { value: "repairAreaM2", label: "Spachtel-/Reparaturfläche" },
  { value: "wallpaperAreaM2", label: "Tapetenfläche" },
  { value: "packingBoxCount", label: "Anzahl Umzugskartons" },
  { value: "fixed", label: "Einmal je Auftrag" },
];

export const materialServiceOptions: Array<{
  value: MaterialService;
  label: string;
}> = [
  { value: "painting", label: "Malerarbeiten" },
  { value: "packing", label: "Packservice" },
];

export const materialTypeOptions: Array<{
  value: MaterialType;
  label: string;
}> = [
  { value: "wallPaint", label: "Wand- und Deckenfarbe" },
  { value: "primer", label: "Grundierung" },
  { value: "protectionFleece", label: "Abdeckvlies" },
  { value: "maskingTape", label: "Abklebeband" },
  { value: "coveringFilm", label: "Abdeckfolie" },
  { value: "paintingTools", label: "Rollen und Werkzeug" },
  { value: "filler", label: "Spachtelmasse" },
  { value: "wallpaper", label: "Tapete" },
  { value: "packingBox", label: "Umzugskarton" },
  { value: "packingMaterial", label: "Verpackungsmaterial" },
  { value: "other", label: "Sonstiges Material" },
];

export const materialUnitOptions: Array<{
  value: MaterialUnit;
  label: string;
}> = [
  { value: "l", label: "Liter (l)" },
  { value: "kg", label: "Kilogramm (kg)" },
  { value: "m", label: "Meter (m)" },
  { value: "m²", label: "Quadratmeter (m²)" },
  { value: "Stk.", label: "Stück (Stk.)" },
  { value: "Set", label: "Set" },
];

const materialUnitsByType: Record<MaterialType, MaterialUnit[]> = {
  wallPaint: ["l"],
  primer: ["l"],
  protectionFleece: ["m²", "m"],
  maskingTape: ["m"],
  coveringFilm: ["m²", "m"],
  paintingTools: ["Set", "Stk."],
  filler: ["kg"],
  wallpaper: ["m²", "m"],
  packingBox: ["Stk."],
  packingMaterial: ["Stk.", "m", "m²", "kg", "l"],
  other: ["Stk.", "Set", "m", "m²", "kg", "l"],
};

const defaultUnitByType: Record<MaterialType, MaterialUnit> = {
  wallPaint: "l",
  primer: "l",
  protectionFleece: "m²",
  maskingTape: "m",
  coveringFilm: "m²",
  paintingTools: "Set",
  filler: "kg",
  wallpaper: "m²",
  packingBox: "Stk.",
  packingMaterial: "Stk.",
  other: "Stk.",
};

const areaRollMaterialTypes = new Set<MaterialType>([
  "protectionFleece",
  "coveringFilm",
  "wallpaper",
]);

export function getMaterialUnitOptions(materialType: MaterialType) {
  const allowedUnits = materialUnitsByType[materialType];
  return materialUnitOptions.filter((option) =>
    allowedUnits.includes(option.value)
  );
}

export function materialTypeUsesAreaWidth(materialType: MaterialType) {
  return areaRollMaterialTypes.has(materialType);
}

export function getDefaultMaterialWidthM(materialType: MaterialType) {
  if (materialType === "coveringFilm") return 2;
  if (materialType === "wallpaper") return 0.53;
  return 1;
}

function normalizeMaterialUnit(unit: string | undefined) {
  const normalized = unit?.toLowerCase().replaceAll(".", "").trim();
  if (normalized === "l" || normalized === "liter" || normalized === "ltr") return "l";
  if (normalized === "kg" || normalized === "kilogramm") return "kg";
  if (normalized === "m" || normalized === "meter" || normalized === "lfm") return "m";
  if (normalized === "m²" || normalized === "m2" || normalized === "qm" || normalized === "quadratmeter") return "m²";
  if (normalized === "stk" || normalized === "stück" || normalized === "stueck") return "Stk.";
  if (normalized === "set") return "Set";
  return undefined;
}

export const defaultMaterialCatalog: MaterialCatalogItem[] = [
  {
    id: "paint",
    name: "Wand- und Deckenfarbe",
    service: "painting",
    materialType: "wallPaint",
    calculationBasis: "coatedAreaM2",
    unit: "l",
    packageSize: 12.5,
    widthM: 1,
    packageLabel: "Eimer",
    netPrice: 45,
    enabled: true,
  },
  {
    id: "primer",
    name: "Grundierung / Tiefengrund",
    service: "painting",
    materialType: "primer",
    calculationBasis: "surfaceAreaM2",
    unit: "l",
    packageSize: 10,
    widthM: 1,
    packageLabel: "Kanister",
    netPrice: 25,
    enabled: true,
  },
  {
    id: "fleece",
    name: "Abdeckvlies",
    service: "painting",
    materialType: "protectionFleece",
    calculationBasis: "protectionAreaM2",
    unit: "m²",
    packageSize: 50,
    widthM: 1,
    packageLabel: "Rolle",
    netPrice: 22,
    enabled: true,
  },
  {
    id: "masking-tape",
    name: "Malerkrepp",
    service: "painting",
    materialType: "maskingTape",
    calculationBasis: "surfaceAreaM2",
    unit: "m",
    packageSize: 50,
    widthM: 1,
    packageLabel: "Rolle",
    netPrice: 6,
    enabled: true,
  },
  {
    id: "covering-film",
    name: "Abdeckfolie",
    service: "painting",
    materialType: "coveringFilm",
    calculationBasis: "protectionAreaM2",
    unit: "m²",
    packageSize: 100,
    widthM: 2,
    packageLabel: "Rolle",
    netPrice: 15,
    enabled: true,
  },
  {
    id: "tools",
    name: "Farbrollen- und Pinselset",
    service: "painting",
    materialType: "paintingTools",
    calculationBasis: "surfaceAreaM2",
    unit: "Set",
    packageSize: 1,
    widthM: 1,
    packageLabel: "Set",
    netPrice: 15,
    enabled: true,
  },
  {
    id: "filler",
    name: "Spachtelmasse",
    service: "painting",
    materialType: "filler",
    calculationBasis: "repairAreaM2",
    unit: "kg",
    packageSize: 25,
    widthM: 1,
    packageLabel: "Sack",
    netPrice: 18,
    enabled: true,
  },
  {
    id: "wallpaper",
    name: "Tapete",
    service: "painting",
    materialType: "wallpaper",
    calculationBasis: "wallpaperAreaM2",
    unit: "m²",
    packageSize: 5.33,
    widthM: 0.53,
    packageLabel: "Rolle",
    netPrice: 25,
    enabled: true,
  },
  {
    id: "packing-box",
    name: "Umzugskarton",
    service: "packing",
    materialType: "packingBox",
    calculationBasis: "packingBoxCount",
    unit: "Stk.",
    packageSize: 1,
    widthM: 1,
    packageLabel: "Karton",
    netPrice: 2.5,
    enabled: true,
  },
];

export function normalizeMaterialCatalog(
  catalog: MaterialCatalogItem[] | undefined
): MaterialCatalogItem[] {
  if (!Array.isArray(catalog) || catalog.length === 0) {
    return defaultMaterialCatalog.map((item) => ({ ...item }));
  }

  const validBases = new Set(materialBasisOptions.map((option) => option.value));
  const validTypes = new Set(materialTypeOptions.map((option) => option.value));
  return catalog.map((item) => {
    const materialType = validTypes.has(item.materialType)
      ? item.materialType
      : item.id === "paint" || item.calculationBasis === "coatedAreaM2"
        ? "wallPaint"
        : item.id === "primer"
          ? "primer"
          : item.id === "fleece"
            ? "protectionFleece"
            : item.id === "masking-tape"
              ? "maskingTape"
              : item.id === "covering-film"
                ? "coveringFilm"
                : item.id === "tools"
                  ? "paintingTools"
                  : item.id === "filler"
                    ? "filler"
                    : item.id === "wallpaper" || item.calculationBasis === "wallpaperAreaM2"
                      ? "wallpaper"
                      : item.id === "packing-box" || item.calculationBasis === "packingBoxCount"
                        ? "packingBox"
                          : "other";
      const normalizedUnit = normalizeMaterialUnit(item.unit);
      const allowedUnits = materialUnitsByType[materialType];
      const unit = normalizedUnit && allowedUnits.includes(normalizedUnit)
        ? normalizedUnit
        : defaultUnitByType[materialType];
      const widthM = Number(item.widthM);

      return {
        id: item.id || crypto.randomUUID(),
        name: item.name || "Material",
        service: item.service === "packing" ? "packing" : "painting",
        materialType,
        calculationBasis: validBases.has(item.calculationBasis)
          ? item.calculationBasis
          : "fixed",
        unit,
        packageSize: Math.max(0, item.packageSize ?? 0),
        widthM:
          Number.isFinite(widthM) && widthM > 0
            ? widthM
            : getDefaultMaterialWidthM(materialType),
        packageLabel: item.packageLabel || "Gebinde",
        netPrice: Math.max(0, item.netPrice ?? 0),
        enabled: item.enabled !== false,
      };
    });
}

function automaticRequirementFactor(item: MaterialCatalogItem) {
  if (item.materialType === "wallPaint") return 1.1 / 7;
  if (item.materialType === "primer") return 1.1 / 10;
  if (item.materialType === "protectionFleece") return 1.1;
  if (item.materialType === "maskingTape") return 0.55;
  if (item.materialType === "coveringFilm") return 2.2;
  if (item.materialType === "paintingTools") return 0.01;
  if (item.materialType === "filler") return 1.1;
  if (item.materialType === "wallpaper") return 1;
  if (item.materialType === "packingBox") return 1;
  if (item.materialType === "packingMaterial") return 1;

  if (item.calculationBasis === "packingBoxCount" || item.calculationBasis === "fixed") return 1;
  if (item.calculationBasis === "wallpaperAreaM2") return 1;
  if (item.calculationBasis === "repairAreaM2") return item.unit.toLowerCase() === "kg" ? 1.1 : 1;

  const unit = item.unit.toLowerCase().replaceAll(".", "").trim();
  if (unit === "l" || unit === "liter") {
    return item.calculationBasis === "coatedAreaM2" ? 1.1 / 7 : 1.1 / 10;
  }
  if (unit === "m") return 0.55;
  if (unit === "set" || unit === "stk" || unit === "stück") return 0.01;
  return item.calculationBasis === "protectionAreaM2" ? 1.1 : 1;
}

export function calculateMaterials(
  catalog: MaterialCatalogItem[],
  context: MaterialCalculationContext,
  service?: MaterialService
): CalculatedMaterial[] {
  return catalog.flatMap((item) => {
    const basisAmount = Math.max(0, context[item.calculationBasis] ?? 0);
    const calculatedAmount = basisAmount * automaticRequirementFactor(item);
    const widthM = Math.max(0, item.widthM ?? 0);
    const requiredAmount =
      item.unit === "m" && materialTypeUsesAreaWidth(item.materialType)
        ? widthM > 0
          ? calculatedAmount / widthM
          : 0
        : calculatedAmount;
    const packageSize = Math.max(0, item.packageSize);

    if (
      !item.enabled ||
      (service && item.service !== service) ||
      requiredAmount <= 0 ||
      packageSize <= 0
    ) return [];

    const packageQuantity = Math.ceil(requiredAmount / packageSize);
    return [
      {
        ...item,
        basisAmount,
        requiredAmount: Math.round(requiredAmount * 10) / 10,
        packageQuantity,
        netTotal: Math.round(packageQuantity * item.netPrice * 100) / 100,
      },
    ];
  });
}

export function calculatePackagedMaterial(
  item: MaterialCatalogItem,
  requiredAmount: number,
  options: { id: string; name: string; basisAmount: number }
): CalculatedMaterial | null {
  const safeRequiredAmount = Math.max(0, requiredAmount);
  const packageSize = Math.max(0, item.packageSize);
  if (!item.enabled || safeRequiredAmount <= 0 || packageSize <= 0) return null;

  const packageQuantity = Math.ceil(safeRequiredAmount / packageSize);
  return {
    ...item,
    id: options.id,
    name: options.name,
    basisAmount: Math.max(0, options.basisAmount),
    requiredAmount: Math.round(safeRequiredAmount * 10) / 10,
    packageQuantity,
    netTotal: Math.round(packageQuantity * item.netPrice * 100) / 100,
  };
}

export function sumMaterialNetTotal(materials: CalculatedMaterial[]) {
  return Math.round(
    materials.reduce((total, item) => total + item.netTotal, 0) * 100
  ) / 100;
}