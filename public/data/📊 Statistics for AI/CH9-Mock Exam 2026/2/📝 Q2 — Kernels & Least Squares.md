# 📝 Mock Exam 2026 — Part 2 of 3

> **Exam:** Statistics for Artificial Intelligence II | **Module:** MAT00127M | **Time:** 3 hours | **Total:** 100 marks
> This is **Part 2** covering **Question 2** (27 marks). See Part 1 for Q1 and Part 3 for Q3.

---

## Question 2 — Kernels & Kernel Least Squares [27 marks]

---

### 2(a): PSD Kernel Definition [3 marks]

>
> **Question:** Define what it means for a function $k : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ to be a positive semi-definite kernel.

<!-- pencil -->
↳ **Strategy:** State the formal definition — it requires checking a matrix condition for EVERY possible finite subset of points.

**The definition (two equivalent forms):**

**Form 1 — Quadratic form:**

A function $k : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ is a **positive semi-definite (PSD) kernel** if for every integer $m \geq 1$, every finite set $\{x_1, \ldots, x_m\} \subset \mathcal{X}$, and every vector $\alpha \in \mathbb{R}^m$:

<!-- green -->
$$\sum_{i=1}^{m}\sum_{j=1}^{m} \alpha_i \alpha_j\, k(x_i, x_j) \geq 0$$

**Form 2 — Gram matrix:**

Equivalently, the **Gram matrix** $K \in \mathbb{R}^{m \times m}$ with entries $K_{ij} = k(x_i, x_j)$ is positive semi-definite ($K \succeq 0$) for any choice of points.

---

<!-- pencil -->
↳ **What does "PSD" actually mean geometrically?** It means $k$ behaves like a valid "similarity measure" — it can always be interpreted as an inner product in some (possibly infinite-dimensional) feature space. The PSD condition ensures no negative "energies" can appear.

**Concrete example** ($m = 2$, linear kernel $k(x,y) = x^\top y$):

Let $x_1 = (1, 0)$, $x_2 = (0, 1)$, and $\alpha = (\alpha_1, \alpha_2)$.

$$\sum_{i,j} \alpha_i \alpha_j k(x_i, x_j) = \alpha_1^2 \underbrace{k(x_1,x_1)}_{1} + 2\alpha_1\alpha_2 \underbrace{k(x_1,x_2)}_{0} + \alpha_2^2 \underbrace{k(x_2,x_2)}_{1} = \alpha_1^2 + \alpha_2^2 \geq 0\; ✅$$

<!-- pencil -->
↳ The Gram matrix here is $K = I_2$ (identity), which is PSD with eigenvalues $\{1, 1\}$.

---

<!-- red -->
↳ **Common mistake:** Writing "for some $\alpha$" instead of "for ALL $\alpha$." The condition must hold for every possible coefficient vector — this is what makes it a strong guarantee.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ "For every finite set" | ✅ "For every $\alpha \in \mathbb{R}^m$" | ✅ Double sum $\geq 0$ | ✅ Gram matrix $K \succeq 0$

> **Takeaway:** A PSD kernel is a "legal similarity function" — it guarantees that any Gram matrix built from it will have no negative eigenvalues, making kernel methods well-defined.

---
<br><br><br><br><br><br>

### 2(b): Gaussian kernel bandwidth $\sigma$ [2 marks]

>
> **Question:** Consider the Gaussian kernel $k(x,y) = \exp\!\left(-\frac{\|x-y\|^2}{2\sigma^2}\right)$, $\sigma > 0$. What role does $\sigma$ play?

<!-- pencil -->
↳ **Strategy:** Explain $\sigma$ as the "bandwidth" parameter that controls the locality of the kernel.

**The role of $\sigma$:** It is the **bandwidth** (or **length-scale**) parameter that controls how quickly kernel similarity decays with distance.

---

**Case 1: Small $\sigma$ (narrow kernel)**

- The exponential decays **rapidly** — only very close points have $k \approx 1$
- Distant points have $k \approx 0$ (invisible to each other)
- Result: model is very **local** → high variance → risk of **overfitting**

<!-- pencil -->
↳ Numerical check: $\|x - y\| = 1$, $\sigma = 0.1$ → $k = \exp(-\frac{1}{0.02}) = \exp(-50) \approx 10^{-22} \approx 0$

**Case 2: Large $\sigma$ (wide kernel)**

- The exponential decays **slowly** — even distant points have $k \approx 1$
- All points look "similar" to each other
- Result: model is very **smooth** → high bias → risk of **underfitting**

<!-- pencil -->
↳ Numerical check: $\|x - y\| = 1$, $\sigma = 10$ → $k = \exp(-\frac{1}{200}) = \exp(-0.005) \approx 0.995$

---

<!-- green -->
**Summary:** $\sigma$ controls the **bias-variance trade-off**:

| $\sigma$ | Kernel shape | Model behaviour | Risk |
|---|---|---|---|
| Small | Narrow, spiky | Very local / flexible | Overfitting |
| Large | Wide, flat | Very smooth / rigid | Underfitting |
| Optimal | Medium | Balanced | Best generalisation |

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Bandwidth / length-scale | ✅ Small → overfit | ✅ Large → underfit | ✅ Bias-variance trade-off

> **Takeaway:** Think of $\sigma$ as the "radius of influence" of each training point. Too small = each point only cares about itself (memorisation). Too large = every point blends together (can't distinguish classes).

---
<br><br><br><br><br><br>

### 2(c): Kernel matrix and predictions [5 marks]

>
> **Question:** Let $h(x) = \sum_{i=1}^{n} a_i\, k(X_i, x)$. Define the kernel matrix $K$ and express $(h(X_1), \ldots, h(X_n))^\top$ in terms of $K$ and $a$.

<!-- pencil -->
↳ **Strategy:** (1) Build the $n \times n$ kernel matrix, (2) show that evaluating $h$ at all training points is equivalent to one matrix-vector product $Ka$.

**Step 1 — Define the kernel (Gram) matrix $K \in \mathbb{R}^{n \times n}$:**

<!-- green -->
$$K_{ij} = k(X_i, X_j)$$

**Properties of $K$:**
- **Symmetric:** $K_{ij} = K_{ji}$ because $k(x,y) = k(y,x)$ (kernels are symmetric by definition)
- **PSD:** $K \succeq 0$ by the definition from part (a)

**Concrete example** ($n = 3$):

$$K = \begin{pmatrix} k(X_1,X_1) & k(X_1,X_2) & k(X_1,X_3) \\ k(X_2,X_1) & k(X_2,X_2) & k(X_2,X_3) \\ k(X_3,X_1) & k(X_3,X_2) & k(X_3,X_3) \end{pmatrix}$$

<!-- pencil -->
↳ Notice: the diagonal entries $k(X_i, X_i)$ measure self-similarity. For the Gaussian kernel, $k(X_i, X_i) = \exp(0) = 1$ always.

**Step 2 — Evaluate $h$ at a training point $X_j$:**

$$h(X_j) = \sum_{i=1}^{n} a_i\, k(X_i, X_j) = \sum_{i=1}^{n} K_{ji}\, a_i$$

<!-- pencil -->
↳ This is exactly the $j$-th entry of the matrix-vector product $Ka$! Why? Row $j$ of $K$ is $(K_{j1}, K_{j2}, \ldots, K_{jn})$. Dotting it with $a = (a_1, \ldots, a_n)^\top$ gives $\sum_i K_{ji} a_i = h(X_j)$.

**Step 3 — Stack all evaluations:**

<!-- green -->
$$\begin{pmatrix} h(X_1) \\ h(X_2) \\ \vdots \\ h(X_n) \end{pmatrix} = Ka$$

---

**Numerical verification** ($n = 2$):

Let $K = \begin{pmatrix} 1 & 0.5 \\ 0.5 & 1 \end{pmatrix}$, $a = \begin{pmatrix} 2 \\ 3 \end{pmatrix}$.

$$Ka = \begin{pmatrix} 1(2) + 0.5(3) \\ 0.5(2) + 1(3) \end{pmatrix} = \begin{pmatrix} 3.5 \\ 4.0 \end{pmatrix}$$

Check: $h(X_1) = 2 \cdot k(X_1,X_1) + 3 \cdot k(X_2,X_1) = 2(1) + 3(0.5) = 3.5$ ✅

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Gram matrix $K_{ij} = k(X_i, X_j)$ | ✅ Symmetry and PSD | ✅ Row-by-column multiplication logic | ✅ Final result $(h(X_1), \ldots, h(X_n))^\top = Ka$

> **Takeaway:** The kernel matrix $K$ is a "relationship map" between all training points. Multiplying $Ka$ gives predictions at ALL training points simultaneously — no loops needed.

---
<br><br><br><br><br><br>

### 2(d): Reformulating in terms of $a$ [6 marks]

>
> **Question:** Consider the least-squares problem $R_n(h) = \frac{1}{n}\sum_{i=1}^{n}(Y_i - h(X_i))^2$ where $h(x) = \sum_{i=1}^{n} a_i k(X_i, x)$. Express this optimisation problem in terms of $a$.

<!-- pencil -->
↳ **Strategy:** Use the result from 2(c) that $(h(X_1), \ldots, h(X_n))^\top = Ka$, then rewrite the sum-of-squares as a squared norm.

**Step 1 — Replace $h(X_i)$ with $(Ka)_i$:**

$$R_n(h) = \frac{1}{n}\sum_{i=1}^{n}(Y_i - (Ka)_i)^2$$

**Step 2 — Recognise the squared-norm pattern:**

<!-- pencil -->
↳ The sum $\sum_{i=1}^n (v_i)^2$ for any vector $v$ equals $\|v\|^2 = v^\top v$. Here $v = Y - Ka$, so:

$$R_n = \frac{1}{n}\|Y - Ka\|^2 = \frac{1}{n}(Y - Ka)^\top(Y - Ka)$$

**Step 3 — Write the optimisation problem:**

<!-- green -->
$$\hat{a} = \arg\min_{a \in \mathbb{R}^n}\; \frac{1}{n}\|Y - Ka\|^2$$

---

**Why this matters — comparison with standard least squares:**

| | Standard LS | Kernel LS |
|---|---|---|
| **Unknowns** | $w \in \mathbb{R}^p$ (feature weights) | $a \in \mathbb{R}^n$ (data point weights) |
| **"Design matrix"** | $X \in \mathbb{R}^{n \times p}$ | $K \in \mathbb{R}^{n \times n}$ |
| **Objective** | $\|Y - Xw\|^2$ | $\|Y - Ka\|^2$ |
| **Dimension of search** | Feature space ($p$) | Sample space ($n$) |

<!-- pencil -->
↳ The swap from $X$ to $K$ is the essence of the **kernel trick**: we never need to compute features explicitly. We work entirely in "similarity space."

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Substitution $h(X_i) = (Ka)_i$ | ✅ Vector norm identity $\sum(Y_i - (Ka)_i)^2 = \|Y - Ka\|^2$ | ✅ Final form $\min_a \frac{1}{n}\|Y - Ka\|^2$ | ✅ Identified as standard LS in $a$

> **Takeaway:** We converted from "find the best function $h$" (infinite-dimensional problem) to "find the best coefficient vector $a$" (finite $n$-dimensional problem). This is the power of the representer theorem!

---
<br><br><br><br><br><br>

### 2(e): Deriving the minimiser $\hat{a}$ [7 marks]

>
> **Question:** Derive the minimiser $\hat{a}$ of the objective in part (d). You may assume that the kernel matrix $K$ is invertible.

<!-- pencil -->
↳ **Strategy:** This is a standard least-squares derivation. Take gradient → set to zero → solve for $a$. The key tool is the matrix calculus rule $\nabla_a \|Y - Ka\|^2 = -2K^\top(Y - Ka)$.

**Step 1 — Write out the objective:**

$$L(a) = \frac{1}{n}(Y - Ka)^\top(Y - Ka)$$

**Step 2 — Expand the quadratic:**

$$L(a) = \frac{1}{n}\left(Y^\top Y - 2Y^\top K a + a^\top K^\top K a\right)$$

<!-- pencil -->
↳ We used $(u - v)^\top(u - v) = u^\top u - 2u^\top v + v^\top v$ with $u = Y$ and $v = Ka$.

**Step 3 — Take the gradient with respect to $a$:**

Using matrix calculus rules:
- $\nabla_a(Y^\top Y) = 0$ (no dependence on $a$)
- $\nabla_a(Y^\top K a) = K^\top Y = KY$ (since $K$ is symmetric)
- $\nabla_a(a^\top K^\top K a) = 2K^\top K a = 2K^2 a$ (since $K^\top = K$)

<!-- pencil -->
↳ **Matrix calculus reminder:** $\nabla_a(b^\top a) = b$, and $\nabla_a(a^\top M a) = 2Ma$ when $M$ is symmetric.

Combining:

$$\nabla_a L(a) = \frac{1}{n}\left(-2KY + 2K^2 a\right) = \frac{2}{n}K(Ka - Y)$$

**Step 4 — Set gradient to zero:**

$$\frac{2}{n}K(Ka - Y) = 0$$

Since $\frac{2}{n} \neq 0$, we need:

$$K(Ka - Y) = 0$$

**Step 5 — Use invertibility of $K$:**

<!-- pencil -->
↳ Since $K$ is invertible ($\det(K) \neq 0$), we can multiply both sides on the left by $K^{-1}$:

$$K^{-1} \cdot K(Ka - Y) = K^{-1} \cdot 0$$
$$Ka - Y = 0$$
$$Ka = Y$$

**Step 6 — Isolate $\hat{a}$:**

Multiply both sides by $K^{-1}$:

<!-- green -->
$$\boxed{\hat{a} = K^{-1}Y}$$

---

**What does this solution mean?**

<!-- pencil -->
↳ $Ka = Y$ means the model predictions **exactly equal** the training labels: $h(X_i) = Y_i$ for all $i$. The model perfectly interpolates the training data — zero training error!

---

<!-- red -->
↳ **Warning:** Perfect interpolation sounds great but is actually dangerous. It means the model has memorised the data including any noise. This motivates regularisation (next sub-question).

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Expand quadratic | ✅ Matrix calculus rules | ✅ Gradient $= \frac{2}{n}K(Ka - Y)$ | ✅ Use $K$ symmetric | ✅ Apply $K^{-1}$ (given invertible) | ✅ Final answer $\hat{a} = K^{-1}Y$

> **Takeaway:** The derivation follows the universal least-squares recipe: expand → differentiate → set to zero → solve. The answer $\hat{a} = K^{-1}Y$ is elegant but dangerous — it memorises data perfectly.

---
<br><br><br><br><br><br>

### 2(f): Why not minimise $R_n$ directly? [4 marks]

>
> **Question:** Typically one does not minimise $R_n(h)$ directly. Why is that and what is a popular alternative?

<!-- pencil -->
↳ **Strategy:** Explain the overfitting problem, then introduce Kernel Ridge Regression as the fix.

**Why NOT minimise $R_n(h)$ directly?**

**Problem: Overfitting via interpolation**

With $\hat{a} = K^{-1}Y$, the model satisfies $h(X_i) = Y_i$ for ALL training points. This means:

- Training error $= 0$ (perfect fit)
- But test error can be very high because the model has **memorised noise**

<!-- pencil -->
↳ **Analogy:** Imagine a student who memorises every exam answer word-for-word but doesn't understand the concepts. They score 100% on past papers but fail on any new question with different wording.

**Symptoms of interpolation:**
1. The function $h$ oscillates wildly between training points to hit each one exactly
2. Small changes in training data cause large changes in $h$ (high variance)
3. Predictions at new points are unreliable

---

**The popular alternative: Kernel Ridge Regression (KRR)**

Add a **regularisation penalty** that controls the complexity of $h$:

<!-- green -->
$$\hat{a} = \arg\min_{a \in \mathbb{R}^n}\; \frac{1}{n}\|Y - Ka\|^2 + \lambda\, a^\top K a$$

where:
- $\lambda > 0$ is the regularisation parameter
- $a^\top K a = \|h\|_{\mathcal{H}}^2$ is the squared **RKHS norm** (measures function smoothness)

**Solving (same recipe as 2e but with penalty):**

Gradient: $\nabla_a = \frac{2}{n}K(Ka - Y) + 2\lambda K a = 0$

After simplification: $(K + n\lambda I)a = Y$

<!-- green -->
$$\hat{a}_{\text{ridge}} = (K + n\lambda I)^{-1}Y$$

**Why this is better:**

| Property | $\hat{a} = K^{-1}Y$ | $\hat{a} = (K + n\lambda I)^{-1}Y$ |
|---|---|---|
| Training error | Exactly 0 | Small but > 0 |
| Test error | Often high | Often much lower |
| Function smoothness | Can be wild | Controlled by $\lambda$ |
| Numerical stability | $K$ might be near-singular | $K + n\lambda I$ always invertible |

<!-- pencil -->
↳ Adding $n\lambda I$ to $K$ shifts all eigenvalues up by $n\lambda$, ensuring the matrix is always well-conditioned. It's like adding "training wheels" to the optimisation.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Interpolation → overfitting | ✅ Memorises noise | ✅ Kernel Ridge Regression | ✅ RKHS norm penalty $a^\top K a$ | ✅ Solution $(K + n\lambda I)^{-1}Y$ | ✅ $\lambda$ controls bias-variance

> **Takeaway:** Raw kernel least squares is too greedy — it hits every training point perfectly but fails on new data. Adding a smoothness penalty ($\lambda$) sacrifices a little training accuracy for dramatically better generalisation.

---

**End of Part 2 — Question 2 Complete! ✅**

> Continue to **Part 3** for Question 3 (RL, Double Descent & Transformers, 38 marks).
