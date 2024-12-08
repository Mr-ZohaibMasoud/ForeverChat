// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBuMPfXNJf1EaTWRTKZarjcPPOyHMetnug",
    authDomain: "foreverchat-09.firebaseapp.com",
    projectId: "foreverchat-09",
    storageBucket: "foreverchat-09.firebasestorage.app",
    messagingSenderId: "755931252190",
    appId: "1:755931252190:web:1a191cfdb85d4a3e1e494f",
    measurementId: "G-EJ20FB65TJ"  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
const auth = getAuth(app);

// Firestore Database
const firestore = getFirestore(app);

export { auth, firestore, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };
