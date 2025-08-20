"use client";

import { getAllCompanies } from "@/actions/companyActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
import { CompanyType } from "@/types/RegisterTypye";
import { useParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
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
  const [allCompanies, setAllCompanies] = useState<CompanyType[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyType[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 12;
  const params = useParams<{ userid: string }>();

  const form = useForm<FilterFormValues>({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    async function fetchCompanies() {
      const comps = await getAllCompanies();
      setAllCompanies(comps);
      setFilteredCompanies(comps); // initially show all
      setLoading(false);
    }
    fetchCompanies();
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

  const onSubmit = (data: FilterFormValues) => {
    const filtered = allCompanies.filter((company) => {
      const nameMatch = company
        .companyName!.toLowerCase()
        .includes(data.name.toLowerCase());
      const emailMatch = company.email
        .toLowerCase()
        .includes(data.email.toLowerCase());
      return nameMatch && emailMatch;
    });
    setFilteredCompanies(filtered);
    setCurrentPage(1);
  };

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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Page;
