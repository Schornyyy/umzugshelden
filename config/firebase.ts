
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore";
import {getAuth} from "firebase/auth";
import {getStorage} from "firebase/storage"


const firebaseConfig = {
  apiKey: "AIzaSyA442lHya1rJ4xvG_EpFWZAXATMRalqY4Q",
  authDomain: "gym-crm-6216d.firebaseapp.com",
  databaseURL: "https://gym-crm-6216d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "gym-crm-6216d",
  storageBucket: "gym-crm-6216d.appspot.com",
  messagingSenderId: "248617571191",
  appId: "1:248617571191:web:42eaad09c1da08ab2d0772"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);