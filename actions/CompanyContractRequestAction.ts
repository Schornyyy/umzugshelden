"use server";

import { database } from "@/config/firebase";
import { ContractRequest } from "@/types/ContractRequest";
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

export async function createContractRequest(contract: ContractRequest): Promise<ContractRequest> {
  await setDoc(doc(database, "contractRequests", contract.id), { ...contract })
  return contract
}

// ❌ DELETE
export async function deleteContractRequest(id: string): Promise<void> {
  await deleteDoc(doc(database, "contractRequests", id))
}

// 🔄 UPDATE
export async function updateContractRequest(id: string, updates: Partial<ContractRequest>): Promise<void> {
  await updateDoc(doc(database, "contractRequests", id), updates)
}

// 📄 GET ALL BY COMPANY ID
export async function getContractRequestsByCompanyId(companyId: string): Promise<ContractRequest[]> {
  const q = query(
    collection(database, "contractRequests"),
    where("companyId", "==", companyId)
  )
  const querySnapshot = await getDocs(q)
  const data: ContractRequest[] = []
  querySnapshot.forEach((doc) => {
    data.push(doc.data() as ContractRequest)
  })
  return data
}

// 📄 GET BY ID
export async function getContractRequestById(id: string): Promise<ContractRequest | null> {
  const docRef = doc(database, "contractRequests", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return docSnap.data() as ContractRequest
  } else {
    return null // oder throw new Error("Not found"), je nach Fehlerhandling
  }
}