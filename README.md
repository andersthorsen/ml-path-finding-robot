# ML Path-Finding Robot

A browser playground that simulates a two-wheeled, **Bit:Bot PRO–style** robot
following a coloured path printed on an A2 sheet. It is built to be a sandbox
for machine-learning experiments: a hand-written line follower ships as the
baseline, and a learned policy can drop straight into the same seam.

See [docs/purpose.md](docs/purpose.md) for the intent and the step-by-step
learning path this repo is built around.

## The robot model

Modelled on the [4tronix Bit:Bot PRO for micro:bit](https://n00b.no/products/bitbot-pro-for-micro-bit):

- **Two independently driven wheels** (differential drive), motor power `-100..100`.
- **Two front line sensors** (the PRO exposes both analog and digital). Each
  sensor reports an **analog intensity (0–1023)** computed from the *average of
  every pixel under its circular footprint* — the more of the dark line it
  covers, the lower the reading — plus the averaged colour, so the red/green
  tree fork is distinguishable.
- A ~125 mm round chassis with a ~108 mm wheel base. Top speed is throttled
  below the real buggy so the motion is easy to watch, and timed `drive`
  commands are delayed by their duration.

## The paper & paths

The surface is **A2 portrait, 420 mm × 594 mm**, rasterised at 2 px/mm
(840 × 1188 px) for sensing. Five paths are provided:

| id | Path |
| --- | --- |
| `circle` | A single closed loop |
| `tree` | A trunk that forks into a **red** and a **green** branch |
| `maze` | Right-angle segments like a simple maze |
| `wave` | A smooth sine wave down the page |
| `line` | A single straight diagonal line |

Paths are **real PNG assets**. They are produced by the generator in
[`image-gen/`](image-gen/) (Node + `@napi-rs/canvas`) into `public/paths/`, and
loaded by the runtime `Paper`, which owns all pixel access for the sensor.

## Getting started

```bash
pnpm install
pnpm gen:paths   # render the five path PNGs into public/paths/
pnpm dev         # start Vite, open the printed URL
```

Other scripts: `pnpm typecheck`, `pnpm build`, `pnpm preview`.

## Controls

- **Manual mode** (default): drive with the on-screen pad, or the keyboard —
  `W`/`S` = left wheel, `↑`/`↓` = right wheel (true independent wheel control),
  `←`/`→` = turn.
- **Auto mode**: the `ReactiveLineFollower` baseline policy drives the robot.

## Architecture

Each class has one job (SOLID); the simulation depends on interfaces, so pieces
swap freely.

```
src/
  geometry/    Vector2, Pose, offset maths
  paper/       Paper (raster + pixel/footprint sampling), Color, PaperSpec, pathGeometry
  robot/       Bot, DifferentialDrive, LineSensor, startPose
  control/     BotController (interface), ManualController, AutoController,
               Policy (interface), ReactiveLineFollower (baseline)
  sim/         Simulation (real-time loop), Renderer
  ui/          styles
  main.ts      wiring
image-gen/     scene drawers + Node PNG generator (separate from the runtime)
```

### Plugging in a learned policy

Implement [`Policy`](src/control/Policy.ts) — `decide({ left, right })` returns
`{ left, right }` motor powers — and pass it to `AutoController`. The baseline
`ReactiveLineFollower` is the reference to beat. Training infrastructure is not
included yet; this repo is the simulator/environment it would run against.
