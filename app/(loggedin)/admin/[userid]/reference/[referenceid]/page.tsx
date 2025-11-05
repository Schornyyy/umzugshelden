import React from "react";
import type { Reference } from "@/types/ReferencType";
import {
  getReferenceById,
  updateReference,
  deleteReference,
} from "@/actions/referenceActions";
import EditReferenceForm from "../_components/EditReferenceForm";

type Props = {
  params: Promise<{ userid: string; referenceid: string }>;
};

const page = async ({ params }: Props) => {
  // Next.js may provide params as a promise in some environments — await to be safe
  const { referenceid } = (await params) as { referenceid: string };
  const refData: (Reference & { id: string }) | null = await getReferenceById(
    referenceid
  );

  if (!refData) {
    return (
      <div className='container mx-auto p-8'>
        <h2 className='text-2xl font-bold'>Referenz nicht gefunden</h2>
        <p className='mt-2 text-sm text-slate-600'>
          Die angeforderte Referenz existiert nicht oder wurde gelöscht.
        </p>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-4'>Referenz bearbeiten</h1>
      {/*
        Pass server actions so the client form can invoke them directly and we
        can avoid the API route layer.
      */}
      <EditReferenceForm
        initialData={refData}
        saveAction={async (
          data: Partial<Reference> | Record<string, unknown>
        ) => {
          "use server";
          await updateReference(referenceid, data);
        }}
        deleteAction={async () => {
          "use server";
          await deleteReference(referenceid);
        }}
      />
    </div>
  );
};

export default page;
