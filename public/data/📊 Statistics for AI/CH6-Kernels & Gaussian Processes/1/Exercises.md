# 📝 Chapter 6 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise — Kernel Regression: Solve for $a$ ⭐⭐

>
> **Question:** Given the regularized kernel regression objective $R_n(h) = \frac{1}{2n}\sum_{i=1}^n(Y_i - h(X_i))^2 + \lambda\|h\|_{\mathcal{H}}^2$, and using the Representer Theorem $h(x) = \sum_{i=1}^n a_i k(X_i, x)$, show that the optimal $a = (K + 2\lambda n I)^{-1}Y$ where $K$ is the kernel matrix.

### Solution — Step 1: Rewrite the objective in matrix form

By the **Representer Theorem**, we know $h(x) = \sum_{i=1}^n a_i k(X_i, x)$. This means:

$$h(X_j) = \sum_{i=1}^n a_i k(X_i, X_j) = (Ka)_j$$

So the vector of predictions is $\hat{Y} = Ka$ where $K_{ij} = k(X_i, X_j)$.

Also, the RKHS norm is $\|h\|_{\mathcal{H}}^2 = a^\top K a$.

The objective becomes:

$$R_n(a) = \frac{1}{2n}\|Y - Ka\|^2 + \lambda \cdot a^\top K a$$

---

### Solution — Step 2: Expand the squared term

$$R_n(a) = \frac{1}{2n}(Y - Ka)^\top(Y - Ka) + \lambda \cdot a^\top Ka$$

$$= \frac{1}{2n}\left[Y^\top Y - 2Y^\top Ka + a^\top K^\top Ka\right] + \lambda \cdot a^\top Ka$$

Since $K$ is symmetric ($K^\top = K$), we have $K^\top K = K^2$:

$$= \frac{1}{2n}\left[Y^\top Y - 2Y^\top Ka + a^\top K^2 a\right] + \lambda \cdot a^\top Ka$$

---

### Solution — Step 3: Take the gradient with respect to $a$

$$\nabla_a R_n = \frac{1}{2n}\left[-2KY + 2K^2 a\right] + 2\lambda Ka$$

$$= \frac{1}{n}\left[-KY + K^2 a\right] + 2\lambda Ka$$

$$= \frac{1}{n}\left[-KY + K^2 a + 2\lambda n Ka\right]$$

$$= \frac{1}{n}K\left[-Y + Ka + 2\lambda n a\right]$$

$$= \frac{1}{n}K\left[(K + 2\lambda n I)a - Y\right]$$

---

### Solution — Step 4: Set gradient to zero and solve

$$\nabla_a R_n = 0$$

$$K\left[(K + 2\lambda n I)a - Y\right] = 0$$

This means either $K = 0$ (trivially no data) or:

$$(K + 2\lambda n I)a = Y$$

$$\boxed{a = (K + 2\lambda n I)^{-1}Y}$$

---

### Solution — Step 5: Why is $(K + 2\lambda n I)$ always invertible?

$K$ is PSD (positive semi-definite) because it's a kernel matrix. All its eigenvalues $\mu_i \geq 0$.

Adding $2\lambda n I$ shifts every eigenvalue to $\mu_i + 2\lambda n > 0$ (since $\lambda > 0$).

So $K + 2\lambda n I$ is **positive definite** → always invertible ✅

> **Key insight:** The regularization $\lambda$ doesn't just prevent overfitting — it also guarantees the system is solvable! Without $\lambda$, the kernel matrix might be singular, making the inverse undefined.

---

### Solution — Step 6: Making predictions

Once we have $a$, the prediction at any new point $x^*$ is:

$$h(x^*) = \sum_{i=1}^n a_i k(X_i, x^*) = k(x^*, X)^\top a = k(x^*, X)^\top (K + 2\lambda n I)^{-1}Y$$

This is a **weighted average** of the training labels $Y$, where the weights depend on how "similar" $x^*$ is to each training point (measured by the kernel $k$).

> **Takeaway:** Kernel regression is like "smart weighted averaging." The kernel measures similarity, $\lambda$ controls smoothness, and the Representer Theorem guarantees the solution lives in a finite-dimensional space despite the potentially infinite-dimensional RKHS.

---

---
<br><br><br><br><br><br>

## Exercise — Prove that the Gaussian Kernel is PSD ⭐

>
> **Question:** Show that the Gaussian (RBF) kernel $k(x, y) = \exp(-\ell\|x - y\|^2)$ is positive semi-definite.

### Solution — Strategy

We'll show that $k(x, y) = \varphi(x)^\top\varphi(y)$ for some (infinite-dimensional) feature map $\varphi$. Any such inner product is automatically PSD.

---

### Solution — Step 1: Expand the exponent

$$k(x, y) = \exp(-\ell\|x-y\|^2) = \exp\left(-\ell(\|x\|^2 - 2x^\top y + \|y\|^2)\right)$$

$$= \underbrace{\exp(-\ell\|x\|^2)}_{g(x)} \cdot \exp(2\ell \cdot x^\top y) \cdot \underbrace{\exp(-\ell\|y\|^2)}_{g(y)}$$

---

### Solution — Step 2: Expand the middle term using Taylor series

$$\exp(2\ell \cdot x^\top y) = \sum_{k=0}^{\infty} \frac{(2\ell)^k}{k!}(x^\top y)^k$$

Each term $(x^\top y)^k$ is a **polynomial kernel** of degree $k$, which is PSD (proved by induction: products and sums of PSD kernels are PSD).

---

### Solution — Step 3: Combine

$$k(x,y) = g(x) \cdot g(y) \cdot \sum_{k=0}^{\infty} \frac{(2\ell)^k}{k!}(x^\top y)^k$$

This is a product of:
- $g(x) \cdot g(y)$: this just rescales → preserves PSD
- An infinite sum of PSD kernels with positive coefficients → PSD (sums of PSD kernels with non-negative weights are PSD)

Therefore $k(x,y)$ is PSD. $\blacksquare$

> **Key insight:** The Gaussian kernel corresponds to an **infinite-dimensional** feature map. That's its superpower — it can represent any smooth function, not just polynomials. The kernel trick lets us work in this infinite space without ever computing $\varphi(x)$ explicitly.

---

---
<br><br><br><br><br><br>

## Exercise — GP Posterior Prediction ⭐

>
> **Question:** Given training data $(X, Y)$ and a GP prior with kernel $k$ and noise $\sigma^2$, write the posterior mean $\mu(x^*)$ and variance $\sigma^2(x^*)$ at a new point $x^*$. Explain what happens to the variance near and far from training data.

### Solution — The GP Posterior Formulas

**Mean (prediction):**

$$\mu(x^*) = k(x^*, X)(K + \sigma^2 I)^{-1}Y$$

**Variance (uncertainty):**

$$\sigma^2(x^*) = k(x^*, x^*) - k(x^*, X)(K + \sigma^2 I)^{-1}k(X, x^*)$$

where:
- $k(x^*, X)$ is the $1 \times n$ vector of kernel evaluations between $x^*$ and each training point
- $K$ is the $n \times n$ kernel matrix: $K_{ij} = k(X_i, X_j)$
- $\sigma^2$ is the observation noise variance

---

### Solution — Near Training Data

When $x^*$ is **close** to a training point $X_i$:

- $k(x^*, X_i)$ is **large** (Gaussian kernel peaks at distance 0)
- The vector $k(x^*, X)$ closely matches row $i$ of $K$
- The subtracted term $k(x^*, X)(K + \sigma^2 I)^{-1}k(X, x^*)$ is **large**
- So $\sigma^2(x^*)$ is **small** → **high confidence** ✅

When $x^* = X_i$ exactly: $\sigma^2(x^*) \approx \sigma^2$ (just the noise level).

---

### Solution — Far from Training Data

When $x^*$ is **far** from all training points:

- $k(x^*, X_i) \approx 0$ for all $i$ (Gaussian kernel decays to 0)
- The vector $k(x^*, X) \approx \mathbf{0}$
- The subtracted term $\approx 0$
- So $\sigma^2(x^*) \approx k(x^*, x^*) = 1$ → **maximum uncertainty** ❌

> **Takeaway:** A GP is honest about what it doesn't know. Near your data, it gives confident predictions (low variance). Far from your data, it admits uncertainty (high variance). This makes GPs ideal for scientific applications where knowing "how sure am I?" is as important as the prediction itself.
