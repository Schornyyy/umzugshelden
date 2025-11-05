"use client";

import { listPublishedReferences } from "@/actions/referenceActions";
import { Reference } from "@/types/ReferencType";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Headings from "../Headings";
import Link from "next/link";

const ReferenceBlock = ({
  maxReferences,
  title,
  subtext,
}: {
  maxReferences?: number;
  title: string;
  subtext: string;
}) => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReferences() {
      setLoading(true);
      try {
        const res = await listPublishedReferences(maxReferences);
        setReferences(res);
        console.log("Loaded references:", res);
      } catch (error) {
        console.log(error);
        toast.error("Fehler beim Laden der Referenzen");
      } finally {
        setLoading(false);
      }
    }

    loadReferences();
  }, [maxReferences]);

  return (
    <div className='flex flex-col gap-6 items-center'>
      <Headings level={2}>{title}</Headings>
      <p className='text-slate-600'>{subtext}</p>
      <div className='grid grid-cols-1 md:grid-cols-3 grid-auto-rows-fr gap-12 flex-wrap'>
        {!loading &&
          references.map((ref) => (
            <Link key={ref.id} href={`/referenzen/${ref.id}`}>
              <div className='flex relative h-[400px] w-full max-w-full overflow-hidden rounded-md shadow-lg'>
                <Image
                  src={ref.thumbnailUrl}
                  alt={ref.comanyName}
                  width={500}
                  height={500}
                  className='object-cover'
                />
                <div
                  className='w-full h-full absolute z-10 top-0 left-0'
                  aria-hidden='true'
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.70) 20%, rgba(0,0,0,0) 100%)",
                  }}
                />
                <Headings
                  level={4}
                  className='absolute bottom-10 left-4 text-white z-20'>
                  {ref.comanyName}
                </Headings>
                <p className='text-white absolute left-4 bottom-4 z-20 uppercase text-sm'>
                  {ref.companyBranch}
                </p>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default ReferenceBlock;
