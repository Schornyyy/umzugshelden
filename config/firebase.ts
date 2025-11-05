
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {getStorage} from "firebase/storage"


const firebaseConfig = {
  apiKey: "AIzaSyBaQQ2KWYefEL7SxxLooeljWxRWYvYFtP4",
  authDomain: "gs-templates.firebaseapp.com",
  projectId: "gs-templates",
  storageBucket: "gs-templates.firebasestorage.app",
  messagingSenderId: "887669918597",
  appId: "1:887669918597:web:de28477d9ab6d400b452ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);