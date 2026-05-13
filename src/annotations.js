/**
 * annotations.js — EK-Board Annotation Engine v2
 * 
 * Architecture (based on tldraw/Excalidraw patterns):
 * 
 *   Canvas: touch-action: none (full control over all pointer events)
 *   
 *   Pen   → ALWAYS draws. preventDefault() claims the pointer.
 *            Auto-activates last tool. Double-tap screen = pen↔eraser.
 *            Uses getCoalescedEvents() for smooth strokes.
 *            Reads e.pressure for pressure-sensitive width.
 *   
 *   Finger → NEVER draws. No preventDefault() → browser handles scroll.
 *            Tap/double-tap detected by main.js for step navigation.
 *   
 *   Mouse → Follows toolbar. If tool active → draws. If none → navigate.
 * 
 * Rendering: perfect-freehand for smooth, pressure-sensitive strokes.
 *            requestAnimationFrame batching for performance.
 * 
 * Persistence: localStorage (instant) + Firestore (60s debounced cloud sync)
 */
import { getStroke } from 'perfect-freehand';
import { saveToCloud, loadFromCloud, saveSettingsToCloud, loadSettingsFromCloud } from './firebase.js';
import { saveToIDB, loadFromIDB } from './idb-storage.js';

// ─── GLOBAL SETTINGS SYNC ───
export let globalSettings = {
  penSize: 3,
  hlSize: 8,
  textScale: 1,
  laserX: 0.8,
  laserY: 0.5
};

let settingsSaveTimer = null;
function saveSettings() {
  try { localStorage.setItem('ekboard_settings', JSON.stringify(globalSettings)); } catch {}
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer);
  settingsSaveTimer = setTimeout(async () => {
    await saveSettingsToCloud(globalSettings);
  }, 2000);
}

async function loadSettings() {
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
  
  applySettings();
}

let currentExerciseHash = '';

function applySettings() {
  penSize = globalSettings.penSize;
  hlSize = globalSettings.hlSize || 8;
  const brushSlider = document.querySelector('.ann-size-slider[title="Brush Size"]');
  if (brushSlider) brushSlider.value = tool === 'hl' ? hlSize : penSize;
  
  document.documentElement.style.setProperty('--text-scale', globalSettings.textScale);
  const textSlider = document.querySelector('.ann-size-slider[title="Adjust Text Size"]');
  if (textSlider) textSlider.value = globalSettings.textScale;
  setTimeout(resizeCanvas, 50);
  
  if (laserDot) {
    const px = Math.min(window.innerWidth - 28, Math.max(0, window.innerWidth * globalSettings.laserX));
    const py = Math.min(window.innerHeight - 28, Math.max(0, window.innerHeight * globalSettings.laserY));
    laserDotPos = { x: px, y: py };
    laserDot.style.left = px + 'px';
    laserDot.style.top = py + 'px';
  }
}

// ─── PERFORMANCE HELPERS ───
// Reduce point count by keeping every Nth point (preserves first and last)
function decimatePoints(pts, factor) {
  if (pts.length <= 10) return pts;
  const result = [pts[0]];
  for (let i = factor; i < pts.length - 1; i += factor) {
    result.push(pts[i]);
  }
  result.push(pts[pts.length - 1]);
  return result;
}

// Compute axis-aligned bounding box for a stroke's points
function computeBBox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// ─── COMPUTE WORKER ───
// Offloads getStroke() computation from main thread
let strokeWorker = null;
let workerReady = false;
let pendingWorkerCallbacks = {};
let workerMsgId = 0;

function initWorker() {
  try {
    strokeWorker = new Worker(
      new URL('./stroke-worker.js', import.meta.url),
      { type: 'module' }
    );
    strokeWorker.onmessage = onWorkerMessage;
    strokeWorker.onerror = () => { workerReady = false; };
    workerReady = true;
  } catch (err) {
    console.warn('[EK-Board] Worker init failed, using main thread fallback:', err.message);
    workerReady = false;
  }
}

function onWorkerMessage(e) {
  const { type, id, results, outline } = e.data;

  if (type === 'outline' && pendingWorkerCallbacks[id]) {
    pendingWorkerCallbacks[id](outline);
    delete pendingWorkerCallbacks[id];
  }

  if (type === 'batchOutlines') {
    // Apply pre-computed outlines to strokes
    if (results) {
      for (const r of results) {
        if (r.outline && strokes[r.index]) {
          strokes[r.index]._outline = r.outline;
        }
      }
      // Now that outlines are cached, rebuild cache using them (fast!)
      cacheValid = false;
      scheduleRedraw();
    }
    if (pendingWorkerCallbacks[id]) {
      pendingWorkerCallbacks[id]();
      delete pendingWorkerCallbacks[id];
    }
  }
}

// Request background pre-computation of all stroke outlines
function precomputeOutlines() {
  if (!workerReady || !strokeWorker || strokes.length === 0) return;
  const id = workerMsgId++;
  // Send only the data the worker needs (pts, tool, size)
  const lightweight = strokes.map(s => ({
    pts: s.pts,
    tool: s.tool,
    size: s.size
  }));
  strokeWorker.postMessage({ type: 'computeBatch', id, data: { strokes: lightweight } });
}

// Compute outline for a single stroke (main thread, used at pen-up)
function computeOutline(stroke) {
  if (stroke.tool === 'hl' || stroke.pts.length < 2) return null;
  const inputPoints = stroke.pts.map(p => [p.x, p.y, p.p || 0.5]);
  return getStroke(inputPoints, {
    size: stroke.size * 2.5,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => t,
    start: { taper: 0, easing: (t) => t, cap: true },
    end: { taper: 0, easing: (t) => t, cap: true },
  });
}

// ─── STATE ───
let canvas = null;
let ctx = null;
let laserSvg = null;
let notebook = null;

let tool = 'none';    // 'none' | 'pen' | 'hl' | 'eraser' | 'laser'
let penColor = '#c41e3a';
let penSize = 3;
let hlSize = 8;
let drawing = false;
let visible = true;

let strokes = [];     // Persisted stroke data
let redoStack = [];
let curStroke = null;  // Current in-progress stroke { tool, color, size, pts: [{x,y,p}] }

// Laser
let laserSegments = [];
let laserSegId = 0;
let lastLaserPt = null;

// Double-tap detection (pen tip on screen: toggle pen↔eraser)
let lastPenTapTime = 0;
let prevTool = 'pen';

// Last used drawing tool (for pen auto-activation)
let lastDrawTool = 'pen';

// Floating cursor element (works on iPad unlike CSS cursors)
let cursorEl = null;

// requestAnimationFrame rendering
let needsRedraw = false;

// PEN ACTIVITY FLAG — set when pen is touching screen, cleared when lifted.
// This is the ULTIMATE guard: main.js checks this flag and rejects navigation.
// Even if Safari fires duplicate events that bypass stopPropagation, this flag
// will always be correct because it's set/cleared at the document capture level.
let penActive = false;

// ─── PUBLIC API (used by main.js) ───
export function isToolActive() {
  return tool !== 'none';
}

// Called by main.js to check if navigation should happen
export function shouldNavigate(pointerType) {
  if (pointerType === 'pen') return false;    // Pen NEVER navigates
  if (penActive) return false;                // Pen is touching — block everything
  if (pointerType === 'touch') return true;   // Finger ALWAYS navigates
  // Mouse: navigates only if no drawing tool is active
  return !(tool === 'pen' || tool === 'hl' || tool === 'eraser');
}

// Check if pen is currently touching (for main.js safety check)
export function isPenActive() { return penActive; }

// Called to get current tool (for main.js)
export function getCurrentTool() { return tool; }

// ─── INIT ───
export function initAnnotations(notebookEl) {
  notebook = notebookEl;

  // Create canvas — sized to notebook content
  canvas = document.createElement('canvas');
  canvas.className = 'annotation-canvas';
  canvas.id = 'annotationCanvas';
  // Start with pointer-events auto (pen hits canvas, finger toggle disables it)
  canvas.style.pointerEvents = 'auto';
  notebook.appendChild(canvas);

  // Create laser SVG overlay
  laserSvg = document.createElement('div');
  laserSvg.className = 'laser-overlay';
  laserSvg.innerHTML = '<svg id="laserSvg" style="width:100%;height:100%"></svg>';
  document.body.appendChild(laserSvg);

  ctx = canvas.getContext('2d', { willReadFrequently: true });

  // Size canvas to content
  resizeCanvas();
  const ro = new ResizeObserver(resizeCanvas);
  ro.observe(notebook);

  // ── POINTER EVENTS ──
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Laser: dot events are bound in createLaserDot() when first activated

  // Keyboard shortcuts
  document.addEventListener('keydown', onKey);

  // Floating cursor
  cursorEl = document.createElement('div');
  cursorEl.id = 'floatingCursor';
  cursorEl.className = 'floating-cursor';
  document.body.appendChild(cursorEl);
  document.addEventListener('pointermove', onGlobalPointerMove);

  // ── PREVENT STYLUS GESTURE DELAY ──
  // Instantly disables Safari's built-in touch gesture recognizer for Apple Pencil,
  // ensuring strokes begin immediately with zero latency.
  document.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0] && e.touches[0].touchType === 'stylus') {
      // Allow clicking on UI elements (toolbar, buttons) with the Apple Pencil
      if (e.target.closest('.ann-toolbar') || e.target.closest('button') || e.target.closest('input')) {
        return; 
      }
      e.preventDefault();
    }
  }, { passive: false });

  // ── CRITICAL: Input routing at document capture level ──
  // This fires BEFORE any element-level handler.
  document.addEventListener('pointerdown', (e) => {
    if (!canvas) return;
    showDebugInput(e.pointerType);  // Debug indicator
    
    if (e.pointerType === 'pen') {
      penActive = true;
      // Auto-activate drawing tool if none selected
      if (tool === 'none' || tool === 'laser') {
        setAnnotationTool(lastDrawTool || 'pen');
      }
    }
    // We NO LONGER toggle canvas.style.pointerEvents here! 
    // The canvas is permanently 'auto'. 
    // If pointerType === 'touch', we simply don't call e.preventDefault() in onPointerDown,
    // which allows Safari to natively scroll the page underneath without complex state management.
  }, true);

  // Pen up: clear flag + block propagation
  document.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'pen') {
      // Clear pen flag after a tiny delay (so any queued events still see it as active)
      setTimeout(() => { penActive = false; }, 100);
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  // Also catch pointercancel (pen can be cancelled by system gestures)
  document.addEventListener('pointercancel', (e) => {
    if (e.pointerType === 'pen') {
      setTimeout(() => { penActive = false; }, 100);
    }
  }, true);

  // Build toolbar
  buildToolbar();

  // Create laser pointer dot (always visible)
  createLaserDot();

  currentExerciseHash = window.location.hash || '#default';

  // Load saved annotations
  loadAnnotations();

  // Load global settings
  loadSettings();

  // Init compute worker
  initWorker();

  // ── DESK SCROLL FORWARDING ──
  // When user touches the brown desk area (body, outside the notebook paper),
  // forward the scroll gesture to the notebook so the paper scrolls naturally.
  let deskScrollY = null;
  document.body.addEventListener('touchstart', (e) => {
    // Only activate if touch lands on the desk (body), NOT on notebook or toolbar
    const t = e.target;
    if (t === document.body || (!t.closest('.notebook') && !t.closest('.ann-toolbar') && !t.closest('.exercise-nav'))) {
      deskScrollY = e.touches[0].clientY;
    }
  }, { passive: true });

  document.body.addEventListener('touchmove', (e) => {
    if (deskScrollY !== null && notebook) {
      const dy = deskScrollY - e.touches[0].clientY;
      notebook.scrollTop += dy;
      deskScrollY = e.touches[0].clientY;
      e.preventDefault(); // prevent body from scrolling
    }
  }, { passive: false });

  document.body.addEventListener('touchend', () => { deskScrollY = null; });
  document.body.addEventListener('touchcancel', () => { deskScrollY = null; });

  // Start render loop
  requestAnimationFrame(renderLoop);
}

// ─── RENDER LOOP (rAF batched) ───
let lastDrawBox = null;

// Incremental bounding box for active stroke — avoids re-scanning all points each frame
let activeBBox = null;

function renderLoop() {
  if (needsRedraw) {
    needsRedraw = false;
    
    if (curStroke && curStroke.pts.length >= 2) {
      // Use incrementally-maintained bounding box (updated in onPointerMove)
      const pad = curStroke.size * 5 + 10;
      const box = {
        x: Math.floor((activeBBox?.minX ?? 0) - pad),
        y: Math.floor((activeBBox?.minY ?? 0) - pad),
        w: Math.ceil(((activeBBox?.maxX ?? 0) - (activeBBox?.minX ?? 0)) + pad * 2),
        h: Math.ceil(((activeBBox?.maxY ?? 0) - (activeBBox?.minY ?? 0)) + pad * 2)
      };
      
      // Combine with previous frame's box to ensure we clear the tail
      let clearBox = box;
      if (lastDrawBox) {
        const cx1 = Math.min(box.x, lastDrawBox.x);
        const cy1 = Math.min(box.y, lastDrawBox.y);
        const cx2 = Math.max(box.x + box.w, lastDrawBox.x + lastDrawBox.w);
        const cy2 = Math.max(box.y + box.h, lastDrawBox.y + lastDrawBox.h);
        clearBox = { x: cx1, y: cy1, w: cx2 - cx1, h: cy2 - cy1 };
      }
      lastDrawBox = box;
      
      const dpr = window.devicePixelRatio || 1;
      
      // Clear ONLY the dirty area on main canvas
      ctx.clearRect(clearBox.x, clearBox.y, clearBox.w, clearBox.h);
      
      // Restore ONLY the dirty area from cache
      if (cacheValid && cacheCanvas) {
        ctx.drawImage(cacheCanvas, 
          clearBox.x * dpr, clearBox.y * dpr, clearBox.w * dpr, clearBox.h * dpr,
          clearBox.x, clearBox.y, clearBox.w, clearBox.h);
      }
      
      // Draw the active stroke using DRAFT mode (simple lineTo, zero computation)
      // The beautiful perfect-freehand outline is computed once at pen-up
      drawDraftStroke(curStroke, ctx);
      
    } else {
      // Full redraw (stroke finished, undone, erased, etc)
      lastDrawBox = null;
      redrawAll();
    }
  }
  requestAnimationFrame(renderLoop);
}

function scheduleRedraw() {
  needsRedraw = true;
}

// ─── RESIZE CANVAS ───
function resizeCanvas() {
  if (!canvas || !notebook) return;
  const w = notebook.scrollWidth;
  const h = notebook.scrollHeight;
  const dpr = window.devicePixelRatio || 1;
  
  // Update spiral holes height to match full scrollable content
  notebook.style.setProperty('--scroll-height', h + 'px');
  
  if (canvas.width === Math.floor(w * dpr) && canvas.height === Math.floor(h * dpr)) return;
  
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  
  redrawAll();
  
  // Keep laser proportionally on screen during resize
  if (laserDot && laserDotPos) {
    applySettings();
  }
}

// ─── COORDINATES ───
// Maps screen coordinates → canvas CSS-pixel coordinates.
// Uses normalized 0..1 position for zoom-proof accuracy:
//   (clientX - rect.left) / rect.width → always correct regardless of
//   CSS zoom, CSS transform, browser pinch-zoom, or visual viewport scale.
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  // Normalized position (0..1) within the element
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  // Map to canvas CSS-pixel coordinate space
  return {
    x: Math.round(nx * (canvas.width / dpr) * 10) / 10,
    y: Math.round(ny * (canvas.height / dpr) * 10) / 10,
    p: Math.round((e.pressure || 0.5) * 100) / 100
  };
}

// Minimum distance² between points (pixels) — skip points closer than this
// Prevents runaway point accumulation on slow/long strokes
const MIN_POINT_DIST_SQ = 4; // 2px minimum gap

// ─── INPUT DISCRIMINATION ───
// Determines if this pointer should draw based on type and tool state
function shouldDraw(pointerType) {
  if (tool === 'none' || tool === 'laser') return false;
  if (pointerType === 'touch') return false;   // Finger NEVER draws
  if (pointerType === 'pen') return true;       // Pen ALWAYS draws (when tool active)
  // Mouse: draws if drawing tool selected
  return tool === 'pen' || tool === 'hl' || tool === 'eraser';
}

// ─── POINTER EVENTS ───
function onPointerDown(e) {
  // ── FINGER: Let it pass through for scrolling ──
  // We do NOT call preventDefault() → browser handles scroll natively
  if (e.pointerType === 'touch') return;

  // ── PEN: Auto-activate last drawing tool ──
  if (e.pointerType === 'pen' && (tool === 'none' || tool === 'laser')) {
    setAnnotationTool(lastDrawTool || 'pen');
  }

  // Should this pointer draw?
  if (!shouldDraw(e.pointerType)) return;

  // CLAIM this pointer — prevents scroll/zoom for pen & mouse
  e.preventDefault();
  e.stopPropagation();

  // NOTE: Pen double-tap for eraser toggle is handled via Apple Pencil's
  // hardware double-tap event, not via timing. Timing-based detection
  // was causing writing lag (every 2nd fast stroke triggered eraser toggle).

  const p = getPos(e);
  drawing = true;
  redoStack = [];

  // ERASER: whole-stroke deletion
  if (tool === 'eraser') {
    eraseStrokeAt(p);
    return;
  }

  // PEN / HIGHLIGHTER: start new stroke
  // Reset incremental bounding box
  activeBBox = { minX: p.x, minY: p.y, maxX: p.x, maxY: p.y };
  curStroke = {
    tool: tool,
    color: penColor,
    size: tool === 'hl' ? hlSize : penSize,
    pts: [p]
  };
}

function onPointerMove(e) {
  // Update floating cursor position (even when drawing — stopPropagation blocks global handler)
  updateCursorPosition(e);

  // Finger: always ignore
  if (e.pointerType === 'touch') return;
  if (!drawing) return;
  if (!shouldDraw(e.pointerType)) return;

  e.preventDefault();
  e.stopPropagation();

  // ERASER: keep deleting strokes as we drag
  if (tool === 'eraser') {
    const p = getPos(e);
    eraseStrokeAt(p);
    return;
  }

  if (!curStroke) return;

  // Use getCoalescedEvents() for extra points between frames (smoother strokes)
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ce of events) {
    const pt = getPos(ce);
    // Minimum distance filter: skip points too close to the last one
    // This caps point count at ~1 per 2px of movement, preventing runaway growth on long strokes
    const lastPt = curStroke.pts[curStroke.pts.length - 1];
    const dx = pt.x - lastPt.x;
    const dy = pt.y - lastPt.y;
    if (dx * dx + dy * dy < MIN_POINT_DIST_SQ) continue;
    
    curStroke.pts.push(pt);
    // Incrementally expand bounding box (O(1) per point instead of O(n) per frame)
    if (activeBBox) {
      if (pt.x < activeBBox.minX) activeBBox.minX = pt.x;
      if (pt.x > activeBBox.maxX) activeBBox.maxX = pt.x;
      if (pt.y < activeBBox.minY) activeBBox.minY = pt.y;
      if (pt.y > activeBBox.maxY) activeBBox.maxY = pt.y;
    }
  }

  // Schedule redraw via rAF (don't draw directly in event handler)
  scheduleRedraw();
}

function onPointerUp(e) {
  if (e.pointerType === 'touch') return;
  
  // Pen: always prevent + stop (also done at document capture level as safety)
  if (e.pointerType === 'pen') {
    e.preventDefault();
    e.stopPropagation();
    // Hide cursor circle when pen is lifted/leaves screen
    if (cursorEl) cursorEl.style.display = 'none';
  }
  
  if (!drawing) return;
  drawing = false;
  
  if (curStroke && curStroke.pts.length >= 2) {
    // Decimate long strokes to save memory and speed up future redraws
    if (curStroke.pts.length > 500) {
      curStroke.pts = decimatePoints(curStroke.pts, 2);
    }
    // Pre-compute bounding box for fast eraser rejection
    curStroke._bbox = computeBBox(curStroke.pts);
    // Pre-compute outline for instant cache rebuilds (no getStroke() needed later)
    if (curStroke.tool !== 'hl') {
      curStroke._outline = computeOutline(curStroke);
    }
    strokes.push(curStroke);
    // Render completed stroke to offscreen cache for performance
    bakeStrokeToCache(curStroke);
  }
  curStroke = null;
  activeBBox = null;
  scheduleRedraw();
  saveAnnotations();
}

// ─── WHOLE-STROKE ERASER ───
// Performance strategy:
//   1. Hit-test uses bounding-box pre-check to skip distant strokes (O(1) per stroke)
//   2. On erase: ONLY redraw the small area around the erased stroke (O(k), k = overlapping strokes)
//   3. Full cache rebuild debounced to 300ms after erasing stops (cleanup)
// This makes erasing feel instant even with 500+ strokes.
let eraseRebuildTimer = null;

function eraseStrokeAt(pt) {
  const radius = penSize * 5;
  const radiusSq = radius * radius;
  let erasedStroke = null;
  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    // Fast bounding-box rejection
    if (stroke._bbox) {
      const b = stroke._bbox;
      if (pt.x < b.minX - radius || pt.x > b.maxX + radius ||
          pt.y < b.minY - radius || pt.y > b.maxY + radius) {
        continue;
      }
    }
    // Point-level hit test (sample every Nth point for large strokes)
    const pts = stroke.pts;
    const step = pts.length > 200 ? 3 : 1;
    for (let j = 0; j < pts.length; j += step) {
      const dx = pts[j].x - pt.x;
      const dy = pts[j].y - pt.y;
      if (dx * dx + dy * dy < radiusSq) {
        erasedStroke = strokes.splice(i, 1)[0];
        redoStack.push(erasedStroke);
        break;
      }
    }
    if (erasedStroke) break;
  }
  if (erasedStroke) {
    // LOCAL-AREA REDRAW: only repaint the bbox of the erased stroke
    // Instead of clearing + redrawing ALL strokes (slow), we:
    //   1. Clear just the erased stroke's area on both cache and screen
    //   2. Clip to that area and redraw only overlapping strokes
    eraseLocalArea(erasedStroke);

    // Full cache rebuild debounced (cleanup for edge cases like overlapping composites)
    clearTimeout(eraseRebuildTimer);
    eraseRebuildTimer = setTimeout(() => {
      cacheValid = false;
      rebuildCache();
      scheduleRedraw();
    }, 300);
  }
}

// Redraw ONLY the area occupied by the erased stroke — O(k) not O(n)
function eraseLocalArea(erasedStroke) {
  if (!ctx || !canvas || !cacheCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const bbox = erasedStroke._bbox || computeBBox(erasedStroke.pts);
  const pad = (erasedStroke.size || 3) * 5 + 5;
  const bx = Math.floor(bbox.minX - pad);
  const by = Math.floor(bbox.minY - pad);
  const bw = Math.ceil(bbox.maxX - bbox.minX + pad * 2);
  const bh = Math.ceil(bbox.maxY - bbox.minY + pad * 2);

  // 1. Clear the area on the cache canvas
  cacheCtx.clearRect(bx, by, bw, bh);

  // 2. Clip to the area and redraw ONLY overlapping strokes
  cacheCtx.save();
  cacheCtx.beginPath();
  cacheCtx.rect(bx, by, bw, bh);
  cacheCtx.clip();
  for (const s of strokes) {
    if (!s._bbox) continue;
    // Quick overlap check: does this stroke's bbox intersect the cleared area?
    if (s._bbox.maxX + pad >= bx && s._bbox.minX - pad <= bx + bw &&
        s._bbox.maxY + pad >= by && s._bbox.minY - pad <= by + bh) {
      drawStroke(s, cacheCtx);
    }
  }
  cacheCtx.restore();

  // 3. Update the screen canvas from cache (just the affected area)
  ctx.clearRect(bx, by, bw, bh);
  ctx.drawImage(cacheCanvas,
    bx * dpr, by * dpr, bw * dpr, bh * dpr,
    bx, by, bw, bh);
  cacheValid = true;
}

// ─── LASER POINTER (Always-Visible Draggable Dot with Beam Trail) ───
let laserDot = null;
let laserDotPos = null;
let laserDragging = false;

function createLaserDot() {
  if (laserDot) return;
  
  // The red laser dot (always visible, draggable by any input)
  laserDot = document.createElement('div');
  laserDot.id = 'laserDot';
  Object.assign(laserDot.style, {
    position: 'fixed',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, #ff3b30 0%, #ff6b6b 40%, rgba(255,59,48,0.6) 70%, transparent 100%)',
    boxShadow: '0 0 20px rgba(255,59,48,0.8), 0 0 40px rgba(255,59,48,0.4), inset 0 0 8px rgba(255,255,255,0.3)',
    cursor: 'grab',
    zIndex: '145',
    touchAction: 'none',
  });
  
  // Default position: bottom-right area
  laserDotPos = { x: window.innerWidth - 80, y: window.innerHeight / 2 };
  laserDot.style.left = laserDotPos.x + 'px';
  laserDot.style.top = laserDotPos.y + 'px';
  
  document.body.appendChild(laserDot);
  
  // Events on the dot — all pointer types can drag
  laserDot.addEventListener('pointerdown', onLaserDown);
  laserDot.addEventListener('pointermove', onLaserMove);
  laserDot.addEventListener('pointerup', onLaserUp);
  laserDot.addEventListener('pointercancel', onLaserUp);
}

function onLaserDown(e) {
  e.preventDefault();
  e.stopPropagation();
  laserDragging = true;
  laserDot.setPointerCapture(e.pointerId);
  laserDot.style.cursor = 'grabbing';
  laserDot.style.transform = 'scale(1.3)';
  lastLaserPt = { x: e.clientX, y: e.clientY };
  laserSegments = [];
  laserSvg.style.display = 'block';
}

function onLaserMove(e) {
  if (!laserDragging) return;
  e.preventDefault();
  e.stopPropagation();
  
  const px = e.clientX, py = e.clientY;
  
  // Move the dot
  const newX = Math.max(0, Math.min(window.innerWidth - 28, px - 14));
  const newY = Math.max(0, Math.min(window.innerHeight - 28, py - 14));
  laserDotPos = { x: newX, y: newY };
  laserDot.style.left = newX + 'px';
  laserDot.style.top = newY + 'px';
  
  // Save position relative to screen
  globalSettings.laserX = newX / window.innerWidth;
  globalSettings.laserY = newY / window.innerHeight;
  saveSettings();
  
  // Add beam segment
  if (lastLaserPt && (Math.abs(lastLaserPt.x - px) > 1 || Math.abs(lastLaserPt.y - py) > 1)) {
    laserSegments.push({ id: laserSegId++, x1: lastLaserPt.x, y1: lastLaserPt.y, x2: px, y2: py });
    if (laserSegments.length > 20) laserSegments = laserSegments.slice(-20);
    const svg = laserSvg.querySelector('svg');
    svg.innerHTML = laserSegments.map(s =>
      `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="#ff3b30" stroke-width="3" stroke-linecap="round" opacity="0.6" style="animation:beamFade .5s forwards"/>`
    ).join('');
  }
  lastLaserPt = { x: px, y: py };
}

function onLaserUp(e) {
  laserDragging = false;
  lastLaserPt = null;
  if (laserDot) {
    laserDot.style.cursor = 'grab';
    laserDot.style.transform = 'scale(1)';
  }
}

// ─── DRAFT RENDERING (used during active drawing for zero-latency feedback) ───
// Simple lineTo() path — no getStroke() computation.
// Pen strokes: thin preview line; Highlighter: same as final.
// The beautiful pressure-sensitive outline is computed ONCE at pen-up.
function drawDraftStroke(s, cx) {
  if (s.pts.length < 2) return;
  cx.save();

  if (s.tool === 'hl') {
    // Highlighter draft = same as final (already cheap, no getStroke)
    drawStroke(s, cx);
    cx.restore();
    return;
  }

  // Pen draft: simple colored line with slight pressure width variation
  cx.strokeStyle = s.color;
  cx.lineWidth = s.size * 1.5;
  cx.lineCap = 'round';
  cx.lineJoin = 'round';
  cx.globalAlpha = 0.85;
  cx.beginPath();
  cx.moveTo(s.pts[0].x, s.pts[0].y);
  
  // Quadratic curves for smoothness (still much cheaper than getStroke)
  for (let i = 1; i < s.pts.length - 1; i++) {
    const mx = (s.pts[i].x + s.pts[i + 1].x) / 2;
    const my = (s.pts[i].y + s.pts[i + 1].y) / 2;
    cx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mx, my);
  }
  const last = s.pts[s.pts.length - 1];
  cx.lineTo(last.x, last.y);
  cx.stroke();

  cx.restore();
}

// ─── STROKE RENDERING (with offscreen cache for performance) ───
let cacheCanvas = null;
let cacheCtx = null;
let cacheValid = false;

// Bake a single new stroke onto the cache (called when stroke completes)
function bakeStrokeToCache(stroke) {
  ensureCacheCanvas();
  drawStroke(stroke, cacheCtx);
}

// Rebuild entire cache from scratch (after undo, redo, erase, load)
function rebuildCache() {
  ensureCacheCanvas();
  const dpr = window.devicePixelRatio || 1;
  cacheCtx.clearRect(0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  strokes.forEach(s => drawStroke(s, cacheCtx));
  cacheValid = true;
}

function ensureCacheCanvas() {
  if (!cacheCanvas) {
    cacheCanvas = document.createElement('canvas');
    cacheCtx = cacheCanvas.getContext('2d');
  }
  if (canvas && (cacheCanvas.width !== canvas.width || cacheCanvas.height !== canvas.height)) {
    cacheCanvas.width = canvas.width;
    cacheCanvas.height = canvas.height;
    
    const dpr = window.devicePixelRatio || 1;
    cacheCtx.setTransform(1, 0, 0, 1, 0, 0);
    cacheCtx.scale(dpr, dpr);
    
    // Size changed — must rebuild
    cacheCtx.clearRect(0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
    strokes.forEach(s => drawStroke(s, cacheCtx));
    cacheValid = true;
  }
}

function redrawAll() {
  if (!ctx || !canvas) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  if (!visible) return;
  
  // Draw from offscreen cache (fast: single drawImage call)
  if (cacheValid && cacheCanvas) {
    ctx.drawImage(cacheCanvas, 0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  } else {
    // Fallback: draw all strokes directly + build cache
    rebuildCache();
    ctx.drawImage(cacheCanvas, 0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  }
}

// Global persistent temp canvas for high-performance highlighter rendering
let hlCanvas = null;
let hlCtx = null;
function ensureHlCanvas() {
  if (!hlCanvas) {
    hlCanvas = document.createElement('canvas');
    hlCtx = hlCanvas.getContext('2d');
  }
  if (canvas && (hlCanvas.width !== canvas.width || hlCanvas.height !== canvas.height)) {
    hlCanvas.width = canvas.width;
    hlCanvas.height = canvas.height;
    const dpr = window.devicePixelRatio || 1;
    hlCtx.setTransform(1, 0, 0, 1, 0, 0);
    hlCtx.scale(dpr, dpr);
  }
}

function drawStroke(s, cx) {
  if (s.pts.length < 2) return;
  cx.save();

  if (s.tool === 'hl') {
    // Highlighter: draw at full opacity on a temp canvas, then composite with alpha.
    ensureHlCanvas();
    const dpr = window.devicePixelRatio || 1;
    
    // Calculate dirty rectangle (bounding box) to avoid clearing the entire 4K canvas 60 times a second
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let p of s.pts) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = s.size * 5 + 10;
    const bx = Math.floor(minX - pad);
    const by = Math.floor(minY - pad);
    const bw = Math.ceil(maxX - minX + pad * 2);
    const bh = Math.ceil(maxY - minY + pad * 2);
    
    // Clear ONLY the bounding box on the temp canvas
    hlCtx.clearRect(bx, by, bw, bh);
    
    hlCtx.strokeStyle = s.color;
    hlCtx.lineWidth = s.size * 4;
    hlCtx.lineCap = 'round';
    hlCtx.lineJoin = 'round';
    hlCtx.globalAlpha = 1;
    hlCtx.beginPath();
    hlCtx.moveTo(s.pts[0].x, s.pts[0].y);
    
    // Use quadratic curves for smooth path
    for (let i = 1; i < s.pts.length - 1; i++) {
      const mx = (s.pts[i].x + s.pts[i + 1].x) / 2;
      const my = (s.pts[i].y + s.pts[i + 1].y) / 2;
      hlCtx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mx, my);
    }
    const last = s.pts[s.pts.length - 1];
    hlCtx.lineTo(last.x, last.y);
    hlCtx.stroke();
    
    // Composite onto main canvas with transparency, ONLY the bounding box
    cx.globalAlpha = 0.25;
    cx.drawImage(hlCanvas, 
      bx * dpr, by * dpr, bw * dpr, bh * dpr, 
      bx, by, bw, bh);
  } else {
    // Pen: use pre-computed outline if available (instant), otherwise compute (slow fallback)
    let outlinePoints = s._outline;
    if (!outlinePoints) {
      // Fallback: compute inline (first render before worker finishes)
      outlinePoints = computeOutline(s);
      // Cache it so we never recompute for this stroke again
      if (outlinePoints) s._outline = outlinePoints;
    }

    if (!outlinePoints || outlinePoints.length < 2) {
      cx.restore();
      return;
    }

    cx.fillStyle = s.color;
    cx.globalAlpha = 1;
    cx.beginPath();
    cx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
    
    for (let i = 1; i < outlinePoints.length; i++) {
      cx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
    }
    cx.closePath();
    cx.fill();
  }

  cx.restore();
}

// ─── TOOL MANAGEMENT ───
export function setAnnotationTool(t) {
  tool = t;
  // Track last drawing tool for pen auto-activation
  if (t === 'pen' || t === 'hl' || t === 'eraser') {
    lastDrawTool = t;
  }
  // Update brush size slider based on tool
  const brushSlider = document.querySelector('.ann-size-slider[title="Brush Size"]');
  if (brushSlider) {
    if (t === 'hl') brushSlider.value = globalSettings.hlSize || 8;
    else if (t === 'pen' || t === 'eraser') brushSlider.value = globalSettings.penSize || 3;
  }
  // Update toolbar active states
  document.querySelectorAll('.ann-tool-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tool === t);
  });
  // Canvas pointer events — ALWAYS auto
  if (canvas) {
    canvas.style.pointerEvents = 'auto';
    updateCursor();
  }
}
// ─── FLOATING CURSOR (works on iPad) ───
function updateCursor() {
  if (!cursorEl) return;
  if (tool === 'none') {
    cursorEl.style.display = 'none';
    if (canvas) canvas.style.cursor = 'default';
    return;
  }

  cursorEl.style.display = 'block';

  if (tool === 'laser') {
    const size = 20;
    Object.assign(cursorEl.style, {
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: 'rgba(255,59,48,0.3)',
      border: '2px solid #ff3b30',
      boxShadow: '0 0 8px rgba(255,59,48,0.5)',
    });
  } else if (tool === 'eraser') {
    const size = Math.max(penSize * 8, 20);
    Object.assign(cursorEl.style, {
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: 'rgba(255,107,107,0.15)',
      border: '2px solid rgba(255,107,107,0.6)',
      boxShadow: 'none',
    });
  } else {
    // Pen / Highlighter
    const size = Math.max((tool === 'hl' ? hlSize * 6 : penSize * 2), 8);
    Object.assign(cursorEl.style, {
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: tool === 'hl' ? penColor + '40' : 'none',
      border: `2px solid ${penColor}`,
      boxShadow: 'none',
    });
  }

  if (canvas) canvas.style.cursor = 'none';
}

// Shared cursor position updater (called from both global handler and canvas pointermove)
function updateCursorPosition(e) {
  if (!cursorEl || tool === 'none') return;
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

function onGlobalPointerMove(e) {
  updateCursorPosition(e);
}

// ─── UNDO / REDO ───
export function undoAnnotation() {
  if (!strokes.length) return;
  redoStack.push(strokes.pop());
  cacheValid = false;  // Invalidate cache
  scheduleRedraw();
  saveAnnotations();
}

export function redoAnnotation() {
  if (!redoStack.length) return;
  strokes.push(redoStack.pop());
  cacheValid = false;  // Invalidate cache
  scheduleRedraw();
  saveAnnotations();
}

// ─── VISIBILITY TOGGLE ───
export function toggleVisibility() {
  visible = !visible;
  canvas.style.opacity = visible ? '1' : '0';
  const eyeBtn = document.querySelector('.ann-tool-btn[data-tool="eye"]');
  if (eyeBtn) eyeBtn.textContent = visible ? '👁️' : '🚫';
  scheduleRedraw();
}

// ─── CLEAR ALL ───
export function clearAnnotations() {
  strokes = [];
  redoStack = [];
  cacheValid = false;
  scheduleRedraw();
  // Clear IndexedDB + Cloud
  const key = getStorageKey();
  saveToIDB(key, []);
  hasPendingCloudSave = false;
  clearTimeout(saveTimer);
  saveToCloud(key, []).then(ok => showSyncStatus(ok ? 'saved' : 'error'));
}

// ─── PERSISTENCE (IndexedDB primary + Firestore debounced cloud backup) ───
let saveTimer = null;
let hasPendingCloudSave = false;
let lastLocalSaveTime = 0;
const LOCAL_SAVE_THROTTLE = 2000;
let idbSaveTimer = null;

function getStorageKey() {
  const hash = currentExerciseHash || window.location.hash || '#default';
  return hash.replace('#', '').replace(/\//g, '-') || 'default';
}

function saveAnnotations() {
  // 1. Throttled IndexedDB save (async, no main-thread blocking, no size limit)
  const now = Date.now();
  if (now - lastLocalSaveTime > LOCAL_SAVE_THROTTLE) {
    lastLocalSaveTime = now;
    saveToIDB(getStorageKey(), stripMetadataForSave(strokes));
  } else {
    // Debounce: schedule a save so the last stroke is never lost
    clearTimeout(idbSaveTimer);
    idbSaveTimer = setTimeout(() => {
      saveToIDB(getStorageKey(), stripMetadataForSave(strokes));
    }, LOCAL_SAVE_THROTTLE);
  }
  // 2. Debounced Firestore cloud backup (every 60 seconds)
  hasPendingCloudSave = true;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      doCloudSave();
    }, 60000);
  }
}

// Strip internal metadata (_bbox, _outline) before serializing to save space
function stripMetadataForSave(data) {
  return data.map(s => {
    if (!s._bbox && !s._outline) return s;
    const { _bbox, _outline, ...rest } = s;
    return rest;
  });
}

// Actual cloud save with size guard and retry
async function doCloudSave() {
  if (!hasPendingCloudSave) return;
  hasPendingCloudSave = false;
  const key = getStorageKey();
  const saveData = stripMetadataForSave(strokes);
  
  // Guard: Firestore doc limit is ~1MB. If data is too large, decimate further.
  let dataStr = JSON.stringify(saveData);
  if (dataStr.length > 900000) {
    // Aggressively decimate point arrays to fit within Firestore limit
    const trimmed = saveData.map(s => ({
      ...s,
      pts: s.pts.length > 100 ? decimatePoints(s.pts, 3) : s.pts
    }));
    dataStr = JSON.stringify(trimmed);
    const ok = await saveToCloud(key, trimmed);
    showSyncStatus(ok ? 'saved' : 'error');
  } else {
    const ok = await saveToCloud(key, saveData);
    showSyncStatus(ok ? 'saved' : 'error');
  }
}

// Force flush pending saves (called during exercise switch)
export async function flushToCloud() {
  if (hasPendingCloudSave) {
    hasPendingCloudSave = false;
    clearTimeout(saveTimer);
    saveTimer = null;
    const key = getStorageKey();
    // Fire-and-forget: don't block exercise switch on network
    saveToCloud(key, stripMetadataForSave(strokes))
      .then(ok => showSyncStatus(ok ? 'saved' : 'error'))
      .catch(() => showSyncStatus('error'));
  }
}

async function loadAnnotations() {
  const key = getStorageKey();
  
  // 1. Fast load from IndexedDB (async but local — ~1ms)
  try {
    const idbData = await loadFromIDB(key);
    if (idbData && idbData.length > 0) {
      strokes = idbData;
      strokes.forEach(s => { s._bbox = computeBBox(s.pts); });
      cacheValid = false;
      scheduleRedraw();
      precomputeOutlines();
    }
  } catch {}

  // 2. Background cloud sync (may have newer data from another device)
  loadFromCloud(key).then(cloudData => {
    if (cloudData && cloudData.length > 0) {
      strokes = cloudData;
      strokes.forEach(s => { s._bbox = computeBBox(s.pts); });
      // Update IndexedDB with cloud data
      saveToIDB(key, stripMetadataForSave(strokes));
      showSyncStatus('loaded');
      cacheValid = false;
      scheduleRedraw();
      precomputeOutlines();
    } else if (strokes.length > 0) {
      showSyncStatus('local');
    }
  }).catch(() => {});
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

// ─── EXERCISE CHANGE ───
export async function onExerciseChange() {
  // Fire-and-forget cloud flush — don't block the exercise switch!
  flushToCloud();
  currentExerciseHash = window.location.hash || '#default';
  strokes = [];
  redoStack = [];
  cacheValid = false;
  activeBBox = null;

  // Re-create canvas (renderExercise wipes notebook innerHTML)
  if (notebook) {
    canvas = document.createElement('canvas');
    canvas.className = 'annotation-canvas';
    canvas.id = 'annotationCanvas';
    canvas.style.pointerEvents = 'auto';
    notebook.appendChild(canvas);
    ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Re-attach pointer events to new canvas
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    resizeCanvas();
  }

  // Load annotations (cloud sync happens in background, doesn't block)
  loadAnnotations();
}

// ─── KEYBOARD ───
function onKey(e) {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'z') { e.preventDefault(); undoAnnotation(); }
  if (mod && e.key === 'y') { e.preventDefault(); redoAnnotation(); }
}

// ─── BUILD TOOLBAR ───
function buildToolbar() {
  const toolbar = document.createElement('div');
  toolbar.className = 'ann-toolbar';
  toolbar.id = 'annToolbar';

  // Tool buttons (laser is now always-visible floating dot, not a tool)
  const tools = [
    { id: 'pen', icon: '✏️', title: 'Pen' },
    { id: 'hl', icon: '🖍️', title: 'Highlighter' },
    { id: 'eraser', icon: '🧹', title: 'Eraser (or double-tap pen)' },
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
      } else {
        // Toggle: click same tool = deactivate (none), click different = activate
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
  slider.value = globalSettings.penSize;
  slider.className = 'ann-size-slider';
  slider.title = 'Brush Size';
  slider.addEventListener('input', (e) => { 
    if (tool === 'hl') {
      hlSize = +e.target.value;
      globalSettings.hlSize = hlSize;
    } else {
      penSize = +e.target.value; 
      globalSettings.penSize = penSize;
    }
    saveSettings();
    updateCursor(); 
  });
  slider.addEventListener('click', (e) => e.stopPropagation());
  toolbar.appendChild(slider);

  toolbar.appendChild(makeDivider());

  // Text Scale UI (Aa button + Slider)
  const textScaleBtn = document.createElement('button');
  textScaleBtn.className = 'ann-tool-btn';
  textScaleBtn.textContent = 'Aa';
  textScaleBtn.title = 'Text Size';
  toolbar.appendChild(textScaleBtn);
  
  const textScaleContainer = document.createElement('div');
  textScaleContainer.style.display = 'none';
  textScaleContainer.style.alignItems = 'center';
  textScaleContainer.style.marginLeft = '4px';
  
  const textSlider = document.createElement('input');
  textSlider.type = 'range';
  textSlider.min = '0.7';
  textSlider.max = '1.8';
  textSlider.step = '0.05';
  textSlider.value = globalSettings.textScale;
  textSlider.className = 'ann-size-slider';
  textSlider.title = 'Adjust Text Size';
  
  textSlider.addEventListener('input', (e) => {
    const val = +e.target.value;
    document.documentElement.style.setProperty('--text-scale', val);
    globalSettings.textScale = val;
    saveSettings();
    // Let the browser reflow CSS, then fix canvas sizes so drawings stay aligned
    setTimeout(resizeCanvas, 50);
  });
  textSlider.addEventListener('click', (e) => e.stopPropagation());
  
  textScaleContainer.appendChild(textSlider);
  toolbar.appendChild(textScaleContainer);
  
  textScaleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVis = textScaleContainer.style.display !== 'none';
    textScaleContainer.style.display = isVis ? 'none' : 'flex';
  });

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'ann-tool-btn ann-clear';
  clearBtn.textContent = '🗑️';
  clearBtn.title = 'Clear All';
  clearBtn.addEventListener('click', (e) => { e.stopPropagation(); clearAnnotations(); });
  toolbar.appendChild(clearBtn);

  // Debug toggle button
  const debugBtn = document.createElement('button');
  debugBtn.className = 'ann-tool-btn';
  debugBtn.textContent = '🔍';
  debugBtn.title = 'Debug: Show Input Type';
  debugBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = toggleDebug();
    debugBtn.classList.toggle('active', on);
  });
  toolbar.appendChild(debugBtn);

  document.body.appendChild(toolbar);
}

function makeDivider() {
  const d = document.createElement('div');
  d.className = 'ann-divider';
  return d;
}

// ─── DEBUG INPUT INDICATOR ───
let debugEl = null;
let debugTimer = null;
let debugEnabled = false;

function showDebugInput(pointerType) {
  if (!debugEnabled) return;
  if (!debugEl) {
    debugEl = document.createElement('div');
    debugEl.id = 'inputDebug';
    Object.assign(debugEl.style, {
      position: 'fixed',
      top: '12px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 20px',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '700',
      fontFamily: 'Inter, sans-serif',
      zIndex: '9999',
      pointerEvents: 'none',
      transition: 'opacity 0.3s',
      backdropFilter: 'blur(8px)',
      border: '2px solid',
    });
    document.body.appendChild(debugEl);
  }

  const config = {
    pen:   { icon: '🖊️', label: 'PEN (Apple Pencil)', bg: 'rgba(13,148,136,0.9)', border: '#0d9488', color: '#fff' },
    touch: { icon: '👆', label: 'FINGER (Touch)', bg: 'rgba(59,130,246,0.9)', border: '#3b82f6', color: '#fff' },
    mouse: { icon: '🖱️', label: 'MOUSE', bg: 'rgba(139,92,246,0.9)', border: '#8b5cf6', color: '#fff' },
  };
  const c = config[pointerType] || config.mouse;
  debugEl.textContent = `${c.icon}  ${c.label}`;
  debugEl.style.background = c.bg;
  debugEl.style.borderColor = c.border;
  debugEl.style.color = c.color;
  debugEl.style.opacity = '1';

  clearTimeout(debugTimer);
  debugTimer = setTimeout(() => {
    if (debugEl) debugEl.style.opacity = '0';
  }, 1500);
}

export function toggleDebug() {
  debugEnabled = !debugEnabled;
  if (!debugEnabled && debugEl) {
    debugEl.style.opacity = '0';
  }
  return debugEnabled;
}
