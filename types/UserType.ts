export interface User {
    email: string,
    role: UserRole,
}

export type UserRole = "admin" | "privatPerson" | "company";