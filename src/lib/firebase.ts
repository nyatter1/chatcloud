import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDpW-zMDJW1BKIz09QPVjh01BeB5oKNOac",
  authDomain: "novachat-4ee7a.firebaseapp.com",
  projectId: "novachat-4ee7a",
  storageBucket: "novachat-4ee7a.firebasestorage.app",
  messagingSenderId: "395567082476",
  appId: "1:395567082476:web:4fb4c1f60c9ed9ef426ec9",
  measurementId: "G-MW6NW8ZF67",
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
export const db = getFirestore(app);

export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
};
