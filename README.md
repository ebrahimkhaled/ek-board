# 📓 EK-Board — Interactive Notebook Player

> Transform static LaTeX exercises into click-to-advance, handwriting-animated teaching experiences.

**By Dr. Ebrahim Khaled** — A personal teaching productivity tool for recording pre-recorded lecture walkthroughs.

---

## ✨ Features

- 📝 **School Notebook Feel** — Grid paper, red margin, spiral binding, handwriting fonts
- 🖊️ **Pen Colors** — Black (text), Red (headers), Blue (math), Green (results), Gray (pencil notes)
- ⏩ **Click-to-Advance** — Each logical step revealed with a click or keyboard arrow
- 🔢 **Auto Equation Splitting** — Chained equations (`= ... = ... = ...`) split into separate clickable steps
- 📐 **KaTeX Math** — Beautiful LaTeX math rendering
- 📋 **Question Boxes** — Dashed blue borders for exercise statements
- 📱 **iPad Ready** — Touch support, double-tap pen/eraser toggle
- ☰ **Exercise Navigation** — Sidebar with chapter/exercise selection

## 🚀 Quick Start

```bash
npm install
npm run dev        # Opens http://localhost:5173
```

## 📂 Adding Content

1. Place your exercise MD files in `public/data/ch{N}/`
2. Update the chapter registry in `src/main.js`
3. Use the `notebook-md-prep` skill to convert LaTeX → MD

## 📄 MD Format

```markdown
## Exercise 1 — Title ⭐

>
> **Question:** Show that $\langle u, v \rangle = u^\top v$ defines an inner product.

### Solution — Part 1

**Rule 1: Symmetry** — Does $\langle u, v \rangle = \langle v, u \rangle$?

$$\langle u, v \rangle = u^\top v = u_1 v_1 + \cdots + u_d v_d$$

<!-- pencil -->
↳ Since multiplication is commutative

✅ Symmetry verified!
```

### Color Hints

| Comment | Effect |
|---------|--------|
| `<!-- pencil -->` | Next line = gray italic pencil |
| `<!-- green -->` | Next line = green pen |
| `<!-- red -->` | Next line = red pen |
| `<!-- blue -->` | Next line = blue pen |

---

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `Click` / `→` / `Space` / `Enter` | Next step |
| `←` / `Backspace` | Previous step |
| `R` | Reset to beginning |
| `Esc` | Close sidebar |

## 🛠️ Tech Stack

- **Vite** — Build tool
- **Vanilla JS** — No framework
- **KaTeX** — Math rendering
- **CSS** — Grid paper, animations
- **Canvas API** — Annotations (planned)

## 📋 Roadmap

- [x] Phase 1: Core notebook engine
- [ ] Phase 2: Chapter/exercise navigation with routing
- [ ] Phase 3: Annotation tools (pen, highlighter, eraser, laser)
- [ ] Phase 4: Fullscreen presenter + GitHub Pages deployment
