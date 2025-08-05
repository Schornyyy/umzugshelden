
import { DocumentData } from "firebase/firestore";
import { UserRole } from "./UserType";

export interface CompanyType  {
    email: string,
    type: UserRole,
    city?: string,
    zip?: string,
    longitude?: number,
    latitude?: number,
    description?: string,
    companyName?: string,
    companyNumber?: string,
    companyEmail?: string,
    companyWebsite?: string,
    images?: string[],
    title?: string,
    public?: boolean,
    services?: string[],
    id?: string,
    ownerid: string
}

export function parseDataToCompanyType(data: DocumentData, id?: string) {
    return {
        email: data.email,
        type: data.type as UserRole,
        city: data.city ? data.city : "",
        zip: data.zip ? data.zip : "",
        longitude: data.longitude ? data.longitude : undefined,
        latitude: data.latitude ? data.latitude : undefined,
        description: data.description ? data.description : "",
        companyName: data.companyName ? data.companyName : "",
        companyNumber: data.companyNumber ? data.companyNumber : "",
        companyEmail: data.companyEmail ? data.companyEmail : "",
        companyWebsite: data.companyWebsite ? data.companyWebsite : "",
        images: data.images ? data.images : [],
        title: data.title ? data.title : "",
        public: data.public ? data.public : false,
        id: id ? id : "",
        services: data.services ? data.services :  [],
        ownerid: data.ownerid ? data.ownerid : "",
    }
}