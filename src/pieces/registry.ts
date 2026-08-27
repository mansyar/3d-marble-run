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

/** Quarter-arc channel geometry per (type, inPort>outPort) — centres, radius
 * and sweep angles in local space. Mirrors the builders' arc troughs. */
const ARC_CHANNELS: Record<
  string,
  { cx: number; cz: number; r: number; from: number; to: number }
> = {
  "curve:a>b": {
    cx: -CURVE_RADIUS / 2,
    cz: -CURVE_RADIUS / 2,
    r: CURVE_RADIUS,
    from: Math.PI / 2,
    to: 0,
  },
  "curve:b>a": {
    cx: -CURVE_RADIUS / 2,
    cz: -CURVE_RADIUS / 2,
    r: CURVE_RADIUS,
    from: 0,
    to: Math.PI / 2,
  },
  "splitter:inlet>outlet-l": {
    cx: -SPLITTER_RADIUS,
    cz: SPLITTER_RADIUS,
    r: SPLITTER_RADIUS,
    from: 0,
    to: -Math.PI / 2,
  },
  "splitter:outlet-l>inlet": {
    cx: -SPLITTER_RADIUS,
    cz: SPLITTER_RADIUS,
    r: SPLITTER_RADIUS,
    from: -Math.PI / 2,
    to: 0,
  },
  "splitter:inlet>outlet-r": {
    cx: SPLITTER_RADIUS,
    cz: SPLITTER_RADIUS,
    r: SPLITTER_RADIUS,
    from: Math.PI,
    to: (Math.PI * 3) / 2,
  },
  "splitter:outlet-r>inlet": {
    cx: SPLITTER_RADIUS,
    cz: SPLITTER_RADIUS,
    r: SPLITTER_RADIUS,
    from: (Math.PI * 3) / 2,
    to: Math.PI,
  },
};

const ARC_SEGMENTS = 8;

/** World-space polyline tracing a piece's channel between the used ports —
 * straight runs port-to-port, with quarter arcs sampled so consumers (route
 * glow) can bend smoothly without leaving the rails. Route ends (one port)
 * reduce to that port; pieces without it fall back to the channel centroid. */
export function channelPath(
  placement: Placement,
  typeId: PieceTypeId,
  inPortId: string | null,
  outPortId: string | null,
): Vec3[] {
  const def = PIECE_TYPE_IDS[typeId];
  const centroid = (): Vec3 => {
    if (def.ports.length === 0) return placement.position;
    let x = 0;
    let y = 0;
    let z = 0;
    for (const port of def.ports) {
      const world = getWorldPort(placement, typeId, port.id).position;
      x += world[0];
      y += world[1];
      z += world[2];
    }
    return [x / def.ports.length, y / def.ports.length, z / def.ports.length];
  };

  if (!inPortId && !outPortId) return [centroid()];
  if (!inPortId || !outPortId) {
    const usedId = (inPortId ?? outPortId) as string;
    const used = getWorldPort(placement, typeId, usedId).position;
    return def.ports.length <= 1 ? [used] : [centroid(), used];
  }

  const arc = ARC_CHANNELS[`${typeId}:${inPortId}>${outPortId}`];
  if (!arc) {
    return [
      getWorldPort(placement, typeId, inPortId).position,
      getWorldPort(placement, typeId, outPortId).position,
    ];
  }

  const points: Vec3[] = [];
  for (let i = 0; i <= ARC_SEGMENTS; i += 1) {
    const angle = arc.from + ((arc.to - arc.from) * i) / ARC_SEGMENTS;
    const local: Vec3 = [arc.cx + Math.cos(angle) * arc.r, 0, arc.cz + Math.sin(angle) * arc.r];
    const rotated = rotateY(local, placement.yawDeg);
    points.push([
      rotated[0] + placement.position[0],
      rotated[1] + placement.position[1],
      rotated[2] + placement.position[2],
    ]);
  }
  return points;
}
