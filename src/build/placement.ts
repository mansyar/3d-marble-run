import type { MeshStandardMaterial, PerspectiveCamera, Scene } from "three";
import { Plane, Raycaster, Vector2, Vector3 } from "three";
import type { CommandStack } from "../core/commandStack";
import { buildPiece } from "../pieces/builders";
import type { PieceTypeId, Placement } from "../pieces/registry";
import { PlaceCommand } from "../track/commands";
import type { TrackGraph } from "../track/graph";
import { classifySnap, type SnapClassification } from "../track/snapping";

/**
 * Ghost placement flow: pick a piece in the tray, a translucent ghost follows
 * the pointer/finger across the table, snaps to compatible free ports, and
 * places on release (routed through the command stack for undo/redo).
 */

const GHOST_OPACITY = 0.55;
const BLOCKED_COLOR = 0xd00000;
const ROTATE_STEP_DEG = 45;

export interface PlacementDeps {
  scene: Scene;
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  graph: TrackGraph;
  stack: CommandStack<TrackGraph>;
  /** Spawns meshes+colliders for a freshly placed piece and records its id. */
  spawn: (id: string, typeId: PieceTypeId, placement: Placement) => void;
  /** Called after every placement or cancel so UI state can re-sync. */
  onEnd?: () => void;
  nextId: () => string;
}

interface Ghost {
  group: ReturnType<typeof buildPiece>["group"];
  originalColors: Map<MeshStandardMaterial, number>;
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
  let lastStatus: SnapClassification["status"] = "free";

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
    const c = classifySnap(graph, query);
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
    const query = {
      typeId: activeTypeId,
      placement: { position: [cursorPos.x, 0, cursorPos.z] as [number, number, number], yawDeg },
    };
    const c = classifySnap(graph, query);
    if (c.status === "blocked") return;
    const placement = c.status === "snap" ? c.snap.placement : query.placement;
    const id = deps.nextId();
    const connection =
      c.status === "snap"
        ? {
            targetPieceId: c.snap.targetPieceId,
            targetPortId: c.snap.targetPortId,
            dragPortId: c.snap.dragPortId,
          }
        : undefined;
    stack.execute(graph, new PlaceCommand(id, activeTypeId, placement, connection));
    deps.spawn(id, activeTypeId, placement);
    deps.onEnd?.();
  }

  function onPointerMove(ev: PointerEvent): void {
    if (!ghost) return;
    cursorPos = pointOnTable(ev.clientX, ev.clientY);
    refreshGhost();
  }

  function onPointerUp(ev: PointerEvent): void {
    if (!ghost) return;
    if (ev.button === 2) return; // right-click cancels via contextmenu handler
    place();
  }

  function onPointerDown(ev: PointerEvent): void {
    if (!ghost) return;
    // First contact also re-anchors the ghost so taps far away still work.
    cursorPos = pointOnTable(ev.clientX, ev.clientY);
    refreshGhost();
  }

  function onKeyDown(ev: KeyboardEvent): void {
    if (!ghost) return;
    if (ev.key === "Escape") cancel();
    else if (ev.key.toLowerCase() === "r")
      yawDeg += ev.shiftKey ? -ROTATE_STEP_DEG : ROTATE_STEP_DEG;
    refreshGhost();
  }

  function onWheel(ev: WheelEvent): void {
    if (!ghost) return;
    ev.preventDefault();
    yawDeg += ev.deltaY > 0 ? ROTATE_STEP_DEG : -ROTATE_STEP_DEG;
    refreshGhost();
  }

  function onContextMenu(ev: MouseEvent): void {
    if (ghost) ev.preventDefault();
  }

  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointerup", onPointerUp);
  domElement.addEventListener("wheel", onWheel, { passive: false });
  domElement.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("keydown", onKeyDown);

  function begin(typeId: PieceTypeId): void {
    cancel();
    activeTypeId = typeId;
    yawDeg = 0;
    ghost = makeGhost(typeId);
    rotateBtn.hidden = false;
  }

  function cancel(): void {
    if (ghost) {
      scene.remove(ghost.group);
      ghost = null;
    }
    activeTypeId = null;
    cursorPos = null;
    rotateBtn.hidden = true;
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
