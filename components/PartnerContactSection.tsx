"use client";
import { Laptop2Icon, MailIcon, Phone, UserCircle2Icon } from "lucide-react";
import Link from "next/link";
import React from "react";

async function track(partnerId: string, type: "website" | "email" | "phone") {
  try {
    await fetch(`/api/partner-interaction?pid=${partnerId}&t=${type}`, {
      method: "POST",
    });
  } catch {}
}

interface Props {
  partnerId: string;
  contactPerson?: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
}

export function PartnerContactSection({
  partnerId,
  contactPerson,
  website,
  email,
  phone,
}: Props) {
  return (
    <div className='mt-4 text-slate-600 flex flex-col gap-3'>
      <p className='flex flex-row gap-2'>
        <UserCircle2Icon className='text-green-600' height={24} width={24} />
        {contactPerson}
      </p>
      {website && (
        <Link
          onClick={() => track(partnerId, "website")}
          className='flex flex-row gap-2 text-green-500 hover:text-green-400'
          href={website}>
          <Laptop2Icon className='text-green-600' height={24} width={24} />
          {website}
        </Link>
      )}
      {email && (
        <Link
          onClick={() => track(partnerId, "email")}
          className='flex flex-row gap-2 text-green-500 hover:text-green-400'
          href={`mailto:${email}`}>
          <MailIcon className='text-green-600' height={24} width={24} />
          {email}
        </Link>
      )}
      <button
        onClick={() => phone && track(partnerId, "phone")}
        disabled={!phone}
        className='flex flex-row gap-2 text-left text-green-600 disabled:text-slate-400'>
        <Phone className='text-green-600' height={24} width={24} />
        {phone || "Keine Telefonnummer vorhanden"}
      </button>
    </div>
  );
}
