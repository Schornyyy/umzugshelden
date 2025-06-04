import { DocumentData } from "firebase/firestore"

export type ContractRequest = {
    id: string,
    name: string,
    email: string,
    phone: string,
    msg: string,
    service: string,
    createdAt: string,
    companyId: string,
    status: "read" | "unread"
}

export function contractRequestDTO(data: DocumentData): ContractRequest {
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        msg: data.msg,
        service: data.server,
        createdAt: data.createdAt,
        companyId: data.companyId,
        status: data.status
    }
}