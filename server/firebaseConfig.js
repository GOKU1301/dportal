const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");

// Replace with your Firebase project config
const firebaseConfig = {
    apiKey: "AIzaSyAvAyazTVHV375ZSfBv2xj0yOEqv6Sohnk",
    authDomain: "student-chat-app-1e8d6.firebaseapp.com",
    projectId: "student-chat-app-1e8d6",
    storageBucket: "student-chat-app-1e8d6.firebasestorage.app",
    messagingSenderId: "1055604134555",
    appId: "1:1055604134555:web:808b5f8be22453dfc8ac3e"
  };
// Initialize Firebase App
const firebaseApp = initializeApp(firebaseConfig);

// Get Firestore Database Instance
const db = getFirestore(firebaseApp);

module.exports = db;
