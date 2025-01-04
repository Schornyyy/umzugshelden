"use server";

import { database } from "@/config/firebase";
import { CompanyType, parseDataToCompanyType } from "@/types/RegisterTypye";
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

export async function createCompanyInDatabase(data: CompanyType): Promise<boolean | undefined> {

    const colRef = collection(database, "users");

    await addDoc(colRef, {...data}).then(() => {
        return true;
    })
    return false;
}

export async function findCompanyByEmail(email: string): Promise<CompanyType | undefined> {
    const colRef = collection(database, "users");
    const querySnapshot = await getDocs(query(colRef, where("email", "==", email)));

    if (querySnapshot.empty) {
        return undefined;
    }

    const company: CompanyType = parseDataToCompanyType(querySnapshot.docs[0].data(), querySnapshot.docs[0].id);

    return company;
}

export async function findCompanyById(id: string): Promise<CompanyType | undefined> {
    const docRef = doc(database, "users", id)
    const companyDocRef = await getDoc(docRef);

    const company: CompanyType = parseDataToCompanyType(companyDocRef.data()!, companyDocRef.id);

    return company;
}

export async function updateCompanyInDatabase(data: CompanyType): Promise<CompanyType | undefined> {
    const docRef = doc(database, "users", data.id!);

    await updateDoc(docRef, {...data}).then(() => {
        return data;
    })

    return data;
}

export async function getAllCompanies(): Promise<CompanyType[]> {
    const colRef = collection(database, "users");
    const querySnapshot = await getDocs(colRef);

    const companies: CompanyType[] = [];

    querySnapshot.forEach((doc) => {
        companies.push(parseDataToCompanyType(doc.data(), doc.id));
    })

    return companies;
}
