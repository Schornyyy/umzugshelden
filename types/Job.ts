export interface Job {
    id: string,
    ownerId: string,
    titel: string,
    shortText?: string,
    text?: string,
    active?: boolean,
    jobArt: "vollzeit" | "teilzeit" | "aushilfe" | "praktikum" | "ferienjob",
}