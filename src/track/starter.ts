import type { TrackGraph } from "./graph";
import { addPiece, connect, createTrackGraph } from "./graph";

// Keep the drop point inside the ramp instead of directly over its capped end.
const STARTER_Z_OFFSET = -0.17;

/**
 * Build the first-run contraption: a descending ramp feeds a straight and a
 * quarter-turn into a funnel and goal cup. The high end sits below the
 * default marble drop point so the first release demonstrates motion.
 */
export function createStarterGraph(): TrackGraph {
  const graph = createTrackGraph();
  const ramp = addPiece(graph, "ramp", {
    position: [0, 1.1, 1 + STARTER_Z_OFFSET],
    yawDeg: 180,
  });
  const straight = addPiece(graph, "straight", {
    position: [0, 1.1, 3 + STARTER_Z_OFFSET],
    yawDeg: 0,
  });
  const curve = addPiece(graph, "curve", {
    position: [0.5, 1.1, 4.5 + STARTER_Z_OFFSET],
    yawDeg: -90,
  });
  const funnel = addPiece(graph, "funnel", {
    position: [1, 0.1, 5 + STARTER_Z_OFFSET],
    yawDeg: 0,
  });
  const cup = addPiece(graph, "goal-cup", {
    position: [1, -0.5, 5 + STARTER_Z_OFFSET],
    yawDeg: 0,
  });

  connect(graph, ramp, "a", straight, "a");
  connect(graph, straight, "b", curve, "a");
  connect(graph, curve, "b", funnel, "mouth");
  connect(graph, funnel, "spout", cup, "inlet");
  return graph;
}
