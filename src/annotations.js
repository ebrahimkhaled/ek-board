/**
 * annotations.js — EK-Board Annotation Engine
 * 
 * Input discrimination:
 *   - Apple Pencil / Stylus → always draws (auto-activates pen)
 *   - Finger → always navigates (next step / scroll)
 *   - Mouse → follows toolbar state (manual tool selection)
 * 
 * Persistence: localStorage (instant) + Firestore (debounced cloud sync)
 */
import { saveToCloud, loadFromCloud } from './firebase.js';

// ─── STATE ───
let canvas = null;
let ctx = null;
let laserSvg = null;
let notebook = null;

let tool = 'none';    // 'none' | 'pen' | 'hl' | 'eraser' | 'laser'
let penColor = '#c41e3a';
let penSize = 3;
let drawing = false;
let visible = true;
let autoMode = true;  // true = auto-detect stylus vs finger

let strokes = [];
let redoStack = [];
let curStroke = null;

// Laser
let laserSegments = [];
let laserSegId = 0;
let lastLaserPt = null;

// Double-tap detection (iPad pen↔eraser)
let lastTapTime = 0;
let prevTool = 'pen';

// Last used drawing tool (for auto-mode stylus activation)
let lastDrawTool = 'pen';

// Floating cursor element (works on iPad unlike CSS cursors)
let cursorEl = null;

// ─── PUBLIC API ───
// Called by main.js to check if a tool is active
export function isToolActive() {
  return tool !== 'none';
}

// Called by main.js to check if we're in auto mode
export function isAutoMode() {
  return autoMode;
}

// Called by main.js to check if a pointer event should navigate
// Returns true if this event is NOT being handled by the annotation engine
export function shouldNavigate(pointerType) {
  // ✋ Hand mode: EVERYTHING navigates, nothing draws
  if (tool === 'hand' || tool === 'none') return true;
  // Pen draws (when a drawing tool is selected)
  if (pointerType === 'pen') return false;
  // Finger always navigates
  if (pointerType === 'touch') return true;
  // Mouse: navigates only if no drawing tool is active
  return !(tool === 'pen' || tool === 'hl' || tool === 'eraser');
}

// ─── INIT ───
export function initAnnotations(notebookEl) {
  notebook = notebookEl;

  // Create canvas — sized to notebook content
  canvas = document.createElement('canvas');
  canvas.className = 'annotation-canvas';
  canvas.id = 'annotationCanvas';
  notebook.appendChild(canvas);

  // Create laser SVG overlay — fixed to viewport, BELOW toolbar z-index
  laserSvg = document.createElement('div');
  laserSvg.className = 'laser-overlay';
  laserSvg.innerHTML = '<svg id="laserSvg" style="width:100%;height:100%"></svg>';
  document.body.appendChild(laserSvg);

  ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Size canvas to content
  resizeCanvas();
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(notebook);

  // ── POINTER EVENTS (replaces mouse+touch for input discrimination) ──
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Laser events — use pointer events too
  laserSvg.addEventListener('pointerdown', onLaserDown);
  laserSvg.addEventListener('pointermove', onLaserMove);
  laserSvg.addEventListener('pointerup', onLaserUp);

  // Keyboard shortcuts
  document.addEventListener('keydown', onKey);

  // Create floating cursor element (iPad doesn't support CSS custom cursors)
  cursorEl = document.createElement('div');
  cursorEl.id = 'floatingCursor';
  cursorEl.className = 'floating-cursor';
  document.body.appendChild(cursorEl);

  // Track pointer movement globally for cursor position
  document.addEventListener('pointermove', onGlobalPointerMove);
  document.addEventListener('pointerleave', () => { if (cursorEl) cursorEl.style.display = 'none'; });

  // Build toolbar
  buildToolbar();

  // Load saved annotations
  loadAnnotations();
}

// ─── RESIZE CANVAS ───
function resizeCanvas() {
  if (!canvas || !notebook) return;
  const w = notebook.scrollWidth;
  const h = notebook.scrollHeight;
  if (canvas.width === w && canvas.height === h) return;
  const imageData = (canvas.width > 0 && canvas.height > 0)
    ? ctx?.getImageData(0, 0, canvas.width, canvas.height)
    : null;
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  if (imageData) ctx.putImageData(imageData, 0, 0);
  redrawAll();
}

// ─── COORDINATES ───
// Maps visual (screen) coordinates → canvas buffer coordinates.
// Works correctly regardless of CSS zoom/transform on the notebook.
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  // Ratio accounts for any CSS scaling (zoom, transform, etc.)
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  };
}

// ─── INPUT DISCRIMINATION ───
// Hand/None → nothing draws. Pen → draws. Finger → never. Mouse → only if tool active.
function shouldDraw(e) {
  // ✋ Hand mode: nothing draws
  if (tool === 'hand' || tool === 'none') return false;
  if (e.pointerType === 'touch') return false; // Finger: NEVER draws
  if (e.pointerType === 'pen') return true;     // Apple Pencil: draws when tool active
  // Mouse: draws only when a drawing/eraser tool is selected
  return tool === 'pen' || tool === 'hl' || tool === 'eraser';
}

// ─── POINTER EVENTS ───
function onPointerDown(e) {
  // ── FINGER: never handled here, pass through to main.js ──
  if (e.pointerType === 'touch') return;

  // ── HAND mode: pass everything through to main.js ──
  if (tool === 'hand' || tool === 'none') return;

  // ── PEN: auto-activate last tool if none selected ──
  if (e.pointerType === 'pen' && tool === 'laser') {
    setAnnotationTool(lastDrawTool || 'pen');
  }

  // ── Check if this input type should draw ──
  if (!shouldDraw(e)) return;

  // STOP event from reaching main.js (prevents step advance while drawing)
  e.preventDefault();
  e.stopPropagation();

  // ── PEN double-tap: toggle pen ↔ eraser ──
  if (e.pointerType === 'pen') {
    const now = Date.now();
    if (now - lastTapTime < 500) {
      if (tool === 'pen' || tool === 'hl') {
        prevTool = tool;
        setAnnotationTool('eraser');
      } else if (tool === 'eraser') {
        setAnnotationTool(prevTool || 'pen');
      }
      lastTapTime = 0;
      return;
    }
    lastTapTime = now;
  }

  const p = getPos(e);
  drawing = true;
  redoStack = [];

  // ERASER: whole-stroke deletion
  if (tool === 'eraser') {
    eraseStrokeAt(p);
    return;
  }

  // PEN / HIGHLIGHTER: start new stroke
  curStroke = {
    tool: tool,
    color: penColor,
    size: tool === 'hl' ? penSize * 3 : penSize,
    pts: [p]
  };
}

function onPointerMove(e) {
  if (e.pointerType === 'touch') return; // Finger: never handle
  if (!drawing) return;
  if (!shouldDraw(e)) return;
  e.preventDefault();
  e.stopPropagation();

  const p = getPos(e);

  // ERASER: keep deleting strokes as we drag
  if (tool === 'eraser') {
    eraseStrokeAt(p);
    return;
  }

  if (!curStroke) return;
  curStroke.pts.push(p);
  redrawAll();
  drawStroke(curStroke, ctx);
}

function onPointerUp(e) {
  if (e.pointerType === 'touch') return; // Finger: never handle
  if (!drawing) return;
  drawing = false;
  if (curStroke && curStroke.pts.length >= 2) {
    strokes.push(curStroke);
  }
  curStroke = null;
  redrawAll();
  saveAnnotations();
}

// ─── WHOLE-STROKE ERASER ───
// Finds any stroke within eraser radius and removes the entire stroke
function eraseStrokeAt(pt) {
  const radius = penSize * 5; // eraser hit area
  let erased = false;
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    for (const sp of stroke.pts) {
      const dx = sp.x - pt.x;
      const dy = sp.y - pt.y;
      if (dx * dx + dy * dy < radius * radius) {
        // Remove entire stroke, push to redo
        redoStack.push(strokes.splice(i, 1)[0]);
        erased = true;
        break;
      }
    }
  }
  if (erased) {
    redrawAll();
    saveAnnotations();
  }
}

// ─── LASER ───
function onLaserDown(e) {
  if (tool !== 'laser') return;
  // In auto mode, only mouse activates laser (not finger)
  if (autoMode && e.pointerType === 'touch') return;
  e.preventDefault();
  e.stopPropagation();
  drawing = true;
  lastLaserPt = { x: e.clientX, y: e.clientY };
  laserSegments = [];
}

function onLaserMove(e) {
  if (!drawing || tool !== 'laser') return;
  e.preventDefault();
  const px = e.clientX, py = e.clientY;
  if (lastLaserPt && (Math.abs(lastLaserPt.x - px) > 1 || Math.abs(lastLaserPt.y - py) > 1)) {
    laserSegments.push({ id: laserSegId++, x1: lastLaserPt.x, y1: lastLaserPt.y, x2: px, y2: py });
    if (laserSegments.length > 60) laserSegments = laserSegments.slice(-60);
    const svg = laserSvg.querySelector('svg');
    svg.innerHTML = laserSegments.map(s =>
      `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="#ff3b30" stroke-width="2.5" stroke-linecap="round" style="animation:beamFade .8s forwards"/>`
    ).join('');
  }
  lastLaserPt = { x: px, y: py };
}

function onLaserUp() {
  drawing = false;
  lastLaserPt = null;
}

// ─── STROKE RENDERING ───
function redrawAll() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!visible) return;
  strokes.forEach(s => drawStroke(s, ctx));
}

function drawStroke(s, cx) {
  if (s.pts.length < 2) return;
  cx.save();
  cx.strokeStyle = s.color;
  cx.lineWidth = s.size;
  cx.lineCap = 'round';
  cx.lineJoin = 'round';
  cx.globalAlpha = s.tool === 'hl' ? 0.25 : 1;
  cx.globalCompositeOperation = 'source-over';
  cx.beginPath();
  cx.moveTo(s.pts[0].x, s.pts[0].y);
  for (let i = 1; i < s.pts.length; i++) {
    cx.lineTo(s.pts[i].x, s.pts[i].y);
  }
  cx.stroke();
  cx.restore();
}

// ─── TOOL MANAGEMENT ───
export function setAnnotationTool(t) {
  tool = t;
  // Track last drawing tool for auto-mode
  if (t === 'pen' || t === 'hl' || t === 'eraser') {
    lastDrawTool = t;
  }
  // Update toolbar active states
  document.querySelectorAll('.ann-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === t);
  });
  // Canvas pointer events + cursor
  if (canvas) {
    // Hand/None: canvas is transparent to events → navigation works
    // Drawing tools: canvas captures events → drawing works
    const isDrawingTool = (t === 'pen' || t === 'hl' || t === 'eraser');
    canvas.style.pointerEvents = isDrawingTool ? 'auto' : 'none';
    updateCursor();
  }
  // Laser overlay — z-index BELOW toolbar so toolbar is still clickable
  if (laserSvg) {
    laserSvg.style.pointerEvents = t === 'laser' ? 'auto' : 'none';
    laserSvg.style.display = t === 'laser' ? 'block' : 'none';
  }
  if (t !== 'laser') {
    laserSegments = [];
    const svg = laserSvg?.querySelector('svg');
    if (svg) svg.innerHTML = '';
  }
}

// ─── CUSTOM CURSOR (floating DOM element — works on iPad) ───
function updateCursor() {
  if (!cursorEl) return;
  if (tool === 'none') {
    cursorEl.style.display = 'none';
    if (canvas) canvas.style.cursor = 'default';
    return;
  }

  // Show floating cursor
  cursorEl.style.display = 'block';

  if (tool === 'laser') {
    const size = 20;
    cursorEl.style.width = size + 'px';
    cursorEl.style.height = size + 'px';
    cursorEl.style.borderRadius = '50%';
    cursorEl.style.background = 'rgba(255,59,48,0.3)';
    cursorEl.style.border = '2px solid #ff3b30';
    cursorEl.style.boxShadow = '0 0 8px rgba(255,59,48,0.5)';
  } else if (tool === 'eraser') {
    const size = Math.max(penSize * 8, 20);
    cursorEl.style.width = size + 'px';
    cursorEl.style.height = size + 'px';
    cursorEl.style.borderRadius = '50%';
    cursorEl.style.background = 'rgba(255,107,107,0.15)';
    cursorEl.style.border = '2px solid rgba(255,107,107,0.6)';
    cursorEl.style.boxShadow = 'none';
  } else {
    // Pen / Highlighter
    const size = Math.max((tool === 'hl' ? penSize * 6 : penSize * 2), 8);
    cursorEl.style.width = size + 'px';
    cursorEl.style.height = size + 'px';
    cursorEl.style.borderRadius = '50%';
    cursorEl.style.background = tool === 'hl' ? penColor + '40' : 'none';
    cursorEl.style.border = `2px solid ${penColor}`;
    cursorEl.style.boxShadow = 'none';
  }

  // Also set CSS cursor to none so native cursor hides on desktop
  if (canvas) canvas.style.cursor = 'none';
}

// Track pointer for floating cursor position
function onGlobalPointerMove(e) {
  if (!cursorEl || tool === 'none') return;
  // Only show cursor for mouse and pen (not finger)
  if (e.pointerType === 'touch') {
    cursorEl.style.display = 'none';
    return;
  }
  cursorEl.style.display = 'block';
  const w = parseInt(cursorEl.style.width) || 12;
  const h = parseInt(cursorEl.style.height) || 12;
  cursorEl.style.left = (e.clientX - w / 2) + 'px';
  cursorEl.style.top = (e.clientY - h / 2) + 'px';
}

// ─── AUTO/MANUAL MODE ───
export function toggleAutoMode() {
  autoMode = !autoMode;
  const modeBtn = document.querySelector('.ann-mode-btn');
  if (modeBtn) {
    modeBtn.textContent = autoMode ? '🅰️' : '🔧';
    modeBtn.title = autoMode ? 'Auto Mode: Pencil draws, Finger navigates' : 'Manual Mode: Tool follows toolbar';
    modeBtn.classList.toggle('active', autoMode);
  }
  // In auto mode, canvas always captures events; in manual, only when tool is active
  if (canvas) {
    const shouldCapture = autoMode || (tool !== 'none' && tool !== 'laser');
    canvas.style.pointerEvents = shouldCapture ? 'auto' : 'none';
  }
}

// ─── UNDO / REDO ───
export function undoAnnotation() {
  if (!strokes.length) return;
  redoStack.push(strokes.pop());
  redrawAll();
  saveAnnotations();
}

export function redoAnnotation() {
  if (!redoStack.length) return;
  strokes.push(redoStack.pop());
  redrawAll();
  saveAnnotations();
}

// ─── VISIBILITY TOGGLE ───
export function toggleVisibility() {
  visible = !visible;
  canvas.style.opacity = visible ? '1' : '0';
  const eyeBtn = document.querySelector('.ann-tool-btn[data-tool="eye"]');
  if (eyeBtn) eyeBtn.textContent = visible ? '👁️' : '🚫';
  redrawAll();
}

// ─── CLEAR ALL ───
export function clearAnnotations() {
  strokes = [];
  redoStack = [];
  redrawAll();
  // Save empty state to localStorage immediately
  try {
    localStorage.setItem(getLocalKey(), '[]');
  } catch {}
  // Force push empty to cloud NOW (don't wait 60s)
  const key = getStorageKey();
  hasPendingCloudSave = false;
  clearTimeout(saveTimer);
  saveToCloud(key, []).then(ok => showSyncStatus(ok ? 'saved' : 'error'));
}

// ─── PERSISTENCE (localStorage instant + Firestore every 60s) ───
let saveTimer = null;
let hasPendingCloudSave = false;

function getStorageKey() {
  const hash = window.location.hash || '#default';
  return hash.replace('#', '').replace(/\//g, '-') || 'default';
}

function getLocalKey() {
  return `ekboard-ann-${window.location.hash || 'default'}`;
}

function saveAnnotations() {
  const data = JSON.stringify(strokes);

  // 1. Instant localStorage save (always)
  try {
    localStorage.setItem(getLocalKey(), data);
  } catch { /* quota exceeded */ }

  // 2. Debounced Firestore save (every 60 seconds)
  hasPendingCloudSave = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => flushToCloud(), 60000);
}

// Force push to Firestore (called on exercise change + every 60s)
async function flushToCloud() {
  if (!hasPendingCloudSave || strokes.length === 0) return;
  hasPendingCloudSave = false;
  clearTimeout(saveTimer);
  const key = getStorageKey();
  const ok = await saveToCloud(key, strokes);
  showSyncStatus(ok ? 'saved' : 'error');
}

async function loadAnnotations() {
  const localKey = getLocalKey();
  const cloudKey = getStorageKey();

  // 1. Load localStorage INSTANTLY (fast UX)
  try {
    const saved = JSON.parse(localStorage.getItem(localKey) || '[]');
    strokes = saved;
    redrawAll();
  } catch { strokes = []; }

  // 2. Then try cloud (may override localStorage)
  try {
    const cloudData = await loadFromCloud(cloudKey);
    if (cloudData && cloudData.length > 0) {
      strokes = cloudData;
      try { localStorage.setItem(localKey, JSON.stringify(strokes)); } catch {}
      showSyncStatus('loaded');
      redrawAll();
    } else if (strokes.length > 0) {
      showSyncStatus('local');
    }
  } catch {
    // Cloud failed — localStorage data already loaded, just continue
  }
}

// Sync status indicator
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

export async function onExerciseChange() {
  // Flush any pending annotations to cloud before switching
  await flushToCloud();
  strokes = [];
  redoStack = [];

  // Re-create canvas (renderExercise wipes notebook innerHTML)
  if (notebook) {
    canvas = document.createElement('canvas');
    canvas.className = 'annotation-canvas';
    canvas.id = 'annotationCanvas';
    notebook.appendChild(canvas);
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Re-attach pointer events to new canvas
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // Resize canvas to match content
    resizeCanvas();
  }

  await loadAnnotations();
}

// ─── KEYBOARD ───
function onKey(e) {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  // Support both Ctrl (Windows) and Cmd (Mac/iPad) for undo/redo
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'z') { e.preventDefault(); undoAnnotation(); }
  if (mod && e.key === 'y') { e.preventDefault(); redoAnnotation(); }
}

// ─── BUILD TOOLBAR ───
function buildToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'ann-toolbar';
  toolbar.id = 'annToolbar';

  // Auto/Manual mode toggle — at the top
  const modeBtn = document.createElement('button');
  modeBtn.className = 'ann-tool-btn ann-mode-btn active';
  modeBtn.textContent = '🅰️';
  modeBtn.title = 'Auto Mode: Pencil draws, Finger navigates';
  modeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAutoMode();
  });
  toolbar.appendChild(modeBtn);

  // Divider
  toolbar.appendChild(makeDivider());

  // Tool buttons
  const tools = [
    { id: 'hand', icon: '✋', title: 'Hand (Scroll & Navigate)' },
    { id: 'pen', icon: '✏️', title: 'Pen' },
    { id: 'hl', icon: '🖍️', title: 'Highlighter' },
    { id: 'eraser', icon: '🧹', title: 'Eraser' },
    { id: 'laser', icon: '📍', title: 'Laser Pointer' },
    { id: 'eye', icon: '👁️', title: 'Toggle Annotations' },
  ];

  tools.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'ann-tool-btn';
    btn.dataset.tool = t.id;
    btn.textContent = t.icon;
    btn.title = t.title;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (t.id === 'eye') {
        toggleVisibility();
      } else if (t.id === 'hand') {
        // Hand = deactivate everything, enable scroll/navigate
        setAnnotationTool('none');
        // Highlight hand button
        document.querySelectorAll('.ann-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        const newTool = tool === t.id ? 'none' : t.id;
        setAnnotationTool(newTool);
      }
    });
    toolbar.appendChild(btn);
  });

  toolbar.appendChild(makeDivider());

  // Undo/Redo
  const undoBtn = document.createElement('button');
  undoBtn.className = 'ann-tool-btn';
  undoBtn.textContent = '↩️';
  undoBtn.title = 'Undo (Ctrl+Z)';
  undoBtn.addEventListener('click', (e) => { e.stopPropagation(); undoAnnotation(); });
  toolbar.appendChild(undoBtn);

  const redoBtn = document.createElement('button');
  redoBtn.className = 'ann-tool-btn';
  redoBtn.textContent = '↪️';
  redoBtn.title = 'Redo (Ctrl+Y)';
  redoBtn.addEventListener('click', (e) => { e.stopPropagation(); redoAnnotation(); });
  toolbar.appendChild(redoBtn);

  toolbar.appendChild(makeDivider());

  // Color dots
  const penColors = [
    { color: '#c41e3a', name: 'Red' },
    { color: '#1a5276', name: 'Blue' },
    { color: '#1a1a1a', name: 'Black' },
    { color: '#1e8449', name: 'Green' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#ffffff', name: 'White' },
  ];

  penColors.forEach((c, i) => {
    const dot = document.createElement('div');
    dot.className = 'ann-color-dot' + (i === 0 ? ' active' : '');
    dot.style.background = c.color;
    if (c.color === '#ffffff') dot.style.border = '1px solid #475569';
    dot.title = c.name;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      penColor = c.color;
      toolbar.querySelectorAll('.ann-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      updateCursor();
    });
    toolbar.appendChild(dot);
  });

  toolbar.appendChild(makeDivider());

  // Size slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '1';
  slider.max = '15';
  slider.value = '3';
  slider.className = 'ann-size-slider';
  slider.title = 'Brush Size';
  slider.addEventListener('input', (e) => { penSize = +e.target.value; updateCursor(); });
  slider.addEventListener('click', (e) => e.stopPropagation());
  toolbar.appendChild(slider);

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'ann-tool-btn ann-clear';
  clearBtn.textContent = '🗑️';
  clearBtn.title = 'Clear All';
  clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearAnnotations(); });
  toolbar.appendChild(clearBtn);

  document.body.appendChild(toolbar);
}

function makeDivider() {
  const d = document.createElement('div');
  d.className = 'ann-divider';
  return d;
}
