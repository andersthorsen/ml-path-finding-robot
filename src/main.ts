import { AutoController } from "./control/AutoController.ts";
import type { BotController } from "./control/BotController.ts";
import { ManualController, type ManualInput } from "./control/ManualController.ts";
import { ReactiveLineFollower } from "./control/ReactiveLineFollower.ts";
import { Paper } from "./paper/Paper.ts";
import { A2_PORTRAIT, DEFAULT_PIXELS_PER_MM, PATHS, pathImageUrl, type PathId } from "./paper/PaperSpec.ts";
import { Bot } from "./robot/Bot.ts";
import { startPoseFor } from "./robot/startPose.ts";
import { Renderer } from "./sim/Renderer.ts";
import { Simulation, type TickInfo } from "./sim/Simulation.ts";

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) {
    throw new Error(`Missing element #${id}`);
  }
  return node as T;
};

const canvas = el<HTMLCanvasElement>("canvas");
const pathSelect = el<HTMLSelectElement>("path");
const pathDesc = el("path-desc");
const modeManualBtn = el<HTMLButtonElement>("mode-manual");
const modeAutoBtn = el<HTMLButtonElement>("mode-auto");
const runBtn = el<HTMLButtonElement>("run");
const resetBtn = el<HTMLButtonElement>("reset");
const manualControls = el("manual-controls");
const readout = {
  left: el("r-left"),
  right: el("r-right"),
  motors: el("r-motors"),
  pose: el("r-pose"),
};

const manual = new ManualController();
const auto = new AutoController(new ReactiveLineFollower());
const paperOptions = { size: A2_PORTRAIT, pixelsPerMm: DEFAULT_PIXELS_PER_MM } as const;

let mode: "manual" | "auto" = "manual";
let currentPath: PathId = PATHS[0].id;
let bot: Bot;
let renderer: Renderer;
let simulation: Simulation;

const controllerFor = (m: typeof mode): BotController => (m === "manual" ? manual : auto);

async function buildWorld(pathId: PathId): Promise<void> {
  simulation?.stop();
  const paper = await Paper.load(pathImageUrl(pathId), paperOptions);
  bot = new Bot(paper, startPoseFor(pathId, paper.size));
  renderer = new Renderer(canvas, paper);
  simulation = new Simulation(bot, renderer, controllerFor(mode));
  simulation.onTick = updateReadout;
  simulation.start();
  syncRunButton();
}

function setMode(next: typeof mode): void {
  mode = next;
  simulation.setController(controllerFor(next));
  modeManualBtn.setAttribute("aria-pressed", String(next === "manual"));
  modeAutoBtn.setAttribute("aria-pressed", String(next === "auto"));
  manualControls.hidden = next !== "manual";
}

function syncRunButton(): void {
  runBtn.textContent = simulation.running ? "Pause" : "Run";
}

let readoutFrame = 0;
function updateReadout(info: TickInfo): void {
  if (readoutFrame++ % 4 !== 0) {
    return; // ~15 Hz is plenty for text
  }
  const describe = (r: TickInfo["sensors"]["left"]): string => `${r.colorName} · ${r.analog}`;
  readout.left.textContent = describe(info.sensors.left);
  readout.right.textContent = describe(info.sensors.right);
  readout.motors.textContent = `${Math.round(info.motors.left)} / ${Math.round(info.motors.right)}`;
  const { x, y, heading } = bot.pose;
  readout.pose.textContent = `${x.toFixed(0)}, ${y.toFixed(0)} mm @ ${((heading * 180) / Math.PI).toFixed(0)}°`;
}

// --- Path picker ---
for (const { id, label } of PATHS) {
  const option = new Option(label, id);
  pathSelect.add(option);
}
function showPathDescription(id: PathId): void {
  pathDesc.textContent = PATHS.find((p) => p.id === id)?.description ?? "";
}
pathSelect.addEventListener("change", async () => {
  currentPath = pathSelect.value as PathId;
  showPathDescription(currentPath);
  await buildWorld(currentPath);
});

// --- Mode + run controls ---
modeManualBtn.addEventListener("click", () => setMode("manual"));
modeAutoBtn.addEventListener("click", () => setMode("auto"));
runBtn.addEventListener("click", () => {
  if (simulation.running) {
    simulation.stop();
  } else {
    simulation.start();
  }
  syncRunButton();
});
resetBtn.addEventListener("click", () => {
  bot.reset(startPoseFor(currentPath, A2_PORTRAIT));
  renderer.clearTrail();
});

// --- On-screen hold buttons ---
for (const button of document.querySelectorAll<HTMLButtonElement>(".hold")) {
  const input = button.dataset.input as ManualInput;
  const press = (event: PointerEvent): void => {
    event.preventDefault();
    manual.press(input);
  };
  const release = (): void => manual.release(input);
  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
}

// --- Keyboard (independent wheels + turning) ---
const KEY_MAP: Record<string, ManualInput> = {
  w: "leftWheelForward",
  s: "leftWheelBack",
  arrowup: "rightWheelForward",
  arrowdown: "rightWheelBack",
  arrowleft: "left",
  arrowright: "right",
  a: "left",
  d: "right",
};
const inputForKey = (event: KeyboardEvent): ManualInput | undefined => KEY_MAP[event.key.toLowerCase()];
window.addEventListener("keydown", (event) => {
  const input = inputForKey(event);
  if (input) {
    event.preventDefault();
    manual.press(input);
  }
});
window.addEventListener("keyup", (event) => {
  const input = inputForKey(event);
  if (input) {
    manual.release(input);
  }
});

// --- Boot ---
// Initial mode/UI state matches the HTML defaults (manual, controls visible);
// `setMode` is only used for later switches once a simulation exists.
showPathDescription(currentPath);
await buildWorld(currentPath);
