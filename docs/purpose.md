# Purpose

This repository is a **step-by-step shell for learning machine learning**,
using a virtual two-wheeled robot on an HTML canvas as the subject.

Instead of starting from an abstract dataset, you start from a concrete,
watchable problem: a simulated [Bit:Bot PRO–style](https://n00b.no/products/bitbot-pro-for-micro-bit)
robot that must follow a coloured path printed on a virtual A2 sheet. The
simulator, the robot physics, and the sensors are all provided and stay fixed —
the part you replace, step by step, is the **brain**.

## The learning path

A path-finding robot is a *sequential decision* problem, not a dataset
problem, so the curriculum is built around **learning as optimisation**: one
score function is the teacher, and every step tries to beat the score of the
step before it. Each step lives in its own folder with instructions, a
`workshop.ts` skeleton full of TODOs, and a `solved.ts` reference — all
algorithms written by hand, no ML library.

| Step | Lesson |
| --- | --- |
| `00-drive` | Drive manually, watch the live sensor readout — know the inputs and outputs every brain has to work with |
| `01-silly-policy` | A constant-motor policy plus the scoring harness (auto-pain + progress); score the hand-written `ReactiveLineFollower` baseline as the target to beat |
| `02-tune-by-hand` | Expose the baseline's tuning constants (`cruise`, `steerGain`, `searchPower`); tune manually, then grid-search. The core insight: *learning is automated parameter tuning* |
| `03-hill-climbing` | Random search and hill climbing over those parameters: tweak them a little, keep the tweak only when the score improves, repeat. The first genuine learning, and it can honestly beat the hand-tuned baseline |
| `04-evolution` | Evolution strategies over a tiny neural network's weights — population, mutation, selection, watched live on the canvas |
| `05-imitation` | Supervised learning as one honest step: record driving, fit a linear model then a neural net on it, and learn that imitation can at best equal its teacher |
| `06-reinforcement` | Learn from pain directly — first with the red button (human reward: sparse, delayed, noisy), then with auto-pain, seeing dense reward speed learning up dramatically; good enough to solve the maze |
| `07-generalization` | Train on some paths, evaluate on held-out ones; add sensor noise; extend the policy input with a goal to solve the red/green tree fork |

The [`Policy`](../src/control/Policy.ts) interface is the seam every step
plugs into: `decide(sensorReadings) → motorCommand`. A learned brain
implements the same one method as the hand-written baseline and drops into
the simulation unchanged.

## The reward: pain

Reinforcement is part of the baseline harness, not a late add-on. The signal
that shapes every learner is **pain** — negative pulses delivered through one
channel with two interchangeable sources behind the same seam:

- **Auto-pain** (the default teacher): computed from ground truth. Whenever
  the robot strays past a threshold from the templated path, it receives a
  pain pulse scaled by how far off it is — dense, exact, instant. This is
  what the step-01 scorer is built from.
- **The red pain button**: a big red button on the canvas. A human presses it
  when the robot misbehaves — sparse, delayed, and inconsistent, exactly like
  training a puppy. Step 06 opens with it, so sparsity, delay, and credit
  assignment are *felt* before they are named.

Two rules keep the design honest:

1. **Pain goes to the learner, never to the policy.** The robot's brain only
   ever sees its two line sensors — just like the real Bit:Bot, which has no
   ground-truth view of the paper. The tuner, hill climber, or RL loop is
   what consumes pain.
2. **Pain alone is a trap — deliberately.** With pain-only feedback the
   optimal policy is to stand perfectly still: no deviation, no pain. The
   counterweight is progress along the path as the positive term. The trap
   stays in the course on purpose — a robot that achieves zero pain by
   refusing to move is the best possible introduction to *reward hacking*.

## Why a simulator

- **Fast, safe episodes.** Thousands of runs cost nothing; a crashed virtual
  robot resets instantly.
- **Ground truth on demand.** The `Paper` owns every pixel, so reward signals
  (distance along the path, deviation from it) can be computed exactly.
- **Same seam as hardware.** The robot model mirrors the physical Bit:Bot PRO
  (differential drive with power −100..100, two analog line sensors), so a
  policy learned here maps onto the real buggy's controls.

## What this repo is not

Training infrastructure (reward shaping, episode runners, model serialisation)
is intentionally **not** included yet. This repo is the environment those
experiments run against; the steps above grow on top of it.
