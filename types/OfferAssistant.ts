export type AssistantInventoryItem = {
  name: string;
  quantity: number;
  volumeM3: number;
};

export type AssistantRoom = {
  name: string;
  items: AssistantInventoryItem[];
};

export type AssistantOfferDraft = {
  title?: string;
  customer?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  date?: string;
  services?: string[];
  oldAddress?: string;
  newAddress?: string;
  oldFloor?: string;
  newFloor?: string;
  oldFloorLevel?: number;
  newFloorLevel?: number;
  oldElevator?: boolean;
  newElevator?: boolean;
  kilometers?: number;
  carryDistanceM?: number;
  moveTrips?: number;
  moveComplexity?: "easy" | "standard" | "difficult";
  furnitureLiftRequired?: boolean;
  parkingRequired?: boolean;
  rooms?: AssistantRoom[];
  movingBoxes?: number;
  unpackingBoxes?: number;
  furniturePieces?: number;
  dismantlingHours?: number;
  paintAreaM2?: number;
  ceilingAreaM2?: number;
  paintCoats?: number;
  disposalVolumeM3?: number;
  clearanceHeavyItems?: number;
  clearanceDisposalIncluded?: boolean;
  clearanceHazardousVolumeM3?: number;
  clearanceContainerCount?: number;
  clearanceBroomClean?: boolean;
  storageVolumeM3?: number;
  storageMonths?: number;
  notes?: string;
};
