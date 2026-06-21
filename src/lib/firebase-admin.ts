import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    try {
      let parsedCredentials;
      
      const cleanJsonString = (str: string) => {
        // Replaces literal newlines inside the "private_key" string literal with escaped \n
        return str.replace(/"private_key":\s*"([\s\S]*?)"/, (match, p1) => {
          const escaped = p1.replace(/\r/g, "").replace(/\n/g, "\\n");
          return `"private_key": "${escaped}"`;
        });
      };

      if (serviceAccountKey.trim().startsWith("{")) {
        try {
          parsedCredentials = JSON.parse(serviceAccountKey);
        } catch (e) {
          parsedCredentials = JSON.parse(cleanJsonString(serviceAccountKey));
        }
      } else {
        const decoded = Buffer.from(serviceAccountKey, "base64").toString("utf-8");
        try {
          parsedCredentials = JSON.parse(decoded);
        } catch (e) {
          parsedCredentials = JSON.parse(cleanJsonString(decoded));
        }
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

