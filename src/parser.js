/**
 * parser.js — MD → Structured Steps for the Notebook Player
 * Parses exercise markdown files with color hint comments.
 */

/**
 * Parse a markdown string into a structured chapter object
 * @param {string} md - Raw markdown content
 * @param {string} chapterTitle - Title for the chapter
 * @returns {{ chapter: string, exercises: Array }}
 */
export function parseMD(md, chapterTitle = 'Chapter') {
  const lines = md.split('\n');
  const exercises = [];
  let currentExercise = null;
  let stepId = 0;
  let pendingColor = null;

  // Extract chapter title from first # header
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const h1 = lines[i].match(/^# (.+)/);
    if (h1) { chapterTitle = h1[1].replace(/📝\s*/, ''); break; }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // ─── Skip empties (but keep pending color) ───
    if (line.trim() === '') continue;

    // ─── Skip file-level headers ───
    if (line.match(/^# /)) continue;

    // ─── COLOR HINT COMMENTS ───
    const colorHint = line.match(/^<!--\s*(pencil|green|red|blue|black)\s*-->$/);
    if (colorHint) {
      pendingColor = colorHint[1];
      continue;
    }

    // ─── PAGE BREAKS ───
    if (line.match(/^<br>/)) continue;

    // ─── HORIZONTAL RULES ───
    if (line.match(/^---\s*$/)) {
      if (currentExercise) {
        currentExercise.steps.push({ id: ++stepId, type: 'spacer', color: 'none', text: '' });
      }
      pendingColor = null;
      continue;
    }

    // ─── EXERCISE HEADER (## Exercise ...) ───
    const exHeader = line.match(/^## (Exercise .+|Exercise — .+)/);
    if (exHeader) {
      stepId = 0;
      currentExercise = { id: 'ex' + (exercises.length + 1), title: exHeader[1], steps: [] };
      exercises.push(currentExercise);
      currentExercise.steps.push({ id: ++stepId, type: 'header', color: 'red', text: exHeader[1] });
      pendingColor = null;
      continue;
    }

    // ─── QUESTION BOX (> **Question:** ...) ───
    // Pattern: a bare ">", then "> **Question:** ..." on next line
    if (line.match(/^>\s*$/) && i + 1 < lines.length && lines[i + 1].match(/^>\s*\*\*Question/)) {
      // Skip the bare >, the next iteration will handle the question line
      continue;
    }
    if (line.match(/^>\s*\*\*Question/)) {
      if (!currentExercise) continue;
      // Accumulate all consecutive > lines
      let qText = line.replace(/^>\s*/, '');
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^>/)) {
        const part = lines[j].replace(/^>\s*/, '');
        if (part.trim()) qText += ' ' + part;
        j++;
      }
      i = j - 1;
      currentExercise.steps.push({ id: ++stepId, type: 'question-box', color: 'blue', text: qText.trim() });
      pendingColor = null;
      continue;
    }

    // ─── BLOCKQUOTE NOTES (> **Key insight:** ... or > **Takeaway:** ...) ───
    if (line.match(/^>\s*\*\*/)) {
      if (!currentExercise) continue;
      let noteText = line.replace(/^>\s*/, '');
      // Accumulate multi-line blockquotes
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^>/)) {
        const part = lines[j].replace(/^>\s*/, '');
        if (part.trim()) noteText += ' ' + part;
        j++;
      }
      i = j - 1;
      currentExercise.steps.push({ id: ++stepId, type: 'text', color: 'pencil', text: '↳ ' + noteText.replace(/^\*\*(.+?)\*\*\s*/, '$1: ') });
      pendingColor = null;
      continue;
    }

    // ─── Bare blockquotes with no special prefix ───
    if (line.match(/^>\s/) && !line.match(/^>\s*\*\*Question/)) {
      if (!currentExercise) continue;
      // Skip intro blockquotes (before any exercise)
      continue;
    }

    // ─── SOLUTION SUBHEADER (### ...) ───
    const subHeader = line.match(/^### (.+)/);
    if (subHeader && currentExercise) {
      currentExercise.steps.push({ id: ++stepId, type: 'subheader', color: 'red', text: subHeader[1] });
      pendingColor = null;
      continue;
    }

    // ─── DISPLAY MATH ($$...$$) ───
    if (line.match(/^\$\$/) && currentExercise) {
      let mathText = line;
      // Check if $$ is self-closing on same line
      const stripped = line.replace(/^\$\$/, '');
      if (!stripped.includes('$$')) {
        // Multi-line: accumulate until closing $$
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('$$')) {
          mathText += '\n' + lines[j];
          j++;
        }
        if (j < lines.length) mathText += '\n' + lines[j];
        i = j;
      }
      const mathContent = mathText.replace(/^\$\$\s*/, '').replace(/\s*\$\$\s*$/, '');
      const color = pendingColor || 'blue';

      // ─── SPLIT CHAINED EQUATIONS ───
      // Detect chains like: expr = expr = expr or expr \leq expr = expr
      const segments = splitEquationChain(mathContent);

      if (segments.length >= 3) {
        // Multi-step chain → each segment is its own click
        segments.forEach((seg, idx) => {
          currentExercise.steps.push({
            id: ++stepId,
            type: idx === 0 ? 'math-aligned-first' : 'math-aligned',
            color,
            text: seg.trim()
          });
        });
      } else {
        // Single equation → normal display
        currentExercise.steps.push({
          id: ++stepId,
          type: 'math-center',
          color,
          text: mathContent
        });
      }
      pendingColor = null;
      continue;
    }

    // ─── REGULAR CONTENT ───
    if (currentExercise) {
      const color = pendingColor || detectColor(line);
      const type = detectType(line);
      currentExercise.steps.push({ id: ++stepId, type, color, text: line });
      pendingColor = null;
    }
  }

  return { chapter: chapterTitle, exercises };
}

/** Auto-detect color from content */
function detectColor(line) {
  if (line.match(/[✅✓]|\\checkmark/) && line.match(/verified|Match|done|✅/i)) return 'green';
  if (line.match(/✅/)) return 'green';
  if (line.match(/[❌✗✘]|Mismatch/)) return 'red';
  if (line.match(/^[↳→]/)) return 'pencil';
  return 'black';
}

/** Auto-detect type from content */
function detectType(line) {
  if (line.match(/^\*\*.*\*\*/)) return 'bold';
  return 'text';
}

/**
 * Split a chained equation at top-level = signs.
 * Protects: \leq, \geq, \neq, \Rightarrow, \stackrel, content inside {}.
 * Returns array of segments. If 3+ segments → it's a chain worth splitting.
 *
 * Example: "\\langle u,v \\rangle = u^\\top v = \\sum u_i v_i"
 *   → ["\\langle u,v \\rangle", "= u^\\top v", "= \\sum u_i v_i"]
 */
function splitEquationChain(math) {
  // Don't split if it contains alignment commands (already multi-line)
  if (math.includes('\\\\') || math.includes('&')) return [math];

  const result = [];
  let current = '';
  let braceDepth = 0;
  let i = 0;

  while (i < math.length) {
    const ch = math[i];

    // Track brace depth — never split inside braces
    if (ch === '{') { braceDepth++; current += ch; i++; continue; }
    if (ch === '}') { braceDepth--; current += ch; i++; continue; }
    if (braceDepth > 0) { current += ch; i++; continue; }

    // Check for protected sequences (don't split these)
    if (ch === '\\') {
      // Look ahead for \leq, \geq, \neq, \Rightarrow, \stackrel, \quad, etc.
      const rest = math.slice(i);
      const protMatch = rest.match(/^\\(leq|geq|neq|Rightarrow|Leftarrow|stackrel|underbrace|overbrace|text|quad|qquad|,|;|!)/);
      if (protMatch) {
        current += protMatch[0];
        i += protMatch[0].length;
        continue;
      }
      current += ch;
      i++;
      continue;
    }

    // Check for standalone = (split point!)
    if (ch === '=') {
      // Make sure it's not preceded by \, <, >, ! (which would make \leq, etc.)
      const prev = i > 0 ? math[i - 1] : '';
      if (prev === '\\' || prev === '<' || prev === '>' || prev === '!') {
        current += ch;
        i++;
        continue;
      }

      // Check it's not part of \Rightarrow etc that we missed
      if (prev === '>') { current += ch; i++; continue; }

      // This is a split point! Save current segment, start new one with =
      if (current.trim()) {
        result.push(current.trim());
      }
      current = '= ';
      i++;
      continue;
    }

    // Check for \leq or \geq written as ≤ ≥ (Unicode)
    if (ch === '≤' || ch === '≥' || ch === '≠') {
      // Don't split at these
      current += ch;
      i++;
      continue;
    }

    current += ch;
    i++;
  }

  // Push last segment
  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

/** Get exercise by ID */
export function getExerciseById(chapter, exId) {
  return chapter.exercises.find(e => e.id === exId) || null;
}
