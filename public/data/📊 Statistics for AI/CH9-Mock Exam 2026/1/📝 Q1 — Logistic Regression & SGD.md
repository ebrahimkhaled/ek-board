# 📝 Mock Exam 2026 — Part 1 of 3

> **Exam:** Statistics for Artificial Intelligence II | **Module:** MAT00127M | **Time:** 3 hours | **Total:** 100 marks
> This is **Part 1** covering **Question 1** (35 marks). Parts 2 and 3 cover Questions 2 and 3.

---

## Question 1 — Regularised Logistic Regression [35 marks]

>
> Consider the regularised logistic regression objective
> $$F(w) = \frac{1}{n}\sum_{i=1}^{n}\log(1 + \exp(-Y_i w^\top X_i)) + \lambda \|w\|_2^2,$$
> where $\lambda \geq 0$, $w \in \mathbb{R}^p$, $X_i \in \mathbb{R}^p$, and $Y_i \in \{-1,1\}$.
>
> **Given notation:**
> - $n$ = number of training samples, $p$ = number of features
> - Each $X_i$ is a column vector of features for sample $i$
> - Each $Y_i$ is the class label ($+1$ or $-1$) for sample $i$
> - $\lambda$ is the regularisation strength (controls overfitting)
> - $\|w\|_2^2 = w^\top w = \sum_{j=1}^p w_j^2$ (squared Euclidean norm)

---

### 1(a): Design matrix and matrix notation [5 marks]

>
> **Question:** Define the design matrix $X$ and response vector $Y$, and write $F(w)$ using matrix notation.

<!-- pencil -->
↳ **Strategy:** We need to repack all $n$ individual vectors $X_1, \ldots, X_n$ into one matrix, and all labels $Y_1, \ldots, Y_n$ into one vector. Then rewrite the summation $\sum_{i=1}^n$ as a matrix operation.

**Step 1 — Build the design matrix $X \in \mathbb{R}^{n \times p}$:**

Stack each data point as a **row**:

$$X = \begin{pmatrix} X_1^\top \\ X_2^\top \\ \vdots \\ X_n^\top \end{pmatrix}$$

<!-- pencil -->
↳ Each $X_i$ is a $p \times 1$ column vector. Transposing makes it a $1 \times p$ row. Stacking $n$ such rows gives an $n \times p$ matrix.

**Step 2 — Build the response vector $Y \in \{-1, 1\}^n$:**

$$Y = \begin{pmatrix} Y_1 \\ Y_2 \\ \vdots \\ Y_n \end{pmatrix}$$

**Step 3 — Recognise the key identity** $w^\top X_i = (Xw)_i$:

<!-- pencil -->
↳ Why? The $i$-th row of $X$ is $X_i^\top$. So row $i$ times $w$ gives $X_i^\top w = w^\top X_i$. Therefore the product $Xw$ is an $n \times 1$ vector whose $i$-th entry is exactly $w^\top X_i$.

**Step 4 — Introduce the element-wise (Hadamard) product $\odot$:**

Define $Y \odot (Xw) \in \mathbb{R}^n$ with $i$-th entry $Y_i \cdot (w^\top X_i)$.

**Step 5 — Replace the summation with $\mathbf{1}^\top$:**

<!-- pencil -->
↳ The trick: $\mathbf{1}^\top \mathbf{v} = \sum_i v_i$ for any vector $\mathbf{v}$. This converts a sum into a single dot product. Why? Because $\mathbf{1}^\top = (1, 1, \ldots, 1)$, so $\mathbf{1}^\top \mathbf{v} = 1 \cdot v_1 + 1 \cdot v_2 + \cdots = \sum v_i$.

**Step 6 — Convert the norm** $\|w\|_2^2 = w^\top w$:

<!-- pencil -->
↳ The squared norm is just the dot product of $w$ with itself: $w_1^2 + w_2^2 + \cdots + w_p^2 = w^\top w$.

<!-- green -->
**Final answer (matrix notation):**

$$F(w) = \frac{1}{n}\mathbf{1}^\top \log\!\left(\mathbf{1} + \exp(-Y \odot Xw)\right) + \lambda\, w^\top w$$

where $\log$ and $\exp$ act element-wise on vectors, and $\mathbf{1} \in \mathbb{R}^n$ is the all-ones vector.

---

**Concrete numerical example ($n = 3$, $p = 2$):**

Let $X = \begin{pmatrix} 1 & 2 \\ 3 & 4 \\ 5 & 6 \end{pmatrix}$, $Y = \begin{pmatrix} 1 \\ -1 \\ 1 \end{pmatrix}$, $w = \begin{pmatrix} 0.5 \\ -0.3 \end{pmatrix}$.

- $Xw = \begin{pmatrix} 1(0.5)+2(-0.3) \\ 3(0.5)+4(-0.3) \\ 5(0.5)+6(-0.3) \end{pmatrix} = \begin{pmatrix} -0.1 \\ 0.3 \\ 0.7 \end{pmatrix}$

- $Y \odot Xw = \begin{pmatrix} 1 \times (-0.1) \\ (-1) \times 0.3 \\ 1 \times 0.7 \end{pmatrix} = \begin{pmatrix} -0.1 \\ -0.3 \\ 0.7 \end{pmatrix}$

<!-- pencil -->
↳ Negative entries ($-0.1$, $-0.3$) mean the model is currently predicting **wrong** for samples 1 and 2 (the sign doesn't match the label).

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Design matrix $X \in \mathbb{R}^{n \times p}$ with rows $X_i^\top$ | ✅ Response vector $Y \in \{-1,1\}^n$ | ✅ Hadamard product $\odot$ | ✅ Ones-vector trick $\mathbf{1}^\top$ | ✅ Norm conversion $\|w\|^2 = w^\top w$

> **Takeaway:** The matrix form eliminates all summation signs. Every operation becomes a single matrix-vector product — this is why GPUs can train models in seconds instead of hours.

---
<br><br><br><br><br><br>

### 1(b): Deriving the gradient $\nabla F(w)$ [6 marks]

>
> **Question:** Derive the gradient $\nabla F(w)$.

<!-- pencil -->
↳ **Strategy:** Differentiate each term separately (log-loss + regulariser), then combine. We'll use the chain rule on a single data point first, then sum.

**Step 1 — Isolate one data point.** Let $\ell_i(w) = \log(1 + \exp(-Y_i w^\top X_i))$.

This is a composition: outer function $g(z) = \log(1 + e^z)$ applied to inner function $z = -Y_i w^\top X_i$.

**Step 2 — Identify the chain rule components:**

We need $\frac{\partial \ell_i}{\partial w} = \frac{dg}{dz} \cdot \frac{\partial z}{\partial w}$.

- **Outer derivative:** $\frac{d}{dz}\log(1 + e^z) = \frac{e^z}{1 + e^z}$

<!-- pencil -->
↳ This is just $\frac{d}{du}\log(u) = \frac{1}{u}$ with $u = 1 + e^z$, multiplied by $\frac{du}{dz} = e^z$.

- **Inner derivative:** $\frac{\partial}{\partial w}(-Y_i w^\top X_i) = -Y_i X_i$

<!-- pencil -->
↳ Since $w^\top X_i$ is linear in $w$, its gradient with respect to $w$ is simply $X_i$.

**Step 3 — Apply the chain rule:**

$$\frac{\partial \ell_i}{\partial w} = \frac{\exp(-Y_i w^\top X_i)}{1 + \exp(-Y_i w^\top X_i)} \cdot (-Y_i X_i)$$

**Step 4 — Simplify using the sigmoid function** $\sigma(z) = \frac{1}{1 + e^{-z}}$:

<!-- pencil -->
↳ **Key identity:** $\frac{e^{-z}}{1 + e^{-z}} = 1 - \sigma(z)$. Proof: divide numerator and denominator by $e^{-z}$:

$$\frac{e^{-z}}{1 + e^{-z}} = \frac{1}{e^z + 1} = 1 - \frac{1}{1 + e^{-z}} = 1 - \sigma(z)$$

So: $\frac{\partial \ell_i}{\partial w} = -Y_i X_i \cdot (1 - \sigma(Y_i w^\top X_i))$

**Step 5 — Sum over all $i$ and add the regularisation gradient:**

- Sum: $\frac{1}{n}\sum_{i=1}^n \frac{\partial \ell_i}{\partial w} = -\frac{1}{n}\sum_{i=1}^n Y_i X_i(1 - \sigma(Y_i w^\top X_i))$
- Regulariser: $\frac{\partial}{\partial w}(\lambda w^\top w) = 2\lambda w$

<!-- pencil -->
↳ This is the power rule: $\frac{d}{dw}(w^2) = 2w$ applied to each component of $w$.

<!-- green -->
**Final answer:**

$$\nabla F(w) = -\frac{1}{n}\sum_{i=1}^{n} Y_i X_i\bigl(1 - \sigma(Y_i w^\top X_i)\bigr) + 2\lambda w$$

**Matrix form:**

$$\nabla F(w) = -\frac{1}{n}X^\top\bigl[Y \odot (\mathbf{1} - \sigma(Y \odot Xw))\bigr] + 2\lambda w$$

---

**Sanity checks:**

- **Dimensions:** $\nabla F(w) \in \mathbb{R}^p$ (same dimension as $w$) ✅
- **When prediction is perfect** ($\sigma(Y_i w^\top X_i) = 1$): the loss gradient for sample $i$ is $-Y_i X_i \cdot 0 = \mathbf{0}$. No update needed for that sample. ✅
- **When prediction is completely wrong** ($\sigma(Y_i w^\top X_i) \approx 0$): the loss gradient is $\approx -Y_i X_i$. Maximum correction. ✅

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Chain rule | ✅ Sigmoid identity $\frac{e^{-z}}{1+e^{-z}} = 1 - \sigma(z)$ | ✅ Regulariser gradient $2\lambda w$ | ✅ Both summation and matrix forms

> **Takeaway:** The gradient is a weighted sum of data points, where the weight $(1 - \sigma(\cdot))$ measures how wrong the current prediction is. Well-classified points contribute almost nothing; misclassified points drive the update.

---
<br><br><br><br><br><br>

### 1(c): SGD Algorithm [4 marks]

>
> **Question:** Write down the stochastic gradient descent (SGD) algorithm for minimising $F(w)$, including initialisation and update step.

<!-- pencil -->
↳ **Strategy:** Instead of computing the full gradient over all $n$ data points (expensive: $O(np)$ per step), SGD uses ONE randomly chosen point per step (cheap: $O(p)$ per step).

**The SGD Algorithm:**

**Initialisation:**
- Choose starting weights $w^{(0)}$ (commonly $w^{(0)} = \mathbf{0}$)
- Choose a learning rate schedule $\{\eta_t\}_{t \geq 0}$ (must decay to zero for convergence)

**For** $t = 0, 1, 2, \ldots$:

**Step 1:** Sample one index $i_t$ uniformly at random from $\{1, \ldots, n\}$.

<!-- pencil -->
↳ This is the "stochastic" part — instead of using ALL $n$ points, we pick just ONE at random.

**Step 2:** Compute the stochastic gradient using this single sample:

$$g_t = -Y_{i_t} X_{i_t}\bigl(1 - \sigma(Y_{i_t} w^{(t)\top} X_{i_t})\bigr) + 2\lambda w^{(t)}$$

<!-- pencil -->
↳ This is exactly the gradient formula from 1(b), but using only ONE data point $i_t$ instead of averaging over all $n$.

**Step 3:** Update the weights:

<!-- green -->
$$w^{(t+1)} = w^{(t)} - \eta_t \cdot g_t$$

---

**Why does this work? The unbiased estimator property:**

$$\mathbb{E}[g_t \mid w^{(t)}] = \nabla F(w^{(t)})$$

<!-- pencil -->
↳ Proof sketch: since $i_t$ is chosen uniformly, $\mathbb{E}[\text{loss gradient of sample } i_t] = \frac{1}{n}\sum_{i=1}^n \text{loss gradient of sample } i = \nabla(\text{average loss})$. So the stochastic gradient is "correct on average."

**Why must $\eta_t \to 0$?**

<!-- pencil -->
↳ Each stochastic gradient is noisy (based on one sample). If $\eta_t$ stays constant, the iterates will keep bouncing around $w^*$ and never settle. Decreasing $\eta_t$ (e.g., $\eta_t = \frac{c}{t}$) lets the algorithm converge by taking smaller and smaller steps near the optimum.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Initialisation $w^{(0)}$ | ✅ Uniform random sampling | ✅ Stochastic gradient formula | ✅ Update rule $w^{(t+1)} = w^{(t)} - \eta_t g_t$ | ✅ Unbiased estimator property

> **Takeaway:** SGD trades exact gradient computation ($O(n)$ per step) for noisy but cheap updates ($O(1)$ per step). Over many iterations, it still converges because the noise averages out!

---
<br><br><br><br><br><br>

### 1(d): Proving convexity of $F(w)$ [7 marks]

>
> **Question:** Show that $F(w)$ is convex.

<!-- pencil -->
↳ **Strategy:** Break $F(w)$ into pieces, prove each piece is convex, then use the rule: a non-negative weighted sum of convex functions is convex.

**Piece 1: The log-loss term** $\ell_i(w) = \log(1 + \exp(-Y_i w^\top X_i))$

This is a composition $\ell_i = g \circ h_i$ where:
- $h_i(w) = -Y_i w^\top X_i$ — this is **affine** (linear + constant) in $w$
- $g(z) = \log(1 + e^z)$ — the "softplus" function

**Step 1 — Show softplus $g(z)$ is convex:**

Compute the second derivative:

$$g'(z) = \frac{e^z}{1 + e^z} = \sigma(z)$$

$$g''(z) = \sigma(z)(1 - \sigma(z))$$

<!-- pencil -->
↳ **Why is $g''(z) > 0$ always?** Because $0 < \sigma(z) < 1$ for ALL $z$ (the sigmoid never reaches 0 or 1). So both $\sigma(z)$ and $(1 - \sigma(z))$ are strictly positive, and their product is strictly positive. Since $g'' > 0$, $g$ is **convex**. ✅

**Step 2 — Show $g$ is non-decreasing:**

$g'(z) = \sigma(z) > 0$ for all $z$. So $g$ is strictly increasing. ✅

**Step 3 — Apply the composition rule:**

<!-- pencil -->
↳ **The rule:** If $g$ is convex and non-decreasing, and $h$ is affine (both convex and concave), then $g \circ h$ is convex.

Since $g = $ softplus is convex and non-decreasing, and $h_i$ is affine, the composition $\ell_i = g \circ h_i$ is **convex**. ✅

---

**Piece 2: The regulariser** $\lambda \|w\|_2^2 = \lambda w^\top w$

**Step 4 — Compute the Hessian:**

$$\nabla^2(\lambda w^\top w) = 2\lambda I$$

For $\lambda \geq 0$, the matrix $2\lambda I$ has all eigenvalues $= 2\lambda \geq 0$, so it is **positive semi-definite**. Therefore $\lambda \|w\|^2$ is **convex**. ✅

---

**Combining:**

**Step 5 — Sum the pieces:**

<!-- green -->
$$F(w) = \underbrace{\frac{1}{n}\sum_{i=1}^{n} \ell_i(w)}_{\text{convex (avg of convex)}} + \underbrace{\lambda\|w\|^2}_{\text{convex}}$$

A non-negative weighted sum of convex functions is convex. Therefore $F(w)$ is **convex**. $\square$

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Affine function $h_i$ | ✅ Softplus $g(z) = \log(1+e^z)$ | ✅ Second derivative $g'' > 0$ | ✅ Composition rule (convex + non-decreasing $\circ$ affine = convex) | ✅ PSD Hessian for regulariser | ✅ Sum of convex = convex

> **Takeaway:** Convexity of logistic regression comes from two facts: (1) softplus is convex and non-decreasing, (2) composing it with an affine function preserves convexity. The regulariser adds even more curvature.

---
<br><br><br><br><br><br>

### 1(e): Strong convexity [5 marks]

>
> **Question:** For $\lambda > 0$, show that $F(w)$ is strongly convex and provide a valid constant $\mu$.
>
> **Recall the definition:** $f$ is $\mu$-strongly convex if $f(v) \geq f(w) + \nabla f(w)^\top(v - w) + \frac{\mu}{2}\|v - w\|^2$ for all $w, v$.

<!-- pencil -->
↳ **Strategy:** We already know each $\ell_i$ is convex (from 1d). The strong convexity comes entirely from the $\lambda\|w\|^2$ penalty. We'll add two inequalities.

**Step 1 — Use convexity of $\ell_i$:**

Since each $\ell_i$ is convex, for all $w, v$:

$$\ell_i(v) \geq \ell_i(w) + \nabla \ell_i(w)^\top(v - w) + 0$$

<!-- pencil -->
↳ This is just the definition of convexity: the function lies above its tangent line.

**Step 2 — Show $r(w) = \lambda\|w\|^2$ is $2\lambda$-strongly convex:**

We need: $\lambda\|v\|^2 \geq \lambda\|w\|^2 + 2\lambda w^\top(v - w) + \lambda\|v - w\|^2$

<!-- pencil -->
↳ **Proof:** Expand the right side:
$$\lambda\|w\|^2 + 2\lambda w^\top(v - w) + \lambda\|v - w\|^2$$
$$= \lambda\|w\|^2 + 2\lambda w^\top v - 2\lambda\|w\|^2 + \lambda(\|v\|^2 - 2w^\top v + \|w\|^2)$$
$$= \lambda\|w\|^2 + 2\lambda w^\top v - 2\lambda\|w\|^2 + \lambda\|v\|^2 - 2\lambda w^\top v + \lambda\|w\|^2$$
$$= \lambda\|v\|^2$$

This equals the left side, so the inequality holds with equality! ✅

**Step 3 — Add the inequalities:**

Sum the convexity of $\frac{1}{n}\sum_i \ell_i$ and the strong convexity of $r$:

$$F(v) \geq F(w) + \nabla F(w)^\top(v - w) + \lambda\|v - w\|^2$$

**Step 4 — Match with the definition:**

Comparing with $f(v) \geq f(w) + \nabla f(w)^\top(v-w) + \frac{\mu}{2}\|v-w\|^2$:

We need $\frac{\mu}{2} = \lambda$, so:

<!-- green -->
$$\boxed{\mu = 2\lambda}$$

---

**What does strong convexity give us?**

<!-- pencil -->
↳ Two powerful guarantees:
1. **Unique minimiser:** There is exactly ONE $w^*$ — no other local minima exist.
2. **Linear convergence:** Gradient descent converges exponentially fast — each step reduces the error by a constant factor. The larger $\mu = 2\lambda$, the faster.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Convexity of $\ell_i$ (tangent inequality) | ✅ Algebraic expansion of $\|v-w\|^2$ | ✅ Matching with strong convexity definition | ✅ $\mu = 2\lambda$

> **Takeaway:** The ridge penalty $\lambda\|w\|^2$ bends the objective into a "deep bowl" shape with a unique bottom. Without it ($\lambda = 0$), the log-loss is convex but flat, and gradient descent can be painfully slow.

---
<br><br><br><br><br><br>

### 1(f): Comparison with least squares [4 marks]

>
> **Question:** Compare this objective to least squares regression. What are the main differences in optimisation and solutions?

<!-- pencil -->
↳ **Strategy:** List the key structural differences between $F_{\text{logistic}}(w) = \frac{1}{n}\sum \log(1 + e^{-Yw^\top X}) + \lambda\|w\|^2$ and $F_{\text{LS}}(w) = \frac{1}{n}\|Y - Xw\|^2$.

**Difference 1: Loss function and purpose**

- **Logistic:** $\log(1 + e^{-yw^\top x})$ — designed for **classification** ($Y \in \{-1, 1\}$)
- **Least squares:** $(Y - w^\top X)^2$ — designed for **regression** ($Y \in \mathbb{R}$)

**Difference 2: Closed-form solution**

<!-- red -->
**Logistic regression has NO closed-form solution** — must use iterative methods (SGD, Newton)

**Least squares HAS a closed-form:** $\hat{w} = (X^\top X)^{-1}X^\top Y$

<!-- pencil -->
↳ **Why no closed form for logistic?** Setting $\nabla F = 0$ gives an equation involving $\sigma(\cdot)$ (the sigmoid), which is a nonlinear function of $w$. You cannot isolate $w$ algebraically. In contrast, the least squares gradient $\nabla F = -\frac{2}{n}X^\top(Y - Xw) + 2\lambda w$ is linear in $w$, so setting it to zero gives a system of linear equations.

**Difference 3: Optimisation method**

- **Logistic:** Requires iterative methods — gradient descent, SGD, or Newton's method
- **Least squares:** One matrix inversion ($O(p^3)$) and you're done

**Difference 4: Output interpretation**

- **Logistic:** $\sigma(w^\top x) \in (0, 1)$ — a **probability** (probability that $Y = +1$)
- **Least squares:** $w^\top x \in \mathbb{R}$ — an unbounded real-valued prediction

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Classification vs regression | ✅ No closed-form (nonlinear equation) vs closed-form $(X^\top X)^{-1}X^\top Y$ | ✅ Iterative vs direct solve | ✅ Probability output vs unbounded output

> **Takeaway:** Both are linear models ($w^\top x$), but logistic regression wraps the output in a sigmoid for classification (probability output, no closed-form), while least squares solves for continuous predictions in one shot.

---
<br><br><br><br><br><br>

### 1(g): SGD behaviour figure [4 marks]

>
> **Question:** Draw a figure illustrating the behaviour of SGD iterates for this objective.

<!-- pencil -->
↳ **Strategy:** Since $F(w)$ is strongly convex (from 1e), its level curves in 2D weight space are **ellipses** centred at the unique optimum $w^*$. The SGD path should show a noisy, zig-zagging trajectory converging towards $w^*$.

**What to draw:**

**1. Elliptical contour lines** of $F(w)$

<!-- pencil -->
↳ Draw 3-4 concentric ellipses centred at $w^*$. The ellipses get tighter towards the centre (lower loss values). They are ellipses (not circles) because the Hessian generally has different eigenvalues in different directions.

**2. The optimum $w^*$** as a dot at the centre

**3. A zig-zagging SGD path** from $w^{(0)}$ towards $w^*$

<!-- pencil -->
↳ The path should NOT be a smooth curve — it should bounce left and right unpredictably. Each step points roughly towards $w^*$ but with random noise because we're using a single sample.

**4. Oscillation near $w^*$**

<!-- pencil -->
↳ Near the optimum, the iterates should keep bouncing around $w^*$ instead of settling exactly on it. This happens because $\eta_t$ is still positive and each step has noise.

---

**Key features to label on your diagram:**

| Element | What it shows |
|---|---|
| $w^{(0)}$ | Starting point (outer region) |
| $w^*$ | Optimal point (centre of ellipses) |
| Contour ellipses | Strongly convex landscape |
| Zig-zag arrows | Noisy SGD trajectory |
| Oscillation zone near $w^*$ | SGD doesn't converge exactly unless $\eta_t \to 0$ |

---

**Contrast with full Gradient Descent:**

<!-- pencil -->
↳ Full GD (using all $n$ samples per step) would follow a **smooth, direct path** to $w^*$ — no zig-zagging. The trade-off: each GD step costs $n$ times more than each SGD step.

---

<!-- pencil -->
↳ 📋 **Exam Drawing Checklist:** ✅ Elliptical contours (strongly convex) | ✅ Unique optimum $w^*$ at centre | ✅ Zig-zag path from $w^{(0)}$ | ✅ Oscillation near $w^*$ | ✅ Label all elements

> **Takeaway:** SGD trades a smooth path for cheap updates. It converges "on average" but oscillates around the optimum unless the learning rate decays to zero.

---

**End of Part 1 — Question 1 Complete! ✅**

> Continue to **Part 2** for Question 2 (Kernels & Least Squares, 27 marks).
