import "./style.css";
import { createPlacementController } from "./build/placement";
import { createCommandStack } from "./core/commandStack";
import { createStepper } from "./core/stepper";
import { type SpawnedPiece, spawnStaticPiece } from "./pieces/builders";
import { createMarbleMesh, MARBLE_RADIUS } from "./pieces/marble";
import type { PieceTypeId, Placement } from "./pieces/registry";
import { initScene } from "./render/scene";
import { createPhysics } from "./sim/physics";
import { addPiece, createTrackGraph, type TrackGraph } from "./track/graph";
import { createTray } from "./ui/tray";

const FIXED_DT_MS = 1000 / 60;
const MAX_SUB_STEPS = 5;

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("#app container missing from index.html");
}

const world = await createPhysics();
const stepper = createStepper(FIXED_DT_MS, MAX_SUB_STEPS);

const handle = initScene(app, (elapsedMs) => {
  const { steps } = stepper.advance(elapsedMs);
  for (let i = 0; i < steps; i++) {
    world.step();
  }
});

// --- Build mode state -------------------------------------------------------

const graph: TrackGraph = createTrackGraph();
const stack = createCommandStack<TrackGraph>();

/** Placed pieces' live meshes + physics bodies, keyed by graph piece id. */
const spawned = new Map<string, SpawnedPiece>();

// Seed counter above graph-internal ids ("piece-N") to avoid collisions.
let customIdCounter = 1000;

function spawnPiece(id: string, typeId: PieceTypeId, placement: Placement): void {
  spawned.set(id, spawnStaticPiece(handle.scene, world, typeId, placement));
}

function removePiece(id: string): void {
  const live = spawned.get(id);
  if (!live) return;
  handle.scene.remove(live.group);
  world.removeRigidBody(live.body);
  spawned.delete(id);
}

function syncScene(): void {
  for (const id of [...spawned.keys()]) removePiece(id);
  for (const piece of graph.pieces.values()) {
    spawnPiece(piece.id, piece.typeId, piece.placement);
  }
}

// TEMP Phase 3 visual check: a small starter arrangement so the table isn't
// empty. Replaced by the real starter contraption in Phase 6.
const seedStraight = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
const seedCup = addPiece(graph, "goal-cup", { position: [0, 0, 4], yawDeg: 0 });
spawnPiece(seedStraight, "straight", { position: [0, 0, 0], yawDeg: 0 });
spawnPiece(seedCup, "goal-cup", { position: [0, 0, 4], yawDeg: 0 });

const previewMarble = createMarbleMesh();
previewMarble.position.set(2.2, MARBLE_RADIUS, -1);
handle.scene.add(previewMarble);

// --- HUD wiring -------------------------------------------------------------

const tray = createTray(document.body, (typeId) => {
  if (typeId) placement.begin(typeId);
  else placement.cancel();
});

const placement = createPlacementController({
  scene: handle.scene,
  camera: handle.camera,
  domElement: handle.renderer.domElement,
  graph,
  stack,
  spawn: spawnPiece,
  remove: removePiece,
  editablePieces: () =>
    [...spawned.entries()].flatMap(([id, live]) => {
      const piece = graph.pieces.get(id);
      return piece ? [{ id, typeId: piece.typeId, group: live.group }] : [];
    }),
  sync: syncScene,
  nextId: () => `piece-${++customIdCounter}`,
  onEnd: () => tray.setActive(null),
});
