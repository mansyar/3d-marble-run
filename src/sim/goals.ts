import { getWorldPort, type Vec3 } from "../pieces/registry";
import type { PlacedPiece } from "../track/graph";

export interface MarblePosition {
  id: number;
  position: Vec3;
}

export interface GoalEntry {
  marbleId: number;
  goalPieceId: string;
  celebration: "pop";
}

export interface GoalTracker {
  /** Detects new cup entries from the current live marble positions. */
  update(pieces: Iterable<PlacedPiece>, marbles: readonly MarblePosition[]): GoalEntry[];
  count(): number;
  reset(): void;
}

const GOAL_CAPTURE_RADIUS = 0.2;
const GOAL_CAPTURE_TOP_PADDING = 0.05;
const GOAL_CAPTURE_DEPTH = 0.5;

function isInsideInlet(marble: MarblePosition, inlet: Vec3): boolean {
  const dx = marble.position[0] - inlet[0];
  const dz = marble.position[2] - inlet[2];
  const horizontalDistanceSquared = dx * dx + dz * dz;
  const top = inlet[1] + GOAL_CAPTURE_TOP_PADDING;
  const bottom = inlet[1] - GOAL_CAPTURE_DEPTH;
  return (
    horizontalDistanceSquared <= GOAL_CAPTURE_RADIUS * GOAL_CAPTURE_RADIUS &&
    marble.position[1] >= bottom &&
    marble.position[1] <= top
  );
}

/** Tracks one-time marble entries into every placed goal cup. */
export function createGoalTracker(): GoalTracker {
  const countedMarbles = new Set<number>();
  let total = 0;

  return {
    update(pieces, marbles): GoalEntry[] {
      const goals = [...pieces].filter((piece) => piece.typeId === "goal-cup");
      const entries: GoalEntry[] = [];

      for (const marble of marbles) {
        if (countedMarbles.has(marble.id)) continue;
        for (const goal of goals) {
          const inlet = getWorldPort(goal.placement, "goal-cup", "inlet").position;
          if (!isInsideInlet(marble, inlet)) continue;
          countedMarbles.add(marble.id);
          total += 1;
          entries.push({ marbleId: marble.id, goalPieceId: goal.id, celebration: "pop" });
          break;
        }
      }
      return entries;
    },

    count(): number {
      return total;
    },

    reset(): void {
      countedMarbles.clear();
      total = 0;
    },
  };
}
