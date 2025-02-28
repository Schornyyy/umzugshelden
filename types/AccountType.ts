import { DocumentData } from "firebase/firestore";
import { UserRole } from "./UserType";

export interface Account {
    id: string,
    email: string,
    vorname?: string,
    nachname?: string,
    role: UserRole,
    street?: string,
    city?: string,
    zip?: number,
    phone?: string
}

export function accountDto(data: DocumentData): Account {
    return {
        id: data.id,
        email: data.email,
        vorname: data.vorname || "",
        nachname: data.nachname || "",
        role: data.role as UserRole,
        street: data.street || "",
        city: data.city || "",
        zip: data.zip || "",
        phone: data.phone || ""
    } as Account
}