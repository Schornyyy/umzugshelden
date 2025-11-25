"use server";
import { database } from "@/config/firebase";
import { Application, ApplicationNote } from "@/types/Applications";
import { and, collection, deleteDoc, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";

const APPLICATION_COLLECTION = "applications";

export interface CreateApplicationInput {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  availableAt: string;
  salary: string;
  files: string[]; // uploaded file URLs
  jobTitel?: string; // provided by context, not user input
}

export async function createApplication(data: CreateApplicationInput): Promise<Application> {
  const ownerId = process.env.NEXT_PUBLIC_OWNERID;
  if (!ownerId) throw new Error("OwnerId nicht konfiguriert.");

  // Firestore akzeptiert keine undefined Felder -> optionale Felder nur setzen wenn vorhanden
  const base: Application = {
    id: data.id,
    ownerId,
    name: data.name,
    email: data.email,
    message: data.message,
    status: 'pending',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    jobTitel: data.jobTitel || '',
    notes: [] as ApplicationNote[],
    files: data.files,
    availableAt: data.availableAt,
    salary: data.salary,
  };

  const application: Application = data.phone ? { ...base, phone: data.phone } : base;

  const colRef = collection(database, APPLICATION_COLLECTION);
  await setDoc(doc(colRef, application.id), application);
  return application;
}

// List all applications for an owner
export async function listApplicationsByOwner(ownerId: string): Promise<Application[]> {
  const colRef = collection(database, APPLICATION_COLLECTION);
  const qRef = query(colRef, where("ownerId", "==", ownerId));
  const docs = await getDocs(qRef);
  if (docs.empty) return [];
  return docs.docs.map(d => d.data() as Application);
}

// Get single application by id + owner
export async function getApplicationById(id: string, ownerId: string): Promise<Application | null> {
  const colRef = collection(database, APPLICATION_COLLECTION);
  const qRef = query(colRef, and(where("id", "==", id), where("ownerId", "==", ownerId)));
  const docs = await getDocs(qRef);
  if (docs.empty) return null;
  return docs.docs[0].data() as Application;
}

// Update status
export async function updateApplicationStatus(id: string, ownerId: string, status: Application["status"]): Promise<Application | null> {
  const existing = await getApplicationById(id, ownerId);
  if (!existing) return null;
  const updated: Application = { ...existing, status, updatedAt: Date.now() };
  const colRef = collection(database, APPLICATION_COLLECTION);
  await updateDoc(doc(colRef, id), { status: updated.status, updatedAt: updated.updatedAt });
  return updated;
}

// Generic update (message, salary, availableAt)
export async function updateApplicationFields(id: string, ownerId: string, patch: Partial<Pick<Application, "message" | "salary" | "availableAt">>): Promise<Application | null> {
  const existing = await getApplicationById(id, ownerId);
  if (!existing) return null;
  const updated: Application = {
    ...existing,
    message: patch.message ?? existing.message,
    salary: patch.salary ?? existing.salary,
    availableAt: patch.availableAt ?? existing.availableAt,
    updatedAt: Date.now(),
  };
  const colRef = collection(database, APPLICATION_COLLECTION);
  await updateDoc(doc(colRef, id), { message: updated.message, salary: updated.salary, availableAt: updated.availableAt, updatedAt: updated.updatedAt });
  return updated;
}

// Add note
export async function addApplicationNote(id: string, ownerId: string, note: { titel: string; msg: string }): Promise<Application | null> {
  const existing = await getApplicationById(id, ownerId);
  if (!existing) return null;
  const newNote: ApplicationNote = { titel: note.titel, msg: note.msg, createdAt: Date.now() };
  const updated: Application = { ...existing, notes: [...existing.notes, newNote], updatedAt: Date.now() };
  const colRef = collection(database, APPLICATION_COLLECTION);
  await updateDoc(doc(colRef, id), { notes: updated.notes, updatedAt: updated.updatedAt });
  return updated;
}

// Delete application
export async function deleteApplication(id: string, ownerId: string): Promise<{ id: string } | null> {
  const existing = await getApplicationById(id, ownerId);
  if (!existing) return null;
  const colRef = collection(database, APPLICATION_COLLECTION);
  await deleteDoc(doc(colRef, id));
  return { id };
}
