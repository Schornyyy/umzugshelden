"use client";

import {
  getContractRequestById,
  updateContractRequest,
} from "@/actions/CompanyContractRequestAction";
import Headings from "@/components/Headings";
import { Separator } from "@/components/ui/separator";
import { ContractRequest } from "@/types/ContractRequest";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const Page = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [contracts, setContracts] = useState<ContractRequest | null>(null);
  const params = useParams<{ id: string }>();

  useEffect(() => {
    if (!params.id) return;

    async function getConttract() {
      setLoading(true);
      const resp = await getContractRequestById(params.id);

      if (resp) {
        setContracts(resp);

        if (resp.status === "unread") {
          await updateContractRequest(resp.id, { status: "read" });
        }
      }
      setLoading(false);
    }

    getConttract();
  }, [params]);

  if (loading) {
    return (
      <div>
        <p>Daten werden geladen...</p>
      </div>
    );
  }

  if (!loading && contracts === null) {
    return (
      <div>
        <p>Der Auftrag wurde nicht gefunden.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      <Headings level={2}>Auftragsdetails</Headings>
      <p className='text-gray-400'>
        {new Date(contracts!.createdAt).toLocaleDateString("de")}
      </p>
      <Separator />
      <Headings level={3}>Kontaktdaten</Headings>
      <div className='flex flex-col gap-2'>
        <p className='flex flex-col font-semibold'>
          Name
          <span className='text-slate-900 font-normal'>{contracts!.name}</span>
        </p>
        <p className='flex flex-col font-semibold'>
          E-Mail
          <span className='text-slate-900 font-normal'>{contracts!.email}</span>
        </p>
        <p className='flex flex-col font-semibold'>
          Telefonnummer
          <span className='text-slate-900 font-normal'>{contracts!.phone}</span>
        </p>
      </div>
      <Separator />
      <Headings level={3}>Auftragsdaten</Headings>
      <div className='flex flex-col gap-2'>
        <p className='flex flex-col font-semibold'>
          Dienstleistung
          <span className='text-slate-900 font-normal'>
            {contracts!.service.replace(
              contracts!.service[0],
              contracts!.service[0].toUpperCase()
            )}
          </span>
        </p>
        <p className='flex flex-col font-semibold'>
          Nachricht
          <span className='text-slate-900 md:w-1/2 break-all font-normal'>
            {contracts!.msg}
          </span>
        </p>
      </div>
      <Separator />
    </div>
  );
};

export default Page;
