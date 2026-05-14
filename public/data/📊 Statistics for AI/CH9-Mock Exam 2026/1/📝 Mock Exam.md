# 📝 Mock Exam 2026 — SOLVED Step by Step

> Open in VS Code → Press `Ctrl+Shift+V` → All math renders.
> Each question is solved like a tutor sitting next to you, explaining every single step.
> **Exam:** Statistics for Artificial Intelligence II | **Module:** MAT00127M | **Time:** 3 hours | **Total:** 100 marks

---

## Question 1 — Regularised Logistic Regression ⭐⭐ [35 marks]

>
> Consider the regularised logistic regression objective
> $$F(w) = \frac{1}{n}\sum_{i=1}^{n}\log(1 + \exp(-Y_i w^\top X_i)) + \lambda \|w\|_2^2,$$
> where $\lambda \geq 0$, $w \in \mathbb{R}^p$, $X_i \in \mathbb{R}^p$, and $Y_i \in \{-1,1\}$.

---

### Solution — 1(a): Design matrix and matrix notation [5 marks]

>
> **Question:** Define the design matrix $X$ and response vector $Y$, and write $F(w)$ using matrix notation.

<!-- pencil -->
↳ We need to organise all data points into a single matrix/vector so we can write the objective compactly.

**Design matrix** $X \in \mathbb{R}^{n \times p}$: stack each data point as a **row**:

$$X = \begin{pmatrix} X_1^\top \\ X_2^\top \\ \vdots \\ X_n^\top \end{pmatrix}$$

<!-- pencil -->
↳ Row $i$ of $X$ is the feature vector $X_i^\top$. So $X$ has $n$ rows (samples) and $p$ columns (features).

**Response vector** $Y \in \{-1,1\}^n$:

$$Y = \begin{pmatrix} Y_1 \\ Y_2 \\ \vdots \\ Y_n \end{pmatrix}$$

Now, notice that $w^\top X_i = (Xw)_i$ (the $i$-th entry of the vector $Xw$).

<!-- pencil -->
↳ The key trick: $Y_i w^\top X_i$ is the $i$-th entry of the element-wise product $Y \odot (Xw)$.

**Matrix notation:**

$$F(w) = \frac{1}{n}\mathbf{1}^\top \log(\mathbf{1} + \exp(-Y \odot Xw)) + \lambda\, w^\top w$$

<!-- pencil -->
↳ Here $\log$ and $\exp$ act element-wise on vectors, and $\mathbf{1}$ is the all-ones vector. The $\mathbf{1}^\top(\cdots)$ just sums all entries.

> **Takeaway:** The matrix form lets us express the entire loss over all $n$ samples without summation signs!

---
<br><br><br><br><br><br>

### Solution — 1(b): Deriving the gradient $\nabla F(w)$ [6 marks]

>
> **Question:** Derive the gradient $\nabla F(w)$.

<!-- pencil -->
↳ We differentiate each term separately, then combine. Let's start with a single data point.

**Step 1:** Focus on one term $\ell_i(w) = \log(1 + \exp(-Y_i w^\top X_i))$.

This is a composition: outer function $\log(1 + e^z)$ applied to $z = -Y_i w^\top X_i$.

**Step 2:** Apply the chain rule:

$$\frac{\partial \ell_i}{\partial w} = \frac{\exp(-Y_i w^\top X_i)}{1 + \exp(-Y_i w^\top X_i)} \cdot (-Y_i X_i)$$

<!-- pencil -->
↳ The first fraction is $\frac{e^z}{1+e^z}$ which equals $1 - \sigma(z)$ where $\sigma(z) = \frac{1}{1+e^{-z}}$ is the **sigmoid function**.

**Step 3:** Simplify using the sigmoid:

$$\frac{\partial \ell_i}{\partial w} = -Y_i X_i \cdot (1 - \sigma(Y_i w^\top X_i))$$

<!-- pencil -->
↳ Intuition: if $\sigma(Y_i w^\top X_i) \approx 1$, the model is confident and correct → gradient is small. If $\sigma \approx 0$, the model is wrong → gradient is large. Makes sense!

**Step 4:** Sum over all $i$ and add the regularisation gradient:

<!-- green -->
$$\nabla F(w) = -\frac{1}{n}\sum_{i=1}^{n} Y_i X_i(1 - \sigma(Y_i w^\top X_i)) + 2\lambda w$$

<!-- pencil -->
↳ The $2\lambda w$ comes from $\frac{\partial}{\partial w}(\lambda w^\top w) = 2\lambda w$.

**Matrix form:**

$$\nabla F(w) = -\frac{1}{n}X^\top[Y \odot (\mathbf{1} - \sigma(Y \odot Xw))] + 2\lambda w$$

> **Takeaway:** The gradient is a weighted sum of data points, where the weights depend on how wrong the current prediction is!

---
<br><br><br><br><br><br>

### Solution — 1(c): SGD Algorithm [4 marks]

>
> **Question:** Write down the stochastic gradient descent (SGD) algorithm for minimising $F(w)$, including initialisation and update step.

**Initialisation:**

- Choose $w^{(0)}$ (commonly $w^{(0)} = \mathbf{0}$)
- Choose a learning rate schedule $\{\eta_t\}_{t \geq 0}$

**For** $t = 0, 1, 2, \ldots$:

**Step 1:** Sample one index $i_t$ uniformly at random from $\{1, \ldots, n\}$

<!-- pencil -->
↳ This is the "stochastic" part — instead of computing the gradient over ALL data, we pick just ONE random sample.

**Step 2:** Compute the stochastic gradient:

$$g_t = -Y_{i_t} X_{i_t}(1 - \sigma(Y_{i_t} w^{(t)\top} X_{i_t})) + 2\lambda w^{(t)}$$

<!-- pencil -->
↳ This is the gradient formula from part (b), but using only ONE data point $i_t$ instead of averaging over all $n$.

**Step 3:** Update the weights:

<!-- green -->
$$w^{(t+1)} = w^{(t)} - \eta_t \cdot g_t$$

<!-- pencil -->
↳ Key property: $\mathbb{E}[g_t \mid w^{(t)}] = \nabla F(w^{(t)})$ — the stochastic gradient is an **unbiased estimator** of the full gradient!

> **Takeaway:** SGD trades exact gradient computation (expensive: $O(n)$) for noisy but cheap updates ($O(1)$ per step). Over many steps, it still converges!

---
<br><br><br><br><br><br>

### Solution — 1(d): Proving convexity [7 marks]

>
> **Question:** Show that $F(w)$ is convex.

<!-- pencil -->
↳ Strategy: show each piece of $F(w)$ is convex. The sum of convex functions is convex.

**Piece 1:** $\ell_i(w) = \log(1 + \exp(-Y_i w^\top X_i))$

This is a composition $g(h(w))$ where:
- $h(w) = -Y_i w^\top X_i$ is **affine** in $w$ (linear + constant)
- $g(z) = \log(1 + e^z)$ is the "softplus" function

<!-- pencil -->
↳ Is $g(z)$ convex? Check its second derivative!

$$g'(z) = \frac{e^z}{1+e^z} = \sigma(z)$$

$$g''(z) = \sigma(z)(1 - \sigma(z))$$

Since $0 < \sigma(z) < 1$ for all $z$, we have $g''(z) > 0$ always. ✅ So $g$ is **convex**.

<!-- pencil -->
↳ Composition rule: convex + non-decreasing composed with affine → convex. Since $g$ is convex and non-decreasing ($g'(z) = \sigma(z) > 0$), and $h$ is affine, $g \circ h$ is convex.

✅ Each $\ell_i(w)$ is convex!

**Piece 2:** $\lambda\|w\|_2^2 = \lambda w^\top w$

<!-- pencil -->
↳ The Hessian is $2\lambda I$. For $\lambda \geq 0$, $2\lambda I \succeq 0$, so this is convex.

✅ The regulariser is convex!

**Combining:**

<!-- green -->
$$F(w) = \frac{1}{n}\sum_{i=1}^{n}\ell_i(w) + \lambda\|w\|^2$$

is a non-negative weighted sum of convex functions → **convex**. $\square$

> **Takeaway:** Convexity of logistic regression comes from two facts: (1) softplus is convex, (2) composing convex-nondecreasing with affine preserves convexity.

---
<br><br><br><br><br><br>

### Solution — 1(e): Strong convexity [5 marks]

>
> **Question:** For $\lambda > 0$, show that $F(w)$ is strongly convex and provide a valid constant $\mu$.

<!-- pencil -->
↳ We already know the log-loss part is convex. Strong convexity comes from the $\lambda\|w\|^2$ term.

**Step 1:** Since each $\ell_i$ is convex, for all $w, v$:

$$\ell_i(v) \geq \ell_i(w) + \nabla \ell_i(w)^\top(v - w)$$

<!-- pencil -->
↳ This is just the definition of convexity (function lies above its tangent).

**Step 2:** The regulariser $r(w) = \lambda\|w\|^2$ is $2\lambda$-strongly convex:

$$r(v) = \lambda\|v\|^2 \geq \lambda\|w\|^2 + 2\lambda w^\top(v-w) + \lambda\|v-w\|^2$$

<!-- pencil -->
↳ Proof: expand $\lambda\|v-w\|^2 = \lambda(\|v\|^2 - 2w^\top v + \|w\|^2)$, then rearrange: $\lambda\|v\|^2 = \lambda\|w\|^2 + 2\lambda w^\top(v-w) + \lambda\|v-w\|^2$. ✅

**Step 3:** Add the inequalities:

$$F(v) \geq F(w) + \nabla F(w)^\top(v-w) + \lambda\|v-w\|^2$$

<!-- pencil -->
↳ Comparing with the definition: $F(v) \geq F(w) + \nabla F(w)^\top(v-w) + \frac{\mu}{2}\|v-w\|^2$

<!-- green -->
$$\boxed{\mu = 2\lambda}$$

> **Takeaway:** The ridge penalty $\lambda\|w\|^2$ makes the objective strongly convex with parameter $\mu = 2\lambda$. Strong convexity guarantees a **unique** minimum and **linear convergence** of gradient descent!

---
<br><br><br><br><br><br>

### Solution — 1(f): Comparison with least squares [4 marks]

>
> **Question:** Compare this objective to least squares regression. What are the main differences in optimisation and solutions?

**Difference 1: Loss function**

- Logistic: $\log(1 + e^{-yw^\top x})$ → designed for **classification** ($Y \in \{-1,1\}$)
- Least squares: $(Y - w^\top X)^2$ → designed for **regression** ($Y \in \mathbb{R}$)

**Difference 2: Closed-form solution**

<!-- red -->
- Logistic regression has **NO** closed-form solution → must use iterative methods

- Least squares has a **closed-form**: $\hat{w} = (X^\top X)^{-1}X^\top Y$

<!-- pencil -->
↳ Why no closed form for logistic? Because the sigmoid inside the log makes $\nabla F(w) = 0$ a nonlinear equation in $w$.

**Difference 3: Optimisation**

- Logistic: requires SGD, gradient descent, or Newton's method
- Least squares: one matrix inversion and you're done

**Difference 4: Output interpretation**

- Logistic: $\sigma(w^\top x) \in (0,1)$ → a **probability**
- Least squares: $w^\top x \in \mathbb{R}$ → an unbounded prediction

> **Takeaway:** Both are linear models, but logistic regression is for classification (iterative solve, probability output) while least squares is for regression (closed-form solve, continuous output).

---
<br><br><br><br><br><br>

### Solution — 1(g): SGD behaviour figure [4 marks]

>
> **Question:** Draw a figure illustrating the behaviour of SGD iterates for this objective.

<!-- pencil -->
↳ Think of contour lines of $F(w)$ in 2D weight space. Since $F$ is strongly convex, the contours are **ellipses** centred at the optimum $w^*$.

**What the figure should show:**

1. **Elliptical contours** of $F(w)$ centred at $w^*$ (because of strong convexity)
2. **A zig-zagging path** from $w^{(0)}$ towards $w^*$ — this is the SGD trajectory
3. The path **does NOT go straight** to $w^*$ — it bounces around due to gradient noise
4. Near $w^*$, the iterates **oscillate** (they don't settle exactly unless $\eta_t \to 0$)

<!-- pencil -->
↳ Contrast with full gradient descent: GD would follow a smooth, direct path to $w^*$. SGD's path is noisy but each step is $n$ times cheaper!

**Key features to label:**
- $w^{(0)}$: starting point (outer region)
- $w^*$: optimal point (centre)
- Contour ellipses getting tighter towards the centre
- Noisy SGD arrows showing the zig-zag pattern

> **Takeaway:** SGD trades a smooth path for cheap updates. It converges "on average" but oscillates around the optimum.

---
<br><br><br><br><br><br>

## Question 2 — Kernels `[27 marks]`

>
> Questions about positive semi-definite kernels, the Gaussian kernel, kernel matrices, kernel least-squares, and regularisation.

---

### Solution — 2(a): PSD Kernel Definition [3 marks]

>
> **Question:** Define what it means for a function $k : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ to be a positive semi-definite kernel.

A function $k : \mathcal{X} \times \mathcal{X} \to \mathbb{R}$ is a **positive semi-definite (PSD) kernel** if:

<!-- pencil -->
`$\downarrow$` For ANY finite set of points $\{x_1, \ldots, x_m\} \subset \mathcal{X}$ and ANY coefficients $\alpha \in \mathbb{R}^m$:

$$\sum_{i=1}^{m}\sum_{j=1}^{m} \alpha_i \alpha_j\, k(x_i, x_j) \geq 0$$

<!-- pencil -->
`$\downarrow$` Equivalently: the **Gram matrix** $K$ with entries $K_{ij} = k(x_i, x_j)$ is PSD ($K \succeq 0$) for any choice of points.

<!-- pencil -->
`$\downarrow$` Intuition: a PSD kernel measures "similarity" between points. $k(x,y) = \langle \phi(x), \phi(y) \rangle$ for some feature map $\phi$ — it's an inner product in a (possibly infinite-dimensional) feature space!

> **Takeaway:** PSD kernels let us do linear algebra in feature spaces without ever computing $\phi$ explicitly (the "kernel trick").

---
<br><br><br><br><br><br>

### Solution — 2(b): Role of $\sigma$ in the Gaussian Kernel [2 marks]

>
> **Question:** Consider $k(x,y) = \exp\left(-\frac{\|x-y\|^2}{2\sigma^2}\right)$. What role does $\sigma$ play?

$\sigma$ is the **bandwidth** (or **length-scale**) parameter:

<!-- pencil -->
`$\downarrow$` It controls how fast the kernel value drops as points get further apart.

**Small $\sigma$:**
- $k(x,y)$ drops to zero very quickly with distance
- Only very close points are considered "similar"
- The model becomes very **local** `$\to$` risk of **overfitting**

**Large $\sigma$:**
- $k(x,y)$ stays close to 1 even for distant points
- Everything looks similar to everything
- The model becomes very **smooth** `$\to$` risk of **underfitting**

<!-- green -->
`$\sigma$` controls the **bias-variance trade-off** in kernel methods!

> **Takeaway:** Think of $\sigma$ as a "zoom level" — small $\sigma$ zooms in (local detail), large $\sigma$ zooms out (global smoothness).

---
<br><br><br><br><br><br>

### Solution — 2(c): Kernel Matrix and $Ka$ [5 marks]

>
> **Question:** Let $h(x) = \sum_{i=1}^{n} a_i k(X_i, x)$. Define the kernel matrix $K$ and express $(h(X_1), \ldots, h(X_n))^\top$ in terms of $K$ and $a$.

**The kernel matrix** $K \in \mathbb{R}^{n \times n}$ has entries:

$$K_{ij} = k(X_i, X_j)$$

<!-- pencil -->
`$\downarrow$` $K$ is symmetric ($K_{ij} = K_{ji}$) because $k$ is symmetric, and PSD by definition.

**Now compute** $h(X_j)$ for each training point:

$$h(X_j) = \sum_{i=1}^{n} a_i k(X_i, X_j) = \sum_{i=1}^{n} K_{ji}\, a_i$$

<!-- pencil -->
`$\downarrow$` The sum $\sum_i K_{ji} a_i$ is exactly the $j$-th entry of the matrix-vector product $Ka$!

<!-- green -->
$$\begin{pmatrix} h(X_1) \\ h(X_2) \\ \vdots \\ h(X_n) \end{pmatrix} = Ka$$

> **Takeaway:** Evaluating $h$ at all training points is just one matrix-vector multiplication!

---
<br><br><br><br><br><br>

### Solution — 2(d): Kernel least-squares in terms of $a$ [6 marks]

>
> **Question:** Express $R_n(h) = \frac{1}{n}\sum_{i=1}^{n}(Y_i - h(X_i))^2$ as an optimisation problem in $a$.

From part (c): the vector of predictions at training points is $Ka$.

**Step 1:** Substitute $h(X_i) = (Ka)_i$:

$$R_n(h) = \frac{1}{n}\sum_{i=1}^{n}(Y_i - (Ka)_i)^2$$

**Step 2:** Recognise this as a squared norm:

<!-- green -->
$$R_n(a) = \frac{1}{n}\|Y - Ka\|^2 = \frac{1}{n}(Y - Ka)^\top(Y - Ka)$$

**The optimisation problem:**

$$\hat{a} = \arg\min_{a \in \mathbb{R}^n} \frac{1}{n}\|Y - Ka\|^2$$

<!-- pencil -->
`$\downarrow$` This looks just like ordinary least squares, but with $K$ playing the role of the design matrix! Instead of finding weights for raw features, we're finding weights for kernel evaluations.

> **Takeaway:** Kernel regression reduces to least squares in "kernel space" — same math, different representation!

---
<br><br><br><br><br><br>

### Solution — 2(e): Deriving $\hat{a} = K^{-1}Y$ [7 marks]

>
> **Question:** Derive the minimiser $\hat{a}$. You may assume $K$ is invertible.

Let $L(a) = \frac{1}{n}(Y - Ka)^\top(Y - Ka)$.

**Step 1:** Expand the quadratic:

$$L(a) = \frac{1}{n}(Y^\top Y - 2Y^\top Ka + a^\top K^\top Ka)$$

<!-- pencil -->
`$\downarrow$` Since $K$ is symmetric: $K^\top = K$, so $K^\top K = K^2$.

**Step 2:** Take the gradient with respect to $a$:

$$\nabla_a L = \frac{1}{n}(-2K^\top Y + 2K^\top Ka) = \frac{2}{n}K(Ka - Y)$$

<!-- pencil -->
`$\downarrow$` We used $\nabla_a(Y^\top Ka) = K^\top Y = KY$ and $\nabla_a(a^\top K^2 a) = 2K^2 a$.

**Step 3:** Set $\nabla_a L = 0$:

$$K(Ka - Y) = 0$$

Since $K$ is invertible, multiply both sides by $K^{-1}$:

$$Ka - Y = 0$$

$$Ka = Y$$

<!-- green -->
$$\hat{a} = K^{-1}Y$$

> **Takeaway:** The kernel least-squares solution is beautifully simple: just invert the kernel matrix and multiply by $Y$!

---
<br><br><br><br><br><br>

### Solution — 2(f): Why not minimise $R_n(h)$ directly? [4 marks]

>
> **Question:** Why don't we typically minimise $R_n(h)$ directly? What is the popular alternative?

**Problem with** $\hat{a} = K^{-1}Y$:

<!-- red -->
This gives $h(X_i) = Y_i$ exactly for ALL training points — the model **interpolates** the data!

<!-- pencil -->
`$\downarrow$` The model memorises every training point, including noise. On new data, it will perform terribly. This is **overfitting**.

**Popular alternative: Kernel Ridge Regression (regularisation)**

Add a penalty on the complexity of $h$:

$$\hat{a} = \arg\min_{a \in \mathbb{R}^n} \frac{1}{n}\|Y - Ka\|^2 + \lambda\, a^\top K a$$

<!-- pencil -->
`$\downarrow$` The term $a^\top Ka = \|h\|_{\mathcal{H}}^2$ is the **RKHS norm** — it penalises "wiggly" functions.

**The regularised solution:**

<!-- green -->
$$\hat{a} = (K + n\lambda I)^{-1}Y$$

<!-- pencil -->
`$\downarrow$` $\lambda > 0$ shrinks the coefficients, giving a smoother fit that generalises better. The solution is always well-defined (even if $K$ is singular!).

> **Takeaway:** Pure kernel regression interpolates = overfits. Adding $\lambda\|h\|_{\mathcal{H}}^2$ regularisation gives kernel ridge regression, which balances fit and smoothness.

---
<br><br><br><br><br><br>


## Question 3 — RL, Modern ML & LLMs `[38 marks]`

>
> Covers: Markov Decision Processes, TD Learning, Function Approximation challenges, Double Descent, Transformers, and the Stochastic Parrot argument.

---

### Solution — 3(a)(i): Define an MDP [3 marks]

>
> **Question:** Define a Markov Decision Process.

A **Markov Decision Process (MDP)** is a tuple $(\mathcal{S}, \mathcal{A}, P, R, \gamma)$:

- $\mathcal{S}$: a finite set of **states** (where the agent can be)
- $\mathcal{A}$: a finite set of **actions** (what the agent can do)
- $P(s' \mid s, a)$: **transition probabilities** (probability of going to state $s'$ given you're in $s$ and do $a$)
- $R(s, a)$: **reward function** (how much reward for taking action $a$ in state $s$)
- $\gamma \in (0,1)$: **discount factor** (how much we value future vs immediate rewards)

<!-- pencil -->
`$\downarrow$` The **Markov property**: the future depends only on the current state, not on how we got there. $P(S_{t+1} \mid S_t, A_t) = P(S_{t+1} \mid \text{entire history})$.

> **Takeaway:** An MDP formalises sequential decision-making: at each step, you're in a state, choose an action, get a reward, and transition to a new state.

---
<br><br><br><br><br><br>

### Solution — 3(a)(ii): Value Function $V^\pi(s)$ [2 marks]

>
> **Question:** Define the value function $V^\pi(s)$, where $\pi$ is a policy.

$$V^\pi(s) = \mathbb{E}_\pi\left[\sum_{t=0}^{\infty} \gamma^t R(S_t, A_t) \;\middle|\; S_0 = s\right]$$

<!-- pencil -->
`$\downarrow$` In words: $V^\pi(s)$ is the **expected total discounted reward** you'll get if you start in state $s$ and follow policy $\pi$ forever.

<!-- pencil -->
`$\downarrow$` The discount $\gamma^t$ makes future rewards worth less: reward now > reward later. If $\gamma = 0.9$, a reward 10 steps from now is worth $(0.9)^{10} \approx 0.35$ times its face value.

> **Takeaway:** The value function answers "how good is it to be in state $s$?" under a specific policy.

---
<br><br><br><br><br><br>

### Solution — 3(a)(iii): Bellman Equation [3 marks]

>
> **Question:** State the Bellman equation for $V^\pi$.

<!-- green -->
$$V^\pi(s) = \sum_{a}\pi(a \mid s)\left[R(s,a) + \gamma \sum_{s'} P(s' \mid s, a)\, V^\pi(s')\right]$$

<!-- pencil -->
`$\downarrow$` Breaking this down piece by piece:

1. $\pi(a \mid s)$: probability of choosing action $a$ in state $s$
2. $R(s,a)$: immediate reward for that action
3. $\gamma \sum_{s'} P(s' \mid s, a) V^\pi(s')$: discounted expected future value

<!-- pencil -->
`$\downarrow$` The Bellman equation says: **value of being here** = **immediate reward** + $\gamma$ `$\times$` **expected value of where I go next**. It's recursive!

> **Takeaway:** The Bellman equation is the foundation of ALL RL algorithms. It decomposes a long-horizon problem into one-step decisions.

---
<br><br><br><br><br><br>

### Solution — 3(b)(i): TD Update Rule [3 marks]

>
> **Question:** Write down the TD update rule.

The **TD(0) update** is:

<!-- green -->
$$V(S_t) \leftarrow V(S_t) + \alpha\left[\underbrace{R_t + \gamma V(S_{t+1})}_{\text{TD target}} - V(S_t)\right]$$

<!-- pencil -->
`$\downarrow$` $\alpha \in (0,1)$ is the learning rate. The quantity in brackets is the **TD error**: $\delta_t = R_t + \gamma V(S_{t+1}) - V(S_t)$.

<!-- pencil -->
`$\downarrow$` Intuition: after observing transition $(S_t, R_t, S_{t+1})$, we get a better estimate of $V(S_t)$ from $R_t + \gamma V(S_{t+1})$. We nudge $V(S_t)$ towards this new estimate.

> **Takeaway:** TD learning bootstraps — it updates an estimate using another estimate, without waiting for the episode to end!

---
<br><br><br><br><br><br>

### Solution — 3(b)(ii): When to use TD over Bellman iteration [3 marks]

>
> **Question:** When would you use TD instead of iterating the Bellman equation?

Use TD learning when:

**1. The model is unknown:**
<!-- pencil -->
`$\downarrow$` The Bellman equation requires $P(s' \mid s, a)$ and $R(s,a)$ — the full dynamics model. TD only needs **sampled transitions** $(S_t, R_t, S_{t+1})$.

**2. The state space is huge:**
<!-- pencil -->
`$\downarrow$` Bellman iteration needs to sweep through ALL states. With millions of states (e.g., Atari games), this is infeasible. TD updates one state at a time.

**3. You want online learning:**
<!-- pencil -->
`$\downarrow$` TD can update after every single transition. No need to wait for a complete episode (unlike Monte Carlo methods).

> **Takeaway:** TD = model-free, online, scalable. Bellman iteration = model-based, exact, requires small state space.

---
<br><br><br><br><br><br>

### Solution — 3(b)(iii): Finding an optimal policy [5 marks]

>
> **Question:** Describe one method to find an optimal policy.

**Q-Learning** (off-policy TD control):

**Idea:** Learn the optimal action-value function $Q^*(s,a)$ directly, without knowing the model.

**Update rule:**

<!-- green -->
$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\left[R_t + \gamma \max_{a'} Q(S_{t+1}, a') - Q(S_t, A_t)\right]$$

<!-- pencil -->
`$\downarrow$` Notice the $\max_{a'}$ — we always bootstrap from the BEST action, even if we didn't take it. That's what makes it "off-policy".

**Algorithm:**

1. Initialise $Q(s,a) = 0$ for all $(s,a)$
2. **Repeat** for each episode:
   - Observe state $S_t$
   - Choose action $A_t$ using $\varepsilon$-greedy: with probability $\varepsilon$ explore (random), with probability $1-\varepsilon$ exploit ($\arg\max_a Q(S_t, a)$)
   - Observe reward $R_t$ and next state $S_{t+1}$
   - Apply the Q-learning update

3. **Optimal policy:** $\pi^*(s) = \arg\max_a Q(s,a)$

<!-- pencil -->
`$\downarrow$` Q-learning converges to $Q^*$ as long as: all $(s,a)$ pairs are visited infinitely often, and the learning rate decays appropriately.

> **Takeaway:** Q-learning is the most famous model-free RL algorithm. It learns the optimal policy by iteratively improving Q-value estimates.

---
<br><br><br><br><br><br>

### Solution — 3(c): Challenges of function approximation in RL [6 marks]

>
> **Question:** Discuss challenges that arise when using function approximation (e.g., neural networks) in RL. Give at least two distinct issues.

**Challenge 1: The Deadly Triad / Instability**

<!-- red -->
Combining three things can cause **divergence**: (1) function approximation, (2) bootstrapping (TD), (3) off-policy learning.

<!-- pencil -->
`$\downarrow$` In tabular RL, convergence is guaranteed. With neural networks, the function approximator can amplify errors: a small error in $V(S_{t+1})$ gets bootstrapped into $V(S_t)$, which then affects $V(S_{t-1})$, creating a chain reaction.

**Challenge 2: Non-stationary targets**

In deep RL, the target $R + \gamma \max_{a'} Q_\theta(s', a')$ depends on the SAME parameters $\theta$ we're optimising.

<!-- pencil -->
`$\downarrow$` As $\theta$ changes, the targets move too — it's like trying to hit a moving target. This causes training instability. DQN's solution: use a **target network** (a frozen copy of $Q$) that's updated less frequently.

**Challenge 3: Correlated samples**

<!-- pencil -->
`$\downarrow$` RL data is sequential: $S_0, S_1, S_2, \ldots$ are highly correlated (consecutive states are similar). Neural networks trained on correlated data can overfit to recent experiences and "forget" earlier lessons.

<!-- pencil -->
`$\downarrow$` Solution: **experience replay** — store transitions in a buffer and sample random mini-batches, breaking temporal correlations.

> **Takeaway:** Deep RL is hard because it violates the assumptions that make supervised learning work (i.i.d. data, fixed targets, stable optimisation landscape).

---
<br><br><br><br><br><br>

### Solution — 3(d): Double Descent vs Classical Bias-Variance [5 marks]

>
> **Question:** Explain the double descent phenomenon and contrast it with the classical bias-variance trade-off.

**Classical bias-variance trade-off:**

As model complexity increases:
- **Bias** decreases (model fits training data better)
- **Variance** increases (model becomes more sensitive to noise)
- Test error has a **U-shape**: decreasing, then increasing

<!-- pencil -->
`$\downarrow$` The optimal model is at the bottom of the U — the "sweet spot" between underfitting and overfitting.

**Double descent:**

Beyond the **interpolation threshold** (where the model has just enough parameters to perfectly fit all training data), something surprising happens:

<!-- pencil -->
`$\downarrow$` The test error **decreases again**! The curve has TWO descents:

1. **First descent**: classical under-parameterised regime (bias drops)
2. **Peak**: at the interpolation threshold (model barely fits, extremely sensitive to noise)
3. **Second descent**: over-parameterised regime — more parameters `$\to$` smoother interpolation `$\to$` lower test error

<!-- green -->
**Key contrast:** Classical theory says "more parameters after the sweet spot = worse." Double descent says "way MORE parameters = surprisingly better!"

<!-- pencil -->
`$\downarrow$` This is observed in neural networks, random forests, kernel methods, and even linear regression. It explains why modern deep learning (with billions of parameters) can generalise well despite massively over-parameterised models.

> **Takeaway:** Double descent breaks the classical wisdom. The interpolation threshold is the danger zone, but going far beyond it (into the "modern regime") can actually help!

---
<br><br><br><br><br><br>

### Solution — 3(e): Attention Mechanism in Transformers [5 marks]

>
> **Question:** Explain the attention mechanism in transformers. What are queries, keys, and values?

**The big idea:** Attention lets each token in a sequence "look at" all other tokens and decide which ones are relevant.

**Step 1:** Given input embeddings $X \in \mathbb{R}^{n \times d}$ (one row per token), compute:

$$Q = XW_Q, \quad K = XW_K, \quad V = XW_V$$

<!-- pencil -->
`$\downarrow$` $W_Q, W_K \in \mathbb{R}^{d \times d_k}$ and $W_V \in \mathbb{R}^{d \times d_v}$ are **learned** weight matrices.

**Step 2:** Compute attention weights and output:

<!-- green -->
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

**What are Q, K, V?**

<!-- pencil -->
`$\downarrow$` Think of it like a search engine:

- **Query ($Q$):** "What am I looking for?" — each token asks a question
- **Key ($K$):** "What do I contain?" — each token advertises its content
- **Value ($V$):** "What information do I carry?" — the actual content to retrieve

**How it works:**

1. $QK^\top$: compute **similarity scores** between every query and every key
2. $\div \sqrt{d_k}$: scale down to prevent the dot products from being too large (which would make softmax saturate into hard 0/1 and kill gradients)
3. $\text{softmax}$: convert scores into **attention weights** (probabilities that sum to 1)
4. Multiply by $V$: weighted combination of values

<!-- pencil -->
`$\downarrow$` Example: in "The cat sat on the mat", the word "sat" might attend strongly to "cat" (who sat?) and "mat" (where?), giving them high attention weights.

> **Takeaway:** Attention = soft lookup. Each token creates a query, matches it against all keys, and retrieves a weighted mix of values. This is what makes transformers so powerful at capturing long-range dependencies!

---
<br><br><br><br><br><br>

### Solution — 3(f): The Stochastic Parrot Argument [3 marks]

>
> **Question:** Explain the stochastic parrot argument.

The "**stochastic parrot**" argument (Bender et al., 2021) claims that large language models (LLMs):

**Core claim:**

<!-- red -->
LLMs are sophisticated **pattern-matching** systems that produce statistically plausible text WITHOUT genuine **understanding**.

<!-- pencil -->
`$\downarrow$` They learn to predict the next token based on distributional patterns in training data — they "repeat" what they've seen, like a very sophisticated parrot.

**Key points:**

1. The **fluency** of LLM outputs creates an **illusion of comprehension** — but the model has no grounding in real-world experience or meaning

<!-- pencil -->
`$\downarrow$` A parrot can perfectly mimic "I love you" without understanding love.

2. **Risks:** LLMs amplify biases in training data, generate plausible-sounding but factually incorrect text ("hallucinations"), and have enormous environmental costs

3. **No semantic grounding:** The model manipulates symbols without understanding what they refer to — there's no connection to the physical world

> **Takeaway:** The stochastic parrot argument is a critique of LLMs — they produce fluent text by statistical pattern matching, not by understanding meaning. Whether this matters depends on your definition of "understanding"!

---

**End of Mock Exam 2026 — All Questions Solved! `$\checkmark$`**

