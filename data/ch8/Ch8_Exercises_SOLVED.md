# 📝 Chapter 8 Exercises — SOLVED Step by Step

> Each exercise is solved like a tutor sitting next to you, explaining every single step.

---

## Exercise 33 — Grid World Value Iteration ⭐⭐

>
> **Question:** Consider a $3 \times 3$ grid with 4 actions (N, S, W, E). Transitions are deterministic; walking into a wall returns to the same state. Reward $= 1$ for stepping into the bottom-right square ($s_9$), $0$ otherwise. Discount $\gamma = 0.9$. (a) For policy $\pi$ = "always move right", calculate $V^\pi$. (b) Find $Q^*$ using Q-iteration.

### Solution — Setting Up the Grid

Let's label the states:

```
┌─────┬─────┬─────┐
│ s₁  │ s₂  │ s₃  │
├─────┼─────┼─────┤
│ s₄  │ s₅  │ s₆  │
├─────┼─────┼─────┤
│ s₇  │ s₈  │ s₉  │  ← s₉ is the GOAL (reward = 1)
└─────┴─────┴─────┘
```

**Transition rules:**
- Moving in a valid direction takes you to the next cell
- Moving into a wall keeps you in the same cell
- Reward $r(s, a) = 1$ only when the action takes you INTO $s_9$

**Who can reach $s_9$?**
- $s_6$ → move South → $s_9$ → reward 1
- $s_8$ → move East → $s_9$ → reward 1
- $s_9$ → any move → hits wall → stays at $s_9$ → reward 0 (only entering counts)

---

### Solution — Part (a): Policy Evaluation ($\pi$ = "always move right")

Under this policy, every state takes action "East":

| State | Action E goes to | Reward |
|-------|-----------------|--------|
| $s_1$ → $s_2$ | 0 |
| $s_2$ → $s_3$ | 0 |
| $s_3$ → $s_3$ (wall) | 0 |
| $s_4$ → $s_5$ | 0 |
| $s_5$ → $s_6$ | 0 |
| $s_6$ → $s_6$ (wall) | 0 |
| $s_7$ → $s_8$ | 0 |
| $s_8$ → $s_9$ | **1** |
| $s_9$ → $s_9$ (wall) | 0 |

Wait — under "always move right", $s_6$ moves right and hits a wall, staying at $s_6$ with reward 0 (not reward 1, because it doesn't enter $s_9$). Only $s_8$ → $s_9$ yields reward 1.

**Bellman equation under $\pi$:** $V^\pi(s) = r(s, \text{East}) + \gamma \cdot V^\pi(s')$

**States that can never reach $s_9$ under "always right":**
- $s_3 \to s_3 \to s_3 \to \ldots$ (stuck at wall forever) → $V^\pi(s_3) = 0$
- $s_6 \to s_6 \to s_6 \to \ldots$ (stuck at wall forever) → $V^\pi(s_6) = 0$
- $s_9 \to s_9 \to s_9 \to \ldots$ (stuck at wall forever) → $V^\pi(s_9) = 0$

**Working backwards from $s_8$:**

$$V^\pi(s_8) = 1 + 0.9 \cdot V^\pi(s_9) = 1 + 0.9 \cdot 0 = 1$$

$$V^\pi(s_7) = 0 + 0.9 \cdot V^\pi(s_8) = 0.9 \cdot 1 = 0.9$$

$$V^\pi(s_5) = 0 + 0.9 \cdot V^\pi(s_6) = 0.9 \cdot 0 = 0$$

$$V^\pi(s_4) = 0 + 0.9 \cdot V^\pi(s_5) = 0$$

$$V^\pi(s_2) = 0 + 0.9 \cdot V^\pi(s_3) = 0$$

$$V^\pi(s_1) = 0 + 0.9 \cdot V^\pi(s_2) = 0$$

**Value grid under $\pi$ = "always right":**

```
┌──────┬──────┬──────┐
│  0   │  0   │  0   │
├──────┼──────┼──────┤
│  0   │  0   │  0   │
├──────┼──────┼──────┤
│ 0.9  │  1   │  0   │
└──────┴──────┴──────┘
```

> **Insight:** This policy is terrible! Only the bottom row has any value. States $s_1$ through $s_6$ can never reach the goal by always going right — they either get stuck at walls or go away from the goal.

---

### Solution — Part (b): Finding $Q^*$ with Q-Iteration

**Q-iteration update:** $(T^*Q)(s, a) = r(s, a) + \gamma \max_{a'} Q(s', a')$

**Iteration 0:** $Q^{(0)}(s, a) = 0$ for all $(s, a)$.

**Iteration 1:** $Q^{(1)}(s, a) = r(s, a) + \gamma \max_{a'} Q^{(0)}(s', a') = r(s, a) + 0 = r(s, a)$

Only transitions INTO $s_9$ have reward 1:

| | North | South | West | East |
|---|---|---|---|---|
| $s_6$ | 0 | **1** | 0 | 0 |
| $s_8$ | 0 | 0 | 0 | **1** |
| Others | 0 | 0 | 0 | 0 |

**Iteration 2:** $Q^{(2)}(s, a) = r(s, a) + 0.9 \cdot \max_{a'} Q^{(1)}(s', a')$

Now states that lead to $s_6$ or $s_8$ (which have Q = 1) get value:

$$Q^{(2)}(s_3, \text{South}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_6, a') = 0.9 \cdot 1 = 0.9$$

$$Q^{(2)}(s_5, \text{East}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_6, a') = 0.9 \cdot 1 = 0.9$$

$$Q^{(2)}(s_5, \text{South}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_8, a') = 0.9 \cdot 1 = 0.9$$

$$Q^{(2)}(s_7, \text{East}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_8, a') = 0.9 \cdot 1 = 0.9$$

$$Q^{(2)}(s_9, \text{North}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_6, a') = 0.9 \cdot 1 = 0.9$$

$$Q^{(2)}(s_9, \text{West}) = 0 + 0.9 \cdot \max_{a'} Q^{(1)}(s_8, a') = 0.9 \cdot 1 = 0.9$$

Values propagate outward from the goal. Continue iterating until convergence.

> **Takeaway:** Q-iteration is like a "wave" spreading from the goal. At each iteration, states one step further away learn about the reward. After enough iterations, every state knows the optimal action (the one with highest Q-value).

---

---
<br><br><br><br><br><br>

## Exercise 34 — TD Learning and Q-Learning ⭐⭐

>
> **Question:** Same $3 \times 3$ grid. (1) Use TD learning to estimate $V^\pi$ for the policy that circles the boundary. (2) Use Q-learning with $\epsilon$-greedy ($\epsilon = 0.5$) to find the optimal policy.

### Solution — Part 1: TD Learning

**The policy $\pi$:** Circle the boundary — down $\times 2$, right $\times 2$, up $\times 2$, left $\times 2$, repeat.

**The trajectory:** $s_1 \to s_4 \to s_7 \to s_8 \to s_9 \to s_6 \to s_3 \to s_2 \to s_1 \to \ldots$

**TD update rule:**

$$V(S_t) \leftarrow V(S_t) + \alpha_t\left[\underbrace{R_{t+1} + \gamma V(S_{t+1})}_{\text{TD target}} - V(S_t)\right]$$

The "TD error" $\delta_t = R_{t+1} + \gamma V(S_{t+1}) - V(S_t)$ measures how surprised we are by the transition.

**Let's trace with $\alpha = 0.1$, $\gamma = 0.9$, all $V(s) = 0$ initially:**

**Step 1: $s_1 \to s_4$** (move South, $r = 0$)

$$V(s_1) \leftarrow 0 + 0.1[0 + 0.9 \cdot 0 - 0] = 0$$

No change — we haven't seen any reward yet.

**Step 2: $s_4 \to s_7$** (move South, $r = 0$)

$$V(s_4) \leftarrow 0 + 0.1[0 + 0.9 \cdot 0 - 0] = 0$$

**Step 3: $s_7 \to s_8$** (move East, $r = 0$)

$$V(s_7) \leftarrow 0 + 0.1[0 + 0.9 \cdot 0 - 0] = 0$$

**Step 4: $s_8 \to s_9$** (move East, $r = 1$ 🎉)

$$V(s_8) \leftarrow 0 + 0.1[1 + 0.9 \cdot 0 - 0] = 0.1$$

First non-zero value! The reward signal starts propagating.

**Step 5: $s_9 \to s_6$** (move North, $r = 0$)

$$V(s_9) \leftarrow 0 + 0.1[0 + 0.9 \cdot 0 - 0] = 0$$

Continue the loop...

**On the SECOND loop, Step 4 again: $s_8 \to s_9$**

$$V(s_8) \leftarrow 0.1 + 0.1[1 + 0.9 \cdot 0 - 0.1] = 0.1 + 0.1 \cdot 0.9 = 0.19$$

**And now Step 3 again: $s_7 \to s_8$**

$$V(s_7) \leftarrow 0 + 0.1[0 + 0.9 \cdot 0.19 - 0] = 0.0171$$

The value propagates backward from $s_8$!

> **Key insight:** TD learning is "online" — it updates after EVERY step, not waiting for the end of an episode. The reward signal at $s_8 \to s_9$ gradually propagates backward through $s_7, s_4, s_1, \ldots$ over many loops.

---

### Solution — Part 2: Q-Learning with $\epsilon$-Greedy

**Q-Learning update:**

$$Q(S_t, A_t) \leftarrow Q(S_t, A_t) + \alpha\left[R_{t+1} + \gamma \max_{a'} Q(S_{t+1}, a') - Q(S_t, A_t)\right]$$

**$\epsilon$-Greedy with $\epsilon = 0.5$:**
- With probability $0.5$: choose $\arg\max_a Q(s, a)$ (exploit best known action)
- With probability $0.5$: choose a **random** action (explore new actions)

**Key difference from TD:** Q-learning uses $\max_{a'}$ — it always evaluates the BEST possible next action, regardless of what the agent actually does. This makes it **off-policy**.

**What happens over many episodes:**

1. **Early training:** All $Q = 0$, so $\arg\max$ is random. Agent wanders randomly but occasionally stumbles into $s_9$ and gets reward.

2. **After some episodes:** $Q(s_8, \text{East})$ becomes positive. $Q(s_6, \text{South})$ becomes positive. The agent starts learning which actions lead to reward.

3. **Convergence:** The optimal policy emerges:

```
┌──────┬──────┬──────┐
│  →   │  →   │  ↓   │
├──────┼──────┼──────┤
│  →   │  →   │  ↓   │
├──────┼──────┼──────┤
│  →   │  →   │  ★   │
└──────┴──────┴──────┘

Optimal: always move toward s₉ (right and down)
```

> **Takeaway:** Q-learning discovers the optimal policy by trial and error, WITHOUT knowing the transition probabilities. The $\epsilon$-greedy strategy ensures the agent explores enough to find the reward, while gradually shifting to exploiting the best known actions.

---

---
<br><br><br><br><br><br>

## Exercise — Bellman Operator is a Contraction ⭐

>
> **Question:** Show that the Bellman optimality operator $T^*$ defined by $(T^*V)(s) = \max_a[r(s,a) + \gamma \sum_{s'} P(s'|s,a)V(s')]$ is a contraction with factor $\gamma$.

### Solution — Step 1: What we need to show

We need: $\|T^*V - T^*W\|_\infty \leq \gamma \|V - W\|_\infty$ for any two value functions $V$ and $W$.

Here $\|f\|_\infty = \max_s |f(s)|$ is the max-norm.

---

### Solution — Step 2: Use the "max" trick

For any state $s$, let $a_V^*$ be the action that achieves the max for $V$, and $a_W^*$ for $W$.

$$(T^*V)(s) = \max_a\left[r(s,a) + \gamma \sum_{s'} P(s'|s,a)V(s')\right]$$

$$(T^*W)(s) = \max_a\left[r(s,a) + \gamma \sum_{s'} P(s'|s,a)W(s')\right]$$

**Key inequality:** For any functions $f, g$: $|\max_a f(a) - \max_a g(a)| \leq \max_a |f(a) - g(a)|$

(The max of a difference is at least as large as the difference of the maxes.)

---

### Solution — Step 3: Apply the bound

$$|(T^*V)(s) - (T^*W)(s)| \leq \max_a \left|\gamma \sum_{s'} P(s'|s,a)[V(s') - W(s')]\right|$$

$$\leq \max_a \gamma \sum_{s'} P(s'|s,a) |V(s') - W(s')|$$

$$\leq \gamma \max_a \sum_{s'} P(s'|s,a) \|V - W\|_\infty$$

$$= \gamma \|V - W\|_\infty \cdot \underbrace{\sum_{s'} P(s'|s,a)}_{= 1}$$

$$= \gamma \|V - W\|_\infty$$

This holds for **every** state $s$, so:

$$\|T^*V - T^*W\|_\infty = \max_s |(T^*V)(s) - (T^*W)(s)| \leq \gamma \|V - W\|_\infty \quad \blacksquare$$

---

### Solution — Why this matters

Since $\gamma < 1$, the Bellman operator is a contraction. By the **Banach Fixed-Point Theorem**:

1. There exists a **unique** $V^*$ such that $T^*V^* = V^*$ (the optimal value function)
2. Starting from ANY initial $V_0$, iterating $V_{k+1} = T^*V_k$ converges to $V^*$
3. The error shrinks geometrically: $\|V_k - V^*\|_\infty \leq \gamma^k \|V_0 - V^*\|_\infty$

> **Takeaway:** The contraction property is WHY value iteration works. It guarantees convergence to the unique optimal solution regardless of initialization. The discount factor $\gamma$ controls both how much the agent values the future AND how fast the algorithm converges.
