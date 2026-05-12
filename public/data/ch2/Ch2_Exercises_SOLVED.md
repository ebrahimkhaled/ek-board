# 📝 Chapter 2 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise 21 — Gradient of a Quadratic Form ⭐⭐

>
> **Question:** Consider $f(x) = x^\top A x + b^\top x + c$ where $A$ is a symmetric matrix, $b$ is a vector, and $c$ is a scalar. Show that $\nabla f(x) = 2Ax + b$.

### Solution — Step 1: What does $f(x)$ actually look like?

Let's first **expand** $f(x)$ in terms of individual components so we can see what's going on:

$$f(x) = \sum_{i=1}^d \sum_{j=1}^d x_i A_{ij} x_j + \sum_{i=1}^d b_i x_i + c$$

The first part ($x^\top A x$) is a **quadratic form** — each term looks like $x_i \cdot A_{ij} \cdot x_j$.

The second part ($b^\top x$) is a **linear form** — just a weighted sum of the $x_i$'s.

The third part ($c$) is a constant — it vanishes when we differentiate.

---

### Solution — Step 2: Differentiate with respect to one variable $x_k$

We want the $k$-th component of the gradient. Pick one variable $x_k$ and differentiate everything:

$$\frac{\partial f}{\partial x_k} = \frac{\partial}{\partial x_k}\left[\sum_{i,j} x_i A_{ij} x_j\right] + \frac{\partial}{\partial x_k}\left[\sum_i b_i x_i\right] + \frac{\partial}{\partial x_k}[c]$$

**The linear part:** $\frac{\partial}{\partial x_k}\sum_i b_i x_i = b_k$ (only the $i = k$ term survives) ✅

**The constant:** $\frac{\partial c}{\partial x_k} = 0$ ✅

**The quadratic part** (the tricky one): $x_k$ appears in two places inside $\sum_{i,j} x_i A_{ij} x_j$:

- **As the left factor** ($x_i = x_k$, i.e., $i = k$): gives $\sum_j A_{kj} x_j$
- **As the right factor** ($x_j = x_k$, i.e., $j = k$): gives $\sum_i x_i A_{ik}$

$$\frac{\partial}{\partial x_k}\left[\sum_{i,j} x_i A_{ij} x_j\right] = \sum_j A_{kj} x_j + \sum_i x_i A_{ik}$$

The first sum is $(Ax)_k$. The second sum is $(A^\top x)_k$.

---

### Solution — Step 3: Use symmetry ($A = A^\top$)

Since $A$ is symmetric, $A_{ik} = A_{ki}$, which means $A^\top x = Ax$.

So both sums give the **same thing**:

$$\frac{\partial f}{\partial x_k} = (Ax)_k + (Ax)_k + b_k = 2(Ax)_k + b_k$$

---

### Solution — Step 4: Stack all components into the gradient

$$\nabla f(x) = \begin{pmatrix} 2(Ax)_1 + b_1 \\ 2(Ax)_2 + b_2 \\ \vdots \\ 2(Ax)_d + b_d \end{pmatrix} = 2Ax + b \quad \blacksquare$$

> **Key insight:** The symmetry of $A$ is essential — it's what gives us $2Ax$ instead of $(A + A^\top)x$. If $A$ weren't symmetric, the gradient would be $(A + A^\top)x + b$.

---

### Why This Formula Matters in Practice

The OLS (Ordinary Least Squares) loss function is exactly this form:

$$F(\theta) = \frac{1}{2n}\|X\theta - y\|^2 = \frac{1}{2n}(\theta^\top X^\top X \theta - 2y^\top X\theta + y^\top y)$$

Here $A = \frac{1}{2n}X^\top X$, $b = -\frac{1}{n}X^\top y$, $c = \frac{1}{2n}y^\top y$.

Gradient: $\nabla F = 2 \cdot \frac{1}{2n}X^\top X\theta - \frac{1}{n}X^\top y = \frac{1}{n}X^\top(X\theta - y)$

Setting $\nabla F = 0$: $X^\top X \theta^* = X^\top y$ → $\theta^* = (X^\top X)^{-1}X^\top y$

> **Takeaway:** This is the **normal equation** — the closed-form solution for linear regression. Exercise 21 is the mathematical engine behind it.

---

---
<br><br><br><br><br><br>

## Exercise 22 — Minimising the OLS Objective ⭐

>
> **Question:** Consider $F(\theta) = \frac{1}{2}\|X\theta - y\|^2$. Where does $F$ attain its minimum?

### Solution — Step 1: Compute the gradient

First, let's expand $F(\theta)$:

$$F(\theta) = \frac{1}{2}(X\theta - y)^\top(X\theta - y) = \frac{1}{2}(\theta^\top X^\top X\theta - 2y^\top X\theta + y^\top y)$$

This is a quadratic form in $\theta$ with $A = \frac{1}{2}X^\top X$ and $b = -X^\top y$.

Using Exercise 21's result ($\nabla f = 2Ax + b$):

$$\nabla F(\theta) = 2 \cdot \frac{1}{2}X^\top X\theta + (-X^\top y) = X^\top X\theta - X^\top y$$

---

### Solution — Step 2: Set gradient to zero (critical point)

$$\nabla F(\theta^*) = 0$$

$$X^\top X\theta^* - X^\top y = 0$$

$$X^\top X\theta^* = X^\top y$$

This is called the **normal equation**.

---

### Solution — Step 3: Solve for $\theta^*$

**Case 1:** If $X^\top X$ is **invertible** (all eigenvalues > 0):

$$\theta^* = (X^\top X)^{-1}X^\top y$$

**Case 2:** If $X^\top X$ is **not invertible** (some eigenvalue = 0):

The normal equation has infinitely many solutions. We pick the **minimum-norm** solution using the pseudoinverse: $\theta^* = X^\dagger y$.

---

### Solution — Step 4: Confirm it's a minimum (not a maximum or saddle)

The Hessian (second derivative matrix) is:

$$H = \nabla^2 F = X^\top X$$

**Is this PSD?** For any vector $v$:

$$v^\top X^\top X v = (Xv)^\top(Xv) = \|Xv\|^2 \geq 0$$

Since $H \succeq 0$ (positive semi-definite), $F$ is **convex** ✅

> **Key insight:** In a convex function, any critical point is automatically a **global minimum**. There are no saddle points or local maxima to worry about!

---

### Solution — Quick Numerical Example

Let $X = \begin{pmatrix} 1 & 1 \\ 1 & 2 \\ 1 & 3 \end{pmatrix}$, $y = \begin{pmatrix} 1 \\ 2 \\ 2 \end{pmatrix}$.

$$X^\top X = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix}, \quad X^\top y = \begin{pmatrix} 5 \\ 11 \end{pmatrix}$$

$$\theta^* = \begin{pmatrix} 3 & 6 \\ 6 & 14 \end{pmatrix}^{-1}\begin{pmatrix} 5 \\ 11 \end{pmatrix} = \frac{1}{6}\begin{pmatrix} 14 & -6 \\ -6 & 3 \end{pmatrix}\begin{pmatrix} 5 \\ 11 \end{pmatrix} = \begin{pmatrix} 2/3 \\ 1/2 \end{pmatrix}$$

The best-fit line is $y = 2/3 + (1/2)x$. ✅

> **Takeaway:** The minimum of the squared error is found by solving the normal equation. The Hessian being PSD guarantees it's a true minimum.
