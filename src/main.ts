import "./style.css";
import { createStepper } from "./core/stepper";
import { spawnStaticPiece } from "./pieces/builders";
import type { PieceTypeId } from "./pieces/registry";
import { initScene } from "./render/scene";
import { createPhysics } from "./sim/physics";

const FIXED_DT_MS = 1000 / 60;
const MAX_SUB_STEPS = 5;

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("#app container missing from index.html");
}

const world = await createPhysics();
const stepper = createStepper(FIXED_DT_MS, MAX_SUB_STEPS);

// TEMP Phase 2 visual check: one of each piece on the table.
// Replaced by real build-mode placement in Phase 3.
const PREVIEW: Array<[PieceTypeId, [number, number, number], number]> = [
  ["straight", [-3.5, 0, -2], 30],
  ["curve", [-1.2, 0, -2.8], 0],
  ["ramp", [1.2, 0, -2.8], 0],
  ["funnel", [3.2, 0, -2], 0],
  ["goal-cup", [4.4, 0, 0], 10],
];

const { scene } = initScene(app, (elapsedMs) => {
  const { steps } = stepper.advance(elapsedMs);
  for (let i = 0; i < steps; i++) {
    world.step();
  }
});

for (const [typeId, position, yawDeg] of PREVIEW) {
  spawnStaticPiece(scene, world, typeId, { position, yawDeg });
}
