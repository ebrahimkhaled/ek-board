# 📝 Mock Exam 2026 — Part 3 of 3

> **Exam:** Statistics for Artificial Intelligence II | **Module:** MAT00127M | **Time:** 3 hours | **Total:** 100 marks
> This is **Part 3** covering **Question 3** (38 marks). See Parts 1–2 for Q1–Q2.

---

## Question 3 — RL, Double Descent & Transformers [38 marks]

---

### 3(a)(i): Define a Markov Decision Process [3 marks]

>
> **Question:** Define a Markov Decision Process.

<!-- pencil -->
↳ **Strategy:** List all 5 components of the tuple, then state the Markov property.

**Definition:** An **MDP** is a tuple $(\mathcal{S}, \mathcal{A}, P, R, \gamma)$:

| Symbol | Name | Meaning |
|---|---|---|
| $\mathcal{S}$ | State space | Finite set of all possible states |
| $\mathcal{A}$ | Action space | Finite set of all possible actions |
| $P(s' \mid s, a)$ | Transition function | Probability of reaching $s'$ from $s$ via action $a$ |
| $R(s, a)$ | Reward function | Expected immediate reward for action $a$ in state $s$ |
| $\gamma \in (0,1)$ | Discount factor | How much we value future vs. immediate rewards |

**The Markov Property:**

$$P(S_{t+1} \mid S_t, A_t) = P(S_{t+1} \mid S_t, A_t, S_{t-1}, A_{t-1}, \ldots)$$

<!-- pencil -->
↳ "The future depends only on the present, not on how you got here." This is what makes MDPs computationally tractable — we don't need to store the entire history.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ All 5 components | ✅ Markov property equation | ✅ "Future depends only on present"

---
<br><br><br><br><br><br>

### 3(a)(ii): Define the value function $V^\pi(s)$ [2 marks]

>
> **Question:** Define the value function $V^\pi(s)$, where $\pi$ is a policy.

**Definition:** The **value function** under policy $\pi$ is the expected discounted cumulative reward starting from state $s$:

<!-- green -->
$$V^\pi(s) = \mathbb{E}_\pi\!\left[\sum_{t=0}^{\infty} \gamma^t R(S_t, A_t) \;\middle|\; S_0 = s\right]$$

where actions are chosen according to $A_t \sim \pi(\cdot \mid S_t)$.

<!-- pencil -->
↳ **Unpacking each symbol:**
- $\mathbb{E}_\pi$: average over ALL possible futures when following policy $\pi$
- $\gamma^t$: discounts rewards further in the future (reward at time $t=10$ is worth $\gamma^{10}$ times less than reward now)
- $S_0 = s$: we start from state $s$
- The sum goes to $\infty$ but converges because $\gamma < 1$

**Numerical example:** $R_0 = 10, R_1 = 5, R_2 = 3, \gamma = 0.9$:

$V = 10 + 0.9(5) + 0.81(3) = 10 + 4.5 + 2.43 = 16.93$

<!-- pencil -->
↳ Without discounting: $10+5+3=18$. The discount factor reduces future rewards.

> **Takeaway:** $V^\pi(s)$ answers: "If I'm at state $s$ and follow policy $\pi$ forever, what's my expected total (discounted) payoff?"

---
<br><br><br><br><br><br>

### 3(a)(iii): Bellman equation for $V^\pi$ [3 marks]

>
> **Question:** State the Bellman equation for $V^\pi$.

<!-- pencil -->
↳ **Strategy:** Decompose the infinite sum into "immediate reward + discounted future."

**The Bellman Equation:**

<!-- green -->
$$V^\pi(s) = \sum_{a}\pi(a \mid s)\left[R(s,a) + \gamma \sum_{s'} P(s' \mid s, a)\, V^\pi(s')\right]$$

for all $s \in \mathcal{S}$.

**Step-by-step breakdown:**

1. **Choose action $a$** with probability $\pi(a \mid s)$
2. **Collect immediate reward** $R(s, a)$
3. **Transition** to next state $s'$ with probability $P(s' \mid s, a)$
4. **From $s'$, the future value** is $V^\pi(s')$ — this is the recursive part!
5. **Discount** the future by $\gamma$
6. **Average** over all possible actions and next states

<!-- pencil -->
↳ **Why is this powerful?** It converts an infinite-horizon problem (sum to $\infty$) into a system of $|\mathcal{S}|$ simultaneous equations. Each equation relates one state's value to its neighbours' values.

---

<!-- red -->
↳ **Exam warning:** Write the FULL form with both $\sum_a$ and $\sum_{s'}$. Don't abbreviate! Mention it's **recursive**.

> **Takeaway:** Bellman equation = "value of here = immediate reward + discounted value of where I go next."

---
<br><br><br><br><br><br>

### 3(b)(i): TD update rule [3 marks]

>
> **Question:** Write down the TD update rule.

<!-- pencil -->
↳ **Strategy:** TD(0) learns the value function from experience, one step at a time, without knowing the transition model.

**The TD(0) update rule:**

<!-- green -->
$$V(S_t) \leftarrow V(S_t) + \alpha\bigl[\underbrace{R_t + \gamma V(S_{t+1})}_{\text{TD target}} - V(S_t)\bigr]$$

where $\alpha \in (0,1)$ is the learning rate.

**Dissecting each component:**

| Component | Formula | Meaning |
|---|---|---|
| **Old estimate** | $V(S_t)$ | What we currently think state $S_t$ is worth |
| **TD target** | $R_t + \gamma V(S_{t+1})$ | What we NOW think it's worth (observed reward + estimated future) |
| **TD error** $\delta_t$ | $R_t + \gamma V(S_{t+1}) - V(S_t)$ | How surprised we are — the "correction signal" |
| **Learning rate** $\alpha$ | $\alpha \in (0,1)$ | How much we trust the new evidence vs. old belief |

<!-- pencil -->
↳ **The update in plain English:** "Adjust your estimate of $S_t$ a little bit ($\alpha$) in the direction of the surprise ($\delta_t$)."

- $\delta_t > 0$: reality was better than expected → increase $V(S_t)$
- $\delta_t < 0$: reality was worse than expected → decrease $V(S_t)$
- $\delta_t = 0$: prediction was perfect → no change

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Update formula | ✅ TD target identified | ✅ TD error $\delta_t$ defined | ✅ Learning rate $\alpha$

> **Takeaway:** TD learns by "bootstrapping" — it updates its estimate using another estimate ($V(S_{t+1})$), not the true future return. This is what makes it fast but also introduces some bias.

---
<br><br><br><br><br><br>

### 3(b)(ii): TD vs. Bellman iteration [3 marks]

>
> **Question:** When would you use TD instead of iterating the Bellman equation?

<!-- pencil -->
↳ **Strategy:** Three key scenarios where Bellman is impossible but TD works.

**Use TD learning when:**

**1. The model is unknown (model-free setting)**

<!-- pencil -->
↳ The Bellman equation requires knowing $P(s' \mid s, a)$ — the full transition model. In most real-world problems (robotics, games, trading), you DON'T know $P$. TD learns directly from observed transitions $(S_t, R_t, S_{t+1})$ without ever needing $P$.

**2. The state space is enormous**

<!-- pencil -->
↳ The Bellman equation requires solving a system of $|\mathcal{S}|$ equations simultaneously. For chess ($|\mathcal{S}| \approx 10^{47}$), this is physically impossible. TD updates one state at a time, scaling gracefully.

**3. You want online learning**

<!-- pencil -->
↳ TD updates after EVERY single transition — you learn while acting. Bellman iteration requires a full sweep over all states before making any update. TD is like learning from each step of a walk; Bellman is like needing to walk the entire route before learning anything.

---

| | Bellman Iteration | TD Learning |
|---|---|---|
| Needs model $P$? | ✅ Yes | ❌ No |
| Scales to large $\mathcal{S}$? | ❌ No | ✅ Yes |
| Online learning? | ❌ No (batch) | ✅ Yes (per step) |
| Exact solution? | ✅ Yes (given $P$) | Approximate (converges asymptotically) |

> **Takeaway:** TD is for the real world where you learn by doing; Bellman is for the theoretical world where you know all the rules in advance.

---
<br><br><br><br><br><br>

### 3(b)(iii): Finding an optimal policy [5 marks]

>
> **Question:** Describe one method to find an optimal policy.

<!-- pencil -->
↳ **Strategy:** Present Q-Learning — the most famous off-policy TD control algorithm.

**Q-Learning (off-policy TD control):**

**Core idea:** Learn the optimal action-value function $Q^*(s,a)$ directly, without needing a model of the environment.

**The Q-Learning update rule:**

<!-- green -->
$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\bigl[R_t + \gamma \max_{a'} Q(S_{t+1}, a') - Q(S_t, A_t)\bigr]$$

<!-- pencil -->
↳ **The key difference from TD:** instead of $V(S_{t+1})$, we use $\max_{a'} Q(S_{t+1}, a')$. This assumes we'll play OPTIMALLY from the next state onward — regardless of what policy we're actually following now.

**The Algorithm:**

1. **Initialise** $Q(s,a)$ arbitrarily for all $(s,a)$ pairs

2. **For each episode:**
   - Observe state $S_t$
   - Choose action $A_t$ using $\varepsilon$-greedy:
     - With probability $\varepsilon$: random action (exploration)
     - With probability $1 - \varepsilon$: $\arg\max_a Q(S_t, a)$ (exploitation)
   - Observe reward $R_t$ and next state $S_{t+1}$
   - Apply the update rule above

3. **Extract optimal policy:** $\pi^*(s) = \arg\max_a Q(s,a)$

**Convergence conditions:**
1. All state-action pairs $(s,a)$ must be visited infinitely often
2. Learning rate $\alpha_t$ must decay (e.g., $\sum \alpha_t = \infty$, $\sum \alpha_t^2 < \infty$)

<!-- pencil -->
↳ **Why "off-policy"?** The exploration policy (e.g., $\varepsilon$-greedy) can be different from the target policy ($\arg\max Q$). The agent explores randomly but learns the OPTIMAL strategy.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Q-Learning update with $\max_{a'}$ | ✅ Algorithm steps | ✅ $\varepsilon$-greedy exploration | ✅ Convergence conditions | ✅ Extract $\pi^* = \arg\max Q$

> **Takeaway:** Q-Learning separates "how I explore" from "what I learn." Even if the agent takes random actions, it learns the optimal strategy because the $\max$ in the update always targets the best possible future.

---
<br><br><br><br><br><br>

### 3(c): Function approximation challenges in RL [6 marks]

>
> **Question:** Discuss challenges that arise when using function approximation (e.g. neural networks) in reinforcement learning. Give at least two distinct issues.

<!-- pencil -->
↳ **Strategy:** Present the three major challenges that arise when neural networks meet RL.

**Challenge 1: The Deadly Triad — Instability & Divergence**

Combining three ingredients simultaneously can cause the value function to **diverge** (grow to infinity):

1. **Function approximation** (neural network instead of table)
2. **Bootstrapping** (TD: using $V(S_{t+1})$ to update $V(S_t)$)
3. **Off-policy learning** (learning about $\pi^*$ while following $\varepsilon$-greedy)

<!-- pencil -->
↳ **Why does this happen?** The function approximator generalises: updating $V(S_t)$ also changes $V(S_{t+1})$ (since they share weights $\theta$). This can amplify errors — a small overestimate at $S_{t+1}$ propagates back and inflates $S_t$, which then inflates other states, creating a runaway feedback loop.

**In tabular Q-learning, each state's value is independent.** With neural nets, they're all coupled through the shared weights.

---

**Challenge 2: Non-stationary Targets (Moving Target Problem)**

The TD target $R_t + \gamma \max_{a'} Q_\theta(S_{t+1}, a')$ depends on the same parameters $\theta$ being optimised.

<!-- pencil -->
↳ **Analogy:** Imagine trying to hit a bullseye, but every time you adjust your aim, the target moves. In supervised learning, the labels are fixed. In deep RL, the "labels" (TD targets) change as the network learns — creating instability.

**Mitigation:** Use a **target network** $\theta^-$ (frozen copy of $\theta$, updated periodically). Compute targets using $\theta^-$ while training $\theta$.

---

**Challenge 3: Correlated Samples**

Sequential RL data violates the i.i.d. assumption of SGD:
- State $S_t$ and $S_{t+1}$ are nearly identical (consecutive video frames, adjacent board positions)
- The network overfits to recent experiences and forgets earlier lessons (**catastrophic forgetting**)

<!-- pencil -->
↳ **Why is correlation bad for SGD?** SGD assumes each gradient sample is independent. Correlated samples bias the gradient — the network keeps optimising for the current region of the state space and "forgets" others.

**Mitigation:** **Experience replay** — store transitions in a buffer, sample randomly for training. This breaks temporal correlation.

---

<!-- green -->
**Summary of challenges and solutions:**

| Challenge | Cause | Solution |
|---|---|---|
| Deadly triad | Approximation + bootstrap + off-policy | Careful algorithm design (e.g., DQN) |
| Moving targets | Targets depend on $\theta$ | Target networks $\theta^-$ |
| Correlated samples | Sequential data | Experience replay buffer |

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Deadly triad (3 components) | ✅ Divergence | ✅ Moving targets | ✅ Correlated samples | ✅ Experience replay | ✅ Target networks

> **Takeaway:** Deep RL = RL + Deep Learning, but combining them creates unique instabilities. DQN (2015) solved these with two tricks: experience replay (break correlation) + target networks (stabilise targets).

---
<br><br><br><br><br><br>

### 3(d): Double Descent Phenomenon [5 marks]

>
> **Question:** Explain the double descent phenomenon and contrast it with the classical bias-variance trade-off.

<!-- pencil -->
↳ **Strategy:** First explain the classical U-curve, then show how double descent breaks it.

**Part 1: Classical Bias-Variance Trade-off (the U-curve)**

As model complexity increases:
- **Bias decreases** (model fits training data better)
- **Variance increases** (model becomes sensitive to noise)
- **Test error** forms a U-shape: first decreasing, then increasing

<!-- pencil -->
↳ The "sweet spot" is the bottom of the U — the model that balances underfitting and overfitting.

---

**Part 2: Double Descent — Breaking the Classical Theory**

The double descent phenomenon shows that the U-curve is INCOMPLETE. Beyond the classical regime, something unexpected happens:

**Phase 1: Under-parameterised regime** (classical)

- Model has fewer parameters than data points ($p < n$)
- Follows the classical U-curve
- Increasing complexity reduces test error... up to a point

**Phase 2: Interpolation threshold** ($p \approx n$)

- Model has JUST enough parameters to perfectly fit training data
- Test error **spikes** to a peak! The model is forced to memorise every data point including noise, but has no "room to manoeuvre"

<!-- pencil -->
↳ **Analogy:** like fitting a polynomial of degree exactly $n-1$ through $n$ points — it passes through every point but oscillates wildly between them.

**Phase 3: Over-parameterised regime** ($p \gg n$)

- Model has FAR more parameters than data points
- Test error **decreases again**! More parameters → many possible interpolating solutions → gradient descent finds smooth ones

<!-- pencil -->
↳ **Why does more complexity HELP?** With vastly more parameters than data, there are infinitely many perfect-fit solutions. SGD/gradient descent naturally selects the "simplest" (minimum norm) solution, which tends to generalise well.

---

<!-- green -->
**The double descent test error curve:**

$$\text{Test Error: } \searrow \text{ (classical)} \nearrow \text{ (peak at } p \approx n \text{)} \searrow \text{ (second descent)}$$

| Regime | Parameters vs Data | Test Error | Why? |
|---|---|---|---|
| Under-parameterised | $p < n$ | Classical U-curve | Bias-variance trade-off |
| Interpolation threshold | $p \approx n$ | **Peak** (worst!) | Forced memorisation, no flexibility |
| Over-parameterised | $p \gg n$ | **Decreases again** | Many solutions → SGD picks smooth one |

---

**Key contrast with classical theory:**

- **Classical:** "Don't make the model too complex" → monotonic increase after optimum
- **Double descent:** "If you've gone too far, go MUCH further" → error drops again

<!-- pencil -->
↳ This is observed in neural networks, random forests, kernel methods, and even linear regression!

---

<!-- red -->
↳ **Exam tip:** DRAW THE CURVE. Plot $x$-axis = model complexity, $y$-axis = test error. Show: descent → peak at interpolation threshold → second descent. Label all three phases.

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Classical U-curve | ✅ Interpolation threshold | ✅ Three phases | ✅ Second descent in over-parameterised regime | ✅ "More parameters can help"

> **Takeaway:** The classical "don't overfit" wisdom is incomplete. In modern deep learning, making models much bigger than the data can actually improve generalisation — as long as you go far enough past the dangerous interpolation threshold.

---
<br><br><br><br><br><br>

### 3(e): Attention Mechanism in Transformers [5 marks]

>
> **Question:** Explain the attention mechanism in transformers. What are queries, keys, and values?

<!-- pencil -->
↳ **Strategy:** Define Q, K, V with intuition, then show the scaled dot-product formula step by step.

**Setup:** Given input embeddings $X \in \mathbb{R}^{n \times d}$ (sequence of $n$ tokens, each $d$-dimensional):

$$Q = XW_Q, \quad K = XW_K, \quad V = XW_V$$

where $W_Q, W_K \in \mathbb{R}^{d \times d_k}$ and $W_V \in \mathbb{R}^{d \times d_v}$ are **learned** projection matrices.

---

**Intuition for Q, K, V:**

| Component | Symbol | Question it answers | Analogy |
|---|---|---|---|
| **Query** | $Q$ | "What am I looking for?" | Your search query on Google |
| **Key** | $K$ | "What do I contain?" | The title/tags of each webpage |
| **Value** | $V$ | "What information do I provide?" | The actual content of the webpage |

<!-- pencil -->
↳ Each token generates all three: a query (what it needs), a key (what it offers), and a value (its actual content). Attention = matching queries to keys to decide which values to aggregate.

---

**Scaled Dot-Product Attention (4-step computation):**

<!-- green -->
$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

**Step 1:** Compute similarity scores: $QK^\top \in \mathbb{R}^{n \times n}$

<!-- pencil -->
↳ Entry $(i,j)$ = dot product of token $i$'s query with token $j$'s key = "how relevant is token $j$ to token $i$?"

**Step 2:** Scale by $\frac{1}{\sqrt{d_k}}$

<!-- pencil -->
↳ Without scaling, dot products grow proportionally to $d_k$, pushing softmax into saturation (near 0 or 1 outputs, tiny gradients). Dividing by $\sqrt{d_k}$ keeps values in a range where softmax has useful gradients.

**Step 3:** Apply softmax row-wise → attention weights $\in [0,1]$, each row sums to 1

<!-- pencil -->
↳ Converts raw scores into a probability distribution. High-scoring keys get most of the attention weight.

**Step 4:** Multiply weights by $V$ → weighted combination of values

<!-- pencil -->
↳ Each token's output is a weighted average of ALL other tokens' values, where the weights reflect relevance.

---

**Concrete example** (3 tokens):

If softmax gives attention weights for token 1: $(0.7, 0.2, 0.1)$

Then token 1's output = $0.7 \cdot V_1 + 0.2 \cdot V_2 + 0.1 \cdot V_3$

<!-- pencil -->
↳ Token 1 "pays attention" mostly to itself (70%), a bit to token 2 (20%), and barely to token 3 (10%).

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Q, K, V definitions with projection matrices | ✅ Scaled dot-product formula | ✅ Scaling by $\sqrt{d_k}$ (prevent saturation) | ✅ Softmax for weights | ✅ Weighted sum of values

> **Takeaway:** Attention lets every token "look at" the entire sequence and selectively extract information from relevant tokens. This is why Transformers excel at capturing long-range dependencies — unlike RNNs, they don't suffer from vanishing gradients over long distances.

---
<br><br><br><br><br><br>

### 3(f): The Stochastic Parrot Argument [3 marks]

>
> **Question:** Explain the stochastic parrot argument.

<!-- pencil -->
↳ **Strategy:** State the core claim (Bender et al., 2021), then list the key points and risks.

**The Core Claim:**

The "stochastic parrot" argument (Bender et al., 2021) asserts that large language models (LLMs) are fundamentally **pattern-matching systems** that produce statistically plausible text **without genuine understanding**.

---

**Three key points:**

**1. Pattern matching, not comprehension**

LLMs learn to predict the next token based on distributional patterns in massive training corpora. They are "stochastic parrots" — they **repeat** learned statistical patterns without any grounding in real-world experience or meaning.

<!-- pencil -->
↳ The model knows that "The capital of France is ___" should be completed with "Paris" not because it understands geography, but because "Paris" follows that phrase most frequently in its training data.

**2. Illusion of understanding**

The fluency and coherence of LLM outputs creates a convincing **illusion of comprehension** in human observers. The text reads as if the model "knows" and "understands," but there is no internal representation of meaning — only token statistics.

**3. Real-world risks**

- **Bias amplification:** Training data contains human biases (racial, gender, cultural) → the model reproduces and amplifies them
- **Hallucination:** Can generate plausible-sounding but factually incorrect statements
- **Environmental cost:** Training large models requires enormous computational resources and energy

---

<!-- pencil -->
↳ 📋 **Exam Keyword Checklist:** ✅ Bender et al. 2021 | ✅ Pattern matching without understanding | ✅ Illusion of comprehension | ✅ Bias amplification | ✅ Hallucination | ✅ Environmental cost

> **Takeaway:** The stochastic parrot argument is a critical perspective: no matter how impressive LLM outputs appear, the model has no understanding of truth, no real-world grounding, and can confidently generate dangerous misinformation. It's a statistical mirror, not a thinking mind.

---

**End of Part 3 — Question 3 Complete! ✅**

> 🎉 **All 3 Parts Complete.** The full Mock Exam 2026 study guide covers all 19 sub-questions with deep step-by-step solutions.
