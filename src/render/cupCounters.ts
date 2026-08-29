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
  dispose(): void;
}

interface CupChip {
  el: HTMLDivElement;
  count: number;
}

/**
 * Floating per-cup goal counters: one pooled HTML chip per placed goal cup,
 * projected from the cup inlet into screen space each frame. Presentation
 * only — tallies live in the goal tracker and arrive via `score()`.
 */
export function createCupCounters(deps: CupCountersDeps): CupCounters {
  const { container, camera } = deps;
  const chips = new Map<string, CupChip>();
  const seen = new Set<string>();
  const stale: string[] = [];
  const scratch = new Vector3();
  const toPoint = new Vector3();
  const cameraDir = new Vector3();

  function createChip(goalPieceId: string): CupChip {
    const el = document.createElement("div");
    el.className = "cup-counter";
    el.textContent = "0";
    el.style.display = "none";
    container.appendChild(el);
    const chip: CupChip = { el, count: 0 };
    chips.set(goalPieceId, chip);
    return chip;
  }

  function removeChip(goalPieceId: string): void {
    const chip = chips.get(goalPieceId);
    if (!chip) return;
    chip.el.remove();
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
        const chip = chips.get(piece.id) ?? createChip(piece.id);
        const inlet = getWorldPort(piece.placement, "goal-cup", "inlet").position;
        toPoint.set(inlet[0], inlet[1] + INLET_LIFT, inlet[2]);
        scratch.copy(toPoint).sub(camera.position);
        if (scratch.dot(cameraDir) <= 0) {
          chip.el.style.display = "none";
          continue;
        }
        scratch.copy(toPoint).project(camera);
        chip.el.style.display = "";
        chip.el.style.transform = `translate(${(scratch.x * 0.5 + 0.5) * width}px, ${
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
      const chip = chips.get(goalPieceId);
      if (!chip) return;
      chip.count = count;
      chip.el.textContent = String(count);
      if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
      chip.el.classList.remove("punch");
      void chip.el.offsetWidth; // restart the punch animation
      chip.el.classList.add("punch");
    },

    reset(): void {
      for (const chip of chips.values()) {
        chip.count = 0;
        chip.el.textContent = "0";
        chip.el.classList.remove("punch");
      }
    },

    dispose(): void {
      for (const id of [...chips.keys()]) removeChip(id);
    },
  };
}
