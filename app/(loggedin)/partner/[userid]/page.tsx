"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPartner } from "@/actions/partnerActions";

export default function PartnerDashboard() {
  const params = useParams<{ userid: string }>();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const partner = await getPartner(params.userid);
      if (!partner) return router.push("/login");
    })();
  }, [params.userid, router]);

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-bold mb-2'>Willkommen im Partner-Portal</h1>
      <p className='text-gray-600'>
        Hier finden Sie Ihre Partnerseite, Kampagnen und Einstellungen.
      </p>
    </div>
  );
}
