"use client";

import { deleteJob, updateJob } from "@/actions/jobActions";
import { redirectUser } from "@/actions/userActions";
import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Job } from "@/types/Job";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { RichTextEditor } from "@/components/RichTextEditor";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function JobEditClient({
  initialJob,
  userid,
}: {
  initialJob: Job | null;
  userid: string;
}) {
  const [job, setJob] = useState<Job | null>(initialJob);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | undefined>();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();

  const jobSchema = z.object({
    titel: z.string().min(1, { message: "Titel erforderlich" }),
    shortText: z.string().optional(),
    text: z.string().optional(),
    active: z.boolean().optional(),
  });

  type JobFormData = z.infer<typeof jobSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      titel: initialJob?.titel ?? "",
      shortText: initialJob?.shortText ?? "",
      text: initialJob?.text ?? "",
      active: initialJob?.active ?? false,
    },
  });

  useEffect(() => {
    // Falls initialJob nachträglich kommt/ändert, Formular synchronisieren
    reset({
      titel: initialJob?.titel ?? "",
      shortText: initialJob?.shortText ?? "",
      text: initialJob?.text ?? "",
      active: initialJob?.active ?? false,
    });
    setJob(initialJob);
  }, [initialJob, reset]);

  const onSubmit = async (data: JobFormData) => {
    if (!job) return;

    setSaving(true);
    setSaveError(undefined);
    setSaveSuccess(false);

    try {
      const updatedJob: Job = {
        ...job, // behält id und ownerId
        titel: data.titel,
        shortText: data.shortText || undefined,
        text: data.text || undefined,
        active: data.active ?? false,
      };

      const result = await updateJob(job.id, updatedJob);
      if (result) {
        setJob(result);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError("Job konnte nicht aktualisiert werden.");
      }
    } catch (error) {
      console.error("Update error:", error);
      setSaveError("Ein Fehler ist aufgetreten.");
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    redirectUser(`/admin/${userid}/jobs`);
  };

  const onDelete = async () => {
    if (!job) return;
    const ok = window.confirm(
      "Diesen Job wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
    );
    if (!ok) return;

    setDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteJob(job.id);
      redirectUser(`/admin/${userid}/jobs`);
    } catch (error) {
      console.error("Delete error:", error);
      setDeleteError("Job konnte nicht gelöscht werden.");
      setDeleting(false);
    }
  };

  if (!job) {
    return (
      <div className='flex flex-col gap-6'>
        <p className='text-xl font-bold text-red-600'>Job nicht gefunden</p>
        <Button onClick={goBack} variant='outline' className='w-fit'>
          <ArrowLeftIcon className='mr-2 h-4 w-4' />
          Zurück zur Übersicht
        </Button>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-12'>
      {/* Header */}
      <div className='flex flex-col gap-3'>
        <div className='flex items-center gap-4'>
          <Button onClick={goBack} variant='outline' size='sm'>
            <ArrowLeftIcon className='mr-2 h-4 w-4' />
            Zurück
          </Button>
          <Headings level={3}>Job bearbeiten</Headings>
        </div>
        <p className='text-gray-600'>
          Bearbeite die Details für &ldquo;{job.titel}&rdquo;
        </p>
      </div>

      <Separator />

      {/* Form */}
      <div className='max-w-2xl'>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          {/* Success Message */}
          {saveSuccess && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-md'>
              <p className='text-green-800 text-sm'>
                ✓ Job wurde erfolgreich gespeichert!
              </p>
            </div>
          )}

          {/* Error Message */}
          {saveError && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800 text-sm'>{saveError}</p>
            </div>
          )}

          {deleteError && (
            <div className='p-4 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800 text-sm'>{deleteError}</p>
            </div>
          )}

          {/* Job Titel */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Job Titel *
            </label>
            <input
              type='text'
              {...register("titel")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.titel ? "border-red-500" : "border-gray-300"
              }`}
              placeholder='z.B. Frontend Developer'
            />
            {errors.titel && (
              <p className='text-red-500 text-sm'>{errors.titel.message}</p>
            )}
          </div>

          {/* Kurzbeschreibung */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Kurzbeschreibung
            </label>
            <textarea
              {...register("shortText")}
              rows={3}
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20'
              placeholder='Kurze Zusammenfassung der Position...'
            />
          </div>

          {/* Vollständige Beschreibung (Rich Text) */}
          <div className='flex flex-col gap-2'>
            <label className='text-sm font-medium text-gray-700'>
              Vollständige Beschreibung
            </label>
            <RichTextEditor
              field={{
                onChange: (val: string) => {
                  setValue("text", val, { shouldDirty: true });
                },
              }}
              defaultValue={job.text ? job.text : ""}
            />
            <input type='hidden' {...register("text")} />
          </div>

          {/* Aktiv Status */}
          <div className='flex items-center gap-3'>
            <input
              type='checkbox'
              {...register("active")}
              id='active'
              className='h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'
            />
            <label
              htmlFor='active'
              className='text-sm font-medium text-gray-700'>
              Job ist aktiv und öffentlich sichtbar
            </label>
          </div>

          {/* Submit Button */}
          <div className='flex gap-4 pt-4'>
            <Button
              type='submit'
              disabled={saving || deleting}
              className='flex items-center gap-2'>
              <SaveIcon className='h-4 w-4' />
              {saving ? "Speichert..." : "Änderungen speichern"}
            </Button>

            <Button
              type='button'
              variant='outline'
              onClick={goBack}
              disabled={saving || deleting}>
              Abbrechen
            </Button>

            <Button
              type='button'
              variant='destructive'
              onClick={onDelete}
              disabled={saving || deleting}
              className='ml-auto'>
              <Trash2Icon className='h-4 w-4' />
              {deleting ? "Löscht..." : "Job löschen"}
            </Button>
          </div>
        </form>
      </div>

      {/* Job Info */}
      <div className='max-w-2xl pt-8 border-t'>
        <Headings level={4} className='mb-4'>
          Job Informationen
        </Headings>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <span className='font-medium text-gray-700'>Job ID:</span>
            <p className='text-gray-600 font-mono'>{job.id}</p>
          </div>
          <div>
            <span className='font-medium text-gray-700'>Status:</span>
            <p
              className={`font-medium ${
                job.active ? "text-green-600" : "text-gray-500"
              }`}>
              {job.active ? "Aktiv" : "Inaktiv"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
