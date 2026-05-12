# 📝 Chapter 7 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise — ReLU Network as Piecewise Linear Function ⭐

>
> **Question:** Consider a 1-hidden-layer neural network $f(x) = \sum_{j=1}^m w_j \text{ReLU}(a_j x + b_j)$ with $m$ hidden units. Show that $f(x)$ is a piecewise linear function. How many "pieces" can it have?

### Solution — Step 1: What does one ReLU unit look like?

A single ReLU unit is:

$$\text{ReLU}(ax + b) = \max(0, ax + b) = \begin{cases} ax + b & \text{if } ax + b > 0 \\ 0 & \text{if } ax + b \leq 0 \end{cases}$$

This is a "hinge" — a straight line that bends to zero at $x = -b/a$.

**Each unit contributes one "breakpoint"** at $x_j = -b_j/a_j$ where the function changes from zero to linear (or vice versa).

---

### Solution — Step 2: The full network is a sum of hinges

$$f(x) = \sum_{j=1}^m w_j \text{ReLU}(a_j x + b_j)$$

Each term is piecewise linear with one breakpoint. The **sum of piecewise linear functions is piecewise linear**.

Between any two consecutive breakpoints, every ReLU unit is either "on" (linear) or "off" (zero). So $f(x)$ is a linear function in each interval.

---

### Solution — Step 3: How many pieces?

With $m$ hidden units, there are at most $m$ breakpoints (one per unit).

These breakpoints divide the real line into at most $m + 1$ intervals.

$$\text{Maximum number of linear pieces} = m + 1$$

**Example with $m = 3$:**

```
f(x)    /\
       /  \___
      /       \
─────/─────────\────── x
    b₁   b₂   b₃
    
4 linear pieces (separated by 3 breakpoints)
```

> **Key insight:** A ReLU network with $m$ hidden units can represent any piecewise linear function with up to $m + 1$ pieces. More units = more breakpoints = more flexible function. Deep networks multiply this: $L$ layers with $m$ units each can create up to $O(m^L)$ linear regions — exponentially more expressive!

---

---
<br><br><br><br><br><br>

## Exercise — Cross-Entropy vs MSE for Classification ⭐

>
> **Question:** For binary classification with labels $y \in \{0, 1\}$ and predicted probability $\hat{p} = \sigma(z) = \frac{1}{1 + e^{-z}}$, compute $\frac{\partial}{\partial z}\text{CE}(y, \hat{p})$ and $\frac{\partial}{\partial z}\text{MSE}(y, \hat{p})$. Why is CE better for training?

### Solution — Part 1: Cross-Entropy Gradient

The cross-entropy loss is:

$$\text{CE}(y, \hat{p}) = -[y\log(\hat{p}) + (1-y)\log(1-\hat{p})]$$

**Step 1:** We need $\frac{\partial \hat{p}}{\partial z}$. The sigmoid's derivative has a beautiful form:

$$\frac{\partial \sigma(z)}{\partial z} = \sigma(z)(1 - \sigma(z)) = \hat{p}(1 - \hat{p})$$

**Step 2:** Apply chain rule:

$$\frac{\partial \text{CE}}{\partial z} = -\left[\frac{y}{\hat{p}} - \frac{1-y}{1-\hat{p}}\right] \cdot \hat{p}(1-\hat{p})$$

$$= -\left[y(1-\hat{p}) - (1-y)\hat{p}\right]$$

$$= -[y - y\hat{p} - \hat{p} + y\hat{p}]$$

$$= \hat{p} - y$$

$$\boxed{\frac{\partial \text{CE}}{\partial z} = \hat{p} - y}$$

This is **incredibly simple**: the gradient is just "prediction minus truth"! ✅

---

### Solution — Part 2: MSE Gradient

$$\text{MSE} = \frac{1}{2}(y - \hat{p})^2$$

$$\frac{\partial \text{MSE}}{\partial z} = -(y - \hat{p}) \cdot \hat{p}(1 - \hat{p})$$

$$\boxed{\frac{\partial \text{MSE}}{\partial z} = (\hat{p} - y) \cdot \hat{p}(1 - \hat{p})}$$

---

### Solution — Part 3: Why CE is better

Compare the two gradients:

| | Cross-Entropy | MSE |
|---|---|---|
| **Gradient** | $\hat{p} - y$ | $(\hat{p} - y) \cdot \hat{p}(1 - \hat{p})$ |
| **When $\hat{p} \approx 0$ or $\hat{p} \approx 1$** | Normal magnitude | **Tiny!** (multiplied by $\approx 0$) |

**The problem with MSE:** When the prediction is very wrong (say $y = 1$ but $\hat{p} = 0.01$), the gradient for MSE includes the factor $\hat{p}(1 - \hat{p}) = 0.01 \times 0.99 \approx 0.01$. The gradient is **almost zero** even though the prediction is terrible!

**CE doesn't have this problem.** The gradient is simply $\hat{p} - y = 0.01 - 1 = -0.99$. It's **large** when the prediction is bad, giving strong learning signal.

> **Takeaway:** Cross-entropy "cancels" the sigmoid's saturation. When the sigmoid output is near 0 or 1 (where its derivative is tiny), CE's gradient stays strong. MSE's gradient vanishes in these regions, making learning extremely slow. This is why CE is the standard loss for classification.

---

---
<br><br><br><br><br><br>

## Exercise — Diffusion Forward Process ⭐

>
> **Question:** In a diffusion model, the forward process adds noise: $x_t = \sqrt{\alpha_t}\, x_{t-1} + \sqrt{1-\alpha_t}\, \epsilon_t$ where $\epsilon_t \sim \mathcal{N}(0, I)$. Show that after $T$ steps, $x_T \approx \mathcal{N}(0, I)$ when $\bar{\alpha}_T = \prod_{t=1}^T \alpha_t \to 0$.

### Solution — Step 1: Unroll the recursion

Apply the formula repeatedly from $t = 1$ to $t = T$:

$$x_1 = \sqrt{\alpha_1}\, x_0 + \sqrt{1 - \alpha_1}\, \epsilon_1$$

$$x_2 = \sqrt{\alpha_2}\, x_1 + \sqrt{1 - \alpha_2}\, \epsilon_2$$

Substitute $x_1$ into $x_2$:

$$x_2 = \sqrt{\alpha_2}\left(\sqrt{\alpha_1}\, x_0 + \sqrt{1-\alpha_1}\, \epsilon_1\right) + \sqrt{1-\alpha_2}\, \epsilon_2$$

$$= \sqrt{\alpha_1\alpha_2}\, x_0 + \sqrt{\alpha_2(1-\alpha_1)}\, \epsilon_1 + \sqrt{1-\alpha_2}\, \epsilon_2$$

---

### Solution — Step 2: The general formula

By induction, after $T$ steps:

$$x_T = \sqrt{\bar{\alpha}_T}\, x_0 + \sqrt{1 - \bar{\alpha}_T}\, \bar{\epsilon}$$

where $\bar{\alpha}_T = \prod_{t=1}^T \alpha_t$ and $\bar{\epsilon} \sim \mathcal{N}(0, I)$.

**Why does the noise combine into a single Gaussian?** Because a weighted sum of independent Gaussians is Gaussian. The total noise variance is $1 - \bar{\alpha}_T$ (you can verify by computing the variance of the sum).

---

### Solution — Step 3: Take $T \to \infty$

As $T$ grows:
- $\bar{\alpha}_T = \prod_{t=1}^T \alpha_t \to 0$ (product of numbers less than 1 shrinks to 0)
- The "signal" term: $\sqrt{\bar{\alpha}_T}\, x_0 \to 0$ (original data vanishes)
- The "noise" term: $\sqrt{1 - \bar{\alpha}_T}\, \bar{\epsilon} \to \bar{\epsilon} \sim \mathcal{N}(0, I)$ (pure noise dominates)

$$x_T \approx \mathcal{N}(0, I) \quad \blacksquare$$

> **Key insight:** The forward process is designed so that after enough steps, the original data is completely "destroyed" by noise. The neural network's job in the backward process is to learn how to "undo" this destruction step by step — starting from pure noise and gradually recovering the data structure.

---

---
<br><br><br><br><br><br>

## Exercise — Attention Mechanism Computation ⭐

>
> **Question:** Given $Q = \begin{pmatrix} 1 \\ 0 \end{pmatrix}$, $K = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$, $V = \begin{pmatrix} 5 \\ 3 \end{pmatrix}$ with $d_k = 1$, compute $\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$.

### Solution — Step 1: Compute $QK^\top$

$$QK^\top = \begin{pmatrix} 1 \\ 0 \end{pmatrix} \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} 1 & 0 \end{pmatrix}$$

Wait — let's reinterpret. $Q$ is a $1 \times 1$ query (single token), $K$ is $2 \times 1$ (two keys), each of dimension $d_k = 1$.

$$Q = (1), \quad K = \begin{pmatrix} 1 \\ 0 \end{pmatrix}, \quad V = \begin{pmatrix} 5 \\ 3 \end{pmatrix}$$

$$QK^\top = (1) \cdot (1 \quad 0) = (1 \quad 0)$$

---

### Solution — Step 2: Scale by $\sqrt{d_k}$

$$\frac{QK^\top}{\sqrt{d_k}} = \frac{(1 \quad 0)}{\sqrt{1}} = (1 \quad 0)$$

---

### Solution — Step 3: Apply softmax

$$\text{softmax}(1, 0) = \left(\frac{e^1}{e^1 + e^0}, \frac{e^0}{e^1 + e^0}\right) = \left(\frac{2.718}{3.718}, \frac{1}{3.718}\right) \approx (0.731, 0.269)$$

---

### Solution — Step 4: Multiply by $V$

$$\text{Attention} = (0.731, 0.269) \begin{pmatrix} 5 \\ 3 \end{pmatrix} = 0.731 \times 5 + 0.269 \times 3 = 3.655 + 0.807 = 4.46$$

The output is a **weighted average** of the values, with weights determined by how well each key matches the query.

Since $Q = (1)$ matches $K_1 = (1)$ perfectly and $K_2 = (0)$ poorly, the output is much closer to $V_1 = 5$ than $V_2 = 3$.

> **Takeaway:** Attention is a "soft lookup table." The query asks "what am I looking for?", the keys say "here's what I have," and the values say "here's the information." The softmax converts similarity scores into a probability distribution that decides which values to focus on.
