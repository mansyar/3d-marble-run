import type { Group, MeshStandardMaterial, Object3D, PerspectiveCamera, Scene } from "three";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { CommandStack } from "../core/commandStack";
import { buildPiece } from "../pieces/builders";
import type { PieceTypeId, Placement } from "../pieces/registry";
import { DeleteCommand, MoveCommand, PlaceCommand } from "../track/commands";
import {
  getPiece,
  movePiece,
  type PlacedPiece,
  removePiece as removeGraphPiece,
  restorePiece,
  type TrackGraph,
} from "../track/graph";
import { classifySnap, type SnapClassification } from "../track/snapping";
import { canPlacePiece } from "./placementRules";

/**
 * Ghost placement flow: pick a piece in the tray, a translucent ghost follows
 * the pointer/finger across the table, snaps to compatible free ports, and
 * places on release (routed through the command stack for undo/redo).
 */

const GHOST_OPACITY = 0.55;
const BLOCKED_COLOR = 0xd00000;
const ROTATE_STEP_DEG = 45;

export interface EditablePiece {
  id: string;
  typeId: PieceTypeId;
  group: Group;
}

export interface PlacementDeps {
  scene: Scene;
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  graph: TrackGraph;
  stack: CommandStack<TrackGraph>;
  /** Spawns meshes+colliders for a freshly placed piece and records its id. */
  spawn: (id: string, typeId: PieceTypeId, placement: Placement) => void;
  /** Removes a live mesh/body before a move or delete. */
  remove: (id: string) => void;
  /** Lists currently rendered graph pieces for hit-testing. */
  editablePieces: () => Iterable<EditablePiece>;
  /** Rebuilds live meshes/bodies after undo or redo changes the graph. */
  sync: () => void;
  /** Called after every placement or cancel so UI state can re-sync. */
  onEnd?: () => void;
  /** Called after a graph edit so persistence can debounce an autosave. */
  onChange?: () => void;
  /** Disables physical-piece pointer handling while another build tool is active. */
  isEnabled?: () => boolean;
  nextId: () => string;
}

interface Ghost {
  group: ReturnType<typeof buildPiece>["group"];
  originalColors: Map<MeshStandardMaterial, number>;
}

interface MoveState {
  id: string;
  typeId: PieceTypeId;
  before: Placement;
  beforeSnapshot: PlacedPiece;
}

export function createPlacementController(deps: PlacementDeps): {
  begin: (typeId: PieceTypeId) => void;
  cancel: () => void;
  readonly activeTypeId: PieceTypeId | null;
} {
  const { scene, camera, domElement, graph, stack } = deps;

  let activeTypeId: PieceTypeId | null = null;
  let yawDeg = 0;
  let ghost: Ghost | null = null;
  let moving: MoveState | null = null;
  let lastStatus: SnapClassification["status"] = "free";

  function isEnabled(): boolean {
    return deps.isEnabled?.() ?? true;
  }

  // Rotate pill — visible only while placing (works for touch users).
  const rotateBtn = document.createElement("button");
  rotateBtn.className = "rotate-pill";
  rotateBtn.type = "button";
  rotateBtn.textContent = "↻ Turn";
  rotateBtn.hidden = true;
  rotateBtn.addEventListener("click", () => {
    yawDeg += ROTATE_STEP_DEG;
    refreshGhost();
  });
  document.body.appendChild(rotateBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-pill";
  deleteBtn.type = "button";
  deleteBtn.textContent = "✕ Delete";
  deleteBtn.hidden = true;
  deleteBtn.addEventListener("click", () => deleteActive());
  document.body.appendChild(deleteBtn);

  const tablePlane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hit = new Vector3();

  function pointOnTable(clientX: number, clientY: number): Vector3 | null {
    const rect = domElement.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(tablePlane, hit);
  }

  function pieceAt(clientX: number, clientY: number): EditablePiece | null {
    const rect = domElement.getBoundingClientRect();
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const pieces = [...deps.editablePieces()];
    const byGroup = new Map<Group, EditablePiece>();
    for (const piece of pieces) byGroup.set(piece.group, piece);
    const hits = raycaster.intersectObjects(
      pieces.map((piece) => piece.group),
      true,
    );
    for (const hitObject of hits) {
      let object: Object3D | null = hitObject.object;
      while (object) {
        const piece = byGroup.get(object as Group);
        if (piece) return piece;
        object = object.parent;
      }
    }
    return null;
  }

  function makeGhost(typeId: PieceTypeId): Ghost {
    const group = buildPiece(typeId).group;
    const originalColors = new Map<MeshStandardMaterial, number>();
    for (const mesh of group.children) {
      if (!("material" in mesh)) continue;
      const mat = (mesh.material as MeshStandardMaterial).clone();
      mat.transparent = true;
      mat.opacity = GHOST_OPACITY;
      originalColors.set(mat, mat.color.getHex());
      mesh.material = mat;
    }
    group.visible = false;
    scene.add(group);
    return { group, originalColors };
  }

  function tintBlocked(blocked: boolean): void {
    if (!ghost) return;
    for (const [mat, original] of ghost.originalColors) {
      mat.color.setHex(blocked ? BLOCKED_COLOR : original);
    }
  }

  /** Recompute snap classification + ghost transform from current pointer pos. */
  let cursorPos: Vector3 | null = null;
  function refreshGhost(): void {
    if (!ghost || !activeTypeId || !cursorPos) return;
    const query = {
      typeId: activeTypeId,
      placement: { position: [cursorPos.x, 0, cursorPos.z] as [number, number, number], yawDeg },
    };
    const c = classifySnap(graph, query, moving?.id);
    lastStatus = c.status;
    if (c.status === "snap") {
      applyPlacement(c.snap.placement);
    } else {
      applyPlacement(query.placement);
    }
    tintBlocked(c.status === "blocked");
  }

  function applyPlacement(p: Placement): void {
    if (!ghost) return;
    ghost.group.position.set(p.position[0], p.position[1], p.position[2]);
    // Same convention as spawnStaticPiece / registry rotateY: positive yaw
    // about +Y. No negation — the curve piece exposed that mismatch.
    ghost.group.rotation.y = (p.yawDeg * Math.PI) / 180;
    ghost.group.visible = true;
  }

  function place(): void {
    if (!ghost || !activeTypeId || !cursorPos || lastStatus === "blocked") return;
    if (!moving && !canPlacePiece(graph, activeTypeId)) {
      cancel();
      return;
    }
    const query = {
      typeId: activeTypeId,
      placement: { position: [cursorPos.x, 0, cursorPos.z] as [number, number, number], yawDeg },
    };
    const c = classifySnap(graph, query, moving?.id);
    if (c.status === "blocked") return;
    const placement = c.status === "snap" ? c.snap.placement : query.placement;
    const connection =
      c.status === "snap"
        ? {
            targetPieceId: c.snap.targetPieceId,
            targetPortId: c.snap.targetPortId,
            dragPortId: c.snap.dragPortId,
          }
        : undefined;
    if (moving) {
      const state = moving;
      stack.execute(
        graph,
        new MoveCommand(state.id, state.before, placement, connection, state.beforeSnapshot),
      );
      deps.spawn(state.id, state.typeId, placement);
      deps.onChange?.();
    } else {
      const id = deps.nextId();
      stack.execute(graph, new PlaceCommand(id, activeTypeId, placement, connection));
      deps.spawn(id, activeTypeId, placement);
      deps.onChange?.();
    }
    moving = null;
    clearGhost();
    activeTypeId = null;
    cursorPos = null;
    rotateBtn.hidden = true;
    deleteBtn.hidden = true;
    deps.onEnd?.();
  }

  function clearGhost(): void {
    if (ghost) {
      scene.remove(ghost.group);
      ghost = null;
    }
  }

  function startMove(piece: EditablePiece): void {
    const current = getPiece(graph, piece.id);
    if (!current) return;
    moving = {
      id: piece.id,
      typeId: piece.typeId,
      before: structuredClone(current.placement),
      beforeSnapshot: structuredClone(current),
    };
    // Free the old ports while the ghost is being dragged. The snapshot is
    // restored on cancel/delete-undo and is supplied to MoveCommand for undo.
    movePiece(graph, piece.id, current.placement);
    deps.remove(piece.id);
    activeTypeId = piece.typeId;
    yawDeg = current.placement.yawDeg;
    ghost = makeGhost(piece.typeId);
    rotateBtn.hidden = false;
    deleteBtn.hidden = false;
  }

  function restoreMoving(): void {
    if (!moving) return;
    removeGraphPiece(graph, moving.id);
    restorePiece(graph, moving.beforeSnapshot);
    deps.spawn(moving.id, moving.typeId, moving.before);
    moving = null;
  }

  function deleteActive(): void {
    if (!moving) {
      cancel();
      return;
    }
    const state = moving;
    clearGhost();
    moving = null;
    activeTypeId = null;
    cursorPos = null;
    rotateBtn.hidden = true;
    deleteBtn.hidden = true;
    stack.execute(graph, new DeleteCommand(state.id, state.beforeSnapshot));
    deps.onChange?.();
    deps.onEnd?.();
  }

  function onPointerMove(ev: PointerEvent): void {
    if (!isEnabled() || !ghost) return;
    cursorPos = pointOnTable(ev.clientX, ev.clientY);
    refreshGhost();
  }

  function onPointerUp(ev: PointerEvent): void {
    if (!isEnabled() || !ghost) return;
    if (ev.button === 2) return; // right-click cancels via contextmenu handler
    place();
  }

  function onPointerDown(ev: PointerEvent): void {
    if (!isEnabled()) return;
    if (!ghost) {
      const piece = pieceAt(ev.clientX, ev.clientY);
      if (!piece) return;
      startMove(piece);
    }
    // First contact also re-anchors the ghost so taps far away still work.
    cursorPos = pointOnTable(ev.clientX, ev.clientY);
    refreshGhost();
  }

  function onKeyDown(ev: KeyboardEvent): void {
    if (!isEnabled()) return;
    const key = ev.key.toLowerCase();
    const modifier = ev.ctrlKey || ev.metaKey;
    if (modifier && key === "z") {
      ev.preventDefault();
      cancel();
      if (ev.shiftKey ? stack.redo(graph) : stack.undo(graph)) {
        deps.sync();
        deps.onChange?.();
      }
      return;
    }
    if (modifier && key === "y") {
      ev.preventDefault();
      cancel();
      if (stack.redo(graph)) {
        deps.sync();
        deps.onChange?.();
      }
      return;
    }
    if (!ghost) return;
    if (ev.key === "Escape") {
      cancel();
      return;
    }
    if (ev.key === "Delete" || ev.key === "Backspace") {
      ev.preventDefault();
      deleteActive();
    } else if (key === "r") yawDeg += ev.shiftKey ? -ROTATE_STEP_DEG : ROTATE_STEP_DEG;
    refreshGhost();
  }

  function onWheel(ev: WheelEvent): void {
    if (!isEnabled() || !ghost) return;
    ev.preventDefault();
    yawDeg += ev.deltaY > 0 ? ROTATE_STEP_DEG : -ROTATE_STEP_DEG;
    refreshGhost();
  }

  function onContextMenu(ev: MouseEvent): void {
    if (isEnabled() && ghost) ev.preventDefault();
  }

  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });
  domElement.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("keydown", onKeyDown);

  function begin(typeId: PieceTypeId): void {
    clearGhost();
    if (moving) {
      restoreMoving();
    }
    activeTypeId = null;
    cursorPos = null;
    if (!canPlacePiece(graph, typeId)) {
      deps.onEnd?.();
      return;
    }
    activeTypeId = typeId;
    yawDeg = 0;
    ghost = makeGhost(typeId);
    rotateBtn.hidden = false;
    deleteBtn.hidden = true;
  }

  function cancel(): void {
    clearGhost();
    if (moving) {
      restoreMoving();
    }
    activeTypeId = null;
    cursorPos = null;
    rotateBtn.hidden = true;
    deleteBtn.hidden = true;
    deps.onEnd?.();
  }

  return {
    begin,
    cancel,
    get activeTypeId() {
      return activeTypeId;
    },
  };
}
