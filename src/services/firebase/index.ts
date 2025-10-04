// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCZzItLnQV8oAs-Doqn05d5YRdvXJgwI5Y",
  authDomain: "ankaa-files.firebaseapp.com",
  projectId: "ankaa-files",
  storageBucket: "ankaa-files.appspot.com",
  messagingSenderId: "795719647606",
  appId: "1:795719647606:web:fca2b2c78be84309183a57",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);
