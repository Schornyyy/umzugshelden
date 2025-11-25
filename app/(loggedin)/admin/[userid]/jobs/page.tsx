"use client";

import { createJob, getAllJobsbyOwnerId } from "@/actions/jobActions";
import { redirectUser } from "@/actions/userActions";
import Headings from "@/components/Headings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import { Job } from "@/types/Job";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, PlusIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { companyData } = useCompanyData();

  useEffect(() => {
    if (!companyData) return;

    async function loadJobs() {
      setLoading(true);
      if (companyData) {
        try {
          const jobs = await getAllJobsbyOwnerId(companyData.id);
          setJobs(jobs);
        } catch (error) {
          console.log(error);
        } finally {
          setLoading(false);
        }
      }
    }
    loadJobs();
  }, [companyData]);

  const navigateToJob = (jobid: string) => {
    redirectUser(`/admin/${companyData?.id}/jobs/${jobid}`);
  };

  if (loading) {
    return <p className='text-xl font-bold'>Daten werden geladen...</p>;
  }

  return (
    <div className='flex flex-col gap-12'>
      <div className='flex flex-col gap-3'>
        <Headings level={3}>Alle Job Ausschreibungen auf einem Blick</Headings>
        <p>Verwalte alle deine Job Angebot direkt auf einem Ort.</p>
        {companyData && (
          <JobDialog
            ownerid={companyData.id}
            onCreated={(job) =>
              setJobs((prev) => {
                // Falls Job bereits existiert (Race Condition) nicht doppelt hinzufügen
                if (prev.some((j) => j.id === job.id)) return prev;
                return [...prev, job];
              })
            }
          />
        )}
      </div>
      <Separator />
      <div className='flex flex-col gap-3'>
        <Headings level={4}>Alle Jobs</Headings>
        {jobs.map((job) => (
          <div
            key={job.id}
            className='w-full p-4 shadow-md rounded-md bg-white flex flex-row justify-between max-w-3xl'>
            <div className='flex flex-col'>
              <Headings level={4}>{job.titel}</Headings>
            </div>
            <div className='flex flex-col justify-end items-end'>
              <Button
                variant={"ghost"}
                size={"icon"}
                className='text-primary hover:bg-green-50 hover:text-primary/90'
                onClick={() => navigateToJob(job.id)}>
                <EyeIcon />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobsPage;

const JobDialog = ({
  ownerid,
  onCreated,
}: {
  ownerid: string;
  onCreated: (job: Job) => void;
}) => {
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);

  const jobSchema = z.object({
    titel: z.string().min(1, { message: "Titel erforderlich" }),
  });

  type jobSchemaInput = z.infer<typeof jobSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<jobSchemaInput>({
    resolver: zodResolver(jobSchema),
  });

  const onSubmit = async (data: jobSchemaInput) => {
    setLoading(true);
    setFormError(undefined);
    try {
      const created = await createJob(ownerid, data.titel);
      onCreated(created);
      reset();
      setOpen(false);
    } catch {
      setFormError("Job konnte nicht erstellt werden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className='w-fit flex flex-row gap-2'>
          Job erstellen <PlusIcon color='white' width={24} height={24} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Job Erstellen</DialogTitle>
          <DialogDescription>
            Erstelle einen Job und schalte ihn auf deiner Website live.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
          {formError && (
            <div className='mb-4 text-red-500 text-sm' role='alert'>
              {formError}
            </div>
          )}

          <div className='flex flex-col'>
            <label className='text-gray-700'>Job Titel</label>
            <input
              type='text'
              {...register("titel")}
              className={`w-full px-3 py-2 border rounded ${
                errors.titel ? "border-red-500" : "border-gray-300"
              }`}
            />
          </div>

          <button
            type='submit'
            disabled={loading}
            className='w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:opacity-60'>
            {loading ? "Job wird erstellt…" : "Job erstellen"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
