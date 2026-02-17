// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAcfBVhdG83T9RN1BYnjoi__YxHd5DqML8",
  authDomain: "concesionario-aeb98.firebaseapp.com",
  projectId: "concesionario-aeb98",
  storageBucket: "concesionario-aeb98.firebasestorage.app",
  messagingSenderId: "1099323012096",
  appId: "1:1099323012096:web:ab6a81903a99a267c414e5",
  measurementId: "G-VLER2F817C"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
