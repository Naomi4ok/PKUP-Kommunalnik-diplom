// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNwTQNxn5vTqqPp9tqo1pHDDuxyJGJZ94",
  authDomain: "pkup-kommunalnik-diplom.firebaseapp.com",
  databaseURL: "https://pkup-kommunalnik-diplom-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "pkup-kommunalnik-diplom",
  storageBucket: "pkup-kommunalnik-diplom.firebasestorage.app",
  messagingSenderId: "417804884739",
  appId: "1:417804884739:web:ff132da8a45a65abdaa736",
  measurementId: "G-GDXY72MVVE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);