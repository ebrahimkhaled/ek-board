/**
 * idb-storage.js — IndexedDB Storage for EK-Board Annotations
 * 
 * Replaces localStorage for annotation persistence.
 * Benefits over localStorage:
 *   - No 5MB size limit (unlimited storage)
 *   - Async API (doesn't block main thread)
 *   - Binary data support (future: store compressed blobs)
 * 
 * Schema: Database "ekboard" → Object store "annotations"
 *   Key: exercise hash string
 *   Value: { strokes: [...], updatedAt: ISO string }
 */

const DB_NAME = 'ekboard';
const DB_VERSION = 1;
const STORE_NAME = 'annotations';

let dbPromise = null;

/**
 * Open (or create) the IndexedDB database
 * Returns a Promise<IDBDatabase>
 */
function openDB() {
  if (dbPromise) return dbPromise;
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.warn('[EK-Board] IndexedDB open failed:', e.target.error);
      reject(e.target.error);
    };
  });
  
  return dbPromise;
}

/**
 * Save annotation strokes to IndexedDB
 * @param {string} key - Exercise hash key
 * @param {Array} strokes - Stroke data array
 * @returns {Promise<boolean>} success
 */
export async function saveToIDB(key, strokes) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        strokes: strokes,
        updatedAt: new Date().toISOString()
      }, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Load annotation strokes from IndexedDB
 * @param {string} key - Exercise hash key
 * @returns {Promise<Array|null>} strokes or null
 */
export async function loadFromIDB(key) {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.strokes : null);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Delete annotation data for a specific exercise
 * @param {string} key - Exercise hash key
 */
export async function deleteFromIDB(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch {}
}
