"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { createApplication } from "@/actions/applicationActions";
import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Zod Schema for user-provided fields
const applicationSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  email: z.string().email("Ungültige E-Mail"),
  phone: z.string().optional(),
  message: z.string().min(1, "Nachricht erforderlich"),
  availableAt: z.string().min(1, "Verfügbarkeit erforderlich"),
  salary: z.string().min(1, "Gehaltsangabe erforderlich"),
  privacyAccepted: z
    .boolean()
    .refine((v) => v === true, "Datenschutz muss akzeptiert werden"),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobTitel?: string; // provided externally if needed
  onCreated?: (id: string) => void;
  maxFiles?: number;
}

export default function ApplicationForm({
  jobTitel,
  onCreated,
  maxFiles = 5,
}: ApplicationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = Array.from(e.target.files || []);
    if (selected.length > maxFiles) {
      setError(`Maximal ${maxFiles} Dateien erlaubt.`);
      return;
    }
    setFiles(selected);
  }

  async function uploadAllFiles(applicationId: string): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const storageRef = ref(
        storage,
        `applications/${applicationId}/${Date.now()}-${file.name}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      urls.push(url);
    }
    return urls;
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setError(null);
    setSuccess(null);
    if (files.length === 0) {
      setError("Mindestens eine Datei hochladen.");
      return;
    }
    setUploading(true);
    const applicationId = crypto.randomUUID();
    function getErrorMessage(e: unknown) {
      if (e instanceof Error) return e.message;
      try {
        return JSON.stringify(e);
      } catch {
        return String(e);
      }
    }

    try {
      const fileUrls = await uploadAllFiles(applicationId);
      const app = await createApplication({
        id: applicationId,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        message: data.message,
        availableAt: data.availableAt,
        salary: data.salary,
        files: fileUrls,
        jobTitel,
      });
      setSuccess("Bewerbung erfolgreich übermittelt.");
      reset();
      setFiles([]);
      onCreated?.(app.id);
    } catch (e: unknown) {
      console.error(e);
      setError(getErrorMessage(e) || "Fehler beim Absenden der Bewerbung.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className='flex flex-col gap-6 max-w-2xl w-full'>
      <h2 className='text-xl font-semibold'>Jetzt bewerben</h2>
      <p className='text-sm text-muted-foreground'>
        Bitte fülle alle Pflichtfelder aus und lade relevante Dateien hoch.
      </p>

      {/* Success / Error */}
      {success && (
        <div className='p-4 rounded-md border bg-green-50 text-green-700 text-sm'>
          {success}
        </div>
      )}
      {error && (
        <div className='p-4 rounded-md border bg-red-50 text-red-700 text-sm'>
          {error}
        </div>
      )}

      {/* Name */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>Name *</label>
        <input
          type='text'
          {...register("name")}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
          placeholder='Max Mustermann'
        />
        {errors.name && (
          <span className='text-xs text-red-600'>{errors.name.message}</span>
        )}
      </div>

      {/* Email */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>E-Mail *</label>
        <input
          type='email'
          {...register("email")}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder='name@beispiel.de'
        />
        {errors.email && (
          <span className='text-xs text-red-600'>{errors.email.message}</span>
        )}
      </div>

      {/* Phone (optional) */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>Telefon (optional)</label>
        <input
          type='text'
          {...register("phone")}
          className='border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 border-gray-300'
          placeholder='+49 170 ...'
        />
      </div>

      {/* Message */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>Nachricht / Motivation *</label>
        <textarea
          rows={6}
          {...register("message")}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            errors.message ? "border-red-500" : "border-gray-300"
          }`}
          placeholder='Warum passt du gut auf die Stelle?'
        />
        {errors.message && (
          <span className='text-xs text-red-600'>{errors.message.message}</span>
        )}
      </div>

      {/* Available At */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>Verfügbar ab *</label>
        <input
          type='text'
          {...register("availableAt")}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            errors.availableAt ? "border-red-500" : "border-gray-300"
          }`}
          placeholder='z.B. 01.02.2026 oder Sofort'
        />
        {errors.availableAt && (
          <span className='text-xs text-red-600'>
            {errors.availableAt.message}
          </span>
        )}
      </div>

      {/* Salary */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>Gehaltsvorstellung *</label>
        <input
          type='text'
          {...register("salary")}
          className={`border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            errors.salary ? "border-red-500" : "border-gray-300"
          }`}
          placeholder='z.B. 3200€ Brutto'
        />
        {errors.salary && (
          <span className='text-xs text-red-600'>{errors.salary.message}</span>
        )}
      </div>

      {/* Files */}
      <div className='flex flex-col gap-2'>
        <label className='text-sm font-medium'>
          Dateien (PDF, DOC, Bilder) *
        </label>
        <input
          type='file'
          multiple
          onChange={handleFileChange}
          accept='.pdf,.doc,.docx,.png,.jpg,.jpeg'
          className='text-sm'
          disabled={uploading}
        />
        <p className='text-xs text-muted-foreground'>
          Max. {maxFiles} Dateien. Lebenslauf, Zeugnisse, Referenzen etc.
        </p>
        {files.length > 0 && (
          <ul className='text-xs list-disc pl-4'>
            {files.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Privacy */}
      <div className='flex items-start gap-2'>
        <input
          type='checkbox'
          {...register("privacyAccepted")}
          id='privacyAccepted'
          disabled={uploading}
          className='mt-1'
        />
        <label htmlFor='privacyAccepted' className='text-sm'>
          Ich akzeptiere die Datenschutzerklärung und stimme der Verarbeitung
          meiner Daten zum Zweck der Bewerbung zu.*
        </label>
      </div>
      {errors.privacyAccepted && (
        <span className='text-xs text-red-600'>
          {errors.privacyAccepted.message}
        </span>
      )}

      <div className='flex items-center gap-4 pt-2'>
        <Button type='submit' disabled={uploading}>
          {uploading ? "Sendet…" : "Bewerbung absenden"}
        </Button>
        {uploading && (
          <span className='text-xs text-muted-foreground'>
            Dateien werden hochgeladen …
          </span>
        )}
      </div>
    </form>
  );
}
