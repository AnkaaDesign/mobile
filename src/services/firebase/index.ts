// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getStorage, FirebaseStorage } from "firebase/storage";
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

// Lazy initialization - Firebase is only initialized when first accessed
// This prevents blocking the main thread during app startup (critical for Android performance)
let _app: FirebaseApp | null = null;
let _storage: FirebaseStorage | null = null;

/**
 * Get the Firebase app instance (lazy initialized)
 * Use this instead of directly accessing the app to ensure proper initialization
 */
export function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = initializeApp(firebaseConfig);
  }
  return _app;
}

/**
 * Get the Firebase Storage instance (lazy initialized)
 * This is the recommended way to access storage - it will initialize Firebase on first use
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!_storage) {
    _storage = getStorage(getFirebaseApp());
  }
  return _storage;
}

// For backward compatibility - creates a proxy that lazy-initializes on first access
// This ensures existing code using `storage` directly continues to work
export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_target, prop) {
    return Reflect.get(getFirebaseStorage(), prop);
  },
});
