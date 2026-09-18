import { calculateWallpaperRolls } from "./paintingAreaCalculation";

export type PaintingMaterialInput = {
  wallAreaM2: number;
  ceilingAreaM2: number;
  coats: number;
  repairAreaM2: number;
  plasterAreaM2: number;
  wallpaperAreaM2?: number;
  wallpaperRollWidthM?: number;
  wallpaperRollLengthM?: number;
  wallpaperWastePercent?: number;
};

export type PaintingMaterialRequirement = {
  id: string;
  name: string;
  requiredAmount: number;
  requiredUnit: string;
  packageQuantity: number;
  packageLabel: string;
  basis: string;
};

const materialReserveFactor = 1.1;

function roundAmount(value: number) {
  return Math.round(value * 10) / 10;
}

function packagesFor(requiredAmount: number, packageSize: number) {
  return requiredAmount > 0 ? Math.ceil(requiredAmount / packageSize) : 0;
}

export function calculatePaintingMaterialRequirements(
  input: PaintingMaterialInput
): PaintingMaterialRequirement[] {
  const wallAreaM2 = Math.max(0, input.wallAreaM2);
  const ceilingAreaM2 = Math.max(0, input.ceilingAreaM2);
  const surfaceAreaM2 = wallAreaM2 + ceilingAreaM2;
  const wallpaperAreaM2 = Math.max(0, input.wallpaperAreaM2 ?? 0);
  const wallpaperRolls = calculateWallpaperRolls(
    wallpaperAreaM2,
    input.wallpaperRollWidthM ?? 0.53,
    input.wallpaperRollLengthM ?? 10.05,
    input.wallpaperWastePercent ?? 10
  );

  if (surfaceAreaM2 <= 0) {
    return wallpaperRolls > 0
      ? [
          {
            id: "wallpaper",
            name: "Tapete",
            requiredAmount: wallpaperAreaM2,
            requiredUnit: "m²",
            packageQuantity: wallpaperRolls,
            packageLabel: "Rolle",
            basis: `${input.wallpaperWastePercent ?? 10} % Verschnitt eingerechnet`,
          },
        ]
      : [];
  }

  const coats = Math.max(1, input.coats);
  const coatedAreaM2 = surfaceAreaM2 * coats;
  const protectionAreaM2 =
    ceilingAreaM2 > 0 ? ceilingAreaM2 : wallAreaM2 * 0.25;
  const repairAreaM2 =
    Math.max(0, input.repairAreaM2) + Math.max(0, input.plasterAreaM2);
  const paintLiters = roundAmount((coatedAreaM2 / 7) * materialReserveFactor);
  const primerLiters = roundAmount((surfaceAreaM2 / 10) * materialReserveFactor);
  const fleeceAreaM2 = roundAmount(protectionAreaM2 * materialReserveFactor);
  const maskingTapeMeters = roundAmount(
    surfaceAreaM2 * 0.5 * materialReserveFactor
  );
  const adhesiveTapeMeters = roundAmount(
    protectionAreaM2 * 0.25 * materialReserveFactor
  );
  const coveringFilmAreaM2 = roundAmount(
    protectionAreaM2 * 2 * materialReserveFactor
  );
  const fillerKg = roundAmount(repairAreaM2 * materialReserveFactor);
  return [
    {
      id: "paint",
      name: "Wand- und Deckenfarbe",
      requiredAmount: paintLiters,
      requiredUnit: "l",
      packageQuantity: packagesFor(paintLiters, 12.5),
      packageLabel: "12,5-l-Eimer",
      basis: "7 m²/l je Anstrich",
    },
    {
      id: "primer",
      name: "Grundierung / Tiefengrund",
      requiredAmount: primerLiters,
      requiredUnit: "l",
      packageQuantity: packagesFor(primerLiters, 10),
      packageLabel: "10-l-Kanister",
      basis: "10 m²/l",
    },
    {
      id: "fleece",
      name: "Abdeckvlies",
      requiredAmount: fleeceAreaM2,
      requiredUnit: "m²",
      packageQuantity: packagesFor(fleeceAreaM2, 50),
      packageLabel: "50-m²-Rolle",
      basis: "Schutzfläche plus 10 % Reserve",
    },
    {
      id: "masking-tape",
      name: "Malerkrepp",
      requiredAmount: maskingTapeMeters,
      requiredUnit: "lfm",
      packageQuantity: packagesFor(maskingTapeMeters, 50),
      packageLabel: "50-m-Rolle",
      basis: "0,5 lfm je m² Fläche",
    },
    {
      id: "adhesive-tape",
      name: "Klebeband",
      requiredAmount: adhesiveTapeMeters,
      requiredUnit: "lfm",
      packageQuantity: packagesFor(adhesiveTapeMeters, 25),
      packageLabel: "25-m-Rolle",
      basis: "0,25 lfm je m² Schutzfläche",
    },
    {
      id: "covering-film",
      name: "Abdeckfolie",
      requiredAmount: coveringFilmAreaM2,
      requiredUnit: "m²",
      packageQuantity: packagesFor(coveringFilmAreaM2, 100),
      packageLabel: "100-m²-Rolle",
      basis: "2 m² je m² Schutzfläche",
    },
    {
      id: "tools",
      name: "Farbrollen- und Pinselset",
      requiredAmount: Math.max(1, Math.ceil(surfaceAreaM2 / 100)),
      requiredUnit: "Set",
      packageQuantity: Math.max(1, Math.ceil(surfaceAreaM2 / 100)),
      packageLabel: "Set",
      basis: "1 Set je angefangene 100 m²",
    },
    ...(wallpaperRolls > 0
      ? [
          {
            id: "wallpaper",
            name: "Tapete",
            requiredAmount: wallpaperAreaM2,
            requiredUnit: "m²",
            packageQuantity: wallpaperRolls,
            packageLabel: "Rolle",
            basis: `${input.wallpaperWastePercent ?? 10} % Verschnitt eingerechnet`,
          },
        ]
      : []),
    ...(repairAreaM2 > 0
      ? [
          {
            id: "filler",
            name: "Spachtelmasse",
            requiredAmount: fillerKg,
            requiredUnit: "kg",
            packageQuantity: packagesFor(fillerKg, 25),
            packageLabel: "25-kg-Sack",
            basis: "1 kg je m² Reparaturfläche",
          },
        ]
      : []),
  ];
}