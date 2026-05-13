/**
 * eraser.js — EK-Board Whole-Stroke Eraser Tool
 * Performance: bbox pre-check → point-level hit test → local-area redraw.
 */
let eraseRebuildTimer = null;

export default {
  name: 'eraser',

  onDown(pt, eng) {
    eng.drawing = true;
    eng.redoStack.length = 0;
    eraseAt(pt, eng);
  },

  onMove(pt, eng) {
    eraseAt(pt, eng);
  },

  onUp(pt, eng) {
    // Nothing extra needed
  },
};

function eraseAt(pt, eng) {
  const radius = eng.penSize * 5;
  const radiusSq = radius * radius;
  let erasedStroke = null;
  const strokes = eng.strokes;

  for (let i = strokes.length - 1; i >= 0; i--) {
    const stroke = strokes[i];
    // Fast bounding-box rejection
    if (stroke._bbox) {
      const b = stroke._bbox;
      if (pt.x < b.minX - radius || pt.x > b.maxX + radius ||
          pt.y < b.minY - radius || pt.y > b.maxY + radius) continue;
    }
    // Point-level hit test
    const pts = stroke.pts;
    const step = pts.length > 200 ? 3 : 1;
    for (let j = 0; j < pts.length; j += step) {
      const dx = pts[j].x - pt.x;
      const dy = pts[j].y - pt.y;
      if (dx * dx + dy * dy < radiusSq) {
        erasedStroke = strokes.splice(i, 1)[0];
        eng.redoStack.push(erasedStroke);
        break;
      }
    }
    if (erasedStroke) break;
  }

  if (erasedStroke) {
    eng.eraseLocalArea(erasedStroke);
    clearTimeout(eraseRebuildTimer);
    eraseRebuildTimer = setTimeout(() => {
      eng.invalidateCache();
      eng.rebuildCache();
      eng.scheduleRedraw();
    }, 300);
  }
}
