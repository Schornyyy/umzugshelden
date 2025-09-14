"use client";

import React, { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { v4 as uuid } from "uuid";
import {
  createAccountInDatabase,
  findAccountByEmail,
} from "@/actions/AccountActions";
import {
  createPartnerProfile,
  findPartnerByOwnerId,
} from "@/actions/partnerActions";
import { Account } from "@/types/AccountType";
import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

const schema = z.object({
  contactPerson: z.string().min(2, "Bitte Ansprechpartner angeben"),
  website: z
    .string()
    .url("Bitte gültige URL eingeben")
    .optional()
    .or(z.literal("")),
  phone: z.string().min(6, "Bitte gültige Telefonnummer angeben"),
  email: z.string().email("Bitte gültige E-Mail-Adresse angeben"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
});

type PartnerInputs = z.infer<typeof schema>;

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerInputs>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: PartnerInputs) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const existing = await findAccountByEmail(values.email);
      let account: Account;
      if (!existing) {
        await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        account = {
          id: uuid(),
          email: values.email,
          role: "partner",
          phone: values.phone,
        };
        await createAccountInDatabase(account, "partner");
      } else {
        account = existing;
      }

      const partner = await findPartnerByOwnerId(account.id);
      if (!partner) {
        await createPartnerProfile({
          ownerid: account.id,
          email: values.email,
          contactPerson: values.contactPerson,
          website: values.website || undefined,
          phone: values.phone,
        });
      }
      router.push(`/partner/${account.id}`);
    } catch (e) {
      alert("Registrierung fehlgeschlagen");
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white p-6 rounded shadow-md w-full max-w-md'>
        <h1 className='text-xl font-bold mb-4'>Partner registrieren</h1>

        <label className='block text-gray-700 mb-1'>Ansprechpartner</label>
        <input
          className='w-full px-3 py-2 border rounded mb-2'
          {...register("contactPerson")}
        />
        {errors.contactPerson && (
          <p className='text-red-500 text-sm'>{errors.contactPerson.message}</p>
        )}

        <label className='block text-gray-700 mb-1'>Website</label>
        <input
          className='w-full px-3 py-2 border rounded mb-2'
          placeholder='https://example.com'
          {...register("website")}
        />
        {errors.website && (
          <p className='text-red-500 text-sm'>{errors.website.message}</p>
        )}

        <label className='block text-gray-700 mb-1'>Telefonnummer</label>
        <input
          className='w-full px-3 py-2 border rounded mb-2'
          {...register("phone")}
        />
        {errors.phone && (
          <p className='text-red-500 text-sm'>{errors.phone.message}</p>
        )}

        <label className='block text-gray-700 mb-1'>E-Mail</label>
        <input
          className='w-full px-3 py-2 border rounded mb-2'
          {...register("email")}
        />
        {errors.email && (
          <p className='text-red-500 text-sm'>{errors.email.message}</p>
        )}

        <label className='block text-gray-700 mb-1'>Passwort</label>
        <input
          type='password'
          className='w-full px-3 py-2 border rounded mb-4'
          {...register("password")}
        />
        {errors.password && (
          <p className='text-red-500 text-sm'>{errors.password.message}</p>
        )}

        <button
          disabled={submitting}
          type='submit'
          className='w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60'>
          {submitting ? "Wird gesendet…" : "Registrieren"}
        </button>
      </form>
    </div>
  );
}
