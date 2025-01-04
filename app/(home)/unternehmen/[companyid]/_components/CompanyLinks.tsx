// components/CompanyLinks.js
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { saveClick } from '@/actions/userActions';
import { CompanyType } from '@/types/RegisterTypye';

export default function CompanyLinks({ companyData } : {companyData: CompanyType}) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2">
          <Image
            alt="Unternehmens Email Icon"
            src="/icons/ic_round-mail.svg"
            height={32}
            width={32}
          />
          <Link href={`mailto:${companyData.email}`} className="hover:text-green-500" onClick={() => saveClick('email', companyData.id!)}>
            {companyData.email || 'Keine Email vorhanden.'}
          </Link>
        </p>
        <p className="flex items-center gap-2">
          <Image
            alt="Unternehmens Telefon Icon"
            src="/icons/ic_round-phone.svg"
            height={32}
            width={32}
          />
          <Link href={`tel:${companyData.companyNumber}`} className="hover:text-green-500" onClick={() => saveClick('phone', companyData.id!)}>
            {companyData.companyNumber || 'Keine Telefonnummer vorhanden.'}
          </Link>
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2">
          <Image
            alt="Unternehmens Webseite Icon"
            src="/icons/ri_computer-fill.svg"
            height={32}
            width={32}
          />
          <Link href={companyData.companyWebsite || ''} target="_blank" className="hover:text-green-500" onClick={() => saveClick('website', companyData.id!)}>
            {companyData.companyWebsite || 'Keine Webseite vorhanden.'}
          </Link>
        </p>
        <p className="flex items-center gap-2">
          <Image
            alt="Unternehmens Marker Icon"
            src="/icons/fa_map-marker.svg"
            height={22}
            width={22}
          />
          <span>{`${companyData.city || ''}, ${companyData.zip || ''}`}</span>
        </p>
      </div>
    </div>
  );
}
