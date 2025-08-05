import { Service } from "./ServiceType";

export interface Contract {
    type: Service,
    zip: number,
    latitude?: number,
    longitude?: number,
    planningAvaillable: boolean,
    gardenSize: number,
    repeatService: boolean,
    contractSize: ContractSize,
    gardenLocation: GardenLocation,
    projektBeginn: Projectbegin,
    files: string[], // Firebase Storage URLs
    description: string,
    verified: boolean, // Korrigierte Schreibweise
    contact: {
        email: string,
        phone: number,
        firstName: string,
        lastName: string
    }
}

export type ContractSize = "small changes" | "new" | "request";
export type GardenLocation = "front" | "side" | "back";
export type GardenAccess = "free" | "house" | "gardendoor" | "else";
export type Projectbegin = "fast" | "request" | "2weeks" | "1month" | "fewmonths";

export function getAllContractSize():ContractSize[]  {
    return ["new", "request", "small changes"]
}

export function getAllGardenLocations(): GardenLocation[] {
    return ["back", "front", "side"]
}

export function getAllGardenAccess(): GardenAccess[] {
    return ["else", "free", "gardendoor", "house"]
}

export function getAllProjectBegins(): Projectbegin[] {
    return ["1month", "2weeks", "fast", "fewmonths", "request"]
}

