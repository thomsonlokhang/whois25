// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjffbR_es9_oOmWgwFwCzk-oC6I5uRDz0",
  authDomain: "whois25-game.firebaseapp.com",
  databaseURL: "https://whois25-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "whois25-game",
  storageBucket: "whois25-game.firebasestorage.app",
  messagingSenderId: "974947597581",
  appId: "1:974947597581:web:f96e537bdef1a89193c444",
  measurementId: "G-QQKSDTJZJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);