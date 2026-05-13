/**
 * stroke-worker.js — Background Compute Worker for EK-Board
 * 
 * Offloads expensive `getStroke()` (perfect-freehand) computation
 * from the main thread to prevent input lag during:
 *   - Cache rebuilds (after erase/undo)
 *   - Batch outline pre-computation on load
 * 
 * Pattern: Main thread sends point data → Worker computes outlines → Main thread draws
 * The canvas stays on the main thread for immediate pointer response.
 */
import { getStroke } from 'perfect-freehand';

const STROKE_OPTIONS = {
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t) => t,
  start: { taper: 0, easing: (t) => t, cap: true },
  end: { taper: 0, easing: (t) => t, cap: true },
};

self.onmessage = (e) => {
  const { type, id, data } = e.data;

  // ─── SINGLE STROKE OUTLINE ───
  if (type === 'computeOutline') {
    const { pts, size } = data;
    const inputPoints = pts.map(p => [p.x, p.y, p.p || 0.5]);
    const outline = getStroke(inputPoints, {
      ...STROKE_OPTIONS,
      size: size * 2.5,
    });
    self.postMessage({ type: 'outline', id, outline });
  }

  // ─── BATCH: Compute outlines for all pen strokes at once ───
  // Used on load and after cache invalidation
  if (type === 'computeBatch') {
    const results = [];
    const strokes = data.strokes;
    for (let i = 0; i < strokes.length; i++) {
      const s = strokes[i];
      if (s.tool === 'hl' || !s.pts || s.pts.length < 2) {
        results.push({ index: i, outline: null });
        continue;
      }
      const inputPoints = s.pts.map(p => [p.x, p.y, p.p || 0.5]);
      const outline = getStroke(inputPoints, {
        ...STROKE_OPTIONS,
        size: s.size * 2.5,
      });
      results.push({ index: i, outline });
    }
    self.postMessage({ type: 'batchOutlines', id, results });
  }
};
