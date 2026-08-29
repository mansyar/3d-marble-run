import type { PerspectiveCamera } from "three";
import { Vector3 } from "three";
import { getWorldPort } from "../pieces/registry";
import type { PlacedPiece } from "../track/graph";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
/** World-units lift above the cup inlet so the chip floats over the rim. */
const INLET_LIFT = 0.45;

export interface CupCountersDeps {
  /** Overlay container; the canvas fills it, so clientWidth/Height map 1:1 to screen px. */
  container: HTMLElement;
  camera: PerspectiveCamera;
}

export interface CupCounters {
  /**
   * Diff chips against the current goal-cup set and reposition every chip.
   * Call once per frame; handles placement, deletion, moves, undo/redo, and
   * save loads for free.
   */
  update(pieces: Iterable<PlacedPiece>): void;
  /** Show the cup's new tally with a punch animation (instant under reduced motion). */
  score(goalPieceId: string, count: number): void;
  /** Zero every tally display (table reset / save load). */
  reset(): void;
}

/**
 * Floating per-cup goal counters: one pooled HTML chip per placed goal cup,
 * projected from the cup inlet into screen space each frame. Presentation
 * only — tallies live in the goal tracker and arrive via `score()`.
 */
export function createCupCounters(deps: CupCountersDeps): CupCounters {
  const { container, camera } = deps;
  const chips = new Map<string, HTMLDivElement>();
  const seen = new Set<string>();
  const stale: string[] = [];
  const scratch = new Vector3();
  const toPoint = new Vector3();
  const cameraDir = new Vector3();

  function createChip(goalPieceId: string): HTMLDivElement {
    const el = document.createElement("div");
    el.className = "cup-counter";
    el.textContent = "0";
    el.style.display = "none";
    container.appendChild(el);
    chips.set(goalPieceId, el);
    return el;
  }

  function removeChip(goalPieceId: string): void {
    const el = chips.get(goalPieceId);
    if (!el) return;
    el.remove();
    chips.delete(goalPieceId);
  }

  return {
    update(pieces: Iterable<PlacedPiece>): void {
      seen.clear();
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.getWorldDirection(cameraDir);

      for (const piece of pieces) {
        if (piece.typeId !== "goal-cup") continue;
        seen.add(piece.id);
        const el = chips.get(piece.id) ?? createChip(piece.id);
        const inlet = getWorldPort(piece.placement, "goal-cup", "inlet").position;
        toPoint.set(inlet[0], inlet[1] + INLET_LIFT, inlet[2]);
        scratch.copy(toPoint).sub(camera.position);
        if (scratch.dot(cameraDir) <= 0) {
          el.style.display = "none";
          continue;
        }
        scratch.copy(toPoint).project(camera);
        el.style.display = "";
        el.style.transform = `translate(${(scratch.x * 0.5 + 0.5) * width}px, ${
          (-scratch.y * 0.5 + 0.5) * height
        }px) translate(-50%, -100%)`;
      }

      stale.length = 0;
      for (const id of chips.keys()) {
        if (!seen.has(id)) stale.push(id);
      }
      for (const id of stale) removeChip(id);
    },

    score(goalPieceId: string, count: number): void {
      const el = chips.get(goalPieceId);
      if (!el) return;
      el.textContent = String(count);
      if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
      el.classList.remove("punch");
      void el.offsetWidth; // restart the punch animation
      el.classList.add("punch");
    },

    reset(): void {
      for (const el of chips.values()) {
        el.textContent = "0";
        el.classList.remove("punch");
      }
    },
  };
}
