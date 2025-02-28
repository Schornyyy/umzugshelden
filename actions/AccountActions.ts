"use server";

import { database } from "@/config/firebase";
import { Account, accountDto } from "@/types/AccountType";
import { UserRole } from "@/types/UserType";
import { collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

export async function createAccountInDatabase(account: Account, role?: UserRole): Promise<Account> {

    await setDoc((doc(database, "accounts", account.id)), {...account, role: role || account.role});

    return account;
}

export async function updateAccount(account: Account): Promise<Account> {

    await updateDoc(doc(database, "accounts", account.id), {...account});
    return account;
}

export async function deleteAccount(account: Account): Promise<void> {
    
        await deleteDoc(doc(database, "accounts", account.id));
        return;
}

export async function findAccountByEmail(email: string): Promise<Account | null> {

    const colRef = collection(database, "accounts");
    const queryRef = query(colRef, where( "email", "==", email));
    const querySnapchot = await getDocs(queryRef)

    if (querySnapchot.empty) {
        return null;
    }

    return accountDto(querySnapchot.docs[0].data());
}
