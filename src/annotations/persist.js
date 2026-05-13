/**
 * persist.js — EK-Board Persistence Layer
 * Handles IndexedDB (local) + Firestore (cloud) save/load.
 */
import { saveToCloud, loadFromCloud, saveSettingsToCloud, loadSettingsFromCloud } from '../firebase.js';
import { saveToIDB, loadFromIDB } from '../idb-storage.js';
import { computeBBox, decimatePoints } from './render.js';

// ─── SETTINGS ───
export let globalSettings = {
  penSize: 3,
  hlSize: 8,
  textScale: 1,
  laserX: 0.8,
  laserY: 0.5
};

let settingsSaveTimer = null;
export function saveSettings() {
  try { localStorage.setItem('ekboard_settings', JSON.stringify(globalSettings)); } catch {}
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(async () => {
    await saveSettingsToCloud(globalSettings);
  }, 2000);
}

export async function loadSettings(applyFn) {
  try {
    const local = localStorage.getItem('ekboard_settings');
    if (local) Object.assign(globalSettings, JSON.parse(local));
  } catch {}
  
  try {
    const cloud = await loadSettingsFromCloud();
    if (cloud) {
      Object.assign(globalSettings, cloud);
      try { localStorage.setItem('ekboard_settings', JSON.stringify(globalSettings)); } catch {}
    }
  } catch {}
  
  if (applyFn) applyFn();
}

// ─── ANNOTATION PERSISTENCE ───
let saveTimer = null;
let hasPendingCloudSave = false;
let lastLocalSaveTime = 0;
const LOCAL_SAVE_THROTTLE = 2000;
let idbSaveTimer = null;

function stripMetadataForSave(data) {
  return data.map(s => {
    if (!s._bbox && !s._outline) return s;
    const { _bbox, _outline, ...rest } = s;
    return rest;
  });
}

export function saveAnnotations(strokes, getStorageKey) {
  const now = Date.now();
  if (now - lastLocalSaveTime > LOCAL_SAVE_THROTTLE) {
    lastLocalSaveTime = now;
    saveToIDB(getStorageKey(), stripMetadataForSave(strokes));
  } else {
    clearTimeout(idbSaveTimer);
    idbSaveTimer = setTimeout(() => {
      saveToIDB(getStorageKey(), stripMetadataForSave(strokes));
    }, LOCAL_SAVE_THROTTLE);
  }
  hasPendingCloudSave = true;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      doCloudSave(strokes, getStorageKey);
    }, 60000);
  }
}

async function doCloudSave(strokes, getStorageKey) {
  if (!hasPendingCloudSave) return;
  hasPendingCloudSave = false;
  const key = getStorageKey();
  const saveData = stripMetadataForSave(strokes);
  
  let dataStr = JSON.stringify(saveData);
  if (dataStr.length > 900000) {
    const trimmed = saveData.map(s => ({
      ...s,
      pts: s.pts.length > 100 ? decimatePoints(s.pts, 3) : s.pts
    }));
    const ok = await saveToCloud(key, trimmed);
    showSyncStatus(ok ? 'saved' : 'error');
  } else {
    const ok = await saveToCloud(key, saveData);
    showSyncStatus(ok ? 'saved' : 'error');
  }
}

export async function flushToCloud(strokes, getStorageKey) {
  if (hasPendingCloudSave) {
    hasPendingCloudSave = false;
    clearTimeout(saveTimer);
    saveTimer = null;
    const key = getStorageKey();
    saveToCloud(key, stripMetadataForSave(strokes))
      .then(ok => showSyncStatus(ok ? 'saved' : 'error'))
      .catch(() => showSyncStatus('error'));
  }
}

export async function loadAnnotations(getStorageKey, onLoaded) {
  const key = getStorageKey();
  
  try {
    const idbData = await loadFromIDB(key);
    if (idbData && idbData.length > 0) {
      const strokes = idbData;
      strokes.forEach(s => { s._bbox = computeBBox(s.pts); });
      onLoaded(strokes, 'local');
    }
  } catch {}

  loadFromCloud(key).then(cloudData => {
    if (cloudData && cloudData.length > 0) {
      cloudData.forEach(s => { s._bbox = computeBBox(s.pts); });
      saveToIDB(key, stripMetadataForSave(cloudData));
      showSyncStatus('loaded');
      onLoaded(cloudData, 'cloud');
    }
  }).catch(() => {});
}

export function clearAllData(strokes, getStorageKey) {
  const key = getStorageKey();
  saveToIDB(key, []);
  hasPendingCloudSave = false;
  clearTimeout(saveTimer);
  saveToCloud(key, []).then(ok => showSyncStatus(ok ? 'saved' : 'error'));
}

function showSyncStatus(status) {
  let indicator = document.getElementById('syncIndicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'syncIndicator';
    indicator.className = 'sync-indicator';
    document.body.appendChild(indicator);
  }
  const icons = { saved: '☁️ ✔', loaded: '☁️ ↓', error: '☁️ ✘', local: '💾' };
  indicator.textContent = icons[status] || '';
  indicator.classList.add('show');
  setTimeout(() => indicator.classList.remove('show'), 2000);
}
