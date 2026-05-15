C:\Users\ebrah\.gemini\Projects\PDFs\Others\advanced-AI\Exam\Mock2026\MockExam2026_QA.tex/**
 * toolbar.js — EK-Board Toolbar Builder
 * Auto-builds toolbar from registered tools array.
 */
import { globalSettings, saveSettings } from './persist.js';

export function buildToolbar(engine) {
  const toolbar = document.createElement('div');
  toolbar.className = 'ann-toolbar';
  toolbar.id = 'annToolbar';

  // Tool buttons from registered tools
  engine.tools.forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'ann-tool-btn';
    btn.dataset.tool = t.name;
    btn.textContent = t.icon;
    btn.title = t.title;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (t.name === 'eye') {
        engine.toggleVisibility();
      } else {
        const newTool = engine.currentTool === t.name ? 'none' : t.name;
        engine.setTool(newTool);
      }
    });
    toolbar.appendChild(btn);
  });

  // Color dots
  const penColors = [
    { color: '#c41e3a', name: 'Red' },
    { color: '#1a5276', name: 'Blue' },
    { color: '#1a1a1a', name: 'Black' },
    { color: '#1e8449', name: 'Green' },
    { color: '#f59e0b', name: 'Orange' },
    { color: '#ffffff', name: 'White' },
  ];

  penColors.forEach((c, i) => {
    const dot = document.createElement('div');
    dot.className = 'ann-color-dot' + (i === 0 ? ' active' : '');
    dot.style.background = c.color;
    if (c.color === '#ffffff') dot.style.border = '1px solid #475569';
    dot.title = c.name;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      engine.penColor = c.color;
      toolbar.querySelectorAll('.ann-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
      engine.updateCursor();
    });
    toolbar.appendChild(dot);
  });

  toolbar.appendChild(makeDivider());

  // Size slider
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = '1';
  slider.max = '15';
  slider.value = globalSettings.penSize;
  slider.className = 'ann-size-slider';
  slider.title = 'Brush Size';
  slider.addEventListener('input', (e) => { 
    if (engine.currentTool === 'hl') {
      engine.hlSize = +e.target.value;
      globalSettings.hlSize = engine.hlSize;
    } else {
      engine.penSize = +e.target.value; 
      globalSettings.penSize = engine.penSize;
    }
    saveSettings();
    engine.updateCursor(); 
  });
  slider.addEventListener('click', (e) => e.stopPropagation());
  toolbar.appendChild(slider);

  toolbar.appendChild(makeDivider());

  // Text Scale UI
  const textScaleBtn = document.createElement('button');
  textScaleBtn.className = 'ann-tool-btn';
  textScaleBtn.textContent = 'Aa';
  textScaleBtn.title = 'Text Size';
  toolbar.appendChild(textScaleBtn);
  
  const textScaleContainer = document.createElement('div');
  textScaleContainer.style.display = 'none';
  textScaleContainer.style.alignItems = 'center';
  textScaleContainer.style.marginLeft = '4px';
  
  const textSlider = document.createElement('input');
  textSlider.type = 'range';
  textSlider.min = '0.7';
  textSlider.max = '1.8';
  textSlider.step = '0.05';
  textSlider.value = globalSettings.textScale;
  textSlider.className = 'ann-size-slider';
  textSlider.title = 'Adjust Text Size';
  
  textSlider.addEventListener('input', (e) => {
    const val = +e.target.value;
    document.documentElement.style.setProperty('--text-scale', val);
    globalSettings.textScale = val;
    saveSettings();
    setTimeout(() => engine.resizeCanvas(), 50);
  });
  textSlider.addEventListener('click', (e) => e.stopPropagation());
  
  textScaleContainer.appendChild(textSlider);
  toolbar.appendChild(textScaleContainer);
  
  textScaleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVis = textScaleContainer.style.display !== 'none';
    textScaleContainer.style.display = isVis ? 'none' : 'flex';
  });

  // Clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'ann-tool-btn ann-clear';
  clearBtn.textContent = '🗑️';
  clearBtn.title = 'Clear All';
  clearBtn.addEventListener('click', (e) => { e.stopPropagation(); engine.clearAnnotations(); });
  toolbar.appendChild(clearBtn);

  // Debug toggle
  const debugBtn = document.createElement('button');
  debugBtn.className = 'ann-tool-btn';
  debugBtn.textContent = '🔍';
  debugBtn.title = 'Debug: Show Input Type';
  debugBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const on = engine.toggleDebug();
    debugBtn.classList.toggle('active', on);
  });
  toolbar.appendChild(debugBtn);

  document.body.appendChild(toolbar);
  return toolbar;
}

function makeDivider() {
  const d = document.createElement('div');
  d.className = 'ann-divider';
  return d;
}
