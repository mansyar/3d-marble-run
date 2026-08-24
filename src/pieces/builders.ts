import { ColliderDesc, RigidBodyDesc, type World } from "@dimforge/rapier3d-compat";
import {
  BoxGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  MathUtils,
  Mesh,
  Quaternion,
  Vector2,
  Vector3,
} from "three";
import { makePieceMaterial } from "./materials";
import {
  CUP_INLET_HEIGHT,
  CURVE_RADIUS,
  FUNNEL_HEIGHT,
  type PieceTypeId,
  type Placement,
  RAMP_RISE,
  STRAIGHT_LENGTH,
  TRACK_WIDTH,
} from "./registry";
import { geometryToTrimesh } from "./trimesh";

/**
 * Procedural geometry builders — meshes plus matching Rapier collider specs,
 * expressed entirely in the piece's LOCAL space. Placement (position + yaw)
 * is applied only by `spawnStaticPiece`, keeping mesh/collider transforms DRY.
 */

export type ColliderSpec =
  | {
      kind: "cuboid";
      half: [number, number, number];
      position?: [number, number, number];
      rotation?: Quaternion;
    }
  | { kind: "trimesh"; vertices: Float32Array; indices: Uint32Array };

export interface BuiltPiece {
  group: Group;
  colliders: ColliderSpec[];
}

const FLOOR_T = 0.08;
const WALL_H = 0.16;
const RAIL_T = 0.07;
export const FUNNEL_SPOUT_INNER_RADIUS = 0.13;
const FUNNEL_SPOUT_OUTER_RADIUS = 0.17;
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);

function shadowed(mesh: Mesh): Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** U-channel trough segment running along local Z. Shared by straight/ramp/curve. */
function trough(length: number, typeId: PieceTypeId): BuiltPiece {
  const group = new Group();
  const mat = makePieceMaterial(typeId);
  const floor = shadowed(new Mesh(new BoxGeometry(TRACK_WIDTH, FLOOR_T, length), mat));
  floor.position.y = -FLOOR_T / 2;
  group.add(floor);
  const railGeo = new BoxGeometry(RAIL_T, WALL_H, length);
  for (const side of [-1, 1]) {
    const rail = shadowed(new Mesh(railGeo, mat));
    rail.position.set((side * TRACK_WIDTH) / 2, WALL_H / 2, 0);
    group.add(rail);
  }
  return {
    group,
    colliders: [
      {
        kind: "cuboid",
        half: [TRACK_WIDTH / 2, FLOOR_T / 2, length / 2],
        position: [0, -FLOOR_T / 2, 0],
      },
      {
        kind: "cuboid",
        half: [RAIL_T / 2, WALL_H / 2, length / 2],
        position: [TRACK_WIDTH / 2, WALL_H / 2, 0],
      },
      {
        kind: "cuboid",
        half: [RAIL_T / 2, WALL_H / 2, length / 2],
        position: [-TRACK_WIDTH / 2, WALL_H / 2, 0],
      },
    ],
  };
}

function rotX(v: [number, number, number], angle: number): [number, number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

function buildStraight(): BuiltPiece {
  return trough(STRAIGHT_LENGTH, "straight");
}

function buildRamp(): BuiltPiece {
  // Tilted trough whose endpoints land exactly on the registry ports:
  // chord length √(L²+RISE²), tilt −atan2(RISE,L) about X, lifted by RISE/2.
  // The tilt lives on an INNER group so spawn/ghost transforms on the outer
  // group can't flatten it (they overwrite position/quaternion wholesale).
  const chord = Math.hypot(STRAIGHT_LENGTH, RAMP_RISE);
  const slope = Math.atan2(RAMP_RISE, STRAIGHT_LENGTH);
  const built = trough(chord, "ramp");
  built.group.rotation.x = -slope;
  built.group.position.y = RAMP_RISE / 2;
  const q = new Quaternion().setFromAxisAngle(X_AXIS, -slope);
  built.colliders = built.colliders.map((c) => {
    if (c.kind !== "cuboid") return c;
    const lifted = rotX(c.position ?? [0, 0, 0], -slope);
    lifted[1] += RAMP_RISE / 2;
    return { ...c, position: lifted, rotation: q };
  });
  const outer = new Group();
  outer.add(built.group);
  return { group: outer, colliders: built.colliders };
}

const CURVE_SEGMENTS = 8;

function buildCurve(): BuiltPiece {
  // Quarter arc approximated by short trough segments along r=CURVE_RADIUS,
  // sweeping from port a (-r/2,0,r/2) to port b (r/2,0,-r/2). The arc's
  // center sits at (-r/2,0,-r/2) so the piece's origin is its visual middle.
  const group = new Group();
  const colliders: ColliderSpec[] = [];
  const segLength = 2 * CURVE_RADIUS * Math.sin(Math.PI / (4 * CURVE_SEGMENTS));
  const cx = -CURVE_RADIUS / 2;
  const cz = -CURVE_RADIUS / 2;
  for (let i = 0; i < CURVE_SEGMENTS; i++) {
    const a0 = Math.PI / 2 - (i / CURVE_SEGMENTS) * (Math.PI / 2);
    const a1 = Math.PI / 2 - ((i + 1) / CURVE_SEGMENTS) * (Math.PI / 2);
    const mid: [number, number, number] = [
      ((Math.cos(a0) + Math.cos(a1)) / 2) * CURVE_RADIUS + cx,
      0,
      ((Math.sin(a0) + Math.sin(a1)) / 2) * CURVE_RADIUS + cz,
    ];
    const dx = Math.cos(a1) - Math.cos(a0);
    const dz = Math.sin(a1) - Math.sin(a0);
    const yaw = Math.atan2(dx, dz);
    const seg = trough(segLength, "curve");
    seg.group.position.set(...mid);
    seg.group.rotation.y = yaw;
    group.add(seg.group);
    const q = new Quaternion().setFromAxisAngle(Y_AXIS, yaw);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    for (const c of seg.colliders) {
      if (c.kind !== "cuboid") continue;
      const lp = c.position ?? [0, 0, 0];
      colliders.push({
        ...c,
        position: [
          lp[0] * cy + lp[2] * sy + mid[0],
          lp[1] + mid[1],
          -lp[0] * sy + lp[2] * cy + mid[2],
        ],
        rotation: q.clone(),
      });
    }
  }
  return { group, colliders };
}

/** Bell-curve shell from rim to throat plus a short cylindrical spout. */
function buildFunnel(): BuiltPiece {
  const group = new Group();
  const mat = makePieceMaterial("funnel");
  mat.side = DoubleSide;
  const profile = [
    new Vector2(0.72, FUNNEL_HEIGHT),
    new Vector2(0.55, 0.82),
    new Vector2(0.34, 0.6),
    new Vector2(0.16, 0.38),
    new Vector2(0.09, 0.22),
    new Vector2(FUNNEL_SPOUT_INNER_RADIUS, 0.13),
  ];
  const bell = shadowed(new Mesh(new LatheGeometry(profile, 40), mat));
  group.add(bell);
  const spoutProfile = [
    new Vector2(FUNNEL_SPOUT_OUTER_RADIUS, 0.14),
    new Vector2(FUNNEL_SPOUT_OUTER_RADIUS, 0),
    new Vector2(FUNNEL_SPOUT_INNER_RADIUS, 0),
    new Vector2(FUNNEL_SPOUT_INNER_RADIUS, 0.14),
    new Vector2(FUNNEL_SPOUT_OUTER_RADIUS, 0.14),
  ];
  const spout = shadowed(new Mesh(new LatheGeometry(spoutProfile, 40), mat));
  group.add(spout);
  return {
    group,
    colliders: [
      { kind: "trimesh", ...geometryToTrimesh(bell.geometry) },
      { kind: "trimesh", ...geometryToTrimesh(spout.geometry) },
    ],
  };
}

/** Open gold cup; rim height matches the registry inlet port. */
function buildGoalCup(): BuiltPiece {
  const group = new Group();
  const mat = makePieceMaterial("goal-cup");
  mat.side = DoubleSide;
  const profile = [
    new Vector2(0.001, 0.03),
    new Vector2(0.17, 0.04),
    new Vector2(0.21, 0.2),
    new Vector2(0.25, 0.44),
    new Vector2(0.29, CUP_INLET_HEIGHT),
  ];
  const cup = shadowed(new Mesh(new LatheGeometry(profile, 36), mat));
  group.add(cup);
  return { group, colliders: [{ kind: "trimesh", ...geometryToTrimesh(cup.geometry) }] };
}

const BUILDERS: Record<PieceTypeId, () => BuiltPiece> = {
  straight: buildStraight,
  curve: buildCurve,
  ramp: buildRamp,
  funnel: buildFunnel,
  "goal-cup": buildGoalCup,
};

export function buildPiece(typeId: PieceTypeId): BuiltPiece {
  return BUILDERS[typeId]();
}

function toColliderDesc(spec: ColliderSpec): ColliderDesc {
  if (spec.kind === "trimesh") {
    return ColliderDesc.trimesh(spec.vertices, spec.indices);
  }
  const desc = ColliderDesc.cuboid(...spec.half);
  if (spec.position) desc.setTranslation(...spec.position);
  if (spec.rotation) {
    desc.setRotation({
      x: spec.rotation.x,
      y: spec.rotation.y,
      z: spec.rotation.z,
      w: spec.rotation.w,
    });
  }
  return desc;
}

export interface SpawnedPiece {
  group: Group;
  body: ReturnType<World["createRigidBody"]>;
}

/** Build a piece and register it into the scene/world under a placement. */
export function spawnStaticPiece(
  scene: import("three").Scene,
  world: World,
  typeId: PieceTypeId,
  placement: Placement,
): SpawnedPiece {
  const built = buildPiece(typeId);
  const yawRad = MathUtils.degToRad(placement.yawDeg);
  const q = new Quaternion().setFromAxisAngle(Y_AXIS, yawRad);
  built.group.position.set(...placement.position);
  built.group.quaternion.copy(q);
  scene.add(built.group);
  const body = world.createRigidBody(
    RigidBodyDesc.fixed()
      .setTranslation(...placement.position)
      .setRotation({ x: q.x, y: q.y, z: q.z, w: q.w }),
  );
  for (const spec of built.colliders) {
    world.createCollider(toColliderDesc(spec), body);
  }
  return { group: built.group, body };
}
