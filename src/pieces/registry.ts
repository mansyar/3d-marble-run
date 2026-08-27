/**
 * Piece type registry and connector-port math.
 *
 * Pure logic module — no Three.js/Rapier imports. Geometry builders and the
 * snapping solver consume this data; unit tests pin its behavior.
 */

export type Vec3 = [number, number, number];

/** Semantic classes of connector ports. Compatibility is defined on kinds. */
export type PortKind = "run" | "mouth" | "spout" | "cup";

/** A connector endpoint on a piece, expressed in the piece's local space. */
export interface PortDef {
  id: string;
  kind: PortKind;
  /** Local-space position of the connector center. */
  position: Vec3;
  /** Unit vector pointing outward from the piece at this port. */
  direction: Vec3;
}

/** Static definition of one piece type. */
export interface PieceTypeDef {
  id: PieceTypeId;
  ports: PortDef[];
}

export type PieceTypeId =
  | "straight"
  | "curve"
  | "ramp"
  | "funnel"
  | "goal-cup"
  | "splitter"
  | "bumper";

/** Where a piece sits in the world. v1 restricts rotation to Y-axis yaw. */
export interface Placement {
  position: Vec3;
  /** Yaw in degrees, clockwise seen from above (+Y). */
  yawDeg: number;
}

/** Shared track dimensions — geometry builders must stay consistent with these. */
export const TRACK_WIDTH = 0.6;
export const STRAIGHT_LENGTH = 2;
export const CURVE_RADIUS = 1;
export const RAMP_RISE = 0.5;
export const FUNNEL_HEIGHT = 1;
export const CUP_INLET_HEIGHT = 0.6;

const p = (id: string, kind: PortKind, position: Vec3, direction: Vec3): PortDef => ({
  id,
  kind,
  position,
  direction,
});

const STRAIGHT: PieceTypeDef = {
  id: "straight",
  ports: [
    p("a", "run", [0, 0, -STRAIGHT_LENGTH / 2], [0, 0, -1]),
    p("b", "run", [0, 0, STRAIGHT_LENGTH / 2], [0, 0, 1]),
  ],
};

const CURVE: PieceTypeDef = {
  id: "curve",
  // Quarter arc of radius CURVE_RADIUS sweeping from +Z to +X, centered on
  // the piece's bounding-box middle so yaw rotation pivots about the piece
  // itself. Port directions are TANGENTIAL (the way a marble exits along the
  // track), not radial — tangential dirs are what make solver joints
  // tangent-continuous with straight pieces.
  ports: [
    p("a", "run", [-CURVE_RADIUS / 2, 0, CURVE_RADIUS / 2], [-1, 0, 0]),
    p("b", "run", [CURVE_RADIUS / 2, 0, -CURVE_RADIUS / 2], [0, 0, -1]),
  ],
};

const RAMP: PieceTypeDef = {
  id: "ramp",
  ports: [
    p("a", "run", [0, 0, -STRAIGHT_LENGTH / 2], [0, 0, -1]),
    p("b", "run", [0, RAMP_RISE, STRAIGHT_LENGTH / 2], [0, 0, 1]),
  ],
};

const FUNNEL: PieceTypeDef = {
  id: "funnel",
  ports: [
    p("mouth", "mouth", [0, FUNNEL_HEIGHT, 0], [0, 1, 0]),
    p("spout", "spout", [0, 0, 0], [0, -1, 0]),
  ],
};

const GOAL_CUP: PieceTypeDef = {
  id: "goal-cup",
  ports: [p("inlet", "cup", [0, CUP_INLET_HEIGHT, 0], [0, 1, 0])],
};

/** Free-standing bounce dome — deliberately portless, placed anywhere. */
const BUMPER: PieceTypeDef = {
  id: "bumper",
  ports: [],
};

/** Branch arc radius; also offsets the inlet (z=+R) and outlets (x=±R). */
export const SPLITTER_RADIUS = 1;

const SPLITTER: PieceTypeDef = {
  id: "splitter",
  ports: [
    p("inlet", "run", [0, 0, SPLITTER_RADIUS], [0, 0, 1]),
    p("outlet-l", "run", [-SPLITTER_RADIUS, 0, 0], [-1, 0, 0]),
    p("outlet-r", "run", [SPLITTER_RADIUS, 0, 0], [1, 0, 0]),
  ],
};

/** All available piece types, keyed by id. */
export const PIECE_TYPE_IDS: Record<PieceTypeId, PieceTypeDef> = {
  straight: STRAIGHT,
  curve: CURVE,
  ramp: RAMP,
  funnel: FUNNEL,
  "goal-cup": GOAL_CUP,
  splitter: SPLITTER,
  bumper: BUMPER,
};

const COMPATIBLE_PAIRS = new Set(["mouth|run", "run|run", "run|spout", "spout|cup"]);

/**
 * Whether two port kinds may physically join. Symmetric by construction:
 * every pair is checked in both orders against the allow-list.
 */
export function canConnect(a: PortKind, b: PortKind): boolean {
  return COMPATIBLE_PAIRS.has(`${a}|${b}`) || COMPATIBLE_PAIRS.has(`${b}|${a}`);
}

export interface WorldPort {
  position: Vec3;
  direction: Vec3;
}

function rotateY(v: Vec3, yawDeg: number): Vec3 {
  const t = (yawDeg * Math.PI) / 180;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

export { rotateY };

/** Map a piece-local port into world space under the given placement. */
export function getWorldPort(placement: Placement, typeId: PieceTypeId, portId: string): WorldPort {
  const def = PIECE_TYPE_IDS[typeId];
  const port = def.ports.find((q) => q.id === portId);
  if (!port) throw new Error(`Unknown port "${portId}" on piece "${typeId}"`);
  const rotPos = rotateY(port.position, placement.yawDeg);
  return {
    position: [
      rotPos[0] + placement.position[0],
      rotPos[1] + placement.position[1],
      rotPos[2] + placement.position[2],
    ],
    direction: rotateY(port.direction, placement.yawDeg),
  };
}
