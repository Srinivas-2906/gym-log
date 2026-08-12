const DB_NAME = "daylog-images";
const STORE_NAME = "images";
const DB_VERSION = 1;

/** undefined = leave unchanged (edit), null = remove, Blob = set */
export type EntryImageAction = Blob | null | undefined;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const store = tx.objectStore(STORE_NAME);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not compress image."))),
      "image/jpeg",
      quality,
    );
  });

  return blob;
}

export function saveEntryImage(entryId: string, blob: Blob): Promise<void> {
  return runTransaction("readwrite", (store) => store.put(blob, entryId)).then(() => undefined);
}

export function getEntryImage(entryId: string): Promise<Blob | null> {
  return runTransaction<Blob | undefined>("readonly", (store) => store.get(entryId)).then(
    (result) => result ?? null,
  );
}

export function deleteEntryImage(entryId: string): Promise<void> {
  return runTransaction("readwrite", (store) => store.delete(entryId)).then(() => undefined);
}

export async function copyEntryImage(fromId: string, toId: string): Promise<void> {
  const blob = await getEntryImage(fromId);
  if (blob) await saveEntryImage(toId, blob);
}
