import React from 'react';
import { CompanyType } from '@/types/RegisterTypye';
import Image from 'next/image';
import Link from 'next/link';
import { saveClick } from '@/actions/userActions';

interface SearchBarResultsProps {
  results: CompanyType[];
  loading: boolean;
}

const SearchBarResults: React.FC<SearchBarResultsProps> = ({ results, loading }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-2">Ergebnisse</h3>
      {loading ? (
        <p>Lade Ergebnisse...</p>
      ) : results.length > 0 ? (
        <ul className="space-y-6 md:space-y-2">
          {results.map((company) => (
            <div key={company.id} className='border p-4 rounded-lg grid grid-rows-2 md:grid-cols-2 w-full items-center justify-center'>
              {company.images!.length > 0 ? (
                <Image alt={company.companyName!} src={company.images![0]} width={250} height={250} className='object-contain rounded-xl '  />
              ) : (
                <Image alt={company.companyName!} src={"/images/default_company.png"} width={250} height={250} className='object-contain rounded-xl '  />
              )}
              <div className='flex flex-col gap-4'>
                <h4 className='font-semibold text-2xl'>
                  {company.companyName}
                </h4>
                <p className="text-black max-h-[250px] overflow-hidden overflow-ellipsis line-clamp-4">
                  {company.description}
                </p>
                <p className='text-gray-700'>
                  {company.city}, {company.zip}
                </p>
                <Link href={"/unternehmen/" + company.id} className='py-2 px-4 text-white bg-green-500 rounded-lg hover:bg-green-600 w-fit md:self-end' onClick={() => saveClick("company", company.id!)}>
                Unternehmen Ansehen
                </Link>
              </div>
            </div>
          ))}
        </ul>
      ) : (
        <p>Keine Ergebnisse gefunden.</p>
      )}
    </div>
  );
};

export default SearchBarResults;
