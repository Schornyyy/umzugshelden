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
import { Account } from "@/types/AccountType";
import { auth } from "@/config/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { createPartner, getPartner } from "@/actions/partnerActions";

const fullSchema = z.object({
  contactPerson: z.string().min(2, "Bitte Ansprechpartner angeben"),
  email: z.string().email("Bitte gültige E-Mail-Adresse angeben"),
  phone: z.string().min(6, "Bitte gültige Telefonnummer angeben"),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
  companyName: z.string().min(2, "Bitte Firmenname angeben"),
  street: z.string().optional().or(z.literal("")),
  zip: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  website: z
    .string()
    .url("Bitte gültige URL eingeben")
    .optional()
    .or(z.literal("")),
  companyBenefits: z.string().optional().or(z.literal("")),
  shortDescription: z
    .string()
    .max(300, "Max 300 Zeichen")
    .optional()
    .or(z.literal("")),
});

type PartnerInputs = z.infer<typeof fullSchema>;

const steps: {
  key: string;
  title: string;
  fields: (keyof PartnerInputs)[];
}[] = [
  {
    key: "contact",
    title: "Kontakt",
    fields: ["contactPerson", "email", "phone", "password"],
  },
  {
    key: "company",
    title: "Firma",
    fields: ["companyName", "street", "zip", "city"],
  },
  {
    key: "infos",
    title: "Infos",
    fields: ["website", "companyBenefits", "shortDescription"],
  },
];

export default function PartnerRegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<PartnerInputs>({
    resolver: zodResolver(fullSchema),
    mode: "onBlur",
  });

  const isLast = step === steps.length - 1;

  async function next() {
    const currentFields = steps[step].fields;
    const ok = await trigger(
      currentFields as unknown as (keyof PartnerInputs)[],
      { shouldFocus: true }
    );
    if (ok) setStep((s) => Math.min(s + 1, steps.length - 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

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
      } else account = existing;

      const partner = await getPartner(account.id);
      if (!partner) {
        await createPartner({
          id: account.id,
          contact: {
            person: values.contactPerson,
            email: values.email,
            phone: values.phone,
          },
          company: {
            name: values.companyName,
            street: values.street || undefined,
            zip: values.zip || undefined,
            city: values.city || undefined,
          },
          infos: { website: values.website || "", logoPath: undefined },
          companyBenefits: values.companyBenefits || "",
          shortDescription: values.shortDescription || undefined,
          active: false,
          priority: 100,
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

  const Field: React.FC<{
    label: string;
    name: keyof PartnerInputs;
    type?: string;
    placeholder?: string;
  }> = ({ label, name, type = "text", placeholder }) => (
    <div className='mb-4'>
      <label className='block text-gray-700 mb-1'>{label}</label>
      {type === "textarea" ? (
        <textarea
          placeholder={placeholder}
          className='w-full px-3 py-2 border rounded'
          {...register(name)}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          className='w-full px-3 py-2 border rounded'
          {...register(name)}
        />
      )}
      {errors[name] && (
        <p className='text-red-500 text-sm'>{errors[name]?.message}</p>
      )}
    </div>
  );

  const stepConfig = steps[step];

  return (
    <div className='min-h-[75vh] flex items-center justify-center bg-gray-100'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='bg-white p-6 rounded shadow-md w-full max-w-xl'>
        <h1 className='text-xl font-bold mb-4'>Partner registrieren</h1>

        <div className='flex items-center mb-6 text-sm font-medium'>
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <div
                className={`flex items-center ${
                  i === step
                    ? "text-green-600"
                    : i < step
                    ? "text-green-500"
                    : "text-gray-400"
                }`}>
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full border mr-2 ${
                    i <= step ? "border-green-600" : "border-gray-300"
                  }`}>
                  {i + 1}
                </span>
                {s.title}
              </div>
              {i < steps.length - 1 && (
                <div className='flex-1 h-px mx-2 bg-gray-300' />
              )}
            </React.Fragment>
          ))}
        </div>

        {stepConfig.key === "contact" && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='Ansprechpartner' name='contactPerson' />
            <Field label='E-Mail' name='email' />
            <Field label='Telefon' name='phone' />
            <Field label='Passwort' name='password' type='password' />
          </div>
        )}
        {stepConfig.key === "company" && (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Field label='Firmenname' name='companyName' />
            <Field label='Straße' name='street' />
            <Field label='PLZ' name='zip' />
            <Field label='Stadt' name='city' />
          </div>
        )}
        {stepConfig.key === "infos" && (
          <div className='flex flex-col gap-4'>
            <Field
              label='Website'
              name='website'
              placeholder='https://example.com'
            />
            <Field
              label='Vorteile / Benefits'
              name='companyBenefits'
              type='textarea'
            />
            <Field
              label='Kurzbeschreibung'
              name='shortDescription'
              type='textarea'
            />
          </div>
        )}

        <div className='mt-8 flex justify-between'>
          <button
            type='button'
            onClick={back}
            disabled={step === 0 || submitting}
            className='px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50'>
            Zurück
          </button>
          {!isLast && (
            <button
              type='button'
              onClick={next}
              disabled={submitting}
              className='px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60'>
              Weiter
            </button>
          )}
          {isLast && (
            <button
              disabled={submitting}
              type='submit'
              className='px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60'>
              {submitting ? "Wird gesendet…" : "Abschließen"}
            </button>
          )}
        </div>

        {isLast && (
          <p className='text-xs text-gray-500 mt-4'>
            Mit dem Absenden wird Ihr Konto erstellt und zur Prüfung
            eingereicht.
          </p>
        )}
      </form>
    </div>
  );
}
