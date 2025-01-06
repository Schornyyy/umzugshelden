/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { fetchCoordinates } from "@/actions/userActions";
import { collection, query, getDocs, startAfter, limit, where } from "firebase/firestore";
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

  const searchParams = useSearchParams();

  const RESULTS_PER_PAGE = 24;

  useEffect(() => {
    const cityParam = searchParams?.get("city") || "";
    const zipParam = searchParams?.get("plz") || "";
    const serviceParam = searchParams?.get("service") || "";
    const radiusParam = searchParams?.get("km") || "10";

    if (cityParam && zipParam && serviceParam) {
      handleSearch(cityParam, zipParam, Number(radiusParam), serviceParam);
    }
  }, [searchParams]);

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

  const handleSearch = async (city: string, zip: string, radius: number, service?: string) => {
    try {
      setLoading(true);

      const centerCoordinates = await fetchCoordinates(city, zip);
      const querySnapshot = await fetchCompaniesFromFirestore(undefined, service);

      const companies: CompanyType[] = querySnapshot.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CompanyType[];

      if(companies.length === 0) return;

      const filteredCompanies = filterCompaniesByRadius(companies, centerCoordinates!, radius);
      const sortedCompanies = filteredCompanies.sort((a, b) =>
        calculateDistance(
          { latitude: a.latitude!, longitude: a.longitude! },
          centerCoordinates!
        ) -
        calculateDistance(
          { latitude: b.latitude!, longitude: b.longitude! },
          centerCoordinates!
        )
      );

      setResults(sortedCompanies);
      updateDisplayedResults(sortedCompanies, 1);
      setLoading(false);
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
      setLoading(false);
    }
  };

  const fetchCompaniesFromFirestore = async (next = false, service?: string) => {
    const ref = collection(database, "users");
    let baseQuery = query(ref, limit(100));

    if (service) {
      baseQuery = query(baseQuery, where("services", "array-contains", service));
    }

    const q = next && lastDoc
      ? query(baseQuery, startAfter(lastDoc))
      : baseQuery;
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    return querySnapshot.docs;
  };

  const haversineDistance = (point1: Coordinates, point2: Coordinates): number => {
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
  
  const isPointWithinRadius = (point: Coordinates, center: Coordinates, radius: number): boolean => {
    const distance = haversineDistance(point, center);
    return distance <= radius;
  };
  

  const filterCompaniesByRadius = (
    companies: CompanyType[],
    centerCoordinates: { latitude: number; longitude: number },
    radius: number
  ) => {
    return companies.filter((company) => {
      if (!company.latitude || !company.longitude) return false;
      return isPointWithinRadius(
        { latitude: company.latitude, longitude: company.longitude },
        centerCoordinates,
        radius * 1000
      );
    });
  };

  const updateDisplayedResults = (companies: CompanyType[], page: number) => {
    const startIndex = (page - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    setDisplayedResults(companies.slice(startIndex, endIndex));
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    updateDisplayedResults(results, nextPage);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) updateDisplayedResults(results, currentPage - 1);
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div
        className="flex py-24 w-full"
        style={{
          backgroundImage: "url('images/Unternhemen_finden_Hero.png')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
        }}
      >
        <div className="flex justify-center items-center w-full">
          <SearchBar onSearch={handleSearch} loading={loading} styling={{ shadow: true }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 max-md:p-4">
        <SearchBarResults results={displayedResults} loading={loading} />
        <Pagination
          currentPage={currentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasMoreResults={currentPage * RESULTS_PER_PAGE < results.length}
        />
      </div>
      <div className="py-12 bg-green-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 lg:items-center">
            <div className="flex justify-center lg:w-1/2">
              <Image
                alt="JobSmith Aufträge erhalten"
                src="/images/JobSmith_gefunden_werden.png"
                height={512}
                width={512}
                className="object-cover w-full max-w-sm lg:max-w-none"
              />
            </div>
            <div className="flex flex-col gap-6 lg:w-1/2 max-md:items-center">
              <h5 className="font-bold text-3xl md:text-5xl">Suchen Sie Aufträge?</h5>
              <p className="text-base md:text-lg">
                Erhalten Sie planbar neue Aufträge für Ihren Betrieb mit JobSmith.
              </p>
              <p className="text-base md:text-lg">
                JobSmith ist der einfachste Weg, planbar und zuverlässig neue Aufträge
                für Ihren Betrieb zu gewinnen. Registrieren Sie sich jetzt, um direkt
                Aufträge in Ihrer Nähe zu finden.
              </p>
              <Link
                href="/register"
                className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 w-fit"
              >
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
