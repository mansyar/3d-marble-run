import "./style.css";
import { ColliderDesc, RigidBodyDesc, type World } from "@dimforge/rapier3d-compat";
import { createDropPointController } from "./build/dropPointController";
import { createDropPointState, type DropPointState } from "./build/dropPointPlacement";
import { createPlacementController } from "./build/placement";
import { createCommandStack } from "./core/commandStack";
import { createStepper } from "./core/stepper";
import { type SpawnedPiece, spawnStaticPiece } from "./pieces/builders";
import { createMarbleMesh, MARBLE_RADIUS } from "./pieces/marble";
import type { PieceTypeId, Placement } from "./pieces/registry";
import { type CameraTarget, createFreeOrbitCamera, type FreeOrbitCamera } from "./render/camera";
import { createDropPointGuide, type DropPointGuide } from "./render/dropPointGuide";
import { initScene } from "./render/scene";
import {
  createGateSpawnerAdvance,
  createGateSpawnerDrop,
  type PositionedMarbleSpawn,
} from "./sim/gateSpawner";
import { createGoalTracker, type MarblePosition } from "./sim/goals";
import { createPhysics } from "./sim/physics";
import { findOutOfBoundsMarbleIds, resolveSpawnAnchor } from "./sim/playability";
import { createSpawner, type Spawner } from "./sim/spawner";
import type { TrackGraph } from "./track/graph";
import { assessTrackHealth } from "./track/health";
import { createStarterGraph } from "./track/starter";
import { loadInitialTrack } from "./track/startup";
import { createTrackStorage } from "./track/storage";
import { createAboutDialog } from "./ui/about";
import { createSaveSlotControls } from "./ui/save-slots";
import { createSimulationControls } from "./ui/simulation";
import { createTray } from "./ui/tray";
import { APP_VERSION } from "./version";

const FIXED_DT_MS = 1000 / 60;
const MAX_SUB_STEPS = 5;

const app = document.querySelector<HTMLElement>("#app");

if (!app) {
  throw new Error("#app container missing from index.html");
}

const world = await createPhysics();
const stepper = createStepper(FIXED_DT_MS, MAX_SUB_STEPS);
const spawner: Spawner = createSpawner({ maxMarbles: 20, streamIntervalMs: 500 });
const storage = createTrackStorage();
let graph: TrackGraph;
try {
  graph = await loadInitialTrack(storage);
} catch {
  graph = createStarterGraph();
}
const goalTracker = createGoalTracker();

interface LiveMarble {
  mesh: ReturnType<typeof createMarbleMesh>;
  body: ReturnType<World["createRigidBody"]>;
  previousPosition: [number, number, number];
}

const liveMarbles = new Map<number, LiveMarble>();

function spawnMarble(marble: PositionedMarbleSpawn): void {
  const mesh = createMarbleMesh();
  mesh.position.set(...marble.position);
  handle.scene.add(mesh);

  const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(...marble.position));
  world.createCollider(
    ColliderDesc.ball(MARBLE_RADIUS).setFriction(0.45).setRestitution(0.15),
    body,
  );
  liveMarbles.set(marble.id, {
    mesh,
    body,
    previousPosition: [...marble.position],
  });
}

function removeMarble(id: number): void {
  const live = liveMarbles.get(id);
  if (!live) return;
  handle.scene.remove(live.mesh);
  world.removeRigidBody(live.body);
  liveMarbles.delete(id);
}

function applySpawnResult(result: ReturnType<typeof createGateSpawnerDrop>): void {
  for (const id of result.recycled) removeMarble(id);
  for (const marble of result.spawned) spawnMarble(marble);
}

function applyGateSpawnResult(result: ReturnType<typeof createGateSpawnerDrop>): void {
  if (result.streamStopped) simulationControls.setStreamEnabled(false);
  applySpawnResult(result);
}

function snapshotMarbles(): void {
  for (const live of liveMarbles.values()) {
    const position = live.body.translation();
    live.previousPosition = [position.x, position.y, position.z];
  }
}

function interpolatedPosition(live: LiveMarble, alpha: number): [number, number, number] {
  const position = live.body.translation();
  return [
    live.previousPosition[0] + (position.x - live.previousPosition[0]) * alpha,
    live.previousPosition[1] + (position.y - live.previousPosition[1]) * alpha,
    live.previousPosition[2] + (position.z - live.previousPosition[2]) * alpha,
  ];
}

function currentMarblePositions(): MarblePosition[] {
  const marbles: MarblePosition[] = [];
  for (const [id, { body }] of liveMarbles) {
    const position = body.translation();
    marbles.push({ id, position: [position.x, position.y, position.z] });
  }
  return marbles;
}

function syncMarbles(alpha: number): void {
  for (const live of liveMarbles.values()) {
    const position = interpolatedPosition(live, alpha);
    const rotation = live.body.rotation();
    live.mesh.position.set(position[0], position[1], position[2]);
    live.mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
  }
}

function latestMarbleTarget(alpha: number): CameraTarget | null {
  const activeIds = spawner.state().activeIds;
  for (let index = activeIds.length - 1; index >= 0; index -= 1) {
    const live = liveMarbles.get(activeIds[index]);
    if (!live) continue;
    return interpolatedPosition(live, alpha);
  }
  return null;
}

function detectGoalEntries(): void {
  for (const entry of goalTracker.update(graph.pieces.values(), currentMarblePositions())) {
    if (spawner.remove(entry.marbleId)) removeMarble(entry.marbleId);
    simulationControls.setGoalCount(goalTracker.count());
    if (entry.celebration === "pop") simulationControls.showGoalPop();
  }
}

function cleanupOutOfBoundsMarbles(): void {
  for (const id of findOutOfBoundsMarbleIds(currentMarblePositions())) {
    if (spawner.remove(id)) removeMarble(id);
  }
}

let cameraController: FreeOrbitCamera | null = null;
let dropPointGuide: DropPointGuide | null = null;

const handle = initScene(app, (elapsedMs) => {
  applyGateSpawnResult(createGateSpawnerAdvance(spawner, graph, elapsedMs));
  const { steps, alpha } = stepper.advance(elapsedMs);
  for (let i = 0; i < steps; i++) {
    snapshotMarbles();
    world.step();
  }
  syncMarbles(alpha);
  dropPointGuide?.refresh();
  cleanupOutOfBoundsMarbles();
  detectGoalEntries();
  simulationControls.setTimerMs(spawner.state().timerMs);
  cameraController?.update(elapsedMs, latestMarbleTarget(alpha));
});

// --- Build mode state -------------------------------------------------------

const stack = createCommandStack<TrackGraph>();

/** Placed pieces' live meshes + physics bodies, keyed by graph piece id. */
const spawned = new Map<string, SpawnedPiece>();
const staticBodyToPiece = new Map<number, string>();

// Seed counter above graph-internal ids ("piece-N") to avoid collisions.
let customIdCounter = 1000;

function spawnPiece(id: string, typeId: PieceTypeId, placement: Placement): void {
  const live = spawnStaticPiece(handle.scene, world, typeId, placement);
  spawned.set(id, live);
  staticBodyToPiece.set(live.body.handle, id);
}

function removePiece(id: string): void {
  const live = spawned.get(id);
  if (!live) return;
  handle.scene.remove(live.group);
  world.removeRigidBody(live.body);
  staticBodyToPiece.delete(live.body.handle);
  spawned.delete(id);
}

function syncScene(): void {
  for (const id of [...spawned.keys()]) removePiece(id);
  for (const piece of graph.pieces.values()) {
    spawnPiece(piece.id, piece.typeId, piece.placement);
  }
}

function replaceGraph(next: TrackGraph): void {
  graph.pieces.clear();
  graph.nextId = next.nextId;
  for (const piece of next.pieces.values()) {
    graph.pieces.set(piece.id, structuredClone(piece));
  }
  for (const id of graph.pieces.keys()) {
    const numericId = Number(id.split("-")[1]);
    if (Number.isInteger(numericId)) customIdCounter = Math.max(customIdCounter, numericId);
  }
  stack.clear();
  syncScene();
}

function refreshTrackHealth(): void {
  simulationControls.setTrackHealth(assessTrackHealth(graph).status);
}

syncScene();

const previewMarble = createMarbleMesh();
previewMarble.position.set(2.2, MARBLE_RADIUS, -1);
handle.scene.add(previewMarble);

// --- HUD wiring -------------------------------------------------------------

let tray!: ReturnType<typeof createTray>;

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
  onChange: () => {
    storage.scheduleAutosave(graph);
    refreshTrackHealth();
  },
  nextId: () => `piece-${++customIdCounter}`,
  onEnd: () => tray.setActive(null),
});

const dropPointState = createDropPointState();
const dropPointStack = createCommandStack<DropPointState>();
dropPointGuide = createDropPointGuide({
  scene: handle.scene,
  world,
  state: dropPointState,
  trackBodies: staticBodyToPiece,
});
const dropPointPlacement = createDropPointController({
  camera: handle.camera,
  domElement: handle.renderer.domElement,
  state: dropPointState,
  stack: dropPointStack,
  onMove: (position) => dropPointGuide?.setPreview(position),
  onChange: () => dropPointGuide?.refresh(),
  onEnd: () => tray.setActive(null),
});

tray = createTray(document.body, (selection) => {
  if (selection === "drop-point") {
    placement.cancel();
    dropPointPlacement.begin();
    tray.setActive(selection);
  } else if (selection) {
    dropPointPlacement.cancel();
    placement.begin(selection);
    tray.setActive(selection);
  } else {
    dropPointPlacement.cancel();
    placement.cancel();
  }
});

cameraController = createFreeOrbitCamera({
  camera: handle.camera,
  domElement: handle.renderer.domElement,
  isLocked: () => placement.activeTypeId !== null || dropPointPlacement.active,
});

function resetSimulationState(): void {
  const { removedIds } = spawner.reset();
  for (const id of removedIds) removeMarble(id);
  goalTracker.reset();
  simulationControls.setGoalCount(0);
  simulationControls.setTimerMs(0);
  simulationControls.setStreamEnabled(false);
}

const aboutDialog = createAboutDialog(document.body, APP_VERSION);
const simulationControls = createSimulationControls(document.body, {
  onDrop: () => applyGateSpawnResult(createGateSpawnerDrop(spawner, graph)),
  onToggleStream: () => {
    if (resolveSpawnAnchor(graph).status === "missing-start") {
      spawner.setContinuous(false);
      return false;
    }
    return spawner.toggleContinuous();
  },
  onToggleCamera: () => cameraController?.toggleMode() ?? "free",
  onReset: resetSimulationState,
  onAbout: aboutDialog.open,
});

simulationControls.setStreamEnabled(spawner.isContinuous());
simulationControls.setGoalCount(goalTracker.count());
simulationControls.setTimerMs(spawner.state().timerMs);
simulationControls.setCameraMode(cameraController.mode());
refreshTrackHealth();

async function refreshSaveSlots(): Promise<void> {
  saveSlots.setSlots(await storage.list());
}

const saveSlots = createSaveSlotControls(document.body, {
  onSave: async (name) => {
    await storage.save(name, graph);
    await refreshSaveSlots();
  },
  onLoad: async (name) => {
    const loaded = await storage.load(name);
    if (!loaded) throw new Error("Save slot not found");
    placement.cancel();
    resetSimulationState();
    replaceGraph(loaded);
    refreshTrackHealth();
    storage.scheduleAutosave(graph);
  },
  onDelete: async (name) => {
    await storage.remove(name);
    await refreshSaveSlots();
  },
});

void refreshSaveSlots().catch(() => saveSlots.setStatus("Save unavailable"));
window.addEventListener("pagehide", () => {
  void storage.flushAutosave(graph).catch(() => undefined);
});
