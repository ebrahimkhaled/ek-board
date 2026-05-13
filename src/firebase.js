/**
 * firebase.js — EK-Board Firebase Configuration
 * Firestore for cloud annotation persistence.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

const firebaseConfig = {
  apiKey: "AIzaSyDF3UvN4zKUkmBBXFGBjQOiGGPy5IQSeu8",
  authDomain: "ek-board.firebaseapp.com",
  projectId: "ek-board",
  storageBucket: "ek-board.firebasestorage.app",
  messagingSenderId: "544174904478",
  appId: "1:544174904478:web:02a1b39a6741ecb85e978f",
  measurementId: "G-PN7TRHMGHC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── SAVE ANNOTATIONS TO FIRESTORE ───
// Path: ekboard/{exerciseKey} → { strokes (compressed), updatedAt }
export async function saveToCloud(exerciseKey, strokes) {
  try {
    const docRef = doc(db, 'ekboard', exerciseKey);
    // Compress stroke JSON with lz-string (~85% size reduction)
    const raw = JSON.stringify(strokes);
    const compressed = compressToUTF16(raw);
    await setDoc(docRef, {
      strokes: compressed,
      compressed: true,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('[EK-Board] Cloud save failed:', err.message);
    return false;
  }
}

// ─── LOAD ANNOTATIONS FROM FIRESTORE ───
// Backward-compatible: detects old uncompressed format
export async function loadFromCloud(exerciseKey) {
  try {
    const docRef = doc(db, 'ekboard', exerciseKey);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.compressed) {
        // New format: decompress
        const raw = decompressFromUTF16(data.strokes);
        return JSON.parse(raw || '[]');
      }
      // Legacy format: raw JSON string
      return JSON.parse(data.strokes || '[]');
    }
    return null;
  } catch (err) {
    console.warn('[EK-Board] Cloud load failed:', err.message);
    return null;
  }
}

// ─── SAVE PROGRESS TO FIRESTORE ───
export async function saveProgressToCloud(progress) {
  try {
    const docRef = doc(db, 'ekboard', '_progress');
    await setDoc(docRef, {
      data: JSON.stringify(progress),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[EK-Board] Progress cloud save failed:', err.message);
  }
}

// ─── LOAD PROGRESS FROM FIRESTORE ───
export async function loadProgressFromCloud() {
  try {
    const docRef = doc(db, 'ekboard', '_progress');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return JSON.parse(snap.data().data || '{}');
    }
    return null;
  } catch (err) {
    console.warn('[EK-Board] Progress cloud load failed:', err.message);
    return null;
  }
}

export { db };

// ─── SAVE SETTINGS TO FIRESTORE ───
export async function saveSettingsToCloud(settings) {
  try {
    const docRef = doc(db, 'ekboard', '_settings');
    await setDoc(docRef, {
      data: JSON.stringify(settings),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[EK-Board] Settings cloud save failed:', err.message);
  }
}

// ─── LOAD SETTINGS FROM FIRESTORE ───
export async function loadSettingsFromCloud() {
  try {
    const docRef = doc(db, 'ekboard', '_settings');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return JSON.parse(snap.data().data || '{}');
    }
    return null;
  } catch (err) {
    console.warn('[EK-Board] Settings cloud load failed:', err.message);
    return null;
  }
}
