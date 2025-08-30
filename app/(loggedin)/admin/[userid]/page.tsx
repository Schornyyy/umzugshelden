"use client";

// import { getAllCompanies } from "@/actions/companyActions"; // replaced by paginated fetch
import {
  getCompaniesPage,
  getCompaniesTotalCount,
} from "@/actions/companyPaginationActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
import { CompanyType } from "@/types/RegisterTypye";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FilterFormValues = {
  name: string;
  email: string;
};

const Page = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [companies, setCompanies] = useState<CompanyType[]>([]); // currently loaded pages concatenated
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyType[]>([]); // filter over loaded subset
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cursor, setCursor] = useState<string | null>(null); // next cursor for further loading
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [autoLoading, setAutoLoading] = useState<boolean>(false); // automatisches Nachladen für Datenqualitäts-Filter
  const [totalCount, setTotalCount] = useState<number | null>(null); // Gesamtanzahl aller Unternehmen für Progress
  // Datenqualitäts-Filter: alle | ohne Namen | ohne Unternehmens-E-Mail | ohne beides
  type MissingFilter =
    | "all"
    | "missingName"
    | "missingCompanyEmail"
    | "missingBoth";
  const [missingFilter, setMissingFilter] = useState<MissingFilter>("all");
  const PAGE_SIZE = 12; // page size for display & backend fetch
  const params = useParams<{ userid: string }>();

  const form = useForm<FilterFormValues>({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      setLoading(true);
      // Parallel Gesamtzahl holen
      getCompaniesTotalCount().then((cnt) => {
        if (!cancelled) setTotalCount(cnt);
      });
      const page = await getCompaniesPage(PAGE_SIZE);
      if (cancelled) return;
      setCompanies(page.companies);
      setFilteredCompanies(page.companies);
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
      setLoading(false);
    }
    initialLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep current page within bounds when the list changes
  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredCompanies.length / PAGE_SIZE)
    );
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [filteredCompanies, currentPage]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE)),
    [filteredCompanies.length]
  );
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageEndIndex = Math.min(
    pageStartIndex + PAGE_SIZE,
    filteredCompanies.length
  );
  const pagedResults = useMemo(
    () => filteredCompanies.slice(pageStartIndex, pageEndIndex),
    [filteredCompanies, pageStartIndex, pageEndIndex]
  );

  const onSubmit = () => {
    // Nur zentrale Recompute-Funktion aufrufen (nutzt aktuellen missingFilter + Formwerte)
    recomputeFiltered(companies);
  };

  // Zentrale Filter-Funktion (Name/Email Suchfelder + Missing-Filter)
  const recomputeFiltered = useCallback(
    (base: CompanyType[] = companies) => {
      const { name, email } = form.getValues();
      let list = base.filter((c) => {
        const nm = (c.companyName || "").toLowerCase();
        const em = (c.email || "").toLowerCase();
        const nameMatch = nm.includes(name.toLowerCase());
        const emailMatch = em.includes(email.toLowerCase());
        return nameMatch && emailMatch;
      });
      if (missingFilter !== "all") {
        list = list.filter((c) => {
          const noName = !c.companyName || c.companyName.trim() === "";
          // companyEmail als eigentliche Firmen-Kontaktadresse bevorzugen; fallback auf email wenn companyEmail leer
          const noCompanyEmail =
            !c.companyEmail || c.companyEmail.trim() === ""; // gezielt fehlende companyEmail
          switch (missingFilter) {
            case "missingName":
              return noName;
            case "missingCompanyEmail":
              return noCompanyEmail; // nur wenn spezifische companyEmail fehlt
            case "missingBoth":
              return noName && noCompanyEmail;
            default:
              return true;
          }
        });
      }
      setFilteredCompanies(list);
      setCurrentPage(1);
    },
    [companies, form, missingFilter]
  );

  // Recompute wenn Missing-Filter geändert wurde
  useEffect(() => {
    if (!loading) recomputeFiltered(companies);
  }, [missingFilter, loading, recomputeFiltered, companies]);

  async function loadMore() {
    if (!hasMore || loading) return;
    setLoading(true);
    const page = await getCompaniesPage(PAGE_SIZE, cursor || undefined);
    setCompanies((prev) => [...prev, ...page.companies]);
    // Immer zentrale Filter anwenden (berücksichtigt Suchfelder & Missing-Filter)
    recomputeFiltered([...companies, ...page.companies]);
    setCursor(page.nextCursor);
    setHasMore(page.hasMore);
    setLoading(false);
  }

  // Automatisches vollständiges Laden aller Unternehmen, wenn einer der Missing-Filter aktiv ist
  useEffect(() => {
    if (missingFilter === "all") return; // nur bei Qualitäts-Filtern aktiv
    if (autoLoading) return; // laufenden Prozess nicht duplizieren
    let cancelled = false;
    async function loadAll() {
      setAutoLoading(true);
      try {
        let localCompanies = [...companies];
        let localCursor = cursor;
        let safety = 0; // Sicherheits-Grenze gegen Endlosschleifen
        while (!cancelled) {
          // Abbruch falls bekannte Gesamtzahl erreicht
          if (
            totalCount &&
            totalCount > 0 &&
            localCompanies.length >= totalCount
          )
            break;
          const page = await getCompaniesPage(
            PAGE_SIZE,
            localCursor || undefined
          );
          if (cancelled) break;
          if (page.companies.length === 0) {
            // Nichts Neues -> fertig
            setHasMore(false);
            break;
          }
          // Falls keine neuen (sollte nicht passieren) -> Abbruch
          const beforeLen = localCompanies.length;
          localCompanies = [...localCompanies, ...page.companies];
          if (localCompanies.length === beforeLen) {
            setHasMore(false);
            break;
          }
          localCursor = page.nextCursor;
          // Backend Angabe übernehmen
          if (!page.hasMore) {
            // Prüfen ob wir dennoch weiter laden sollten (z.B. count sagt mehr)
            if (!(totalCount && localCompanies.length < totalCount)) {
              setHasMore(false);
            }
          }
          // UI aktualisieren
          setCompanies(localCompanies);
          setCursor(localCursor);
          setHasMore(page.hasMore);
          recomputeFiltered(localCompanies);
          safety++;
          if (safety > 500) {
            // harte Obergrenze
            console.warn("Abbruch: Sicherheitslimit erreicht");
            break;
          }
          // Wenn laut Backend nichts mehr, aber Count unsicher (null) -> Break
          if (!page.hasMore && !totalCount) break;
          // Wenn laut Backend nichts mehr und wir <= totalCount sind (oder count fehlt) -> Break
          if (
            !page.hasMore &&
            (!totalCount || localCompanies.length >= (totalCount || 0))
          )
            break;
        }
      } finally {
        if (!cancelled) setAutoLoading(false);
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [
    missingFilter,
    autoLoading,
    companies,
    cursor,
    recomputeFiltered,
    totalCount,
  ]);

  // Datenqualitäts-Zähler (bezogen auf aktuell geladene Companies, nicht gesamte DB)
  const qualityCounts = useMemo(() => {
    let missingName = 0;
    let missingCompanyEmail = 0;
    let missingBoth = 0;
    companies.forEach((c) => {
      const noName = !c.companyName || c.companyName.trim() === "";
      const noCompanyEmail = !c.companyEmail || c.companyEmail.trim() === "";
      if (noName) missingName++;
      if (noCompanyEmail) missingCompanyEmail++;
      if (noName && noCompanyEmail) missingBoth++;
    });
    return { missingName, missingCompanyEmail, missingBoth };
  }, [companies]);

  // Helper für Button-Stil
  const variantFor = (val: typeof missingFilter) =>
    missingFilter === val ? "default" : ("outline" as const);

  return (
    <div className='flex flex-col gap-8'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-4 md:flex-row'>
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem className='w-full md:w-1/3'>
                <FormLabel>Unternehmensname</FormLabel>
                <FormControl>
                  <Input placeholder='z. B. Müller GmbH' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='w-full md:w-1/3'>
                <FormLabel>E-Mail</FormLabel>
                <FormControl>
                  <Input placeholder='z. B. info@firma.de' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='flex items-end'>
            <Button type='submit' className='w-full md:w-auto'>
              Filtern
            </Button>
          </div>
        </form>
      </Form>

      {/* Datenqualitäts-Filter */}
      <div className='flex flex-col gap-2'>
        <div className='text-sm font-medium text-gray-700'>Datenqualität</div>
        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant={variantFor("all")}
            onClick={() => setMissingFilter("all")}>
            Alle
          </Button>
          <Button
            size='sm'
            variant={variantFor("missingName")}
            onClick={() => setMissingFilter("missingName")}>
            Ohne Namen ({qualityCounts.missingName})
          </Button>
          <Button
            size='sm'
            variant={variantFor("missingCompanyEmail")}
            onClick={() => setMissingFilter("missingCompanyEmail")}>
            Ohne Firmen-E-Mail ({qualityCounts.missingCompanyEmail})
          </Button>
          <Button
            size='sm'
            variant={variantFor("missingBoth")}
            onClick={() => setMissingFilter("missingBoth")}>
            Beides fehlt ({qualityCounts.missingBoth})
          </Button>
        </div>
        <div className='text-xs text-gray-500'>
          Zähler beziehen sich auf aktuell geladene Unternehmen. Mit &quot;Mehr
          laden&quot; erweitern.
        </div>
        {missingFilter !== "all" && (
          <div className='mt-2 w-full max-w-xl'>
            <AutoLoadProgress
              total={totalCount ?? undefined}
              loaded={companies.length}
              active={autoLoading && hasMore}
              finished={!hasMore}
            />
          </div>
        )}
      </div>

      {loading ? (
        <p>Lade Firmen...</p>
      ) : (
        <>
          <SearchBarResults
            admin
            adminid={params.userid}
            loading={false}
            results={pagedResults}
          />

          {/* Pagination Controls */}
          <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-sm text-gray-600'>
              Zeige {filteredCompanies.length === 0 ? 0 : pageStartIndex + 1}-
              {pageEndIndex} von {filteredCompanies.length}
              {missingFilter !== "all" && autoLoading && hasMore && (
                <span className='ml-2 text-xs text-gray-500'>
                  Lade weitere…
                </span>
              )}
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                Zurück
              </Button>
              <span className='text-sm text-gray-700'>
                Seite {currentPage} / {totalPages}
              </span>
              <Button
                variant='outline'
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }>
                Weiter
              </Button>
              {hasMore &&
                currentPage === totalPages &&
                missingFilter === "all" && (
                  <Button
                    variant='default'
                    onClick={loadMore}
                    disabled={loading}>
                    {loading ? "Lade..." : "Mehr laden"}
                  </Button>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;

// Progress Komponente
const AutoLoadProgress: React.FC<{
  total?: number;
  loaded: number;
  active: boolean;
  finished: boolean;
}> = ({ total, loaded, active, finished }) => {
  let percent: number | null = null;
  if (total && total > 0)
    percent = Math.min(100, Math.round((loaded / total) * 100));
  const barWidth =
    percent !== null
      ? `${percent}%`
      : finished
      ? "100%"
      : active
      ? "60%"
      : "0%";
  const label = finished
    ? `Vollständig geladen (${loaded}${total ? ` / ${total}` : ""})`
    : active
    ? total
      ? `Lade… ${loaded} / ${total} (${percent}%)`
      : `Lade… ${loaded}`
    : total
    ? `${loaded} / ${total}`
    : `${loaded} geladen`;
  return (
    <div className='flex flex-col gap-1'>
      <div className='h-3 w-full rounded bg-gray-200 overflow-hidden'>
        <div
          className='h-full bg-emerald-500 transition-all duration-300'
          style={{ width: barWidth }}
        />
      </div>
      <div className='text-[11px] text-gray-600'>{label}</div>
    </div>
  );
};
