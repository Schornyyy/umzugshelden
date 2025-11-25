
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {getStorage} from "firebase/storage"


const firebaseConfig = {
  apiKey: "AIzaSyBYUdfLuf5xfEmbzqF9w6DtULVuTdRuOUs",
  authDomain: "nextjs-jobsmith.firebaseapp.com",
  projectId: "nextjs-jobsmith",
  storageBucket: "nextjs-jobsmith.appspot.com",
  messagingSenderId: "20216257290",
  appId: "1:20216257290:web:a5a09db039cf5f916838f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);