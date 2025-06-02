"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cities } from "@/statics/Lists";
import { slugify } from "@/utils/slugify";

const formSchema = z.object({
  query: z.string().min(1, "Bitte eine Stadt eingeben"),
});

type FormData = z.infer<typeof formSchema>;

const Page = () => {
  const [filteredCities, setFilteredCities] = useState<string[]>(cities);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    const query = data.query.toLowerCase();
    const results = cities.filter((city) => city.toLowerCase().includes(query));
    setFilteredCities(results);
  };

  return (
    <div className='max-w-2xl mx-auto py-12 px-4'>
      <h1 className='text-3xl font-bold mb-6'>Stadt wählen</h1>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 mb-6'>
        <div>
          <Input placeholder='Stadt eingeben...' {...register("query")} />
          {errors.query && (
            <p className='text-sm text-red-500 mt-1'>{errors.query.message}</p>
          )}
        </div>
        <Button type='submit'>Filtern</Button>
      </form>

      <ul className='space-y-2'>
        {filteredCities.map((city) => (
          <li key={city}>
            <Link
              href={`/stadt/${slugify(city)}`}
              className='text-blue-600 underline'>
              {city}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;
