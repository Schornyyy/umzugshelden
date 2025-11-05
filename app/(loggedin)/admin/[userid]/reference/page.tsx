"use client";

import React, { useEffect, useState } from "react";
import CreateRefeenceDialog from "./_components/CreateRefeenceDialog";
import { Reference } from "@/types/ReferencType";
import { listReferences } from "@/actions/referenceActions";
import Image from "next/image";
import Headings from "@/components/Headings";
import Link from "next/link";
import { useCompanyData } from "@/provider/CompanyDataProvider";

const ReferencePage = () => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { companyData } = useCompanyData();

  useEffect(() => {
    async function loadReferences() {
      setLoading(true);
      const res = await listReferences();
      if (res) {
        setReferences(res);
        setLoading(false);
      }
    }
    loadReferences();
  }, []);

  if (loading) {
    return <div>Lade Referenzen...</div>;
  }

  return (
    <div className='flex flex-col gap-12'>
      <CreateRefeenceDialog />
      <div className='flex flex-col gap-4'>
        {references.map((ref) => (
          <div
            key={ref.id}
            className='flex flex-row w-full gap-12 border rounded-md p-4 shadow-md relative'>
            <Image
              src={ref.logoUrl}
              alt={ref.comanyName}
              width={450}
              height={450}
              className='object-fit rounded-md'
            />
            <div className='flex flex-col gap-4'>
              <Headings level={3}>{ref.comanyName}</Headings>
              <p>{ref.description}</p>
            </div>
            <div
              className={`${
                ref.public ? "text-green-600" : "text-red-600"
              } absolute top-4 right-4 font-semibold`}>
              {ref.public ? "Öffentlich" : "Nicht Öffentlich"}
            </div>
            <Link
              href={`/admin/${companyData?.id}/reference/${ref.id}`}
              className='absolute bottom-4 right-4 text-blue-600 underline'>
              Zur Referenz bearbeiten
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReferencePage;
