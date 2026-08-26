import { type PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from "three";
import type { CommandStack } from "../core/commandStack";
import type { Vec3 } from "../pieces/registry";
import { shouldHandleDropPointShortcut } from "./dropPointKeyboard";
import { createDropPointEditor, type DropPointState } from "./dropPointPlacement";

export interface DropPointControllerDeps {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  state: DropPointState;
  stack: CommandStack<DropPointState>;
  isEnabled?: () => boolean;
  onChange?: () => void;
  /** Called only after the Drop point is successfully placed or moved. */
  onPlace?: () => void;
  onMove?: (position: Vec3 | null) => void;
  onEnd?: () => void;
}

/**
 * Free X/Z pointer controller for the separate Drop point setting. It uses
 * the same table-plane projection as physical-piece placement but never
 * consults the TrackGraph or snapping solver.
 */
export function createDropPointController(deps: DropPointControllerDeps): {
  begin: () => void;
  cancel: () => void;
  delete: () => void;
  undo: () => boolean;
  redo: () => boolean;
  readonly active: boolean;
  readonly cursorPosition: Vec3 | null;
} {
  const { camera, domElement } = deps;
  const editor = createDropPointEditor(deps.state, deps.stack);
  const tablePlane = new Plane(new Vector3(0, 1, 0), 0);
  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const hit = new Vector3();
  let active = false;
  let cursorPosition: Vec3 | null = null;

  function pointOnTable(clientX: number, clientY: number): Vec3 | null {
    const rect = domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    ndc.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const point = raycaster.ray.intersectPlane(tablePlane, hit);
    return point ? [point.x, 0, point.z] : null;
  }

  function end(): void {
    active = false;
    cursorPosition = null;
    deps.onMove?.(null);
    deps.onEnd?.();
  }

  function updateCursor(ev: PointerEvent): void {
    if (!active) return;
    cursorPosition = pointOnTable(ev.clientX, ev.clientY);
    deps.onMove?.(cursorPosition);
  }

  function onPointerMove(ev: PointerEvent): void {
    updateCursor(ev);
  }

  function onPointerDown(ev: PointerEvent): void {
    updateCursor(ev);
  }

  function onPointerUp(ev: PointerEvent): void {
    if (!active) return;
    updateCursor(ev);
    if (!cursorPosition || !editor.place(cursorPosition)) return;
    deps.onChange?.();
    deps.onPlace?.();
    end();
  }

  function onKeyDown(ev: KeyboardEvent): void {
    const key = ev.key.toLowerCase();
    const modifier = ev.ctrlKey || ev.metaKey;
    if (!shouldHandleDropPointShortcut(active, deps.isEnabled?.() ?? true)) return;
    if (modifier && key === "z") {
      ev.preventDefault();
      if (active) end();
      const changed = ev.shiftKey ? editor.redo() : editor.undo();
      if (changed) deps.onChange?.();
      return;
    }
    if (modifier && key === "y") {
      ev.preventDefault();
      if (active) end();
      if (editor.redo()) deps.onChange?.();
      return;
    }
    if (active && ev.key === "Escape") {
      ev.preventDefault();
      end();
      return;
    }
    if (active && (ev.key === "Delete" || ev.key === "Backspace")) {
      ev.preventDefault();
      if (editor.delete()) deps.onChange?.();
      end();
    }
  }

  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointerup", onPointerUp);
  window.addEventListener("keydown", onKeyDown);

  return {
    begin() {
      active = true;
      cursorPosition = null;
      deps.onMove?.(null);
    },
    cancel() {
      if (active) end();
    },
    delete() {
      if (editor.delete()) deps.onChange?.();
      if (active) end();
    },
    undo() {
      const changed = editor.undo();
      if (changed) deps.onChange?.();
      return changed;
    },
    redo() {
      const changed = editor.redo();
      if (changed) deps.onChange?.();
      return changed;
    },
    get active() {
      return active;
    },
    get cursorPosition() {
      return cursorPosition;
    },
  };
}
