"use server";

import { database } from "@/config/firebase";
import { CompanyType, parseDataToCompanyType } from "@/types/RegisterTypye";
import { cacheManager, CACHE_KEYS, CACHE_OPTIONS, invalidateCompanyCaches } from "@/lib/cache";
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
export const getAllCompanies = async (useCache: boolean = true): Promise<CompanyType[]> => {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.ALL_COMPANIES,
      async () => {
        const colRef = collection(database, "users");
        const querySnapshot = await getDocs(colRef);

        if (querySnapshot.empty) return [];

        return querySnapshot.docs.map((doc) =>
          parseDataToCompanyType(doc.data(), doc.id)
        );
      },
      CACHE_OPTIONS.COMPANIES
    );
    return cached;
  }

  const colRef = collection(database, "users");
  const querySnapshot = await getDocs(colRef);

  if (querySnapshot.empty) return [];

  return querySnapshot.docs.map((doc) =>
    parseDataToCompanyType(doc.data(), doc.id)
  );
};

// 🔹 UNTERNEHMEN NACH EMAIL LADEN (mit Cache)
export const findCompanyByEmail = async (
  email: string,
  useCache: boolean = true
): Promise<CompanyType | undefined> => {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.COMPANY_BY_EMAIL(email),
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
      CACHE_OPTIONS.COMPANY_DETAILS
    );
    return cached;
  }

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
  id: string,
  useCache: boolean = true
): Promise<CompanyType | undefined> => {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.COMPANY_BY_OWNER_ID(id),
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
      CACHE_OPTIONS.COMPANY_DETAILS
    );
    return cached;
  }

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
  id: string,
  useCache: boolean = true
): Promise<CompanyType | undefined> => {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.COMPANY_BY_ID(id),
      async () => {
        const docRef = doc(database, "users", id);
        const companyDocRef = await getDoc(docRef);

        if (!companyDocRef.exists()) return undefined;

        return parseDataToCompanyType(companyDocRef.data()!, companyDocRef.id);
      },
      CACHE_OPTIONS.COMPANY_DETAILS
    );
    return cached;
  }

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

  // Cache invalidieren nach dem Erstellen
  cacheManager.delete(CACHE_KEYS.ALL_COMPANIES);
  if (data.city) {
    const stats = cacheManager.getStats();
    stats.entries.forEach(entry => {
      if (entry.key.includes(`city:${data.city!.toLowerCase()}`)) {
        cacheManager.delete(entry.key);
      }
    });
  }

  return true;
}

export async function deleteCompanyFromDatabase(id: string): Promise<boolean> {
  try {
    const docRef = doc(database, "users", id);
    await deleteDoc(docRef);
    
    // Cache invalidieren nach dem Löschen
    cacheManager.delete(CACHE_KEYS.ALL_COMPANIES);
    cacheManager.delete(CACHE_KEYS.COMPANY_BY_ID(id));
    
    // Invalidiere auch andere company-bezogene Caches
    const stats = cacheManager.getStats();
    stats.entries.forEach(entry => {
      if (entry.key.startsWith('company:') || entry.key.startsWith('companies:')) {
        cacheManager.delete(entry.key);
      }
    });
    
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

  // Cache invalidieren nach dem Update
  cacheManager.delete(CACHE_KEYS.ALL_COMPANIES);
  cacheManager.delete(CACHE_KEYS.COMPANY_BY_ID(data.id!));
  
  if (data.email) {
    cacheManager.delete(CACHE_KEYS.COMPANY_BY_EMAIL(data.email));
  }
  if (data.ownerid) {
    cacheManager.delete(CACHE_KEYS.COMPANY_BY_OWNER_ID(data.ownerid));
  }
  if (data.city) {
    const stats = cacheManager.getStats();
    stats.entries.forEach(entry => {
      if (entry.key.includes(`city:${data.city!.toLowerCase()}`)) {
        cacheManager.delete(entry.key);
      }
    });
  }

  return updatedData;
}

export async function getAllCompanysFromDatabaseByCity(
  city: string,
  useCache: boolean = true
): Promise<CompanyType[]> {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.COMPANIES_BY_CITY(city),
      async () => {
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
      },
      CACHE_OPTIONS.COMPANIES
    );
    return cached;
  }

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

export async function getCompaniesByCityAndService(
  city: string, 
  service: string,
  useCache: boolean = true
): Promise<CompanyType[]> {
  if (useCache) {
    const cached = await cacheManager.getOrFetch(
      CACHE_KEYS.COMPANIES_BY_CITY_SERVICE(city, service),
      async () => {
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
      },
      CACHE_OPTIONS.COMPANIES
    );
    return cached;
  }

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

// 🔹 HELPER: Alle Company-Caches invalidieren
export const invalidateAllCompanyCaches = async () => {
  invalidateCompanyCaches();
  console.log('Alle Company-Caches wurden invalidiert');
};

