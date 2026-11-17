"use client";

import { auth } from "@/config/firebase";

/** Firebase-ID-Token des angemeldeten Admins für Server Actions und Admin-APIs. */
export async function getAdminIdToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Bitte erneut anmelden.");
  return token;
}
