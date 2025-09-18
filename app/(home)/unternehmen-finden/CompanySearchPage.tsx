"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { fetchCoordinates } from "@/actions/userActions";
import {
  collection,
  query,
  getDocs,
  startAfter,
  limit,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
} from "firebase/firestore";
import { database } from "@/config/firebase";
import { CompanyType } from "@/types/RegisterTypye";
import SearchBar from "./_components/Searchbar";
import SearchBarResults from "./_components/SearchbarResults";
import Pagination from "./_components/Pagination";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Coordinates = {
  latitude: number;
  longitude: number;
};

function CompanySearchPage() {
  const [results, setResults] = useState<CompanyType[]>([]);
  const [displayedResults, setDisplayedResults] = useState<CompanyType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMoreServer, setHasMoreServer] = useState(true);
  const [loadedCompanies, setLoadedCompanies] = useState<CompanyType[]>([]);
  const [activeCenter, setActiveCenter] = useState<Coordinates | null>(null);
  const [activeRadiusKm, setActiveRadiusKm] = useState<number>(10);
  const [activeService, setActiveService] = useState<string | undefined>(
    undefined
  );

  const searchParams = useSearchParams();
  const searchParamsString = React.useMemo(() => searchParams?.toString() || "", [searchParams]);
  const handleSearchRef = React.useRef<(city: string, zip: string, radius: number, service?: string) => void>(() => {});

  const RESULTS_PER_PAGE = 12;

  const calculateDistance = (
    point1: { latitude: number; longitude: number },
    point2: { latitude: number; longitude: number }
  ): number => {
    const toRadians = (deg: number) => (deg * Math.PI) / 180;

    const R = 6371e3; // Radius der Erde in Metern
    const φ1 = toRadians(point1.latitude);
    const φ2 = toRadians(point2.latitude);
    const Δφ = toRadians(point2.latitude - point1.latitude);
    const Δλ = toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distanz in Metern
  };

  // Fetch a single batch of up to 200 docs using a provided cursor (no state side-effects)
  const fetchCompaniesBatch = useCallback(
    async (
      cursor: QueryDocumentSnapshot<DocumentData> | null,
      service?: string
    ): Promise<{
      docs: QueryDocumentSnapshot<DocumentData>[];
      lastDoc: QueryDocumentSnapshot<DocumentData> | null;
      hasMore: boolean;
    }> => {
      const ref = collection(database, "users");
      let baseQuery = query(ref, limit(200));

      if (service) {
        baseQuery = query(
          baseQuery,
          where("services", "array-contains", service)
        );
      }

      const q = cursor ? query(baseQuery, startAfter(cursor)) : baseQuery;
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { docs: [], lastDoc: cursor, hasMore: false };
      }
      const newLast = snapshot.docs[snapshot.docs.length - 1] ?? cursor;
      const hasMore = snapshot.docs.length === 200; // if we hit the limit, assume more available
      return { docs: snapshot.docs, lastDoc: newLast, hasMore };
    },
    []
  );

  // Distance helpers
  const haversineDistance = (
    point1: Coordinates,
    point2: Coordinates
  ): number => {
    const toRadians = (deg: number): number => (deg * Math.PI) / 180;

    const R = 6371e3; // Radius der Erde in Metern
    const φ1 = toRadians(point1.latitude);
    const φ2 = toRadians(point2.latitude);
    const Δφ = toRadians(point2.latitude - point1.latitude);
    const Δλ = toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distanz in Metern
  };

  const isPointWithinRadius = useCallback(
    (point: Coordinates, center: Coordinates, radius: number): boolean => {
      const distance = haversineDistance(point, center);
      return distance <= radius;
    },
    []
  );

  const sortByDistance = useCallback(
    (companies: CompanyType[], center: Coordinates) => {
      return companies.sort(
        (a, b) =>
          calculateDistance(
            { latitude: a.latitude!, longitude: a.longitude! },
            center
          ) -
          calculateDistance(
            { latitude: b.latitude!, longitude: b.longitude! },
            center
          )
      );
    },
    []
  );

  const filterCompaniesByRadius = useCallback(
    (
      companies: CompanyType[],
      centerCoordinates: { latitude: number; longitude: number },
      radiusKm: number
    ) => {
      return companies.filter((company) => {
        if (!company.latitude || !company.longitude) return false;
        return isPointWithinRadius(
          { latitude: company.latitude, longitude: company.longitude },
          centerCoordinates,
          radiusKm * 1000
        );
      });
    },
    [isPointWithinRadius]
  );

  // Ensure we have at least "minCount" filtered & sorted results.
  const ensureResultsCount = useCallback(
    async (
      minCount: number,
      center: Coordinates,
      radiusKm: number,
      service?: string
    ): Promise<CompanyType[]> => {
      // First pass: use already loaded companies (our local "cache")
      // Create a local working set and id index to avoid duplicates
      const localLoaded: CompanyType[] = [...loadedCompanies];
      const idSet = new Set(localLoaded.map((c) => c.id));

      let currentFiltered = sortByDistance(
        filterCompaniesByRadius(localLoaded, center, radiusKm),
        center
      );

      // If we already have enough, update state and exit
      if (currentFiltered.length >= minCount || !hasMoreServer) {
        const trimmed = currentFiltered.slice(
          0,
          Math.max(minCount, currentFiltered.length)
        );
        return trimmed;
      }

      // Otherwise, fetch in 200-sized batches until we reach minCount or no more server data
      // Safety loop limit to avoid infinite loops
      let safety = 30; // up to 30*200 = 6000 docs per search session
      let localCursor: QueryDocumentSnapshot<DocumentData> | null = lastDoc;
      let localHasMore: boolean = hasMoreServer;
      while (
        currentFiltered.length < minCount &&
        localHasMore &&
        safety-- > 0
      ) {
        const {
          docs,
          lastDoc: newCursor,
          hasMore,
        } = await fetchCompaniesBatch(localCursor, service);
        if (!docs || docs.length === 0) {
          localHasMore = false;
          break;
        }

        // Merge deduped
        for (const d of docs) {
          const data = d.data();
          const comp = { ...(data as CompanyType), id: d.id } as CompanyType;
          if (!idSet.has(comp.id!)) {
            idSet.add(comp.id!);
            localLoaded.push(comp);
          }
        }

        // Recompute filtered list
        currentFiltered = sortByDistance(
          filterCompaniesByRadius(localLoaded, center, radiusKm),
          center
        );

        // advance cursor
        localCursor = newCursor;
        localHasMore = hasMore;
      }

      // Persist local state once
      setLoadedCompanies(localLoaded);
      setLastDoc(localCursor);
      setHasMoreServer(localHasMore);

      const finalList = currentFiltered;
      return finalList;
    },
    [
      loadedCompanies,
      hasMoreServer,
      lastDoc,
      fetchCompaniesBatch,
      filterCompaniesByRadius,
      sortByDistance,
    ]
  );

  const handleSearch = useCallback(
    async (city: string, zip: string, radius: number, service?: string) => {
      try {
        setLoading(true);
        // Reset search session state
        setResults([]);
        setDisplayedResults([]);
        setCurrentPage(1);
        setLastDoc(null);
        setHasMoreServer(true);
        setLoadedCompanies([]);
        setActiveService(service);
        setActiveRadiusKm(radius);

        const centerCoordinates = await fetchCoordinates(city, zip);
        if (!centerCoordinates) {
          setLoading(false);
          return;
        }
        setActiveCenter(centerCoordinates);

        // Ensure we have at least one page (12) of results by scanning already loaded companies
        const list = await ensureResultsCount(
          RESULTS_PER_PAGE,
          centerCoordinates,
          radius,
          service
        );
        setResults(list);
        updateDisplayedResults(list, 1);
        setLoading(false);
      } catch (error) {
        console.error("Fehler bei der Suche:", error);
        setLoading(false);
      }
    },
    [ensureResultsCount]
  );

  // Keep ref in sync with the latest handleSearch implementation
  useEffect(() => {
    handleSearchRef.current = handleSearch as (city: string, zip: string, radius: number, service?: string) => void;
  }, [handleSearch]);

  // Trigger search from URL parameters without creating dependency loops
  useEffect(() => {
    const sp = new URLSearchParams(searchParamsString);
    const cityParam = sp.get("city") || "";
    const zipParam = sp.get("plz") || "";
    const serviceParam = sp.get("service") || "";
    const radiusParam = sp.get("km") || "10";

    if (cityParam && zipParam && serviceParam) {
      handleSearchRef.current(cityParam, zipParam, Number(radiusParam), serviceParam);
    }
  }, [searchParamsString]);

  const updateDisplayedResults = (companies: CompanyType[], page: number) => {
    const startIndex = (page - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    setDisplayedResults(companies.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  const handleNextPage = async () => {
    const nextPage = currentPage + 1;
    const neededCount = nextPage * RESULTS_PER_PAGE;
    let source = results;
    if (results.length < neededCount && hasMoreServer && activeCenter) {
      setLoading(true);
      const list = await ensureResultsCount(
        neededCount,
        activeCenter,
        activeRadiusKm,
        activeService
      );
      if (list.length > results.length) {
        setResults(list);
        source = list;
      }
      setLoading(false);
    }
    updateDisplayedResults(source, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) updateDisplayedResults(results, currentPage - 1);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        className='flex py-24 w-full'
        style={{
          backgroundImage: "url('images/Unternhemen_finden_Hero.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
        }}>
        <div className='flex justify-center items-center w-full'>
          <SearchBar
            onSearch={handleSearch}
            loading={loading}
            styling={{ shadow: true }}
          />
        </div>
      </div>

      <div className='max-w-4xl mx-auto py-12 max-md:p-4'>
        <SearchBarResults results={displayedResults} loading={loading} />
        <Pagination
          currentPage={currentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasMoreResults={
            hasMoreServer || currentPage * RESULTS_PER_PAGE < results.length
          }
        />
      </div>
      <div className='py-12 bg-green-100'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col lg:flex-row gap-12 lg:items-center'>
            <div className='flex justify-center lg:w-1/2'>
              <Image
                alt='JobSmith Aufträge erhalten'
                src='/images/JobSmith_gefunden_werden.png'
                height={512}
                width={512}
                className='object-cover w-full max-w-sm lg:max-w-none'
              />
            </div>
            <div className='flex flex-col gap-6 lg:w-1/2 max-md:items-center'>
              <h5 className='font-bold text-3xl md:text-5xl'>
                Suchen Sie Aufträge?
              </h5>
              <p className='text-base md:text-lg'>
                Erhalten Sie planbar neue Aufträge für Ihren Betrieb mit
                JobSmith.
              </p>
              <p className='text-base md:text-lg'>
                JobSmith ist der einfachste Weg, planbar und zuverlässig neue
                Aufträge für Ihren Betrieb zu gewinnen. Registrieren Sie sich
                jetzt, um direkt Aufträge in Ihrer Nähe zu finden.
              </p>
              <Link
                href='/register'
                className='py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 w-fit'>
                Jetzt registrieren
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export default CompanySearchPage;
