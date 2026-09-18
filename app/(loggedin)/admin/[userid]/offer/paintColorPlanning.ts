export type PaintSurfaceCondition = "smooth" | "normal" | "absorbent";

export type PaintColorPlan = {
  id: string;
  name: string;
  hexColor: string;
  areaMode: "remaining" | "custom";
  areaM2: number;
  coats: number;
  materialId: string;
};

export type CalculatedPaintColor = PaintColorPlan & {
  effectiveAreaM2: number;
  coatedAreaM2: number;
};

export const paintSurfaceConditionOptions: Array<{
  value: PaintSurfaceCondition;
  label: string;
  description: string;
}> = [
  {
    value: "smooth",
    label: "Glatt / bereits gestrichen",
    description: "Gleichmäßiger, wenig saugender Untergrund",
  },
  {
    value: "normal",
    label: "Normaler Putz",
    description: "Üblicher, leicht saugender Untergrund",
  },
  {
    value: "absorbent",
    label: "Rau / stark saugend",
    description: "Rauer Putz, Rohbau oder stark saugende Fläche",
  },
];

function roundAmount(value: number) {
  return Math.round(Math.max(0, value) * 10) / 10;
}

export function calculatePaintColorAreas(
  colors: PaintColorPlan[],
  totalAreaM2: number
): CalculatedPaintColor[] {
  const safeTotalAreaM2 = Math.max(0, totalAreaM2);
  const fixedAreaM2 = colors.reduce(
    (total, color) =>
      color.areaMode === "custom" ? total + Math.max(0, color.areaM2) : total,
    0
  );
  const remainingAreaM2 = Math.max(0, safeTotalAreaM2 - fixedAreaM2);
  let remainingAssigned = false;

  return colors.map((color) => {
    const effectiveAreaM2 =
      color.areaMode === "remaining" && !remainingAssigned
        ? remainingAreaM2
        : color.areaMode === "custom"
          ? Math.max(0, color.areaM2)
          : 0;
    if (color.areaMode === "remaining" && !remainingAssigned) {
      remainingAssigned = true;
    }

    return {
      ...color,
      effectiveAreaM2: roundAmount(effectiveAreaM2),
      coatedAreaM2: roundAmount(
        effectiveAreaM2 * Math.max(1, Math.round(color.coats))
      ),
    };
  });
}

export function calculatePaintLiters(
  coatedAreaM2: number,
  condition: PaintSurfaceCondition,
  reservePercent: number
) {
  const coverageM2PerLiter =
    condition === "smooth" ? 8 : condition === "absorbent" ? 5.5 : 7;
  const reserveFactor =
    1 + Math.min(50, Math.max(0, reservePercent)) / 100;
  return roundAmount(
    (Math.max(0, coatedAreaM2) / coverageM2PerLiter) * reserveFactor
  );
}

export function summarizePaintColorAreas(
  colors: CalculatedPaintColor[],
  totalAreaM2: number
) {
  const plannedAreaM2 = colors.reduce(
    (total, color) => total + color.effectiveAreaM2,
    0
  );
  return {
    plannedAreaM2: roundAmount(plannedAreaM2),
    unplannedAreaM2: roundAmount(Math.max(0, totalAreaM2 - plannedAreaM2)),
    overplannedAreaM2: roundAmount(Math.max(0, plannedAreaM2 - totalAreaM2)),
  };
}