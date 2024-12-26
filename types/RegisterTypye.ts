
import { UserRole } from "./UserType";

export interface Registertype  {
    email: string,
    type: UserRole,
    city?: string,
    zip?: string,
    companyName?: string,
    companyNumber?: string,
    companyEmail?: string,
    companyWebsite?: string,
}