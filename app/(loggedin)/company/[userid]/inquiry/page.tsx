"use client";

import { getContractRequestsByCompanyId } from "@/actions/CompanyContractRequestAction";
import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { ContractRequest } from "@/types/ContractRequest";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const Page = () => {
  const { companyData } = useCompanyData();
  const [loading, setLoading] = useState<boolean>(false);
  const [contracts, setContracts] = useState<ContractRequest[]>([]);

  useEffect(() => {
    if (!companyData) return;
    async function getContracts() {
      setLoading(true);
      const resp = await getContractRequestsByCompanyId(companyData!.id!);
      if (resp.length > 0) {
        setContracts(resp);
      }
      setLoading(false);
    }

    getContracts();
  }, [companyData]);

  if (loading) {
    return (
      <div>
        <h1 className='text-2xl font-bold'>Daten werden geladen...</h1>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-4'>
      {contracts.map((contract) => (
        <div
          className={`flex flex-col md:flex-row justify-between p-4 rounded-xl ${
            contract.status === "unread"
              ? "border-amber-600 border-2"
              : "border border-primary"
          }`}
          key={contract.id}>
          <div className='flex flex-col gap-2'>
            <Headings level={4}>{contract.name}</Headings>
            <p className='truncate overflow-hidden whitespace-nowrap w-64'>
              {contract.msg}
            </p>
            <p className='text-gray-400'>
              {new Date(contract.createdAt).toLocaleDateString("de-DE")}
            </p>
          </div>
          <Link
            href={`/company/${companyData?.id}/inquiry/${contract.id}`}
            className='flex items-end max-md:mt-2'>
            <Button>Anfrage ansehen</Button>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Page;
