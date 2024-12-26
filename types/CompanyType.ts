import { User } from "./UserType";

export interface CompanyUser extends User {
    companyName: string,
    public: boolean,
    title: string,
    description: string,
    city: string,
    zip: string,
    companyNumber: string,
    companyContact: string,
    companyEmail: string,
    companyWebsite?: string,
    id?: string,
    images?: []
}