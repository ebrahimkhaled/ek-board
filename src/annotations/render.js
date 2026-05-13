/**
 * render.js — EK-Board Rendering Engine
 * Handles stroke rendering, offscreen cache, and draft preview.
 */
import { getStroke } from 'perfect-freehand';

// ─── OUTLINE COMPUTATION ───
export function computeOutline(stroke) {
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

// ─── HIGHLIGHTER TEMP CANVAS ───
let hlCanvas = null;
let hlCtx = null;

function ensureHlCanvas(canvas) {
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

// ─── DRAW SINGLE STROKE (Final quality) ───
export function drawStroke(s, cx, canvas) {
  if (s.pts.length < 2) return;
  cx.save();

  if (s.tool === 'hl') {
    ensureHlCanvas(canvas);
    const dpr = window.devicePixelRatio || 1;
    
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
    
    hlCtx.clearRect(bx, by, bw, bh);
    hlCtx.strokeStyle = s.color;
    hlCtx.lineWidth = s.size * 4;
    hlCtx.lineCap = 'round';
    hlCtx.lineJoin = 'round';
    hlCtx.globalAlpha = 1;
    hlCtx.beginPath();
    hlCtx.moveTo(s.pts[0].x, s.pts[0].y);
    
    for (let i = 1; i < s.pts.length - 1; i++) {
      const mx = (s.pts[i].x + s.pts[i + 1].x) / 2;
      const my = (s.pts[i].y + s.pts[i + 1].y) / 2;
      hlCtx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mx, my);
    }
    const last = s.pts[s.pts.length - 1];
    hlCtx.lineTo(last.x, last.y);
    hlCtx.stroke();
    
    cx.globalAlpha = 0.25;
    cx.drawImage(hlCanvas, 
      bx * dpr, by * dpr, bw * dpr, bh * dpr, 
      bx, by, bw, bh);
  } else {
    let outlinePoints = s._outline;
    if (!outlinePoints) {
      outlinePoints = computeOutline(s);
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

// ─── DRAFT RENDERING (zero-latency preview during active drawing) ───
export function drawDraftStroke(s, cx) {
  if (s.pts.length < 2) return;
  cx.save();

  if (s.tool === 'hl') {
    drawStroke(s, cx);
    cx.restore();
    return;
  }

  cx.strokeStyle = s.color;
  cx.lineWidth = s.size * 1.5;
  cx.lineCap = 'round';
  cx.lineJoin = 'round';
  cx.globalAlpha = 0.85;
  cx.beginPath();
  cx.moveTo(s.pts[0].x, s.pts[0].y);
  
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

// ─── OFFSCREEN CACHE ───
let cacheCanvas = null;
let cacheCtx = null;
let _cacheValid = false;

export function isCacheValid() { return _cacheValid; }
export function setCacheValid(v) { _cacheValid = v; }
export function getCacheCanvas() { return cacheCanvas; }
export function getCacheCtx() { return cacheCtx; }

export function bakeStrokeToCache(stroke, canvas) {
  ensureCacheCanvas(canvas);
  drawStroke(stroke, cacheCtx, canvas);
}

export function rebuildCache(strokes, canvas) {
  ensureCacheCanvas(canvas);
  const dpr = window.devicePixelRatio || 1;
  cacheCtx.clearRect(0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  strokes.forEach(s => drawStroke(s, cacheCtx, canvas));
  _cacheValid = true;
}

function ensureCacheCanvas(canvas) {
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
    cacheCtx.clearRect(0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
    _cacheValid = false;
  }
}

export function redrawAll(ctx, canvas, strokes, visible) {
  if (!ctx || !canvas) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  if (!visible) return;
  
  if (_cacheValid && cacheCanvas) {
    ctx.drawImage(cacheCanvas, 0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  } else {
    rebuildCache(strokes, canvas);
    ctx.drawImage(cacheCanvas, 0, 0, cacheCanvas.width / dpr, cacheCanvas.height / dpr);
  }
}

// ─── LOCAL-AREA ERASE REDRAW ───
export function eraseLocalArea(erasedStroke, strokes, ctx, canvas) {
  if (!ctx || !canvas || !cacheCanvas) return;
  const dpr = window.devicePixelRatio || 1;
  const bbox = erasedStroke._bbox || computeBBox(erasedStroke.pts);
  const pad = (erasedStroke.size || 3) * 5 + 5;
  const bx = Math.floor(bbox.minX - pad);
  const by = Math.floor(bbox.minY - pad);
  const bw = Math.ceil(bbox.maxX - bbox.minX + pad * 2);
  const bh = Math.ceil(bbox.maxY - bbox.minY + pad * 2);

  cacheCtx.clearRect(bx, by, bw, bh);
  cacheCtx.save();
  cacheCtx.beginPath();
  cacheCtx.rect(bx, by, bw, bh);
  cacheCtx.clip();
  for (const s of strokes) {
    if (!s._bbox) continue;
    if (s._bbox.maxX + pad >= bx && s._bbox.minX - pad <= bx + bw &&
        s._bbox.maxY + pad >= by && s._bbox.minY - pad <= by + bh) {
      drawStroke(s, cacheCtx, canvas);
    }
  }
  cacheCtx.restore();

  ctx.clearRect(bx, by, bw, bh);
  ctx.drawImage(cacheCanvas,
    bx * dpr, by * dpr, bw * dpr, bh * dpr,
    bx, by, bw, bh);
  _cacheValid = true;
}

// ─── HELPERS ───
export function computeBBox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function decimatePoints(pts, factor) {
  if (pts.length <= 10) return pts;
  const result = [pts[0]];
  for (let i = factor; i < pts.length - 1; i += factor) {
    result.push(pts[i]);
  }
  result.push(pts[pts.length - 1]);
  return result;
}
