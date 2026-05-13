/**
 * spacer.js — EK-Board Insert Space Tool (OneNote-style)
 * Tap a position → drag down → pushes all content and strokes below that
 * point downward, creating empty space for new annotations.
 */
let spacerY = null;       // The Y-coordinate where space is being inserted
let spacerDragging = false;
let spacerStartY = null;
let spacerDelta = 0;
let spacerLineEl = null;  // Visual indicator

export default {
  name: 'spacer',
  icon: '↕️',
  title: 'Insert Space',

  onDown(pt, eng) {
    spacerY = pt.y;
    spacerStartY = pt.y;
    spacerDelta = 0;
    spacerDragging = true;
    showSpacerLine(eng, pt.y);
  },

  onMove(pt, eng) {
    if (!spacerDragging) return;
    spacerDelta = Math.max(0, pt.y - spacerStartY); // Only push DOWN
    updateSpacerLine(eng, spacerY, spacerDelta);
    eng.scheduleRedraw();
  },

  onUp(pt, eng) {
    if (!spacerDragging) return;
    spacerDragging = false;
    
    if (spacerDelta > 5) { // Minimum 5px to commit
      // Push all strokes below spacerY down by spacerDelta
      for (const s of eng.strokes) {
        let moved = false;
        for (const p of s.pts) {
          if (p.y >= spacerY) {
            p.y += spacerDelta;
            moved = true;
          }
        }
        if (moved) {
          s._bbox = eng.computeBBox(s.pts);
          s._outline = null;
        }
      }
      
      // Inject spacer into notebook DOM to push HTML content down
      injectDomSpacer(eng, spacerY, spacerDelta);
      
      eng.invalidateCache();
      eng.scheduleRedraw();
      eng.saveAnnotations();
      
      // Resize canvas to accommodate new height
      setTimeout(() => eng.resizeCanvas(), 50);
    }
    
    hideSpacerLine();
    spacerY = null;
    spacerStartY = null;
    spacerDelta = 0;
  },

  drawOverlay(cx) {
    if (!spacerDragging || spacerDelta <= 0) return;
    cx.save();
    
    // Horizontal line at insertion point
    const w = cx.canvas.width / (window.devicePixelRatio || 1);
    cx.strokeStyle = '#f59e0b';
    cx.lineWidth = 2;
    cx.setLineDash([8, 4]);
    cx.beginPath();
    cx.moveTo(0, spacerY);
    cx.lineTo(w, spacerY);
    cx.stroke();
    
    // Shaded area being created
    cx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    cx.fillRect(0, spacerY, w, spacerDelta);
    
    // Bottom line
    cx.beginPath();
    cx.moveTo(0, spacerY + spacerDelta);
    cx.lineTo(w, spacerY + spacerDelta);
    cx.stroke();
    
    // Arrow indicator in the middle
    const midX = w / 2;
    cx.setLineDash([]);
    cx.fillStyle = '#f59e0b';
    cx.beginPath();
    cx.moveTo(midX - 8, spacerY + spacerDelta / 2 - 6);
    cx.lineTo(midX + 8, spacerY + spacerDelta / 2 - 6);
    cx.lineTo(midX, spacerY + spacerDelta / 2 + 6);
    cx.closePath();
    cx.fill();
    
    cx.restore();
  },

  onDeactivate() {
    hideSpacerLine();
    spacerDragging = false;
    spacerY = null;
  },
};

// ─── DOM SPACER INJECTION ───
// Finds the DOM element at the insertion Y and inserts a spacer div after it
function injectDomSpacer(eng, y, height) {
  if (!eng.notebook) return;
  const rect = eng.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const cw = eng.canvas.width / dpr;
  const ch = eng.canvas.height / dpr;
  
  // Convert canvas Y to viewport Y
  const viewportY = rect.top + (y / ch) * rect.height;
  
  // Find the deepest visible block-level element at this Y
  const elements = eng.notebook.querySelectorAll('.step, .line, p, div, pre, h1, h2, h3, h4, h5, h6, li, blockquote, table, img');
  let targetEl = null;
  
  for (const el of elements) {
    const elRect = el.getBoundingClientRect();
    if (elRect.bottom <= viewportY && elRect.bottom > 0) {
      targetEl = el;
    }
  }
  
  if (targetEl) {
    const spacerDiv = document.createElement('div');
    spacerDiv.className = 'annotation-spacer';
    spacerDiv.style.height = height + 'px';
    spacerDiv.style.width = '100%';
    spacerDiv.style.flexShrink = '0';
    targetEl.after(spacerDiv);
  } else {
    // Fallback: add padding to notebook
    const currentPad = parseInt(eng.notebook.style.paddingBottom || '0');
    eng.notebook.style.paddingBottom = (currentPad + height) + 'px';
  }
}

// ─── VISUAL INDICATOR ───
function showSpacerLine(eng, y) {
  hideSpacerLine();
  spacerLineEl = document.createElement('div');
  spacerLineEl.id = 'spacerIndicator';
  Object.assign(spacerLineEl.style, {
    position: 'fixed', left: '0', width: '100%', height: '2px',
    background: '#f59e0b', zIndex: '160', pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(245,158,11,0.5)',
  });
  if (eng.canvas) {
    const rect = eng.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const ch = eng.canvas.height / dpr;
    spacerLineEl.style.top = (rect.top + (y / ch) * rect.height) + 'px';
  }
  document.body.appendChild(spacerLineEl);
}

function updateSpacerLine(eng, y, delta) {
  // The line stays at the original Y; the overlay shows the expansion
}

function hideSpacerLine() {
  if (spacerLineEl) { spacerLineEl.remove(); spacerLineEl = null; }
}
