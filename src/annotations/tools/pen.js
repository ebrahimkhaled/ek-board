/**
 * pen.js — EK-Board Pen & Highlighter Tool
 * Handles both pen and highlighter strokes (same flow, different defaults).
 */

const MIN_POINT_DIST_SQ = 4; // 2px minimum gap between points

export default {
  name: 'pen', // Also handles 'hl'
  
  onDown(pt, eng) {
    eng.drawing = true;
    eng.redoStack.length = 0;
    eng.activeBBox = { minX: pt.x, minY: pt.y, maxX: pt.x, maxY: pt.y };
    eng.curStroke = {
      tool: eng.tool,
      color: eng.penColor,
      size: eng.tool === 'hl' ? eng.hlSize : eng.penSize,
      pts: [pt]
    };
  },

  onMove(pt, eng, coalescedEvents) {
    if (!eng.curStroke) return;
    const events = coalescedEvents || [{ pt }];
    for (const ce of events) {
      const p = ce.pt || ce;
      const lastPt = eng.curStroke.pts[eng.curStroke.pts.length - 1];
      const dx = p.x - lastPt.x;
      const dy = p.y - lastPt.y;
      if (dx * dx + dy * dy < MIN_POINT_DIST_SQ) continue;
      eng.curStroke.pts.push(p);
      if (eng.activeBBox) {
        if (p.x < eng.activeBBox.minX) eng.activeBBox.minX = p.x;
        if (p.x > eng.activeBBox.maxX) eng.activeBBox.maxX = p.x;
        if (p.y < eng.activeBBox.minY) eng.activeBBox.minY = p.y;
        if (p.y > eng.activeBBox.maxY) eng.activeBBox.maxY = p.y;
      }
    }
    eng.scheduleRedraw();
  },

  onUp(pt, eng) {
    if (eng.curStroke && eng.curStroke.pts.length >= 2) {
      if (eng.curStroke.pts.length > 500) {
        eng.curStroke.pts = eng.decimatePoints(eng.curStroke.pts, 2);
      }
      eng.curStroke._bbox = eng.computeBBox(eng.curStroke.pts);
      if (eng.curStroke.tool !== 'hl') {
        eng.curStroke._outline = eng.computeOutline(eng.curStroke);
      }
      eng.strokes.push(eng.curStroke);
      eng.bakeStrokeToCache(eng.curStroke);
    }
    eng.curStroke = null;
    eng.activeBBox = null;
    eng.scheduleRedraw();
    eng.saveAnnotations();
  },
};
