/**
 * lasso.js — EK-Board Lasso Selection Tool
 * Intersection-based: lasso path only needs to TOUCH a stroke to select it.
 * Actions: Move, Resize, Copy, Recolor, Delete.
 */
let selectedStrokes = new Set();
let lassoPath = [];
let isDrawingLasso = false;
let actionBar = null;
let dragState = null;

export default {
  name: 'lasso',

  onDown(pt, eng) {
    const handle = getResizeHandle(pt);
    if (handle) {
      dragState = { type: 'resize', corner: handle, startX: pt.x, startY: pt.y, origBox: getBBox() };
      return;
    }
    if (selectedStrokes.size > 0 && isInsideSelection(pt)) {
      dragState = { type: 'move', startX: pt.x, startY: pt.y };
      return;
    }
    clearSelection(eng);
    lassoPath = [pt];
    isDrawingLasso = true;
  },

  onMove(pt, eng) {
    if (dragState) {
      if (dragState.type === 'move') {
        const dx = pt.x - dragState.startX, dy = pt.y - dragState.startY;
        for (const s of selectedStrokes) {
          for (const p of s.pts) { p.x += dx; p.y += dy; }
          if (s._bbox) { s._bbox.minX += dx; s._bbox.minY += dy; s._bbox.maxX += dx; s._bbox.maxY += dy; }
          s._outline = null;
        }
        dragState.startX = pt.x; dragState.startY = pt.y;
        eng.invalidateCache(); eng.scheduleRedraw();
      } else if (dragState.type === 'resize') {
        const ob = dragState.origBox;
        const cx = (ob.minX + ob.maxX) / 2, cy = (ob.minY + ob.maxY) / 2;
        const hw = Math.max((ob.maxX - ob.minX) / 2, 1), hh = Math.max((ob.maxY - ob.minY) / 2, 1);
        let sx = 1, sy = 1;
        if (dragState.corner.includes('r')) sx = Math.max(0.1, 1 + (pt.x - dragState.startX) / hw);
        if (dragState.corner.includes('l')) sx = Math.max(0.1, 1 - (pt.x - dragState.startX) / hw);
        if (dragState.corner.includes('b')) sy = Math.max(0.1, 1 + (pt.y - dragState.startY) / hh);
        if (dragState.corner.includes('t')) sy = Math.max(0.1, 1 - (pt.y - dragState.startY) / hh);
        const avgScale = (sx + sy) / 2;
        for (const s of selectedStrokes) {
          for (const p of s.pts) { p.x = cx + (p.x - cx) * sx; p.y = cy + (p.y - cy) * sy; }
          s.size = Math.max(0.5, s.size * avgScale);
          s._bbox = eng.computeBBox(s.pts); s._outline = null;
        }
        dragState.startX = pt.x; dragState.startY = pt.y; dragState.origBox = getBBox();
        eng.invalidateCache(); eng.scheduleRedraw();
      }
      return;
    }
    if (!isDrawingLasso) return;
    lassoPath.push(pt);
    eng.scheduleRedraw();
  },

  onUp(pt, eng) {
    if (dragState) {
      dragState = null;
      eng.saveAnnotations(); eng.invalidateCache(); eng.scheduleRedraw();
      showActionBar(eng);
      return;
    }
    if (!isDrawingLasso) return;
    isDrawingLasso = false;
    if (lassoPath.length < 3) { lassoPath = []; return; }
    const RADIUS_SQ = 225;
    for (const stroke of eng.strokes) {
      if (intersects(stroke, lassoPath, RADIUS_SQ)) selectedStrokes.add(stroke);
    }
    lassoPath = [];
    if (selectedStrokes.size > 0) showActionBar(eng);
    eng.scheduleRedraw();
  },

  drawOverlay(cx) {
    if (isDrawingLasso && lassoPath.length > 1) {
      cx.save();
      cx.strokeStyle = '#3b82f6'; cx.lineWidth = 2; cx.setLineDash([6, 4]); cx.globalAlpha = 0.8;
      cx.beginPath(); cx.moveTo(lassoPath[0].x, lassoPath[0].y);
      for (let i = 1; i < lassoPath.length; i++) cx.lineTo(lassoPath[i].x, lassoPath[i].y);
      cx.stroke(); cx.restore();
    }
    if (selectedStrokes.size > 0) {
      const b = getBBox(); const pad = 8;
      cx.save();
      cx.fillStyle = 'rgba(100,140,180,0.12)';
      cx.fillRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2);
      cx.strokeStyle = '#3b82f6'; cx.lineWidth = 1.5; cx.setLineDash([6, 4]);
      cx.strokeRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2);
      cx.setLineDash([]);
      [{ x: b.minX - pad, y: b.minY - pad }, { x: b.maxX + pad, y: b.minY - pad },
       { x: b.minX - pad, y: b.maxY + pad }, { x: b.maxX + pad, y: b.maxY + pad }].forEach(c => {
        cx.fillStyle = '#fff'; cx.strokeStyle = '#3b82f6'; cx.lineWidth = 2;
        cx.beginPath(); cx.arc(c.x, c.y, 5, 0, Math.PI * 2); cx.fill(); cx.stroke();
      });
      cx.restore();
    }
  },

  onDeactivate(eng) { clearSelection(eng); },
  hasSelection() { return selectedStrokes.size > 0; },
  clearSelection(eng) { clearSelection(eng); },
};

// ─── GEOMETRY ───
function intersects(stroke, path, rSq) {
  const step = stroke.pts.length > 100 ? 3 : 1;
  for (let i = 0; i < stroke.pts.length; i += step) {
    const sp = stroke.pts[i];
    for (let j = 0; j < path.length - 1; j++) {
      if (ptSegDist(sp, path[j], path[j + 1]) < rSq) return true;
    }
  }
  return false;
}

function ptSegDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy;
  if (l === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
  let t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
  return (p.x - (a.x + t * dx)) ** 2 + (p.y - (a.y + t * dy)) ** 2;
}

function getBBox() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of selectedStrokes) {
    if (s._bbox) {
      if (s._bbox.minX < minX) minX = s._bbox.minX;
      if (s._bbox.minY < minY) minY = s._bbox.minY;
      if (s._bbox.maxX > maxX) maxX = s._bbox.maxX;
      if (s._bbox.maxY > maxY) maxY = s._bbox.maxY;
    }
  }
  return { minX, minY, maxX, maxY };
}

function isInsideSelection(pt) {
  if (selectedStrokes.size === 0) return false;
  const b = getBBox();
  return pt.x >= b.minX - 10 && pt.x <= b.maxX + 10 && pt.y >= b.minY - 10 && pt.y <= b.maxY + 10;
}

function getResizeHandle(pt) {
  if (selectedStrokes.size === 0) return null;
  const b = getBBox(), pad = 8, H = 12;
  const corners = [
    { name: 'tl', x: b.minX - pad, y: b.minY - pad }, { name: 'tr', x: b.maxX + pad, y: b.minY - pad },
    { name: 'bl', x: b.minX - pad, y: b.maxY + pad }, { name: 'br', x: b.maxX + pad, y: b.maxY + pad },
  ];
  for (const c of corners) { if (Math.abs(pt.x - c.x) < H && Math.abs(pt.y - c.y) < H) return c.name; }
  return null;
}

// ─── ACTIONS ───
function copySelection(eng) {
  const news = [];
  for (const s of selectedStrokes) {
    const cl = JSON.parse(JSON.stringify({ tool: s.tool, color: s.color, size: s.size, pts: s.pts }));
    cl.pts.forEach(p => { p.x += 20; p.y += 20; });
    cl._bbox = eng.computeBBox(cl.pts); news.push(cl);
  }
  news.forEach(s => eng.strokes.push(s));
  selectedStrokes = new Set(news);
  eng.invalidateCache(); eng.scheduleRedraw(); eng.saveAnnotations(); showActionBar(eng);
}

function recolorSelection(color, eng) {
  for (const s of selectedStrokes) { s.color = color; s._outline = null; }
  eng.invalidateCache(); eng.scheduleRedraw(); eng.saveAnnotations();
}

function deleteSelection(eng) {
  for (const s of selectedStrokes) {
    const i = eng.strokes.indexOf(s); if (i !== -1) eng.strokes.splice(i, 1);
  }
  clearSelection(eng); eng.invalidateCache(); eng.scheduleRedraw(); eng.saveAnnotations();
}

function clearSelection(eng) {
  selectedStrokes.clear(); lassoPath = []; isDrawingLasso = false; dragState = null;
  removeActionBar(); if (eng) eng.scheduleRedraw();
}

// ─── ACTION BAR UI ───
function showActionBar(eng) {
  removeActionBar();
  if (selectedStrokes.size === 0) return;
  const b = getBBox();
  actionBar = document.createElement('div');
  actionBar.id = 'lassoActionBar';
  Object.assign(actionBar.style, {
    position: 'fixed', display: 'flex', gap: '4px', padding: '6px 8px', borderRadius: '10px',
    background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: '200', pointerEvents: 'auto',
  });
  if (eng.canvas) {
    const rect = eng.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = eng.canvas.width / dpr, ch = eng.canvas.height / dpr;
    actionBar.style.left = Math.max(10, rect.left + (b.minX / cw) * rect.width) + 'px';
    actionBar.style.top = Math.max(10, rect.top + (b.minY / ch) * rect.height - 52) + 'px';
  }
  [{ icon: '📋', fn: () => copySelection(eng) },
   { icon: '🎨', fn: () => showColorPicker(eng) },
   { icon: '🗑️', fn: () => deleteSelection(eng) }].forEach(a => {
    const btn = document.createElement('button');
    Object.assign(btn.style, {
      background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
      color: '#e2e8f0', padding: '4px 8px', cursor: 'pointer', fontSize: '1.1rem',
    });
    btn.textContent = a.icon;
    btn.addEventListener('click', e => { e.stopPropagation(); a.fn(); });
    btn.addEventListener('pointerdown', e => e.stopPropagation());
    actionBar.appendChild(btn);
  });
  document.body.appendChild(actionBar);
}

function showColorPicker(eng) {
  const picker = document.createElement('div');
  picker.id = 'lassoColorPicker';
  Object.assign(picker.style, {
    position: 'fixed', display: 'flex', gap: '6px', padding: '6px 8px', borderRadius: '10px',
    background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(8px)',
    border: '1px solid rgba(59,130,246,0.3)', zIndex: '201',
  });
  if (actionBar) {
    const r = actionBar.getBoundingClientRect();
    picker.style.left = r.left + 'px'; picker.style.top = (r.bottom + 4) + 'px';
  }
  ['#c41e3a', '#1a5276', '#1a1a1a', '#1e8449', '#f59e0b'].forEach(c => {
    const dot = document.createElement('div');
    Object.assign(dot.style, { width: '22px', height: '22px', borderRadius: '50%', background: c, cursor: 'pointer', border: '2px solid rgba(255,255,255,0.2)' });
    dot.addEventListener('click', e => { e.stopPropagation(); recolorSelection(c, eng); picker.remove(); });
    dot.addEventListener('pointerdown', e => e.stopPropagation());
    picker.appendChild(dot);
  });
  document.body.appendChild(picker);
  setTimeout(() => document.addEventListener('pointerdown', function h() { picker.remove(); document.removeEventListener('pointerdown', h); }, { once: true }), 100);
}

function removeActionBar() {
  if (actionBar) { actionBar.remove(); actionBar = null; }
  const p = document.getElementById('lassoColorPicker'); if (p) p.remove();
}
