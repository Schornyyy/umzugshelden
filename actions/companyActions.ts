"use server";

import { database } from "@/config/firebase";
import { CompanyType, parseDataToCompanyType } from "@/types/RegisterTypye";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

// 🔹 ALLE UNTERNEHMEN LADEN (mit Cache)
export const getAllCompanies = async (): Promise<CompanyType[]> => {
    const colRef = collection(database, "users");
    const querySnapshot = await getDocs(colRef);

    if (querySnapshot.empty) return [];

    return querySnapshot.docs.map((doc) =>
      parseDataToCompanyType(doc.data(), doc.id)
    );
  
  };

// 🔹 UNTERNEHMEN NACH EMAIL LADEN (mit Cache)
export const findCompanyByEmail = async (
  email: string
): Promise<CompanyType | undefined> => {
      const colRef = collection(database, "users");
      const querySnapshot = await getDocs(
        query(colRef, where("email", "==", email))
      );

      if (querySnapshot.empty) return undefined;

      return parseDataToCompanyType(
        querySnapshot.docs[0].data(),
        querySnapshot.docs[0].id
      );
};

// 🔹 UNTERNEHMEN NACH OWNER ID LADEN (mit Cache)
export const findCompanyByOwnerId = async (
  id: string
): Promise<CompanyType | undefined> => {
      const colRef = collection(database, "users");
      const querySnapshot = await getDocs(
        query(colRef, where("ownerid", "==", id))
      );

      if (querySnapshot.empty) return undefined;

      return parseDataToCompanyType(
        querySnapshot.docs[0].data(),
        querySnapshot.docs[0].id
      );
};

// 🔹 UNTERNEHMEN NACH ID LADEN (mit Cache)
export const findCompanyById = async (
  id: string
): Promise<CompanyType | undefined> => {
      const docRef = doc(database, "users", id);
      const companyDocRef = await getDoc(docRef);

      if (!companyDocRef.exists()) return undefined;

      return parseDataToCompanyType(companyDocRef.data()!, companyDocRef.id);
    
};

// 🔹 UNTERNEHMEN ERSTELLEN (Cache invalidieren)
export async function createCompanyInDatabase(
  data: CompanyType
): Promise<boolean | undefined> {
  const colRef = collection(database, "users");

  await addDoc(colRef, { ...data });

  return true;
}

export async function deleteCompanyFromDatabase(id: string): Promise<boolean> {
  try {
    const docRef = doc(database, "users", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Unternehmens:", error);
    return false;
  }
}

// 🔹 UNTERNEHMEN AKTUALISIEREN (Cache invalidieren)
export async function updateCompanyInDatabase(
  data: CompanyType
): Promise<CompanyType | undefined> {
  const docRef = doc(database, "users", data.id!);
  const updatedData = { ...data };

  if (!updatedData.type || updatedData.type === undefined) {
    updatedData.type = "company";
  }

  await updateDoc(docRef, { ...updatedData });

  return updatedData;
}

export async function getAllCompanysFromDatabaseByCity(city: string): Promise<CompanyType[]> {
    const list: CompanyType[] = [];

    const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    const colRef = collection(database, "users");
    const queryRef = query(
        colRef,
        where("city", "==", capitalizedCity)
    );
    const docsRef = await getDocs(queryRef);

    if (docsRef.docs.length === 0) return list;

    docsRef.docs.forEach((doc) => {
        list.push(parseDataToCompanyType(doc.data(), doc.id));
    });

    return list;
}

export async function getCompaniesByCityAndService(city: string, service: string): Promise<CompanyType[]> {
  const result: CompanyType[] = [];

  const capitalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

  const colRef = collection(database, "users");
  const queryRef = query(
    colRef,
    where("city", "==", capitalizedCity),
    where("services", "array-contains", service.toLowerCase())
  );

  const docsSnap = await getDocs(queryRef);

  if (docsSnap.empty) return result;

  docsSnap.docs.forEach(doc => {
    result.push(parseDataToCompanyType(doc.data(), doc.id));
  });

  return result;
}

