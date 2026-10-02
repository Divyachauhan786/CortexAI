import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

// Strategy 1: JSON string in env var (Docker secrets / CI)
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
    // Strategy 2: File path – use FIREBASE_CREDENTIALS_PATH env var or fall back to local dev path
    const serviceAccountPath =
        process.env.FIREBASE_CREDENTIALS_PATH ||
        path.join(
            __dirname,
            "../../credentials/cortexai-12345-firebase-adminsdk-abcde.json"
        );
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
}

const firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount),
});

export const firebaseAdminAuth = getAuth(firebaseAdminApp);