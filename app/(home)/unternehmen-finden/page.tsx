/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React, { useEffect, useState } from "react";
import { fetchCoordinates } from "@/actions/userActions";
import geolib from "geolib";
import { collection, query, getDocs, startAfter, limit, where } from "firebase/firestore";
import { database } from "@/config/firebase";
import { CompanyType } from "@/types/RegisterTypye";
import SearchBar from "./_components/Searchbar";
import SearchBarResults from "./_components/SearchbarResults";
import Pagination from "./_components/Pagination";
import {  useSearchParams } from "next/navigation";

export default function page() {
  const [results, setResults] = useState<CompanyType[]>([]);
  const [displayedResults, setDisplayedResults] = useState<CompanyType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lastDoc, setLastDoc] = useState<any>(null);

  const searchParams = useSearchParams();

  const RESULTS_PER_PAGE = 24;

  useEffect(() => {
    const cityParam = searchParams.get("city") || "";
    const zipParam = searchParams.get("plz") || "";
    const serviceParam = searchParams.get("service") || "";
    const radiusParam = searchParams.get("km") || "10";

    if (cityParam && zipParam && serviceParam) {
      handleSearch(cityParam, zipParam, Number(radiusParam), serviceParam);
    }
  }, [searchParams]);

  const handleSearch = async (city: string, zip: string, radius: number, service: string) => {
    try {
      setLoading(true);

      const centerCoordinates = await fetchCoordinates(city, zip);
      const querySnapshot = await fetchCompaniesFromFirestore(undefined, service);

      const companies: CompanyType[] = querySnapshot.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as CompanyType[];

      const filteredCompanies = filterCompaniesByRadius(companies, centerCoordinates!, radius);
      const sortedCompanies = filteredCompanies.sort((a, b) =>
        geolib.getDistance({ latitude: a.latitude!, longitude: a.longitude! }, centerCoordinates!) -
        geolib.getDistance({ latitude: b.latitude!, longitude: b.longitude! }, centerCoordinates!)
      );

      setResults(sortedCompanies);
      updateDisplayedResults(sortedCompanies, 1);
      setLoading(false);
    } catch (error) {
      console.error("Fehler bei der Suche:", error);
      setLoading(false);
    }
  };

  const fetchCompaniesFromFirestore = async (next = false, service: string) => {
    const ref = collection(database, "users");
    const q = next && lastDoc
      ? query(ref, startAfter(lastDoc), limit(100))
      : query(ref, limit(100), where("services", "array-contains", service));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    return querySnapshot.docs;
  };

  const filterCompaniesByRadius = (
    companies: CompanyType[],
    centerCoordinates: { latitude: number; longitude: number },
    radius: number
  ) => {
    return companies.filter((company) => {
      if (!company.latitude || !company.longitude) return false;
      return geolib.isPointWithinRadius(
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
    <>
      {/* Hero Section */}
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

      {/* Results Section */}
      <div className="max-w-4xl mx-auto py-12">
        <SearchBarResults results={displayedResults} loading={loading} />
        <Pagination
          currentPage={currentPage}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          hasMoreResults={currentPage * RESULTS_PER_PAGE < results.length}
        />
      </div>
    </>
  );
}
