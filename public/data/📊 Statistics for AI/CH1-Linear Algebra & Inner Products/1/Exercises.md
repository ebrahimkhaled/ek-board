# 📝 Chapter 1 Exercises — SOLVED Step by Step

> Open in VS Code → Press `Ctrl+Shift+V` → All math renders.
> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise 1 — Inner Product Verification ⭐

>
> **Question:** Show that $\langle u, v \rangle = u^\top v$ defines an inner product. Also show that $\|u\| = \sqrt{u^\top u}$ defines a norm. Why can't we choose $\|u\| = u^\top u$?

### Solution — Part 1: Is $u^\top v$ a valid inner product?

We need to check **3 rules** (the axioms of an inner product):

---

**Rule 1: Symmetry** — Does $\langle u, v \rangle = \langle v, u \rangle$?

$$\langle u, v \rangle = u^\top v = u_1 v_1 + u_2 v_2 + \cdots + u_d v_d$$

$$\langle v, u \rangle = v^\top u = v_1 u_1 + v_2 u_2 + \cdots + v_d u_d$$

Since multiplication is commutative ($u_i v_i = v_i u_i$), these are **identical**. ✅

---

**Rule 2: Linearity** — Does $\langle u + cv, w \rangle = \langle u, w \rangle + c\langle v, w \rangle$?

$$\langle u + cv, w \rangle = (u + cv)^\top w$$

Let's expand this component by component:

$$= \sum_{i=1}^d (u_i + cv_i)w_i = \sum_{i=1}^d u_i w_i + c\sum_{i=1}^d v_i w_i = u^\top w + c(v^\top w)$$

$$= \langle u, w \rangle + c\langle v, w \rangle \quad \checkmark$$

✅ It distributes just like multiplication!

---

**Rule 3: Positive Definiteness** — Is $\langle u, u \rangle > 0$ when $u \neq 0$?

$$\langle u, u \rangle = u^\top u = u_1^2 + u_2^2 + \cdots + u_d^2$$

This is a sum of squares. Each $u_i^2 \geq 0$. If $u \neq 0$, at least one $u_i \neq 0$, so $u_i^2 > 0$.

Therefore $\langle u, u \rangle > 0$. ✅

---

### Solution — Part 2: Is $\|u\| = \sqrt{u^\top u}$ a valid norm?

Three checks:

**Check 1: Non-negativity + scaling**

$$\|u\| = \sqrt{u^\top u} \geq 0 \quad \text{(square root is always } \geq 0\text{)}$$

$$\|cu\| = \sqrt{(cu)^\top(cu)} = \sqrt{c^2 \cdot u^\top u} = |c| \cdot \sqrt{u^\top u} = |c| \cdot \|u\| \quad \checkmark$$

**Check 2: Triangle inequality** — $\|u + v\| \leq \|u\| + \|v\|$

This is the hardest step. Start by squaring both sides:

$$\|u + v\|^2 = (u+v)^\top(u+v) = u^\top u + 2u^\top v + v^\top v = \|u\|^2 + 2u^\top v + \|v\|^2$$

Now use **Cauchy-Schwarz**: $|u^\top v| \leq \|u\|\|v\|$, so $u^\top v \leq \|u\|\|v\|$:

$$\|u+v\|^2 \leq \|u\|^2 + 2\|u\|\|v\| + \|v\|^2 = (\|u\| + \|v\|)^2$$

Take square root: $\|u+v\| \leq \|u\| + \|v\|$ ✅

> **Key insight:** Cauchy-Schwarz is the bridge between inner products and norms!

**Check 3: Definiteness**

$$\|u\| = 0 \Rightarrow u^\top u = 0 \Rightarrow u_1^2 + \cdots + u_d^2 = 0 \Rightarrow u = 0 \quad \checkmark$$

---

### Solution — Part 3: Why NOT $\|u\| = u^\top u$?

Try the scaling rule with $\|u\| = u^\top u$:

$$\|cu\| = (cu)^\top(cu) = c^2 \cdot u^\top u = c^2 \|u\|$$

But we **need** $\|cu\| = |c| \cdot \|u\|$, not $c^2 \|u\|$.

**Example:** $u = (1, 0)^\top$, $c = 2$.
- With $\sqrt{u^\top u}$: $\|2u\| = 2$ and $|2| \cdot \|u\| = 2$. ✅ Match!
- With $u^\top u$: $\|2u\| = 4$ but $|2| \cdot \|u\| = 2$. ❌ Mismatch!

The square root is essential to get the scaling right.

---

---
<br><br><br><br><br><br>
## Exercise 2 — Norm from Inner Product

>
> **Question:** Check that $\|u\| := \sqrt{\langle u, u \rangle}$ satisfies the norm properties for ANY inner product.

### Solution

This is the **general version** of Exercise 1, Part 2. The proof is identical, but using abstract $\langle \cdot, \cdot \rangle$ instead of $u^\top v$:

**Non-negativity:** $\|u\| = \sqrt{\langle u, u \rangle} \geq 0$ since $\langle u, u \rangle \geq 0$ by positive definiteness. ✅

**Scaling:** $\|cu\| = \sqrt{\langle cu, cu \rangle} = \sqrt{c^2 \langle u, u \rangle} = |c|\sqrt{\langle u, u \rangle} = |c|\|u\|$ ✅

**Triangle inequality:**

$$\|u+v\|^2 = \langle u+v, u+v \rangle = \|u\|^2 + 2\langle u,v \rangle + \|v\|^2$$

By Cauchy-Schwarz: $\langle u,v \rangle \leq \|u\|\|v\|$

$$\leq \|u\|^2 + 2\|u\|\|v\| + \|v\|^2 = (\|u\| + \|v\|)^2$$

Take square root → done ✅

**Definiteness:** $\|u\| = 0 \Rightarrow \langle u,u \rangle = 0 \Rightarrow u = 0$ by axiom 3. ✅

> **Takeaway:** ANY inner product automatically gives you a valid norm via $\sqrt{\langle u,u \rangle}$.

---

---
<br><br><br><br><br><br>

## Exercise 3 — Random Variable Inner Product ⭐⭐

>
> **Question:** Show that $\langle X, Y \rangle := E(XY)$ defines an inner product for **centered** random variables (where $E(X) = 0$). Then show $|\rho(X,Y)| \leq 1$.

### Solution — Part 1: Is $E(XY)$ an inner product?

> **"Centered"** means $E(X) = 0$. This is crucial for Step 3!

**Rule 1: Symmetry**

$$\langle X, Y \rangle = E(XY) = E(YX) = \langle Y, X \rangle \quad \checkmark$$

Multiplication is commutative, even for random variables.

**Rule 2: Linearity**

$$\langle X + cZ, Y \rangle = E((X + cZ)Y) = E(XY + cZY) = E(XY) + cE(ZY)$$

$$= \langle X, Y \rangle + c\langle Z, Y \rangle \quad \checkmark$$

We used: expectation is linear ($E(A + B) = E(A) + E(B)$, $E(cA) = cE(A)$).

**Rule 3: Positive definiteness** — This is the key step!

We need: $\langle X, X \rangle > 0$ when $X \neq 0$ (not identically zero).

$$\langle X, X \rangle = E(X^2)$$

Now, since $X$ is **centered** ($E(X) = 0$):

$$\text{Var}(X) = E(X^2) - [E(X)]^2 = E(X^2) - 0^2 = E(X^2)$$

So $\langle X, X \rangle = \text{Var}(X)$.

If $X$ is not identically zero and $E(X) = 0$, then $X$ must fluctuate → $\text{Var}(X) > 0$. ✅

> **Key insight:** The "centered" condition ($E(X) = 0$) is what makes $E(X^2) = \text{Var}(X)$ work directly!

---

### Solution — Part 2: Why $|\rho(X,Y)| \leq 1$

The correlation is defined as:

$$\rho(X,Y) = \frac{E(XY)}{\sqrt{E(X^2)} \cdot \sqrt{E(Y^2)}}$$

Using our inner product notation:

$$\rho(X,Y) = \frac{\langle X, Y \rangle}{\|X\| \cdot \|Y\|}$$

This is exactly the **cosine of the angle** between $X$ and $Y$!

By **Cauchy-Schwarz**: $|\langle X, Y \rangle| \leq \|X\| \cdot \|Y\|$

$$\therefore |\rho(X,Y)| = \frac{|\langle X, Y \rangle|}{\|X\|\|Y\|} \leq \frac{\|X\|\|Y\|}{\|X\|\|Y\|} = 1 \quad \blacksquare$$

> **Takeaway:** Correlation is literally the cosine of an "angle" between random variables. Cauchy-Schwarz forces it to be between $-1$ and $+1$.

---

---
<br><br><br><br><br><br>

## Exercise — Symmetric Matrix Property

>
> **Question:** For symmetric $A$ ($A^\top = A$), show that $\langle Au, v \rangle = \langle u, Av \rangle$.

### Solution

This is a **one-liner** once you know the trick:

$$\langle Au, v \rangle = (Au)^\top v$$

The transpose of a product reverses the order: $(Au)^\top = u^\top A^\top$

$$= u^\top A^\top v$$

Since $A$ is symmetric: $A^\top = A$

$$= u^\top A v = u^\top (Av) = \langle u, Av \rangle \quad \blacksquare$$

> **In words:** A symmetric matrix can "jump" from one side of the inner product to the other without changing the result.

---

---
<br><br><br><br><br><br>

## Exercise 4 — Projection Matrix ⭐

>
> **Question:** Write the projection matrix onto the x-axis. Verify $P^2 = P = P^\top$. Then find $P$ for projecting onto the line through $(1,1)$.

### Solution — Part 1: Projection onto x-axis

The x-axis is the line in direction $e_1 = (1, 0)^\top$.

**Formula:** $P = \frac{uu^\top}{u^\top u}$ (for projection onto the direction of $u$).

Since $e_1^\top e_1 = 1$:

$$P = e_1 e_1^\top = \begin{pmatrix} 1 \\ 0 \end{pmatrix}\begin{pmatrix} 1 & 0 \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}$$

**Verify $P^2 = P$:**

$$P^2 = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}\begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix} = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix} = P \quad \checkmark$$

**Verify $P^\top = P$:**

$$P^\top = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix} = P \quad \checkmark$$

**Test it:** Apply $P$ to $z = (3, 5)^\top$:

$$Pz = \begin{pmatrix} 1 & 0 \\ 0 & 0 \end{pmatrix}\begin{pmatrix} 3 \\ 5 \end{pmatrix} = \begin{pmatrix} 3 \\ 0 \end{pmatrix}$$

It kept the x-component and dropped the y-component. That's projection onto x-axis! ✅

---

### Solution — Part 2: Projection onto the line through $(1,1)$

Direction: $u = (1, 1)^\top$. Length: $u^\top u = 1 + 1 = 2$.

$$P = \frac{uu^\top}{u^\top u} = \frac{1}{2}\begin{pmatrix} 1 \\ 1 \end{pmatrix}\begin{pmatrix} 1 & 1 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}$$

**Verify $P^2 = P$:**

$$P^2 = \frac{1}{4}\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix} = \frac{1}{4}\begin{pmatrix} 2 & 2 \\ 2 & 2 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix} = P \quad \checkmark$$

**Test it:** Apply $P$ to $z = (4, 0)^\top$:

$$Pz = \frac{1}{2}\begin{pmatrix} 1 & 1 \\ 1 & 1 \end{pmatrix}\begin{pmatrix} 4 \\ 0 \end{pmatrix} = \frac{1}{2}\begin{pmatrix} 4 \\ 4 \end{pmatrix} = \begin{pmatrix} 2 \\ 2 \end{pmatrix}$$

The point $(4,0)$ got projected to $(2,2)$, which lies on the line $y = x$. ✅

---

---
<br><br><br><br><br><br>

## Exercise 15 — PCA Covariance Identity

>
> **Question:** Show that $C_n = \tilde{X}^\top \tilde{X} = X^\top X - \frac{1}{n}X^\top \mathbf{1}\mathbf{1}^\top X$, where $\tilde{X} = X - \frac{1}{n}\mathbf{1}\mathbf{1}^\top X$.

### Solution

This is just **expanding brackets** carefully.

**Step 1:** Write $\tilde{X} = X - \frac{1}{n}\mathbf{1}\mathbf{1}^\top X = (I - \frac{1}{n}\mathbf{1}\mathbf{1}^\top)X$

Let me call $M = \frac{1}{n}\mathbf{1}\mathbf{1}^\top$ (the centering subtractor).

**Step 2:** Expand $\tilde{X}^\top \tilde{X} = (X - MX)^\top(X - MX)$

$$= X^\top X - X^\top MX - (MX)^\top X + (MX)^\top MX$$

$$= X^\top X - X^\top MX - X^\top M^\top X + X^\top M^\top MX$$

**Step 3:** Simplify. Since $M = \frac{1}{n}\mathbf{1}\mathbf{1}^\top$ is symmetric ($M^\top = M$):

The middle two terms are both $-X^\top MX$, giving $-2X^\top MX$.

**Step 4:** For the last term, compute $M^\top M = M^2$:

$$M^2 = \frac{1}{n}\mathbf{1}\mathbf{1}^\top \cdot \frac{1}{n}\mathbf{1}\mathbf{1}^\top = \frac{1}{n^2}\mathbf{1}\underbrace{(\mathbf{1}^\top\mathbf{1})}_{= n}\mathbf{1}^\top = \frac{1}{n}\mathbf{1}\mathbf{1}^\top = M$$

> **Key trick:** $\mathbf{1}^\top\mathbf{1} = n$ because $\mathbf{1}$ is the vector of $n$ ones.

**Step 5:** Combine:

$$C_n = X^\top X - 2X^\top MX + X^\top MX = X^\top X - X^\top MX$$

$$= X^\top X - \frac{1}{n}X^\top\mathbf{1}\mathbf{1}^\top X \quad \blacksquare$$

---

---
<br><br><br><br><br><br>

## Exercise 16 — PCA Truncated Projection

>
> **Question:** $\tilde{W}_{\text{trunc}} = (w_1, \ldots, w_{p'}, 0, \ldots, 0)$. Show that $P = \tilde{W}_{\text{trunc}}\tilde{W}_{\text{trunc}}^\top$ is an orthogonal projection. What subspace? What dimension?

### Solution

**Key fact:** $w_1, \ldots, w_{p'}$ are orthonormal eigenvectors of $C_n$ (from PCA).

**Check $P^2 = P$ (idempotent):**

$$P^2 = \tilde{W}\tilde{W}^\top\tilde{W}\tilde{W}^\top$$

The middle part: $\tilde{W}^\top\tilde{W} = \text{diag}(1, \ldots, 1, 0, \ldots, 0)$ (first $p'$ ones are 1, rest are 0).

This is because $w_i^\top w_j = \delta_{ij}$ (orthonormality).

So $P^2 = \tilde{W} \cdot \text{diag}(1,\ldots,1,0,\ldots,0) \cdot \tilde{W}^\top = \tilde{W}\tilde{W}^\top = P$ ✅

**Check $P^\top = P$ (symmetric):**

$$P^\top = (\tilde{W}\tilde{W}^\top)^\top = \tilde{W}\tilde{W}^\top = P \quad \checkmark$$

**What subspace?** $\text{span}(w_1, \ldots, w_{p'})$ — the first $p'$ principal components.

**Dimension?** $p'$.

> **Intuition:** PCA truncation IS a projection — it projects data onto the top $p'$ variance directions and throws away the rest.

---

---
<br><br><br><br><br><br>

## Exercise 17 — CCA Change of Variables

>
> **Question:** With substitution $c = C_{XX}^{1/2}a$, $d = C_{YY}^{1/2}b$, can we optimize over $(c,d)$ instead of $(a,b)$? What if some eigenvalues are zero?

### Solution

**Case 1: All eigenvalues positive**

If all eigenvalues of $C_{XX}$ are positive, then $C_{XX}^{1/2}$ is **invertible**.

The map $a \mapsto c = C_{XX}^{1/2}a$ is a **bijection** (one-to-one and onto):
- Every $c$ has exactly one $a$: $a = C_{XX}^{-1/2}c$

So optimizing over $(c,d)$ is **exactly the same** as optimizing over $(a,b)$. ✅

**Case 2: Some eigenvalues are zero**

If $C_{XX}$ has a zero eigenvalue, then $C_{XX}^{-1/2}$ **does not exist**.

The map $a \mapsto c = C_{XX}^{1/2}a$ is **not injective** — different $a$ values can give the same $c$. Specifically, any component of $a$ in the null space of $C_{XX}^{1/2}$ gets "crushed" to zero.

The problems are **NOT equivalent**. ❌

> **Intuition:** Zero eigenvalues mean some directions have zero variance — no information there. The change of variables loses those directions.

---

---
<br><br><br><br><br><br>

## Exercise 18 — CCA Uncorrelated Variables

>
> **Question:** Show that $a_j^\top X$ and $a_k^\top X$ are uncorrelated for $j \neq k$, where $a_j = C_{XX}^{-1/2}u_j$.

### Solution

**Goal:** Show $\text{Cov}(a_j^\top X, a_k^\top X) = 0$ when $j \neq k$.

$$\text{Cov}(a_j^\top X, a_k^\top X) = a_j^\top \underbrace{\text{Cov}(X)}_{= C_{XX}} a_k = a_j^\top C_{XX} a_k$$

**Substitute** $a_j = C_{XX}^{-1/2}u_j$:

$$= u_j^\top \underbrace{C_{XX}^{-1/2} C_{XX} C_{XX}^{-1/2}}_{= I} u_k = u_j^\top u_k$$

The key step: $C_{XX}^{-1/2} C_{XX} C_{XX}^{-1/2} = C_{XX}^{-1/2} C_{XX}^{1/2} C_{XX}^{1/2} C_{XX}^{-1/2} = I \cdot I = I$

Since $u_j$ and $u_k$ are **orthonormal** singular vectors:

$$u_j^\top u_k = \begin{cases} 1 & \text{if } j = k \\ 0 & \text{if } j \neq k \end{cases}$$

Therefore $\text{Cov}(a_j^\top X, a_k^\top X) = 0$ for $j \neq k$. $\blacksquare$

> **Intuition:** $C_{XX}^{-1/2}$ acts as "whitening" — it removes all correlations from $X$. After whitening, the singular vectors are orthogonal, so the CCA components are uncorrelated.
