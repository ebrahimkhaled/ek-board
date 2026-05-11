# EK-Board — Architecture & Technical Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EK-Board App                             │
│                                                                 │
│  ┌──────────┐   ┌───────────┐   ┌──────────────┐              │
│  │ main.js  │──►│ parser.js │──►│ notebook.js  │              │
│  │ (router) │   │ (MD→data) │   │ (renderer)   │              │
│  └──────────┘   └───────────┘   └──────┬───────┘              │
│                                        │                       │
│                                  ┌─────▼──────┐               │
│                                  │ style.css   │               │
│                                  │ (paper UI)  │               │
│                                  └─────────────┘               │
│                                                                 │
│  ┌───────────────┐  ┌────────────┐  ┌──────────────┐          │
│  │ annotations.js│  │ storage.js │  │ presenter.js │          │
│  │ (canvas draw) │  │ (persist)  │  │ (fullscreen) │          │
│  └───────────────┘  └────────────┘  └──────────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │              KaTeX (CDN)                        │           │
│  │          Math rendering engine                   │           │
│  └─────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘

Data Layer:
  public/data/ch1/Ch1_Exercises_SOLVED.md
  public/data/ch2/...
```

## Module Responsibilities

| Module | File | Responsibility |
|--------|------|---------------|
| **Router** | `main.js` | App bootstrap, keyboard events, chapter loading, exercise switching |
| **Parser** | `parser.js` | MD text → structured step array (color detection, equation splitting) |
| **Renderer** | `notebook.js` | Step array → DOM elements with animation classes |
| **Styles** | `style.css` | Paper design, pen colors, animations, layout |
| **Annotations** | `annotations.js` | Canvas drawing engine (Phase 3) |
| **Storage** | `storage.js` | localStorage for progress + annotations (Phase 4) |
| **Presenter** | `presenter.js` | Fullscreen, zoom, side margins (Phase 4) |

## Parser Rules (Priority Order)

```
1. <!-- color --> comments     → Set pending color for next line
2. ## Exercise ...             → New exercise, red header
3. > **Question:** ...         → Question box (blue, dashed border)
4. > **Key insight:** ...      → Pencil note (gray, italic)
5. ### Solution ...            → Red subheader
6. $$...$$                     → Display math (blue, check for chain splitting)
7. ✅ / ✓                     → Green text
8. ❌ / ✗                     → Red text
9. ↳ / →                      → Pencil note
10. **Bold text**              → Bold black text
11. Everything else            → Regular black text
```

## Equation Chain Splitting Algorithm

```javascript
splitEquationChain("\\langle u,v \\rangle = u^\\top v = \\sum u_i v_i")
// Returns: ["\\langle u,v \\rangle", "= u^\\top v", "= \\sum u_i v_i"]

// Rules:
// - Split at standalone = signs
// - DON'T split at: \leq, \geq, \neq, \Rightarrow
// - DON'T split inside {} braces
// - DON'T split if equation has \\ or & (already multi-line)
// - Need 3+ segments to trigger splitting (2 segments = keep on one line)
```

## CSS Design Tokens

```css
:root {
  /* Paper */
  --paper-bg: #fefef6;
  --grid-color: rgba(180, 210, 235, 0.35);
  --grid-size: 32px;
  --margin-red: rgba(200, 80, 80, 0.35);
  --desk-bg: #c4b89a;

  /* Pen Colors */
  --pen-black: #1a1a1a;
  --pen-red: #c41e3a;
  --pen-blue: #1a5276;
  --pen-green: #1e8449;
  --pen-pencil: #8e8e8e;

  /* Fonts */
  --font-hand: 'Patrick Hand', cursive;
  --font-header: 'Caveat', cursive;
  --font-ui: 'Inter', sans-serif;
}
```

## Step Data Schema

```typescript
interface Step {
  id: number;              // Sequential, 1-based
  type: StepType;          // See below
  color: PenColor;         // 'black' | 'red' | 'blue' | 'green' | 'pencil'
  text: string;            // Raw content (markdown or LaTeX)
}

type StepType =
  | 'header'               // ## Exercise title (Caveat font, underlined)
  | 'subheader'            // ### Solution part (Caveat font, underlined)
  | 'question-box'         // > **Question:** (dashed blue border)
  | 'math-center'          // $$ single equation $$ (centered)
  | 'math-aligned-first'   // First segment of chained equation (centered)
  | 'math-aligned'         // Continuation segment (indented, starts with =)
  | 'bold'                 // **Bold text** (with spacing)
  | 'text'                 // Regular text
  | 'spacer'               // --- horizontal rule (visual separator)
```

## Known Issues & Design Notes

1. **Red margin line**: Uses `background-image` linear-gradient (NOT `::before`) because pseudo-elements don't extend past the container's visible height when `overflow: auto`

2. **Question box animation**: Uses `fadeWrite` keyframes instead of `clip-path` because `clip-path: inset()` doesn't work properly inside a bordered container

3. **Font loading**: Google Fonts (`Patrick Hand`, `Caveat`) loaded via CSS `@import` — may cause FOUT on slow connections. Could be preloaded in future.

4. **Equation splitting edge cases**: Some equations with `\begin{cases}` or `\text{if}` contain `=` signs that shouldn't be split. The brace-depth tracker handles `{}` but not `\begin/\end` blocks. These should be left on one line or wrapped in braces.
