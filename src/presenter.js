/**
 * presenter.js — EK-Board Presenter Mode
 * Fullscreen, zoom, side margins for annotations, export/import.
 */

let zoomLevel = 1;
let notebook = null;
let isFullscreen = false;

// ─── INIT ───
export function initPresenter(notebookEl) {
  notebook = notebookEl;

  // Build presenter controls in the controls bar
  buildPresenterControls();

  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  // Keyboard shortcuts
  document.addEventListener('keydown', onPresenterKey);

  // Restore saved zoom
  const savedZoom = localStorage.getItem('ekboard-zoom');
  if (savedZoom) {
    zoomLevel = parseFloat(savedZoom);
    applyZoom();
  }
}

// ─── FULLSCREEN ───
export function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function onFullscreenChange() {
  isFullscreen = !!document.fullscreenElement;
  const btn = document.getElementById('btnFullscreen');
  if (btn) btn.textContent = isFullscreen ? '⛶' : '⛶';
  document.body.classList.toggle('fullscreen-mode', isFullscreen);
  // Apply wider margins in fullscreen for annotation space
  if (notebook) {
    notebook.classList.toggle('presenter-mode', isFullscreen);
  }
}

// ─── ZOOM ───
export function zoomIn() {
  zoomLevel = Math.min(zoomLevel + 0.1, 2.0);
  applyZoom();
}

export function zoomOut() {
  zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
  applyZoom();
}

export function zoomReset() {
  zoomLevel = 1;
  applyZoom();
}

function applyZoom() {
  if (!notebook) return;
  // Use CSS zoom (not transform:scale) — it reflows layout naturally,
  // so scrolling works correctly and content isn't cut off.
  // Supported on Safari (iPad), Chrome, Edge — all target browsers.
  notebook.style.zoom = zoomLevel;
  localStorage.setItem('ekboard-zoom', zoomLevel.toString());

  // Update zoom display
  const label = document.getElementById('zoomLabel');
  if (label) label.textContent = `${Math.round(zoomLevel * 100)}%`;
}

// ─── EXPORT / IMPORT ANNOTATIONS ───
export function exportAnnotations() {
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith('ekboard-ann-')) {
      allKeys.push({ key, data: localStorage.getItem(key) });
    }
  }
  // Also export progress
  const progress = localStorage.getItem('ekboard-progress');
  const exportData = {
    version: 1,
    timestamp: new Date().toISOString(),
    annotations: allKeys,
    progress: progress || '{}'
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ekboard-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importAnnotations() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.version !== 1) throw new Error('Unknown version');

        // Restore annotations
        data.annotations.forEach(item => {
          localStorage.setItem(item.key, item.data);
        });

        // Restore progress
        if (data.progress) {
          localStorage.setItem('ekboard-progress', data.progress);
        }

        // Reload page to apply
        window.location.reload();
      } catch (err) {
        alert('Invalid export file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
  input.click();
}

// ─── KEYBOARD ───
function onPresenterKey(e) {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

  // F11 or F for fullscreen
  if (e.key === 'F11' || (e.key === 'f' && !e.ctrlKey && !e.metaKey)) {
    e.preventDefault();
    toggleFullscreen();
  }
  // Ctrl + / Ctrl - for zoom
  if (e.ctrlKey && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    zoomIn();
  }
  if (e.ctrlKey && e.key === '-') {
    e.preventDefault();
    zoomOut();
  }
  if (e.ctrlKey && e.key === '0') {
    e.preventDefault();
    zoomReset();
  }
}

// ─── BUILD CONTROLS ───
function buildPresenterControls() {
  const bar = document.querySelector('.controls-bar');
  if (!bar) return;

  // Create a presenter section in the controls bar
  const section = document.createElement('div');
  section.className = 'presenter-controls';
  section.style.cssText = 'display:flex; align-items:center; gap:6px;';

  // Zoom out
  const zoomOutBtn = document.createElement('button');
  zoomOutBtn.className = 'btn presenter-btn';
  zoomOutBtn.textContent = '−';
  zoomOutBtn.title = 'Zoom Out (Ctrl+-)';
  zoomOutBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomOut(); });
  section.appendChild(zoomOutBtn);

  // Zoom label
  const zoomLabel = document.createElement('span');
  zoomLabel.id = 'zoomLabel';
  zoomLabel.className = 'info zoom-label';
  zoomLabel.textContent = '100%';
  section.appendChild(zoomLabel);

  // Zoom in
  const zoomInBtn = document.createElement('button');
  zoomInBtn.className = 'btn presenter-btn';
  zoomInBtn.textContent = '+';
  zoomInBtn.title = 'Zoom In (Ctrl++)';
  zoomInBtn.addEventListener('click', (e) => { e.stopPropagation(); zoomIn(); });
  section.appendChild(zoomInBtn);

  // Fullscreen
  const fsBtn = document.createElement('button');
  fsBtn.className = 'btn presenter-btn';
  fsBtn.id = 'btnFullscreen';
  fsBtn.textContent = '⛶';
  fsBtn.title = 'Fullscreen (F)';
  fsBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFullscreen(); });
  section.appendChild(fsBtn);

  // Export
  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn presenter-btn';
  exportBtn.textContent = '💾';
  exportBtn.title = 'Export annotations';
  exportBtn.addEventListener('click', (e) => { e.stopPropagation(); exportAnnotations(); });
  section.appendChild(exportBtn);

  // Import
  const importBtn = document.createElement('button');
  importBtn.className = 'btn presenter-btn';
  importBtn.textContent = '📂';
  importBtn.title = 'Import annotations';
  importBtn.addEventListener('click', (e) => { e.stopPropagation(); importAnnotations(); });
  section.appendChild(importBtn);

  // Insert before the keyboard hints
  const keysDiv = bar.querySelector('.controls-keys');
  if (keysDiv) {
    bar.insertBefore(section, keysDiv);
  } else {
    bar.appendChild(section);
  }
}
