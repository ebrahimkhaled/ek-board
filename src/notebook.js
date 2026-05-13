/**
 * notebook.js — Notebook Renderer + Step Animation Controller
 * Renders parsed exercise steps as notebook paper lines with handwriting animation.
 */

/**
 * Render an exercise into the notebook container
 * @param {HTMLElement} container - The .notebook element
 * @param {Object} exercise - Parsed exercise object with steps
 */
export function renderExercise(container, exercise) {
  container.innerHTML = '';
  
  exercise.steps.forEach(step => {
    if (step.type === 'spacer') {
      const spacer = document.createElement('div');
      spacer.className = 'line spacer';
      spacer.dataset.step = step.id;
      container.appendChild(spacer);
      return;
    }

    const line = document.createElement('div');
    line.dataset.step = step.id;
    
    // Build class list
    const classes = ['line', step.color];
    if (step.type === 'header') classes.push('title');
    if (step.type === 'subheader') classes.push('section-header');
    if (step.type === 'math-center') classes.push('math-center');
    if (step.type === 'math-aligned') classes.push('math-aligned');
    if (step.type === 'math-aligned-first') classes.push('math-aligned-first');
    if (step.type === 'question-box') classes.push('question-box-line');
    if (step.type === 'bold') classes.push('bold-line');
    if (step.type === 'image') classes.push('image-line');
    if (step.type === 'code-line' || step.type === 'code-line-first') classes.push('code-line-step');
    if (step.type === 'code-line-first') classes.push('code-first');
    if (step.isLast) classes.push('code-last');
    line.className = classes.join(' ');

    // ─── IMAGE STEP ───
    if (step.type === 'image') {
      const imgContainer = document.createElement('div');
      imgContainer.className = 'image-step';
      const img = document.createElement('img');
      img.src = step.text;
      img.alt = step.alt || '';
      img.loading = 'lazy';
      imgContainer.appendChild(img);
      if (step.alt) {
        const caption = document.createElement('div');
        caption.className = 'image-caption';
        caption.textContent = step.alt;
        imgContainer.appendChild(caption);
      }
      line.appendChild(imgContainer);
      container.appendChild(line);
      return;
    }

    // ─── CODE LINE STEP ───
    if (step.type === 'code-line' || step.type === 'code-line-first') {
      const codeEl = document.createElement('code');
      codeEl.textContent = step.text;
      line.appendChild(codeEl);
      container.appendChild(line);
      return;
    }

    // Create inner writing span for animation
    const writing = document.createElement('span');
    writing.className = 'writing';

    if (step.type === 'question-box') {
      // Wrap in question box div
      const box = document.createElement('div');
      box.className = 'question-box';
      const inner = document.createElement('span');
      inner.className = 'writing';
      inner.innerHTML = processInlineMarkdown(step.text);
      box.appendChild(inner);
      line.appendChild(box);
    } else if (step.type === 'math-center' || step.type === 'math-aligned' || step.type === 'math-aligned-first') {
      // Display math — wrap in $$ for KaTeX
      writing.textContent = `$$${step.text}$$`;
      line.appendChild(writing);
    } else {
      // Regular text — process inline markdown
      writing.innerHTML = processInlineMarkdown(step.text);
      line.appendChild(writing);
    }

    // ─── ARABIC RTL DETECTION ───
    // If text contains Arabic characters, add RTL class
    if (containsArabic(step.text)) {
      line.classList.add('rtl-line');
    }

    container.appendChild(line);
  });
}

/**
 * Check if text contains Arabic characters (U+0600–U+06FF range)
 */
function containsArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

/**
 * Process inline markdown: bold, inline math, etc.
 */
function processInlineMarkdown(text) {
  let html = text;
  // Bold: **text** → <strong>text</strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* → <em>text</em> (but not **)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // Inline code: `text` → <code>text</code>
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Underline: <u>text</u> — already HTML, pass through
  return html;
}


/**
 * Step Animation Controller
 */
export class StepController {
  constructor(totalSteps, onUpdate) {
    this.currentStep = 0;
    this.totalSteps = totalSteps;
    this.onUpdate = onUpdate; // callback(currentStep, totalSteps)
  }

  next() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this._apply();
      return true;
    }
    return false;
  }

  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._apply();
      return true;
    }
    return false;
  }

  goTo(step) {
    this.currentStep = Math.max(0, Math.min(step, this.totalSteps));
    this._apply();
  }

  reset() {
    this.currentStep = 0;
    this._apply();
  }

  _apply() {
    const lines = document.querySelectorAll('.notebook .line');
    lines.forEach(line => {
      const step = parseInt(line.dataset.step);
      if (step <= this.currentStep) {
        line.classList.add('visible');
      } else {
        line.classList.remove('visible');
      }
    });

    // Auto-scroll to the latest visible step
    const visibleLines = document.querySelectorAll(`.notebook .line[data-step="${this.currentStep}"]`);
    if (visibleLines.length) {
      const last = visibleLines[visibleLines.length - 1];
      last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Callback
    if (this.onUpdate) {
      this.onUpdate(this.currentStep, this.totalSteps);
    }
  }
}
