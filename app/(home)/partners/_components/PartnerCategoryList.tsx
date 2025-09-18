"use client";

import Headings from "@/components/Headings";
import Link from "next/link";
import React from "react";

const PartnerCategoryList = ({ categories }: { categories: string[] }) => {
  return (
    <section className='mb-4'>
      <div className='flex flex-row gap-3 overflow-x-auto'>
        {Array.from(new Set(categories)).map((category) => (
          <Link
            href={`/partners/${encodeURIComponent(category)}`}
            key={category}
            className='border rounded-lg py-2 px-4 flex items-center justify-center whitespace-nowrap shadow-sm hover:shadow-md transition cursor-pointer bg-green-500 group hover:bg-green-600'>
            <Headings
              level={4}
              className='font-semibold text-sm text-center text-white '>
              {category}
            </Headings>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PartnerCategoryList;
