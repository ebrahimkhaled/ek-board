# 📝 Chapter 5 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise — Bias-Variance Decomposition ⭐⭐

>
> **Question:** For a linear estimator $\hat{\beta} = (X^\top X)^{-1}X^\top Y$ where $Y = X\beta^* + \epsilon$ with $\epsilon \sim \mathcal{N}(0, \sigma^2 I)$, compute the bias and variance. Is this estimator biased?

### Solution — Step 1: Substitute $Y$ into $\hat{\beta}$

$$\hat{\beta} = (X^\top X)^{-1}X^\top Y = (X^\top X)^{-1}X^\top(X\beta^* + \epsilon)$$

$$= \underbrace{(X^\top X)^{-1}X^\top X}_{= I}\beta^* + (X^\top X)^{-1}X^\top\epsilon$$

$$= \beta^* + (X^\top X)^{-1}X^\top\epsilon$$

---

### Solution — Step 2: Compute the Bias

$$\text{Bias} = \mathbb{E}[\hat{\beta}] - \beta^*$$

$$\mathbb{E}[\hat{\beta}] = \beta^* + (X^\top X)^{-1}X^\top\underbrace{\mathbb{E}[\epsilon]}_{= 0} = \beta^*$$

$$\text{Bias} = \beta^* - \beta^* = 0 \quad \checkmark$$

✅ **The OLS estimator is unbiased!** On average, it hits the true $\beta^*$ perfectly.

---

### Solution — Step 3: Compute the Variance

$$\text{Cov}(\hat{\beta}) = \text{Cov}\left((X^\top X)^{-1}X^\top\epsilon\right)$$

Using the rule $\text{Cov}(Mz) = M \cdot \text{Cov}(z) \cdot M^\top$ with $M = (X^\top X)^{-1}X^\top$:

$$= (X^\top X)^{-1}X^\top \cdot \underbrace{\text{Cov}(\epsilon)}_{= \sigma^2 I} \cdot X(X^\top X)^{-1}$$

$$= \sigma^2 (X^\top X)^{-1}\underbrace{X^\top X (X^\top X)^{-1}}_{= I} = \sigma^2 (X^\top X)^{-1}$$

The **total variance** (trace):

$$\text{Variance} = \text{tr}(\text{Cov}(\hat{\beta}) \cdot \Sigma) = \sigma^2 \text{tr}((X^\top X)^{-1}\Sigma)$$

> **Key insight:** More data ($n$ larger) → $X^\top X$ grows → $(X^\top X)^{-1}$ shrinks → variance decreases. This is the "law of large numbers" in action!

---

### Solution — The Bias-Variance Tradeoff Table

| | OLS (unregularized) | Ridge ($\lambda > 0$) |
|---|---|---|
| **Bias** | $0$ ✅ | $> 0$ (some bias introduced) |
| **Variance** | $\sigma^2(X^\top X)^{-1}$ (can be large) | Reduced by $\lambda$ |
| **Total error** | All variance, no bias | Trades bias for lower variance |

> **Takeaway:** OLS is perfectly unbiased but can have high variance (especially with few data points or correlated features). Ridge regression intentionally adds bias to dramatically reduce variance — often giving lower total error.

---

---
<br><br><br><br><br><br>

## Exercise — Rademacher Complexity Bound ⭐

>
> **Question:** State the generalization bound using Rademacher complexity. Then explain in plain words what each term means and why a more complex model leads to worse bounds.

### Solution — The Generalization Bound

With probability $\geq 1 - \delta$:

$$\underbrace{R(f)}_{\text{true error}} \leq \underbrace{R_n(f)}_{\text{training error}} + \underbrace{\frac{1}{2}\mathcal{R}_n(\mathcal{F})}_{\text{complexity penalty}} + \underbrace{\sqrt{\frac{32\log(4/\delta)}{n}}}_{\text{statistical noise}}$$

---

### Solution — What each term means

**Term 1: $R(f)$ — True Risk (what we WANT to minimize)**

This is how well $f$ performs on **all possible data** — including data we've never seen. We can never compute this directly; we can only bound it.

**Term 2: $R_n(f)$ — Empirical Risk (what we CAN compute)**

This is the average loss on our $n$ training samples. A good model makes this small, but making it TOO small is dangerous (overfitting).

**Term 3: $\frac{1}{2}\mathcal{R}_n(\mathcal{F})$ — Rademacher Complexity (model complexity)**

This measures: "How well can the best function in $\mathcal{F}$ fit **random noise**?"

$$\mathcal{R}_n(\mathcal{F}) = \frac{2}{n}\mathbb{E}\left[\sup_{f \in \mathcal{F}} \left|\sum_{i=1}^n r_i f(X_i)\right|\right]$$

where $r_i = \pm 1$ randomly.

- **Simple model** (e.g., linear): can't fit random noise well → $\mathcal{R}_n$ is small ✅
- **Complex model** (e.g., degree-100 polynomial): can fit almost anything → $\mathcal{R}_n$ is large ❌

**Term 4: $\sqrt{32\log(4/\delta)/n}$ — Statistical Noise**

This shrinks as $n$ grows. With more data, the bound becomes tighter. Choosing $\delta$ smaller (higher confidence) makes this term larger.

---

### Solution — Why complex models have worse bounds

As the model class $\mathcal{F}$ gets more complex:

1. $R_n(f)$ **decreases** (complex models can fit training data better)
2. $\mathcal{R}_n(\mathcal{F})$ **increases** (complex models can also fit random noise)
3. The bound becomes **looser** — we can't guarantee the model generalizes

This is the **bias-variance tradeoff** expressed through Rademacher complexity.

> **Takeaway:** The generalization bound says: "Your true error is at most your training error + a penalty for model complexity + a statistical noise term." This is why we regularize — to keep the complexity term small.

---

---
<br><br><br><br><br><br>

## Exercise — Double Descent and Lemma 11 ⭐

>
> **Question:** What is Lemma 11 (minimum-norm interpolation)? Why does it explain the "benign overfitting" phenomenon in double descent?

### Solution — Lemma 11: What GD Actually Finds

**Lemma 11.** Gradient descent initialized at $\beta_0 = 0$, applied to $F(\beta) = \frac{1}{2n}\|X\beta - Y\|^2$, converges to:

$$\hat{\beta} = X^\top(XX^\top)^{-1}Y = X^\dagger Y$$

This is the **minimum-norm interpolator**: among ALL solutions that perfectly fit the training data ($X\hat{\beta} = Y$), GD picks the one with the **smallest $\|\hat{\beta}\|$**.

---

### Solution — Why does this explain double descent?

**Classical regime** ($p < n$, fewer parameters than data): The model CAN'T fit training data perfectly → must generalize → test error follows the classic U-curve.

**Interpolation threshold** ($p \approx n$): The model BARELY fits training data → it's forced to use extreme parameter values → **test error spikes** dramatically.

**Overparameterized regime** ($p \gg n$): There are MANY solutions that fit the data perfectly. But Lemma 11 says GD picks the **simplest** one (minimum norm). This acts as **implicit regularization**, and the resulting model is smooth enough to generalize well → **test error goes back down**.

$$\text{Test Error} = \underbrace{\text{low in classical}}_{\text{good generalization}} \to \underbrace{\text{spike at } p \approx n}_{\text{interpolation threshold}} \to \underbrace{\text{low again for } p \gg n}_{\text{benign overfitting}}$$

> **Key insight:** Double descent isn't magic — it's the consequence of GD's implicit bias toward simple solutions. Even when a model CAN memorize the data, GD CHOOSES not to use extreme parameters, finding the "smoothest" interpolation instead.
