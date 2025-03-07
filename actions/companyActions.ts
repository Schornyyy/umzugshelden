"use server";

import { database } from "@/config/firebase";
import { CompanyType, parseDataToCompanyType } from "@/types/RegisterTypye";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { unstable_cache } from "next/cache";

// Hilfsfunktion zum Invalidieren des Caches
const revalidate = async (key: string) => {
  await unstable_cache(() => Promise.resolve(), [key], {
    revalidate: 86400, // Cache für einen Tag (24h)
  })();
};

// 🔹 ALLE UNTERNEHMEN LADEN (mit Cache)
export const getAllCompanies = unstable_cache(
  async (): Promise<CompanyType[]> => {
    const colRef = collection(database, "users");
    const querySnapshot = await getDocs(colRef);

    if (querySnapshot.empty) return [];

    return querySnapshot.docs.map((doc) =>
      parseDataToCompanyType(doc.data(), doc.id)
    );
  },
  ["all-companies"],
  { revalidate: 86400 } // Cache erneuert sich täglich
);

// 🔹 UNTERNEHMEN NACH EMAIL LADEN (mit Cache)
export const findCompanyByEmail = async (
  email: string
): Promise<CompanyType | undefined> => {
  return unstable_cache(
    async () => {
      const colRef = collection(database, "users");
      const querySnapshot = await getDocs(
        query(colRef, where("email", "==", email))
      );

      if (querySnapshot.empty) return undefined;

      return parseDataToCompanyType(
        querySnapshot.docs[0].data(),
        querySnapshot.docs[0].id
      );
    },
    [`company-email-${email}`],
    { revalidate: 86400 }
  )();
};

// 🔹 UNTERNEHMEN NACH OWNER ID LADEN (mit Cache)
export const findCompanyByOwnerId = async (
  id: string
): Promise<CompanyType | undefined> => {
  return unstable_cache(
    async () => {
      const colRef = collection(database, "users");
      const querySnapshot = await getDocs(
        query(colRef, where("ownerid", "==", id))
      );

      if (querySnapshot.empty) return undefined;

      return parseDataToCompanyType(
        querySnapshot.docs[0].data(),
        querySnapshot.docs[0].id
      );
    },
    [`company-owner-${id}`],
    { revalidate: 86400 }
  )();
};

// 🔹 UNTERNEHMEN NACH ID LADEN (mit Cache)
export const findCompanyById = async (
  id: string
): Promise<CompanyType | undefined> => {
  return unstable_cache(
    async () => {
      const docRef = doc(database, "users", id);
      const companyDocRef = await getDoc(docRef);

      if (!companyDocRef.exists()) return undefined;

      return parseDataToCompanyType(companyDocRef.data()!, companyDocRef.id);
    },
    [`company-id-${id}`],
    { revalidate: 86400 }
  )();
};

// 🔹 UNTERNEHMEN ERSTELLEN (Cache invalidieren)
export async function createCompanyInDatabase(
  data: CompanyType
): Promise<boolean | undefined> {
  const colRef = collection(database, "users");

  await addDoc(colRef, { ...data });
  await revalidate("all-companies");

  return true;
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

  await revalidate(`company-id-${data.id}`);
  await revalidate("all-companies");

  return updatedData;
}
