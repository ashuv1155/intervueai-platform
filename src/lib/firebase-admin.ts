import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      let parsedCredentials;
      if (serviceAccountKey.trim().startsWith("{")) {
        parsedCredentials = JSON.parse(serviceAccountKey);
      } else {
        const decoded = Buffer.from(serviceAccountKey, "base64").toString("utf-8");
        parsedCredentials = JSON.parse(decoded);
      }

      if (parsedCredentials && parsedCredentials.private_key) {
        parsedCredentials.private_key = parsedCredentials.private_key.replace(/\\n/g, "\n");
      }

      initializeApp({
        credential: cert(parsedCredentials),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
      console.log("Firebase Admin SDK initialized via Service Account Key");
    } catch (error) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
      });
      console.log("Firebase Admin SDK initialized via Project ID Fallback");
    }
  } else {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log("Firebase Admin SDK initialized via ADC / Project ID");
  }
}

const adminDb = getFirestore();
try {
  adminDb.settings({ preferRest: true });
  console.log("Firestore Admin configured to use REST fallback (preferRest: true)");
} catch (e) {
  console.warn("Failed to set Firestore preferRest settings:", e);
}
const adminAuth = getAuth();
const adminStorage = getStorage();

export { adminDb, adminAuth, adminStorage };

