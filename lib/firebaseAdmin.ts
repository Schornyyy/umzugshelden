import "server-only";

import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  const existingApp = getApps()[0];
  if (existingApp) return existingApp;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const applicationCredentials =
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (applicationCredentials) {
    return initializeApp({ credential: applicationDefault(), projectId });
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  }

  return initializeApp({ credential: applicationDefault(), projectId });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDatabase() {
  return getFirestore(getAdminApp());
}