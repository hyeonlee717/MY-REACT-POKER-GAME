// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

// Firebase 설정 객체
const firebaseConfig = {
  apiKey: "AIzaSyCFzSySpL_CaAElfRSu4axxrYzVWkqEtfo",
  authDomain: "my-react-poker-game.firebaseapp.com",
  projectId: "my-react-poker-game",
  storageBucket: "my-react-poker-game.appspot.com",
  messagingSenderId: "720953920556",
  appId: "1:720953920556:web:eadd9cfe85f1d5621a9589",
  measurementId: "G-CZMFEW9DRL"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Firebase Realtime Database 초기화
const analytics = getAnalytics(app);

// database를 export
export { database };
