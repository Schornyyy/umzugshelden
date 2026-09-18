"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/config/firebase";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ArrowLeft, Check, LoaderCircle, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import MaterialPriceListEditor from "../offer/MaterialPriceListEditor";
import {
  defaultMaterialCatalog,
  normalizeMaterialCatalog,
  type MaterialCatalogItem,
} from "../offer/materialCatalog";

const storageCollection = "offer_calculators_umzugshelden";

export default function MaterialPriceListPage() {
  const { companyData } = useCompanyData();
  const [catalog, setCatalog] = useState<MaterialCatalogItem[]>(() =>
    defaultMaterialCatalog.map((item) => ({ ...item }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    const companyId = companyData?.id;
    if (!companyId) return;
    let active = true;

    async function loadCatalog(activeCompanyId: string) {
      try {
        const snapshot = await getDoc(
          doc(database, storageCollection, activeCompanyId)
        );
        const data = snapshot.data() as
          | { materialCatalog?: MaterialCatalogItem[] }
          | undefined;
        if (active) setCatalog(normalizeMaterialCatalog(data?.materialCatalog));
      } catch {
        if (active) setStatus("error");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCatalog(companyId);
    return () => {
      active = false;
    };
  }, [companyData?.id]);

  function updateCatalog(nextCatalog: MaterialCatalogItem[]) {
    setCatalog(nextCatalog);
    setStatus("idle");
  }

  async function saveCatalog() {
    const companyId = companyData?.id;
    if (!companyId) return;
    setIsSaving(true);
    setStatus("idle");

    try {
      await setDoc(
        doc(database, storageCollection, companyId),
        {
          ownerId: companyId,
          materialCatalog: catalog,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-64 items-center justify-center gap-2 text-slate-600'>
        <LoaderCircle className='animate-spin' size={18} /> Preisliste wird geladen ...
      </div>
    );
  }

  return (
    <main className='mx-auto w-full max-w-[1500px] pb-12'>
      <header className='mb-6 flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end'>
        <div>
          <Button asChild variant='ghost' size='sm' className='mb-2 -ml-3 text-slate-600'>
            <Link href={`/admin/${companyData?.id}/crm/calculator`}>
              <ArrowLeft /> Zum Kalkulator
            </Link>
          </Button>
          <p className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700'>
            <PackageCheck size={15} /> Kalkulation
          </p>
          <h1 className='text-2xl font-bold text-slate-950 sm:text-3xl'>Material-Preisliste</h1>
          <p className='mt-2 max-w-3xl text-sm leading-6 text-slate-600'>
            Einheit, Gebinde und Nettopreis zentral pflegen. Den Bedarf ermittelt
            der Kalkulator beim Erstellen eines Angebots automatisch.
          </p>
        </div>
        {status === "saved" && (
          <span className='flex items-center gap-1.5 text-sm font-medium text-emerald-700'>
            <Check size={16} /> Gespeichert
          </span>
        )}
        {status === "error" && (
          <span className='text-sm font-medium text-red-600'>Speichern fehlgeschlagen</span>
        )}
      </header>

      <section className='rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6'>
        <MaterialPriceListEditor
          catalog={catalog}
          isSaving={isSaving}
          onChange={updateCatalog}
          onSave={() => void saveCatalog()}
        />
      </section>
    </main>
  );
}