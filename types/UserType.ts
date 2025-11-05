export interface User {
    email: string,
    role: UserRole,
    id: string,
}

export type UserRole = "admin" | "privatPerson" | "company" | "partner";