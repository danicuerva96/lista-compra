import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRxPLtrk-ZX6BfkGh6x-ir4Cu4uy_bfv4",
  authDomain: "lista-compra-61585.firebaseapp.com",
  projectId: "lista-compra-61585",
  storageBucket: "lista-compra-61585.firebasestorage.app",
  messagingSenderId: "53717226444",
  appId: "1:53717226444:web:5af4b2efb08540321cc369",
  measurementId: "G-9L39NXZXCQ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
