import { createRequire } from "node:module";

type FirestoreClient = {
  collection: (name: string) => {
    doc: (id: string) => {
      get: () => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
      set: (data: Record<string, unknown>, opts?: { merge?: boolean }) => Promise<void>;
    };
  };
};

let firestoreClient: FirestoreClient | null = null;

/** Load Firestore from node_modules at runtime (avoids ESM bundling issues). */
export async function getFirestore(): Promise<FirestoreClient> {
  if (firestoreClient) return firestoreClient;
  const require = createRequire(import.meta.url);
  const { Firestore } = require("@google-cloud/firestore") as {
    Firestore: new () => FirestoreClient;
  };
  firestoreClient = new Firestore();
  return firestoreClient;
}
