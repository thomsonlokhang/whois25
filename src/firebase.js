// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// 請確保以下係你自己嘅 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDjffbR_es9_oOmWgwFwCzk-oC6I5uRDz0",
  authDomain: "whois25-game.firebaseapp.com",
  databaseURL: "https://whois25-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "whois25-game",
  storageBucket: "whois25-game.firebasestorage.app",
  messagingSenderId: "974947597581",
  appId: "1:974947597581:web:f96e537bdef1a89193c444"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// 只 export database（唔使 analytics）
export const database = getDatabase(app);