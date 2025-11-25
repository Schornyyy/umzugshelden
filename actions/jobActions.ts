"use server"

import { database } from "@/config/firebase"
import { Job } from "@/types/Job";
import {  and, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore"

const JOB_COLLECTION = "jobs"


export async function createJob(ownerId: string, titel: string, jobArt: "vollzeit" | "teilzeit" | "aushilfe" | "praktikum" | "ferienjob"): Promise<Job> {

    const colRef = collection(database, JOB_COLLECTION);

    const job: Job = {
        id: crypto.randomUUID(),
        ownerId: ownerId,
        titel: titel,
        active: false,
        jobArt: jobArt,
    } 

    await setDoc(doc(colRef, job.id), job)

    return job;
}

export async function getJobById(jobId: string, ownerId: string): Promise<Job | null> {

    const colRef = collection(database, JOB_COLLECTION);
    const queryRef = query(colRef, and(where("id", "==", jobId), where("ownerId", "==", ownerId)));
    const jobsDocsRef = await getDocs(queryRef)


    if(jobsDocsRef.docs.length == 0) return null;

    return jobsDocsRef.docs[0].data() as Job
 }


export async function deleteJob(jobId: string): Promise<{id: string}> {

    const colRef = collection(database, JOB_COLLECTION);
    const docRef = doc(colRef, jobId)


    await deleteDoc(docRef);


    return {id: jobId};
}

export async function updateJob(jobId: string, newJob: Job): Promise<Job | null> {

    const colRef = collection(database, JOB_COLLECTION);
    const docRef = doc(colRef, newJob.id);

    if(!docRef) return null;

    await updateDoc(docRef, {...newJob})
    return newJob
}

export async function getAllJobsbyOwnerId(ownerId: string): Promise<Job[]> {

    const colRef = collection(database, JOB_COLLECTION);
    const queryRef = query(colRef, where("ownerId", "==", ownerId));
    const jobDocsRef = await getDocs(queryRef);

    if(jobDocsRef.docs.length == 0) return []

    const list: Job[] = [];

    jobDocsRef.docs.forEach((job) => {
        list.push(job.data() as Job)
    })

    return list;

}