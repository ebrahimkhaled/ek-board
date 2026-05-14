# 📝 Chapter 4 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise 24 — Convex Function Identification ⭐⭐

>
> **Question:** Which of the following functions are convex? Provide proofs. (1) $f(x) = x^2$ (2) $f(x) = x^3$ (3) $f(x) = -x^2$ (4) $f(x) = |x|$ (5) $f(x) = \|x\|$ for $x \in \mathbb{R}^d$ (6) $f(x) = x^\top Ax$ (7) $f(x) = x_1 x_2$

### The Tool: How to Check Convexity

Before solving, let's understand the **method**:

- **1D functions:** Compute $f''(x)$. If $f''(x) \geq 0$ everywhere → convex ✅
- **Multivariable functions:** Compute the Hessian $H$. If $H \succeq 0$ (all eigenvalues $\geq 0$) everywhere → convex ✅
- **Non-differentiable functions:** Use the definition directly: $\lambda f(x) + (1-\lambda)f(y) \geq f(\lambda x + (1-\lambda)y)$

---

### Solution — (1) $f(x) = x^2$

$$f'(x) = 2x, \quad f''(x) = 2 > 0 \quad \text{everywhere}$$

✅ **Convex.** The parabola curves upward everywhere.

---

### Solution — (2) $f(x) = x^3$

$$f'(x) = 3x^2, \quad f''(x) = 6x$$

At $x = 1$: $f''(1) = 6 > 0$ (curving up)

At $x = -1$: $f''(-1) = -6 < 0$ (curving down!)

❌ **Not convex.** The second derivative changes sign — the function curves up for $x > 0$ but curves down for $x < 0$.

---

### Solution — (3) $f(x) = -x^2$

$$f''(x) = -2 < 0 \quad \text{everywhere}$$

❌ **Not convex.** This is actually **concave** (upside-down parabola). The function always curves downward.

---

### Solution — (4) $f(x) = |x|$

This function is **not differentiable** at $x = 0$ (the V-shape has a sharp corner), so we can't use $f''$.

**Use the definition directly:** We need $\lambda|x| + (1-\lambda)|y| \geq |\lambda x + (1-\lambda)y|$ for all $\lambda \in [0,1]$.

This is exactly the **triangle inequality**! Since $|\alpha + \beta| \leq |\alpha| + |\beta|$:

$$|\lambda x + (1-\lambda)y| \leq |\lambda x| + |(1-\lambda)y| = \lambda|x| + (1-\lambda)|y| \quad \checkmark$$

✅ **Convex.** The V-shape satisfies the definition.

---

### Solution — (5) $f(x) = \|x\|$ for $x \in \mathbb{R}^d$

Same argument as (4), generalized to higher dimensions:

$$\|\lambda x + (1-\lambda)y\| \leq \|\lambda x\| + \|(1-\lambda)y\| = \lambda\|x\| + (1-\lambda)\|y\|$$

The triangle inequality for norms in $\mathbb{R}^d$ gives us this directly.

✅ **Convex.** Any norm is a convex function.

---

### Solution — (6) $f(x) = x^\top Ax$

The gradient is $\nabla f = 2Ax$ (from Exercise 21 with $b = 0$).

The Hessian is:

$$H = 2A$$

**Convex if and only if $A \succeq 0$** (all eigenvalues of $A$ are $\geq 0$).

- If $A = I$ (identity): $f(x) = \|x\|^2$ → convex ✅
- If $A = -I$: $f(x) = -\|x\|^2$ → concave ❌
- If $A$ has mixed eigenvalues: saddle point → not convex ❌

✅ **Convex if and only if $A$ is positive semi-definite.**

---

### Solution — (7) $f(x) = x_1 x_2$ ⭐ (This is the tricky one!)

First, rewrite as a quadratic form: $f(x) = x^\top A x$ where:

$$A = \begin{pmatrix} 0 & 1/2 \\ 1/2 & 0 \end{pmatrix}$$

Now check if $A$ is PSD by computing eigenvalues:

$$\det(A - \lambda I) = \lambda^2 - 1/4 = 0 \implies \lambda = \pm 1/2$$

One eigenvalue is $+1/2$ and the other is $-1/2$. Mixed signs = **indefinite**.

❌ **Not convex.** The function $x_1 x_2$ is a "saddle" — it curves up in one direction and down in another.

**Numerical check:** $f(1, 1) = 1$, $f(-1, -1) = 1$, but the midpoint $f(0, 0) = 0$. And $\frac{1}{2}f(1,1) + \frac{1}{2}f(-1,-1) = 1 \geq 0 = f(0,0)$... wait, that seems convex? Let's try another pair: $f(1, -1) = -1$, $f(-1, 1) = -1$, midpoint $f(0, 0) = 0$. Now $\frac{1}{2}(-1) + \frac{1}{2}(-1) = -1 < 0 = f(0,0)$. The line segment goes **below** the function! ❌

> **Takeaway:** The Hessian test is the most reliable method. For $x^\top A x$: convex iff $A \succeq 0$. For $x_1 x_2$, the "hidden" matrix has a negative eigenvalue.

---

---
<br><br><br><br><br><br>

## Exercise 25 — Jensen's Inequality and Variance ⭐

>
> **Question:** Use Jensen's inequality to show that the variance of any random variable is always non-negative: $\text{Var}(X) \geq 0$.

### Solution — Step 1: Recall Jensen's Inequality

**Jensen's Inequality:** If $f$ is a **convex** function, then for any random variable $X$:

$$\mathbb{E}[f(X)] \geq f(\mathbb{E}[X])$$

**In words:** The average of the transformed values $\geq$ the transformation of the average.

---

### Solution — Step 2: Choose the right function

We want to prove $\text{Var}(X) \geq 0$.

Recall: $\text{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2$

So we need: $\mathbb{E}[X^2] \geq (\mathbb{E}[X])^2$

**Choose $f(x) = x^2$.** From Exercise 24, part (1): $f''(x) = 2 > 0$, so $f(x) = x^2$ is convex ✅

---

### Solution — Step 3: Apply Jensen's

Apply Jensen's inequality with $f(x) = x^2$:

$$\mathbb{E}[f(X)] \geq f(\mathbb{E}[X])$$

$$\mathbb{E}[X^2] \geq (\mathbb{E}[X])^2$$

---

### Solution — Step 4: Conclude

$$\text{Var}(X) = \mathbb{E}[X^2] - (\mathbb{E}[X])^2 \geq 0 \quad \blacksquare$$

> **Key insight:** Jensen's inequality is incredibly powerful. With just three lines, it proves that variance is always non-negative — something that would be much harder to prove from scratch.

---

### Bonus: When does $\text{Var}(X) = 0$?

By Jensen's, equality holds if and only if $X$ is a **constant** (i.e., $X = c$ with probability 1).

**In words:** The only random variable with zero variance is one that doesn't vary at all!

> **Takeaway:** Jensen's inequality bridges convexity (a geometric property) with probability (a statistical property). It's used everywhere in machine learning — generalization bounds, KL-divergence proofs, ELBO in VAEs.
