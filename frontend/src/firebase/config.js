// src/firebase/firebase.js

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCgMAxSU6iDxVyIzoSIMneRAt5CcyN2LXc",
  authDomain: "quiz-312c5.firebaseapp.com",
  databaseURL: "https://quiz-312c5-default-rtdb.firebaseio.com",
  projectId: "quiz-312c5",
  storageBucket: "quiz-312c5.firebasestorage.app",
  messagingSenderId: "368487416269",
  appId: "1:368487416269:web:7c5f3dc28433d24c658484",
  measurementId: "G-73J5CQRW43"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Realtime Database
export const db = getDatabase(app);

// Firebase Storage
export const storage = getStorage(app);

export default app;