# 📝 Chapter 3 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise 23 — Eigenvalues of the GD Iteration Matrix ⭐

>
> **Question:** Let $\lambda_1, \ldots, \lambda_d > 0$ be eigenvalues of $H$. Show that: (a) $(I - \gamma H)$ has eigenvalues $1 - \gamma\lambda_i$, (b) $(I - \gamma H)^{2t}$ has eigenvalues $(1 - \gamma\lambda_i)^{2t}$, and (c) $|(1 - \gamma\lambda_i)^{2t}| \leq (\max_{\lambda \in [\mu,L]} |1 - \gamma\lambda|)^{2t}$.

### Solution — Part (a): Eigenvalues of $I - \gamma H$

**What we know:** $H$ has eigendecomposition $H = U D U^\top$ where $D = \text{diag}(\lambda_1, \ldots, \lambda_d)$ and $U$ is orthogonal.

**Step 1:** Write $I - \gamma H$ using the eigendecomposition:

$$I - \gamma H = U I U^\top - \gamma U D U^\top = U(I - \gamma D)U^\top$$

**Step 2:** Since $U$ is orthogonal, $U(I - \gamma D)U^\top$ is itself an eigendecomposition!

The eigenvectors are the same columns of $U$, and the eigenvalues are the diagonal entries of $I - \gamma D$:

$$1 - \gamma\lambda_1, \quad 1 - \gamma\lambda_2, \quad \ldots, \quad 1 - \gamma\lambda_d \quad \checkmark$$

> **Intuition:** Subtracting $\gamma H$ from the identity "shifts" each eigenvalue from $\lambda_i$ to $1 - \gamma\lambda_i$. This is why the learning rate $\gamma$ directly controls how much each eigenvalue gets shrunk.

---

### Solution — Part (b): Eigenvalues of $(I - \gamma H)^{2t}$

**Step 1:** If $A = U \Lambda U^\top$, then $A^k = U \Lambda^k U^\top$ (raising a diagonal matrix to a power raises each entry to that power).

$$I - \gamma H = U(I - \gamma D)U^\top$$

$$(I - \gamma H)^{2t} = U(I - \gamma D)^{2t}U^\top$$

**Step 2:** The diagonal entries of $(I - \gamma D)^{2t}$ are:

$$(1 - \gamma\lambda_i)^{2t} \quad \text{for } i = 1, \ldots, d \quad \checkmark$$

> **Intuition:** After $2t$ iterations of gradient descent, the error along the $i$-th eigenvector direction gets multiplied by $(1 - \gamma\lambda_i)^{2t}$. For convergence, we need $|1 - \gamma\lambda_i| < 1$ for ALL $i$.

---

### Solution — Part (c): The worst-case bound

**Step 1:** Since $\lambda_i \in [\mu, L]$ (eigenvalues are between the smallest $\mu$ and largest $L$):

$$|1 - \gamma\lambda_i| \leq \max_{\lambda \in [\mu, L]} |1 - \gamma\lambda|$$

This is just saying: the actual value for any particular $\lambda_i$ can't exceed the worst case over the whole interval $[\mu, L]$.

**Step 2:** Raise both sides to the power $2t$ (preserves the inequality since both sides are non-negative):

$$|(1 - \gamma\lambda_i)^{2t}| = |1 - \gamma\lambda_i|^{2t} \leq \left(\max_{\lambda \in [\mu, L]} |1 - \gamma\lambda|\right)^{2t} \quad \blacksquare$$

> **Key insight:** The convergence speed of GD is controlled by $\max\{|1 - \gamma\mu|, |1 - \gamma L|\}$. The **optimal** $\gamma$ minimizes this worst case, giving $\gamma^* = \frac{2}{\mu + L}$.

---

---
<br><br><br><br><br><br>

## Exercise 26 — Gradient Descent in Practice ⭐

>
> **Question:** Consider $F(x) = \|Ax - b\|^2$ with $A = \begin{pmatrix} 2 & 1.5 & 3 & 4 \\ 7 & -2 & -5 & 0 \\ 0 & -3 & 10 & 3 \\ 1 & 1 & 0 & 0 \end{pmatrix}$ and $b = \begin{pmatrix} 2 \\ 1 \\ -3 \\ 0 \end{pmatrix}$. (1) Derive $\nabla F(x)$. (2) Write the GD update rule. (3) What learning rate should you use?

### Solution — Part 1: Derive the gradient

$$F(x) = \|Ax - b\|^2 = (Ax - b)^\top(Ax - b)$$

**Expand:**

$$= x^\top A^\top A x - 2b^\top A x + b^\top b$$

This is a quadratic form with matrix $A^\top A$ (which IS symmetric — always!).

Using our formula from Exercise 21 (with $A^\top A$ playing the role of "$A$"):

$$\nabla F(x) = 2A^\top A x - 2A^\top b = 2A^\top(Ax - b) \quad \checkmark$$

> **Pattern:** For ANY least-squares problem $\|Ax - b\|^2$, the gradient is always $2A^\top(Ax - b)$. Memorize this!

---

### Solution — Part 2: The GD update rule

Plug the gradient into the GD formula $x_{t+1} = x_t - \gamma \nabla F(x_t)$:

$$\boxed{x_{t+1} = x_t - 2\gamma \cdot A^\top(Ax_t - b)}$$

**Breakdown of one iteration:**
1. Compute the **residual**: $r_t = Ax_t - b$ (how far off are we?)
2. Compute $A^\top r_t$ (the "correction direction")
3. Take a step: $x_{t+1} = x_t - 2\gamma \cdot A^\top r_t$

---

### Solution — Part 3: Choosing the learning rate

The Hessian of $F$ is $H = 2A^\top A$. Its largest eigenvalue $L$ determines the maximum safe learning rate.

$$\gamma_{\text{safe}} = \frac{1}{L} = \frac{1}{2\lambda_{\max}(A^\top A)}$$

- **$\gamma > 1/L$**: GD **diverges** — it overshoots the minimum each step and spirals outward! ❌
- **$\gamma = 1/L$**: Convergence guaranteed, but can be slow if $\kappa$ is large
- **$\gamma = 2/(\mu + L)$**: **Optimal** — fastest convergence ✅

The **exact solution** (what GD converges to) is $x^* = A^{-1}b$ since $A$ is $4 \times 4$ and full rank.

> **Takeaway:** Always compute $\lambda_{\max}(A^\top A)$ first. Your learning rate must be at most $1/(2\lambda_{\max})$, or GD will explode.

---

---
<br><br><br><br><br><br>

## Exercise 27 — SGD for an Underdetermined System ⭐⭐

>
> **Question:** Same as Exercise 26, but now use SGD. The matrix is $A = \begin{pmatrix} 2 & 1.5 & 3 & 4 \\ 7 & -2 & -5 & 0 \\ 0 & -3 & 10 & 3 \end{pmatrix}$, $b = \begin{pmatrix} 2 \\ 1 \\ -3 \end{pmatrix}$ (3 rows, 4 columns). Run it multiple times. Do you get the same solution? Why or why not?

### Solution — Part 1: The SGD update rule

In SGD, instead of using ALL rows of $A$ at each step, we pick **one random row** $i$:

$$x_{t+1} = x_t - 2\gamma_t \cdot a_i(a_i^\top x_t - b_i)$$

where $a_i^\top$ is the $i$-th row of $A$ (viewed as a column vector $a_i$).

**Why is this valid?** The full gradient is:

$$\nabla F = 2A^\top(Ax - b) = 2\sum_{i=1}^n a_i(a_i^\top x - b_i)$$

Each row gives one term. If we pick row $i$ uniformly at random:

$$\mathbb{E}[g_t] = \frac{1}{n}\sum_{i=1}^n 2n \cdot a_i(a_i^\top x - b_i) = 2A^\top(Ax - b) = \nabla F$$

The random estimate is **unbiased** — on average, it equals the true gradient. ✅

---

### Solution — Part 2: Why different runs give different answers

**Critical observation:** $A$ is $3 \times 4$ — it has **more unknowns than equations**!

This means the system $Ax = b$ is **underdetermined** — there are **infinitely many solutions**.

**Geometric picture:** The solution set is a line (or plane) in $\mathbb{R}^4$. Any point on this line satisfies $Ax = b$.

**What happens with SGD:**
- Each run uses a **different random sequence** of row selections
- This creates a **different trajectory** through $\mathbb{R}^4$
- Each trajectory converges to a **different point** on the solution line

$$\text{Run 1: } x_1^* = \begin{pmatrix} 0.3 \\ 0.7 \\ -0.1 \\ 0.4 \end{pmatrix} \quad \text{Run 2: } x_2^* = \begin{pmatrix} 0.5 \\ 0.2 \\ 0.1 \\ 0.3 \end{pmatrix} \quad \text{Different!}$$

Both satisfy $Ax^* \approx b$, but they're different points on the solution manifold.

> **Key insight:** When a system is underdetermined, SGD's randomness causes it to land on different solutions each time. By contrast, GD initialized at $x_0 = 0$ always converges to the **minimum-norm** solution $x^* = A^\dagger b$ (the shortest vector satisfying $Ax = b$). This is Lemma 11's implicit regularization!

---

### Comparison Table

| | **Batch GD** | **SGD** |
|---|---|---|
| **Per-step cost** | $O(nd)$ — uses all 3 rows | $O(d)$ — uses 1 row |
| **Path** | Smooth, deterministic | Noisy, random |
| **Convergence** | Exponential: $\exp(-t/\kappa)$ | Polynomial: $O(1/t)$ |
| **Reproducible?** | Yes — same start → same result | No — different random rows → different path |
| **Underdetermined** | Always gives minimum-norm solution | Depends on random seed |

> **Takeaway:** SGD is $n\times$ cheaper per step but noisier. For underdetermined systems, the randomness means you might land on any valid solution.
