"use client";

import { getAllCompanies } from "@/actions/companyActions";
import SearchBarResults from "@/app/(home)/unternehmen-finden/_components/SearchbarResults";
import { CompanyType } from "@/types/RegisterTypye";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
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
        <SearchBarResults
          admin
          adminid={params.userid}
          loading={false}
          results={filteredCompanies}
        />
      )}
    </div>
  );
};

export default Page;
