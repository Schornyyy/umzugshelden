export type RoofSlopeType = "none" | "single" | "double";

export type PaintingAreaInput = {
  livingAreaM2: number;
  roomCount: number;
  roomHeightM: number;
  openingDeductionPercent: number;
  roofSlopeType: RoofSlopeType;
  slopedRoomCount: number;
  kneeWallHeightM: number;
  roofPitchDegrees: number;
};

export type PaintingAreaEstimate = {
  wallAreaM2: number;
  ceilingAreaM2: number;
  roofSlopeAreaM2: number;
};

function roundArea(value: number) {
  return Math.round(Math.max(0, value) * 10) / 10;
}

export function calculatePaintingAreas(
  input: PaintingAreaInput
): PaintingAreaEstimate {
  const livingAreaM2 = Math.max(0, input.livingAreaM2);
  const roomCount = Math.max(1, Math.round(input.roomCount));
  const roomHeightM = Math.max(0, input.roomHeightM);
  const openingFactor =
    1 - Math.min(100, Math.max(0, input.openingDeductionPercent)) / 100;
  const slopedRoomCount =
    input.roofSlopeType === "none"
      ? 0
      : Math.min(roomCount, Math.max(0, Math.round(input.slopedRoomCount)));

  if (livingAreaM2 <= 0 || roomHeightM <= 0) {
    return { wallAreaM2: 0, ceilingAreaM2: 0, roofSlopeAreaM2: 0 };
  }

  const roomAreaM2 = livingAreaM2 / roomCount;
  const roomSideM = Math.sqrt(roomAreaM2);
  const baseWallAreaM2 = roomSideM * 4 * roomHeightM * roomCount;

  if (slopedRoomCount === 0) {
    return {
      wallAreaM2: roundArea(baseWallAreaM2 * openingFactor),
      ceilingAreaM2: roundArea(livingAreaM2),
      roofSlopeAreaM2: 0,
    };
  }

  const slopeSides = input.roofSlopeType === "double" ? 2 : 1;
  const kneeWallHeightM = Math.min(
    roomHeightM,
    Math.max(0, input.kneeWallHeightM)
  );
  const availableRiseM = roomHeightM - kneeWallHeightM;
  const roofPitchRadians =
    (Math.min(80, Math.max(10, input.roofPitchDegrees)) * Math.PI) / 180;
  const maximumRunM = roomSideM / slopeSides;
  const slopeRunM = Math.min(
    maximumRunM,
    availableRiseM / Math.tan(roofPitchRadians)
  );
  const actualRiseM = slopeRunM * Math.tan(roofPitchRadians);
  const slopeLengthM = slopeRunM / Math.cos(roofPitchRadians);
  const flatCeilingWidthM = roomSideM - slopeRunM * slopeSides;
  const slopedCeilingPerRoomM2 =
    roomSideM * (flatCeilingWidthM + slopeLengthM * slopeSides);
  const roofSlopeAreaM2 =
    roomSideM * slopeLengthM * slopeSides * slopedRoomCount;

  const lowWallReductionPerRoomM2 =
    roomSideM * actualRiseM * slopeSides;
  const sideWallReductionPerRoomM2 =
    slopeRunM * actualRiseM * slopeSides;
  const adjustedWallAreaM2 =
    baseWallAreaM2 -
    (lowWallReductionPerRoomM2 + sideWallReductionPerRoomM2) *
      slopedRoomCount;
  const ceilingAreaM2 =
    livingAreaM2 -
    roomAreaM2 * slopedRoomCount +
    slopedCeilingPerRoomM2 * slopedRoomCount;

  return {
    wallAreaM2: roundArea(adjustedWallAreaM2 * openingFactor),
    ceilingAreaM2: roundArea(ceilingAreaM2),
    roofSlopeAreaM2: roundArea(roofSlopeAreaM2),
  };
}

export function calculateWallpaperRolls(
  wallpaperAreaM2: number,
  rollWidthM: number,
  rollLengthM: number,
  wastePercent: number
) {
  const rollAreaM2 = Math.max(0, rollWidthM) * Math.max(0, rollLengthM);
  if (wallpaperAreaM2 <= 0 || rollAreaM2 <= 0) return 0;

  const areaWithWasteM2 =
    wallpaperAreaM2 *
    (1 + Math.min(100, Math.max(0, wastePercent)) / 100);
  return Math.ceil(areaWithWasteM2 / rollAreaM2);
}