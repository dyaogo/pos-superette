import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlwPLfUi2Jgo8LblOSbgffquGr45fWvpg",
  authDomain: "pos-alimentation.firebaseapp.com",
  projectId: "pos-alimentation",
  storageBucket: "pos-alimentation.firebasestorage.app",
  messagingSenderId: "721107426869",
  appId: "1:721107426869:web:26a86f744b15c590e51b7c",
  measurementId: "G-DC5EZZ3GQ9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
