# Purpose

This repository is a **step-by-step shell for learning machine learning**,
using a virtual two-wheeled robot on an HTML canvas as the subject.

Instead of starting from an abstract dataset, you start from a concrete,
watchable problem: a simulated [Bit:Bot PRO–style](https://n00b.no/products/bitbot-pro-for-micro-bit)
robot that must follow a coloured path printed on a virtual A2 sheet. The
simulator, the robot physics, and the sensors are all provided and stay fixed —
the part you replace, step by step, is the **brain**.

## The learning path

1. **Understand the environment.** Drive the robot manually and watch how the
   two line sensors respond as the robot crosses a path. The sensor readings
   are the *inputs* any brain — hand-written or learned — has to work with.
2. **Study the hand-written baseline.** `ReactiveLineFollower` is a small
   proportional controller: steer toward the darker sensor, spin to re-acquire
   the line when both sensors go bright. It is deliberately simple, readable,
   and *good enough* — the reference every learned policy must beat.
3. **Plug in a learned policy.** The [`Policy`](../src/control/Policy.ts)
   interface is the seam: `decide(sensorReadings) → motorCommand`. A trained
   network implements the same one method as the baseline and drops into the
   simulation unchanged. Nothing else in the codebase needs to know whether the
   brain was written or trained.
4. **Iterate.** Train against the five provided paths (straight line, circle,
   sine wave, maze, colour-forked tree — roughly in order of difficulty),
   compare against the baseline, and tighten the loop.

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
