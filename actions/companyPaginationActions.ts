"use server";

import { database } from "@/config/firebase";
import { CompanyType, parseDataToCompanyType } from "@/types/RegisterTypye";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore";

export interface CompaniesPageResult {
  companies: CompanyType[];
  nextCursor: string | null; // document id of last item
  hasMore: boolean;
}

const COL = () => collection(database, "users");

// Basic cursor-based pagination ordered by document id for stability.
export async function getCompaniesPage(pageSize: number = 12, startAfterId?: string): Promise<CompaniesPageResult> {
  let q;
  if (startAfterId) {
    const snap = await getDoc(doc(database, "users", startAfterId));
    if (!snap.exists()) {
      return { companies: [], nextCursor: null, hasMore: false };
    }
    q = query(COL(), orderBy("__name__"), startAfter(snap), limit(pageSize));
  } else {
    q = query(COL(), orderBy("__name__"), limit(pageSize));
  }
  const qs = await getDocs(q);
  const companies = qs.docs.map(d => parseDataToCompanyType(d.data(), d.id));
  const last = qs.docs[qs.docs.length - 1];
  return {
    companies,
    nextCursor: last ? last.id : null,
    hasMore: !!last && companies.length === pageSize
  };
}
