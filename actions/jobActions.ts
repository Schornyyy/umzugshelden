"use server"

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { Job } from "@/types/Job";

const JOB_COLLECTION = "jobs_umzugshelden"


export async function createJob(ownerId: string, titel: string, jobArt: "vollzeit" | "teilzeit" | "aushilfe" | "praktikum" | "ferienjob"): Promise<Job> {

    const job: Job = {
        id: crypto.randomUUID(),
        ownerId: ownerId,
        titel: titel,
        active: false,
        jobArt: jobArt,
    } 

    await getAdminDatabase().collection(JOB_COLLECTION).doc(job.id).set(job);

    return job;
}

export async function getJobById(jobId: string, ownerId: string): Promise<Job | null> {

    const jobDocument = await getAdminDatabase()
        .collection(JOB_COLLECTION)
        .doc(jobId)
        .get();
    if (!jobDocument.exists) return null;
    const job = jobDocument.data() as Job;
    return job.ownerId === ownerId ? job : null;
 }


export async function deleteJob(jobId: string): Promise<{id: string}> {

    await getAdminDatabase().collection(JOB_COLLECTION).doc(jobId).delete();


    return {id: jobId};
}

export async function updateJob(jobId: string, newJob: Job): Promise<Job | null> {

    await getAdminDatabase()
        .collection(JOB_COLLECTION)
        .doc(newJob.id)
        .update({ ...newJob });
    return newJob
}

export async function getAllJobsbyOwnerId(ownerId: string): Promise<Job[]> {

    const jobDocsRef = await getAdminDatabase()
        .collection(JOB_COLLECTION)
        .where("ownerId", "==", ownerId)
        .get();

    if(jobDocsRef.docs.length == 0) return []

    const list: Job[] = [];

    jobDocsRef.docs.forEach((job) => {
        list.push(job.data() as Job)
    })

    return list;

}