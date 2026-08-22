"use client";

import { getUserByEmail } from "@/actions/userActions";
import { auth } from "@/config/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLaunchPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser?.email) {
        router.replace("/login");
        return;
      }

      try {
        const account = await getUserByEmail(firebaseUser.email);
        if (account?.role === "admin") {
          router.replace(`/admin/${account.id}/requests`);
          return;
        }
      } catch {
        // The user is sent to the login page below when the account cannot be resolved.
      }

      router.replace("/login");
    });

    return unsubscribe;
  }, [router]);

  return (
    <main className='min-h-screen grid place-items-center bg-slate-950 px-6 text-center text-white'>
      <p className='text-sm'>Adminbereich wird geoeffnet...</p>
    </main>
  );
}