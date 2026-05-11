/**
 * main.js — EK-Board Entry Point
 * Hash-based routing, chapter accordion, progress persistence.
 */
import './style.css';
import { parseMD, getExerciseById } from './parser.js';
import { renderExercise, StepController } from './notebook.js';
import { initAnnotations, onExerciseChange, isToolActive, isAutoMode, shouldNavigate } from './annotations.js';
import { initPresenter } from './presenter.js';
import { saveProgressToCloud, loadProgressFromCloud } from './firebase.js';

// ─── CHAPTER REGISTRY ───
// Add new chapters here. Each file must be in public/data/
const chapters = [
  {
    id: 'ch1',
    title: 'Chapter 1: Linear Algebra & Inner Products',
    file: './data/ch1/Ch1_Exercises_SOLVED.md'
  }
  // { id: 'ch2', title: 'Chapter 2: ...', file: '/data/ch2/Ch2_Exercises_SOLVED.md' },
];

// ─── STATE ───
const state = {
  chaptersData: {},       // { ch1: parsedChapterObj, ch2: ... }
  currentChapterId: null,
  currentExerciseId: null,
  stepCtrl: null,
  progress: {} // loaded async in init()
};

// ─── INIT ───
async function init() {
  // Load progress from cloud (or localStorage fallback)
  state.progress = await loadProgress();
  buildChapterNav();

  // Try to restore from URL hash
  const route = parseHash();
  if (route.chapterId) {
    await loadChapter(route.chapterId, route.exerciseId);
  } else {
    // Default: first chapter, first exercise
    await loadChapter(chapters[0].id);
  }

  // Init annotation engine AFTER first exercise is loaded
  const notebookEl = document.getElementById('notebookContent');
  initAnnotations(notebookEl);
  initPresenter(notebookEl);
}

// ─── URL ROUTING ───
// Hash format: #ch1/ex3 or #ch1

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  if (!hash) return {};
  const parts = hash.split('/');
  return {
    chapterId: parts[0] || null,
    exerciseId: parts[1] || null
  };
}

function setHash(chapterId, exerciseId) {
  const hash = exerciseId ? `${chapterId}/${exerciseId}` : chapterId;
  history.replaceState(null, '', `#${hash}`);
  document.title = `📓 EK-Board — ${getChapterTitle(chapterId)}`;
}

function getChapterTitle(chId) {
  const ch = chapters.find(c => c.id === chId);
  return ch ? ch.title : 'EK-Board';
}

// Listen for hash changes (back/forward browser buttons)
window.addEventListener('hashchange', async () => {
  const route = parseHash();
  if (route.chapterId && route.chapterId !== state.currentChapterId) {
    await loadChapter(route.chapterId, route.exerciseId);
  } else if (route.exerciseId && route.exerciseId !== state.currentExerciseId) {
    loadExercise(route.exerciseId);
  }
});

// ─── BUILD CHAPTER NAV ───
function buildChapterNav() {
  const container = document.getElementById('navChapters');
  container.innerHTML = '';

  chapters.forEach(ch => {
    // Chapter accordion header
    const chGroup = document.createElement('div');
    chGroup.className = 'ch-group';
    chGroup.dataset.chId = ch.id;

    const chHeader = document.createElement('div');
    chHeader.className = 'ch-header';
    chHeader.innerHTML = `
      <span class="ch-icon">📖</span>
      <span class="ch-title">${ch.title}</span>
      <span class="ch-arrow">▸</span>
    `;
    chHeader.addEventListener('click', async () => {
      // Toggle accordion
      const isOpen = chGroup.classList.contains('open');
      // Close all
      document.querySelectorAll('.ch-group').forEach(g => g.classList.remove('open'));
      if (!isOpen) {
        chGroup.classList.add('open');
        if (!state.chaptersData[ch.id]) {
          await loadChapter(ch.id);
        }
      }
    });

    // Exercise list (initially empty, populated on load)
    const exList = document.createElement('div');
    exList.className = 'ex-list';
    exList.id = `exList-${ch.id}`;

    chGroup.appendChild(chHeader);
    chGroup.appendChild(exList);
    container.appendChild(chGroup);
  });
}

// ─── LOAD CHAPTER ───
async function loadChapter(chapterId, exerciseId = null) {
  const chDef = chapters.find(c => c.id === chapterId);
  if (!chDef) return;

  // Parse if not cached
  if (!state.chaptersData[chapterId]) {
    const resp = await fetch(chDef.file);
    const md = await resp.text();
    state.chaptersData[chapterId] = parseMD(md, chDef.title);
  }

  state.currentChapterId = chapterId;
  const chapter = state.chaptersData[chapterId];

  // Build exercise list in sidebar
  buildExerciseList(chapterId, chapter);

  // Open this chapter's accordion
  document.querySelectorAll('.ch-group').forEach(g => {
    g.classList.toggle('open', g.dataset.chId === chapterId);
  });

  // Load target exercise (or first)
  const targetEx = exerciseId || chapter.exercises[0]?.id;
  if (targetEx) {
    loadExercise(targetEx);
  }
}

// ─── BUILD EXERCISE LIST ───
function buildExerciseList(chapterId, chapter) {
  const list = document.getElementById(`exList-${chapterId}`);
  if (!list) return;
  list.innerHTML = '';

  chapter.exercises.forEach(ex => {
    const item = document.createElement('div');
    item.className = 'ex-item';
    item.dataset.exId = ex.id;
    item.dataset.chId = chapterId;

    // Progress indicator
    const totalSteps = ex.steps[ex.steps.length - 1]?.id || 0;
    const savedStep = state.progress[`${chapterId}/${ex.id}`] || 0;
    const pct = totalSteps > 0 ? Math.round((savedStep / totalSteps) * 100) : 0;

    const statusIcon = pct >= 100 ? '✅' : pct > 0 ? '🔵' : '⚪';

    item.innerHTML = `
      <span class="ex-status">${statusIcon}</span>
      <span class="ex-name">${ex.title}</span>
      ${pct > 0 && pct < 100 ? `<span class="ex-pct">${pct}%</span>` : ''}
    `;

    item.addEventListener('click', () => {
      loadExercise(ex.id);
      document.getElementById('exerciseNav').classList.remove('open');
    });

    list.appendChild(item);
  });
}

// ─── LOAD EXERCISE ───
function loadExercise(exId) {
  const chapter = state.chaptersData[state.currentChapterId];
  if (!chapter) return;
  const exercise = getExerciseById(chapter, exId);
  if (!exercise) return;

  state.currentExerciseId = exId;

  // Update URL hash
  setHash(state.currentChapterId, exId);

  // Update active state in sidebar
  document.querySelectorAll('.ex-item').forEach(item => {
    item.classList.toggle('active', item.dataset.exId === exId);
  });

  // Render notebook
  const notebook = document.getElementById('notebookContent');
  renderExercise(notebook, exercise);

  // KaTeX render
  requestAnimationFrame(() => {
    if (window.renderMathInElement) {
      window.renderMathInElement(notebook, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  });

  // Step controller
  const totalSteps = exercise.steps[exercise.steps.length - 1]?.id || 0;

  // Restore saved progress
  const savedStep = state.progress[`${state.currentChapterId}/${exId}`] || 0;

  state.stepCtrl = new StepController(totalSteps, (current, total) => {
    updateUI(current, total);
    // Save progress
    saveStepProgress(state.currentChapterId, exId, current);
  });

  // Jump to saved step
  if (savedStep > 0) {
    state.stepCtrl.goTo(savedStep);
  }

  // Update controls
  document.getElementById('exerciseLabel').textContent = exercise.title;
  notebook.scrollTop = 0;
  updateUI(savedStep, totalSteps);

  // Reload annotations for this exercise
  onExerciseChange();
}

// ─── UPDATE UI ───
function updateUI(current, total) {
  document.getElementById('stepInfo').textContent = `${current} / ${total}`;
  const pct = total > 0 ? `${(current / total) * 100}%` : '0%';
  document.getElementById('progressFill').style.width = pct;
  document.getElementById('topProgressFill').style.width = pct;
}

// ─── PROGRESS PERSISTENCE (localStorage + Firestore) ───
let progressSaveTimer = null;

async function loadProgress() {
  // Try cloud first
  const cloud = await loadProgressFromCloud();
  if (cloud && Object.keys(cloud).length > 0) {
    // Merge: cloud wins, but keep any local-only keys
    const local = (() => { try { return JSON.parse(localStorage.getItem('ekboard-progress') || '{}'); } catch { return {}; } })();
    const merged = { ...local, ...cloud };
    try { localStorage.setItem('ekboard-progress', JSON.stringify(merged)); } catch {}
    return merged;
  }
  // Fallback to localStorage
  try {
    return JSON.parse(localStorage.getItem('ekboard-progress') || '{}');
  } catch { return {}; }
}

function saveStepProgress(chId, exId, step) {
  const key = `${chId}/${exId}`;
  state.progress[key] = step;

  // 1. Instant localStorage save
  try {
    localStorage.setItem('ekboard-progress', JSON.stringify(state.progress));
  } catch { /* quota exceeded */ }

  // 2. Debounced cloud save (60s)
  clearTimeout(progressSaveTimer);
  progressSaveTimer = setTimeout(() => saveProgressToCloud(state.progress), 60000);

  // Update sidebar indicator
  const items = document.querySelectorAll(`.ex-item[data-ex-id="${exId}"][data-ch-id="${chId}"]`);
  items.forEach(item => {
    const chapter = state.chaptersData[chId];
    const ex = chapter?.exercises.find(e => e.id === exId);
    if (!ex) return;
    const total = ex.steps[ex.steps.length - 1]?.id || 0;
    const pct = total > 0 ? Math.round((step / total) * 100) : 0;
    const icon = item.querySelector('.ex-status');
    const pctEl = item.querySelector('.ex-pct');
    if (icon) icon.textContent = pct >= 100 ? '✅' : pct > 0 ? '🔵' : '⚪';
    if (pctEl) {
      pctEl.textContent = pct > 0 && pct < 100 ? `${pct}%` : '';
    }
  });
}

// ─── EVENT LISTENERS ───

// ── NAVIGATION INPUT ──
// INPUT RULES (set in annotations.js):
//   Pen → NEVER navigates (always draws)
//   Finger → ALWAYS navigates (tap=next, double-tap=back)
//   Mouse → navigates only if no drawing tool active

let lastFingerTap = 0;

document.getElementById('notebookContent').addEventListener('pointerup', (e) => {
  if (!state.stepCtrl) return;

  // Ask annotation engine: should this pointer type navigate?
  if (!shouldNavigate(e.pointerType)) return;

  // Finger: single tap = next, double-tap = back (with delay)
  if (e.pointerType === 'touch') {
    const now = Date.now();
    if (now - lastFingerTap < 400) {
      state.stepCtrl.prev();
      lastFingerTap = 0;
      return;
    }
    lastFingerTap = now;
    setTimeout(() => {
      if (lastFingerTap !== 0 && Date.now() - lastFingerTap >= 380) {
        state.stepCtrl.next();
      }
    }, 400);
    return;
  }

  // Mouse: single click = next step
  state.stepCtrl.next();
});

// Mouse double-click = go back one step (ALL modes)
document.getElementById('notebookContent').addEventListener('dblclick', (e) => {
  if (!state.stepCtrl) return;
  e.preventDefault();
  state.stepCtrl.prev();
});

// Menu toggles
document.getElementById('menuToggle').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('exerciseNav').classList.toggle('open');
});
document.getElementById('btnMenu').addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('exerciseNav').classList.toggle('open');
});

// Click outside nav to close
document.addEventListener('click', (e) => {
  const nav = document.getElementById('exerciseNav');
  const toggle = document.getElementById('menuToggle');
  const btn = document.getElementById('btnMenu');
  if (nav.classList.contains('open') && !nav.contains(e.target)
      && e.target !== toggle && e.target !== btn) {
    nav.classList.remove('open');
  }
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (!state.stepCtrl) return;
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

  switch (e.key) {
    case 'ArrowRight':
    case ' ':
    case 'Enter':
      e.preventDefault();
      state.stepCtrl.next();
      break;
    case 'ArrowLeft':
    case 'Backspace':
      e.preventDefault();
      state.stepCtrl.prev();
      break;
    case 'r':
    case 'R':
      e.preventDefault();
      state.stepCtrl.reset();
      document.getElementById('notebookContent').scrollTop = 0;
      break;
    case 'Escape':
      document.getElementById('exerciseNav').classList.remove('open');
      break;
  }
});

// Touch swipe (finger swipe navigates regardless of tool)
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  // Only swipe if horizontal movement is dominant
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0 && state.stepCtrl) state.stepCtrl.next();
    if (dx > 0 && state.stepCtrl) state.stepCtrl.prev();
  }
});

// ─── BOOT ───
init();
