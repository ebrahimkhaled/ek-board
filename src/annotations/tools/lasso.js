/**
 * lasso.js — EK-Board Lasso Selection Tool
 * 
 * Intersection-based selection: the lasso path only needs to TOUCH a stroke
 * to select it (not encircle it). Selected strokes get a blue-gray overlay
 * with resize handles.
 * 
 * Actions: Move, Resize, Copy, Recolor, Delete
 */

// Selection state
let selectedStrokes = new Set();
let lassoPath = [];        // Lasso drawing points
let isDrawingLasso = false;
let actionBar = null;
let selectionBox = null;
let dragState = null;      // { type: 'move'|'resize', startX, startY, corner? }

// ─── TOOL DEFINITION ───
export default {
  name: 'lasso',
  icon: '✂️',
  title: 'Lasso Select',

  onDown(pt, e, engine) {
    // If clicking inside existing selection with no drag → check for action
    if (selectedStrokes.size > 0 && isInsideSelection(pt)) {
      // Start move drag
      dragState = { type: 'move', startX: pt.x, startY: pt.y };
      return;
    }
    
    // If clicking on a resize handle
    const handle = getResizeHandle(pt);
    if (handle) {
      dragState = { type: 'resize', corner: handle, startX: pt.x, startY: pt.y, origBox: getSelectionBBox() };
      return;
    }
    
    // Clear previous selection and start new lasso
    clearSelection(engine);
    lassoPath = [pt];
    isDrawingLasso = true;
  },

  onMove(pt, e, engine) {
    if (dragState) {
      if (dragState.type === 'move') {
        moveSelection(pt, dragState, engine);
        dragState.startX = pt.x;
        dragState.startY = pt.y;
      } else if (dragState.type === 'resize') {
        resizeSelection(pt, dragState, engine);
      }
      return;
    }
    
    if (!isDrawingLasso) return;
    lassoPath.push(pt);
    
    // Draw lasso preview on screen
    drawLassoPreview(engine);
  },

  onUp(pt, e, engine) {
    if (dragState) {
      dragState = null;
      engine.saveAnnotations();
      engine.invalidateCache();
      engine.scheduleRedraw();
      updateUI(engine);
      return;
    }
    
    if (!isDrawingLasso) return;
    isDrawingLasso = false;
    
    if (lassoPath.length < 3) {
      lassoPath = [];
      return;
    }
    
    // Find strokes that INTERSECT the lasso path
    selectIntersectingStrokes(engine);
    lassoPath = [];
    
    if (selectedStrokes.size > 0) {
      showActionBar(engine);
      engine.scheduleRedraw();
    }
  },

  // Called after engine renders all strokes
  drawOverlay(ctx, engine) {
    // Draw lasso path while drawing
    if (isDrawingLasso && lassoPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(lassoPath[0].x, lassoPath[0].y);
      for (let i = 1; i < lassoPath.length; i++) {
        ctx.lineTo(lassoPath[i].x, lassoPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
    
    // Draw selection overlay
    if (selectedStrokes.size > 0) {
      drawSelectionOverlay(ctx);
    }
  },

  onDeactivate(engine) {
    clearSelection(engine);
  },
};

// ─── INTERSECTION DETECTION ───
// Tests if the lasso path touches any stroke (within radius distance)
function selectIntersectingStrokes(engine) {
  const TOUCH_RADIUS = 15;
  const TOUCH_RADIUS_SQ = TOUCH_RADIUS * TOUCH_RADIUS;
  
  for (const stroke of engine.strokes) {
    if (strokeIntersectsPath(stroke, lassoPath, TOUCH_RADIUS_SQ)) {
      selectedStrokes.add(stroke);
    }
  }
}

function strokeIntersectsPath(stroke, path, radiusSq) {
  // For each point in the stroke, check if it's near any lasso segment
  const step = stroke.pts.length > 100 ? 3 : 1;
  for (let i = 0; i < stroke.pts.length; i += step) {
    const sp = stroke.pts[i];
    for (let j = 0; j < path.length - 1; j++) {
      const distSq = pointToSegmentDistSq(sp, path[j], path[j + 1]);
      if (distSq < radiusSq) return true;
    }
  }
  return false;
}

// Point-to-line-segment distance squared
function pointToSegmentDistSq(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return (p.x - a.x) ** 2 + (p.y - a.y) ** 2;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return (p.x - projX) ** 2 + (p.y - projY) ** 2;
}

// ─── SELECTION BOX ───
function getSelectionBBox() {
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
  const b = getSelectionBBox();
  const pad = 10;
  return pt.x >= b.minX - pad && pt.x <= b.maxX + pad &&
         pt.y >= b.minY - pad && pt.y <= b.maxY + pad;
}

const HANDLE_SIZE = 12;
function getResizeHandle(pt) {
  if (selectedStrokes.size === 0) return null;
  const b = getSelectionBBox();
  const pad = 8;
  const corners = [
    { name: 'tl', x: b.minX - pad, y: b.minY - pad },
    { name: 'tr', x: b.maxX + pad, y: b.minY - pad },
    { name: 'bl', x: b.minX - pad, y: b.maxY + pad },
    { name: 'br', x: b.maxX + pad, y: b.maxY + pad },
  ];
  for (const c of corners) {
    if (Math.abs(pt.x - c.x) < HANDLE_SIZE && Math.abs(pt.y - c.y) < HANDLE_SIZE) {
      return c.name;
    }
  }
  return null;
}

// ─── SELECTION VISUAL ───
function drawSelectionOverlay(ctx) {
  const b = getSelectionBBox();
  const pad = 8;
  
  // Blue-gray frosted overlay on each selected stroke's bbox
  ctx.save();
  ctx.fillStyle = 'rgba(100, 140, 180, 0.12)';
  ctx.fillRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2);
  
  // Dashed selection border
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(b.minX - pad, b.minY - pad, b.maxX - b.minX + pad * 2, b.maxY - b.minY + pad * 2);
  ctx.setLineDash([]);
  
  // Corner resize handles
  const corners = [
    { x: b.minX - pad, y: b.minY - pad },
    { x: b.maxX + pad, y: b.minY - pad },
    { x: b.minX - pad, y: b.maxY + pad },
    { x: b.maxX + pad, y: b.maxY + pad },
  ];
  corners.forEach(c => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  
  ctx.restore();
}

function drawLassoPreview(engine) {
  engine.scheduleRedraw();
}

// ─── ACTIONS ───
function moveSelection(pt, drag, engine) {
  const dx = pt.x - drag.startX;
  const dy = pt.y - drag.startY;
  
  for (const stroke of selectedStrokes) {
    for (const p of stroke.pts) {
      p.x += dx;
      p.y += dy;
    }
    if (stroke._bbox) {
      stroke._bbox.minX += dx;
      stroke._bbox.minY += dy;
      stroke._bbox.maxX += dx;
      stroke._bbox.maxY += dy;
    }
    stroke._outline = null; // Force recompute
  }
  
  engine.invalidateCache();
  engine.scheduleRedraw();
}

function resizeSelection(pt, drag, engine) {
  const ob = drag.origBox;
  const cx = (ob.minX + ob.maxX) / 2;
  const cy = (ob.minY + ob.maxY) / 2;
  const hw = (ob.maxX - ob.minX) / 2;
  const hh = (ob.maxY - ob.minY) / 2;
  
  if (hw < 1 || hh < 1) return;
  
  // Calculate scale based on which corner is being dragged
  let sx = 1, sy = 1;
  if (drag.corner.includes('r')) sx = Math.max(0.1, 1 + (pt.x - drag.startX) / hw);
  if (drag.corner.includes('l')) sx = Math.max(0.1, 1 - (pt.x - drag.startX) / hw);
  if (drag.corner.includes('b')) sy = Math.max(0.1, 1 + (pt.y - drag.startY) / hh);
  if (drag.corner.includes('t')) sy = Math.max(0.1, 1 - (pt.y - drag.startY) / hh);
  
  for (const stroke of selectedStrokes) {
    for (const p of stroke.pts) {
      p.x = cx + (p.x - cx) * sx;
      p.y = cy + (p.y - cy) * sy;
    }
    stroke._bbox = null;
    stroke._outline = null;
    // Recompute bbox inline
    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
    for (const p of stroke.pts) {
      if (p.x < mnX) mnX = p.x; if (p.x > mxX) mxX = p.x;
      if (p.y < mnY) mnY = p.y; if (p.y > mxY) mxY = p.y;
    }
    stroke._bbox = { minX: mnX, minY: mnY, maxX: mxX, maxY: mxY };
  }
  
  drag.startX = pt.x;
  drag.startY = pt.y;
  drag.origBox = getSelectionBBox();
  
  engine.invalidateCache();
  engine.scheduleRedraw();
}

function copySelection(engine) {
  const newStrokes = [];
  for (const stroke of selectedStrokes) {
    const clone = JSON.parse(JSON.stringify({
      tool: stroke.tool,
      color: stroke.color,
      size: stroke.size,
      pts: stroke.pts,
    }));
    // Offset by 20px
    clone.pts.forEach(p => { p.x += 20; p.y += 20; });
    clone._bbox = { 
      minX: stroke._bbox.minX + 20, minY: stroke._bbox.minY + 20,
      maxX: stroke._bbox.maxX + 20, maxY: stroke._bbox.maxY + 20
    };
    newStrokes.push(clone);
  }
  
  // Add to strokes and select new copies
  newStrokes.forEach(s => engine.strokes.push(s));
  selectedStrokes = new Set(newStrokes);
  
  engine.invalidateCache();
  engine.scheduleRedraw();
  engine.saveAnnotations();
  updateUI(engine);
}

function recolorSelection(color, engine) {
  for (const stroke of selectedStrokes) {
    stroke.color = color;
    stroke._outline = null; // Force recompute
  }
  engine.invalidateCache();
  engine.scheduleRedraw();
  engine.saveAnnotations();
}

function deleteSelection(engine) {
  for (const stroke of selectedStrokes) {
    const idx = engine.strokes.indexOf(stroke);
    if (idx !== -1) engine.strokes.splice(idx, 1);
  }
  clearSelection(engine);
  engine.invalidateCache();
  engine.scheduleRedraw();
  engine.saveAnnotations();
}

// ─── ACTION BAR UI ───
function showActionBar(engine) {
  removeActionBar();
  
  const b = getSelectionBBox();
  actionBar = document.createElement('div');
  actionBar.className = 'lasso-action-bar';
  actionBar.id = 'lassoActionBar';
  
  // Position above selection
  const canvasRect = engine.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const nx = (b.minX) / (engine.canvas.width / dpr);
  const ny = (b.minY) / (engine.canvas.height / dpr);
  const screenX = canvasRect.left + nx * canvasRect.width;
  const screenY = canvasRect.top + ny * canvasRect.height - 50;
  
  actionBar.style.left = Math.max(10, screenX) + 'px';
  actionBar.style.top = Math.max(10, screenY) + 'px';
  
  const actions = [
    { icon: '📋', title: 'Copy', fn: () => copySelection(engine) },
    { icon: '🎨', title: 'Recolor', fn: () => showColorPicker(engine) },
    { icon: '🗑️', title: 'Delete', fn: () => deleteSelection(engine) },
  ];
  
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'lasso-action-btn';
    btn.textContent = a.icon;
    btn.title = a.title;
    btn.addEventListener('click', (e) => { e.stopPropagation(); a.fn(); });
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    actionBar.appendChild(btn);
  });
  
  document.body.appendChild(actionBar);
}

function showColorPicker(engine) {
  const colors = ['#c41e3a', '#1a5276', '#1a1a1a', '#1e8449', '#f59e0b'];
  const picker = document.createElement('div');
  picker.className = 'lasso-color-picker';
  picker.style.position = 'fixed';
  
  if (actionBar) {
    const rect = actionBar.getBoundingClientRect();
    picker.style.left = rect.left + 'px';
    picker.style.top = (rect.bottom + 4) + 'px';
  }
  
  colors.forEach(c => {
    const dot = document.createElement('div');
    dot.className = 'lasso-color-dot';
    dot.style.background = c;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      recolorSelection(c, engine);
      picker.remove();
    });
    dot.addEventListener('pointerdown', (e) => e.stopPropagation());
    picker.appendChild(dot);
  });
  
  document.body.appendChild(picker);
  // Remove picker when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('pointerdown', function removePickerHandler() {
      picker.remove();
      document.removeEventListener('pointerdown', removePickerHandler);
    }, { once: true });
  }, 100);
}

function removeActionBar() {
  if (actionBar) {
    actionBar.remove();
    actionBar = null;
  }
}

function updateUI(engine) {
  if (selectedStrokes.size > 0) {
    showActionBar(engine);
  } else {
    removeActionBar();
  }
}

export function clearSelection(engine) {
  selectedStrokes.clear();
  lassoPath = [];
  isDrawingLasso = false;
  dragState = null;
  removeActionBar();
  if (engine) engine.scheduleRedraw();
}

export function getSelectedStrokes() {
  return selectedStrokes;
}
