import "./style.css";
import { ColliderDesc, RigidBodyDesc, type World } from "@dimforge/rapier3d-compat";
import { createPlacementController } from "./build/placement";
import { createCommandStack } from "./core/commandStack";
import { createStepper } from "./core/stepper";
import { type SpawnedPiece, spawnStaticPiece } from "./pieces/builders";
import { createMarbleMesh, MARBLE_RADIUS } from "./pieces/marble";
import type { PieceTypeId, Placement } from "./pieces/registry";
import { type CameraTarget, createFreeOrbitCamera, type FreeOrbitCamera } from "./render/camera";
import { initScene } from "./render/scene";
import { createGoalTracker, type MarblePosition } from "./sim/goals";
import { createPhysics } from "./sim/physics";
import { createSpawner, type MarbleSpawn, type Spawner } from "./sim/spawner";
import { addPiece, createTrackGraph, type TrackGraph } from "./track/graph";
import { createSimulationControls } from "./ui/simulation";
import { createTray } from "./ui/tray";

const FIXED_DT_MS = 1000 / 60;
const MAX_SUB_STEPS = 5;

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("#app container missing from index.html");
}

const world = await createPhysics();
const stepper = createStepper(FIXED_DT_MS, MAX_SUB_STEPS);
const spawner: Spawner = createSpawner({ maxMarbles: 20, streamIntervalMs: 500 });
const graph: TrackGraph = createTrackGraph();
const goalTracker = createGoalTracker();

interface LiveMarble {
  mesh: ReturnType<typeof createMarbleMesh>;
  body: ReturnType<World["createRigidBody"]>;
}

const liveMarbles = new Map<number, LiveMarble>();
const MARBLE_SPAWN_POSITION: [number, number, number] = [0, 2, 0];

function spawnMarble(marble: MarbleSpawn): void {
  const mesh = createMarbleMesh();
  mesh.position.set(...MARBLE_SPAWN_POSITION);
  handle.scene.add(mesh);

  const body = world.createRigidBody(
    RigidBodyDesc.dynamic().setTranslation(...MARBLE_SPAWN_POSITION),
  );
  world.createCollider(
    ColliderDesc.ball(MARBLE_RADIUS).setFriction(0.45).setRestitution(0.15),
    body,
  );
  liveMarbles.set(marble.id, { mesh, body });
}

function removeMarble(id: number): void {
  const live = liveMarbles.get(id);
  if (!live) return;
  handle.scene.remove(live.mesh);
  world.removeRigidBody(live.body);
  liveMarbles.delete(id);
}

function applySpawnResult(result: ReturnType<Spawner["drop"]>): void {
  for (const id of result.recycled) removeMarble(id);
  for (const marble of result.spawned) spawnMarble(marble);
}

function syncMarbles(): void {
  for (const { mesh, body } of liveMarbles.values()) {
    const position = body.translation();
    const rotation = body.rotation();
    mesh.position.set(position.x, position.y, position.z);
    mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}

function latestMarbleTarget(): CameraTarget | null {
  const activeIds = spawner.state().activeIds;
  for (let index = activeIds.length - 1; index >= 0; index -= 1) {
    const live = liveMarbles.get(activeIds[index]);
    if (!live) continue;
    const position = live.body.translation();
    return [position.x, position.y, position.z];
  }
  return null;
}

function detectGoalEntries(): void {
  const marbles: MarblePosition[] = [];
  for (const [id, { body }] of liveMarbles) {
    const position = body.translation();
    marbles.push({ id, position: [position.x, position.y, position.z] });
  }

  for (const entry of goalTracker.update(graph.pieces.values(), marbles)) {
    if (spawner.remove(entry.marbleId)) removeMarble(entry.marbleId);
    simulationControls.setGoalCount(goalTracker.count());
    if (entry.celebration === "pop") simulationControls.showGoalPop();
  }
}

let cameraController: FreeOrbitCamera | null = null;

const handle = initScene(app, (elapsedMs) => {
  applySpawnResult(spawner.advance(elapsedMs));
  const { steps } = stepper.advance(elapsedMs);
  for (let i = 0; i < steps; i++) {
    world.step();
  }
  syncMarbles();
  detectGoalEntries();
  simulationControls.setTimerMs(spawner.state().timerMs);
  cameraController?.update(elapsedMs, latestMarbleTarget());
});

// --- Build mode state -------------------------------------------------------

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

cameraController = createFreeOrbitCamera({
  camera: handle.camera,
  domElement: handle.renderer.domElement,
  isLocked: () => placement.activeTypeId !== null,
});

const simulationControls = createSimulationControls(document.body, {
  onDrop: () => applySpawnResult(spawner.drop()),
  onToggleStream: () => spawner.toggleContinuous(),
  onToggleCamera: () => cameraController?.toggleMode() ?? "free",
  onReset: () => {
    const { removedIds } = spawner.reset();
    for (const id of removedIds) removeMarble(id);
    goalTracker.reset();
    simulationControls.setGoalCount(0);
    simulationControls.setTimerMs(0);
    simulationControls.setStreamEnabled(false);
  },
});

simulationControls.setStreamEnabled(spawner.isContinuous());
simulationControls.setGoalCount(goalTracker.count());
simulationControls.setTimerMs(spawner.state().timerMs);
simulationControls.setCameraMode(cameraController.mode());
