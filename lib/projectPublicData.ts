import "server-only";

import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { PROJECT_COLLECTION, serializeProject } from "@/lib/projects";
import type { Project } from "@/types/project/Project";

export async function listPublishedProjects(): Promise<Project[]> {
  const snapshot = await getAdminDatabase()
    .collection(PROJECT_COLLECTION)
    .where("published", "==", true)
    .get();
  return snapshot.docs
    .map((document) => serializeProject(document.id, document.data()))
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function getPublishedProject(slug: string): Promise<Project | null> {
  const snapshot = await getAdminDatabase()
    .collection(PROJECT_COLLECTION)
    .where("slug", "==", slug)
    .where("published", "==", true)
    .limit(1)
    .get();
  const document = snapshot.docs[0];
  return document ? serializeProject(document.id, document.data()) : null;
}
