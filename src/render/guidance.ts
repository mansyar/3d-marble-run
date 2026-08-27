import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  type Scene,
  TubeGeometry,
  Vector3,
} from "three";
import type { GoalRoute } from "../track/health";

const GLOW_COLOR = 0x8338ec; // the Drop-point violet — guidance shares the accent
const PULSE_CYCLE_MS = 2000;
const PULSE_MIN_INTENSITY = 0.06;
const PULSE_MAX_INTENSITY = 0.32;
const PULSE_STATIC_INTENSITY = 0.22;
const GLOW_HOVER = 0.1; // marble-centre height inside a rail channel

export interface GuidanceState {
  /** Connector pieces the landing cannot reach — they pulse. */
  unreachablePieceIds: string[];
  /** Landing→cup paths — they glow. */
  routes: GoalRoute[];
}

export interface GuidanceDeps {
  scene: Scene;
  /** World-space polyline of a piece's channel between the used ports. */
  channelPathOf: (
    pieceId: string,
    inPortId: string | null,
    outPortId: string | null,
  ) => [number, number, number][];
  /** The port id on `pieceId` that connects to `otherId`, if any. */
  connectedPortOf: (pieceId: string, otherId: string) => string | null;
  /** Rendered group for a piece id, used to pulse its materials. */
  pieceGroupOf: (pieceId: string) => Group | null;
}

export interface GuidanceRenderer {
  refresh(state: GuidanceState): void;
  tick(elapsedMs: number): void;
}

interface TrackedPiece {
  meshes: Mesh[];
  originalEmissive: number[];
  originalIntensity: number[];
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/** Soft route guidance: violet pulses on unreachable connector pieces and an
 * additive glow tube along each landing→cup path. Recomputed only on graph /
 * landing changes (see refresh), animated per frame in tick. */
export function createGuidanceRenderer(deps: GuidanceDeps): GuidanceRenderer {
  const reducedMotion = prefersReducedMotion();
  const pulseColor = new Color(GLOW_COLOR);
  const glowMaterial = new MeshBasicMaterial({
    color: GLOW_COLOR,
    transparent: true,
    opacity: 0.4,
    blending: AdditiveBlending,
    depthWrite: false,
  });

  const glowGroup = new Group();
  glowGroup.visible = false;
  deps.scene.add(glowGroup);

  const tracked = new Map<string, TrackedPiece>();
  let phase = 0;

  function rebuildGlow(routes: GoalRoute[]): void {
    for (const child of [...glowGroup.children]) {
      glowGroup.remove(child);
      (child as Mesh).geometry.dispose();
    }
    for (const route of routes) {
      const points: Vector3[] = [];
      const push = (raw: [number, number, number] | null): void => {
        if (!raw) return;
        const point = new Vector3(raw[0], raw[1] + GLOW_HOVER, raw[2]);
        const previous = points[points.length - 1];
        if (previous && previous.distanceToSquared(point) < 1e-6) return;
        points.push(point);
      };
      for (let i = 0; i < route.pieceIds.length; i += 1) {
        const pieceId = route.pieceIds[i];
        const inPort = i > 0 ? deps.connectedPortOf(pieceId, route.pieceIds[i - 1]) : null;
        const outPort =
          i < route.pieceIds.length - 1
            ? deps.connectedPortOf(pieceId, route.pieceIds[i + 1])
            : null;
        for (const raw of deps.channelPathOf(pieceId, inPort, outPort)) push(raw);
      }
      if (points.length < 2) continue;
      // Tension 0 = straight runs between dense channel samples, so the glow
      // hugs the channel (arcs included) without swinging outside the rails.
      const curve = new CatmullRomCurve3(points, false, "catmullrom", 0);
      const mesh = new Mesh(
        new TubeGeometry(curve, Math.max(8, (points.length - 1) * 3), 0.025, 6, false),
        glowMaterial,
      );
      glowGroup.add(mesh);
    }
    glowGroup.visible = glowGroup.children.length > 0;
  }

  function refresh(state: GuidanceState): void {
    const wanted = new Set(state.unreachablePieceIds);
    for (const pieceId of [...tracked.keys()]) {
      if (wanted.has(pieceId)) continue;
      const entry = tracked.get(pieceId);
      entry?.meshes.forEach((mesh, index) => {
        const material = mesh.material as MeshStandardMaterial;
        material.emissive.setHex(entry.originalEmissive[index]);
        material.emissiveIntensity = entry.originalIntensity[index];
      });
      tracked.delete(pieceId);
    }

    for (const pieceId of state.unreachablePieceIds) {
      if (tracked.has(pieceId)) continue;
      const group = deps.pieceGroupOf(pieceId);
      if (!group) continue;
      const meshes: Mesh[] = [];
      const originalEmissive: number[] = [];
      const originalIntensity: number[] = [];
      group.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        const material = child.material as MeshStandardMaterial;
        if (!material.emissive) return;
        meshes.push(child);
        originalEmissive.push(material.emissive.getHex());
        originalIntensity.push(material.emissiveIntensity);
        material.emissive.copy(pulseColor);
        material.emissiveIntensity = reducedMotion ? PULSE_STATIC_INTENSITY : PULSE_MIN_INTENSITY;
      });
      if (meshes.length > 0) tracked.set(pieceId, { meshes, originalEmissive, originalIntensity });
    }

    rebuildGlow(state.routes);
  }

  function tick(elapsedMs: number): void {
    if (tracked.size === 0 || reducedMotion) return;
    phase = (phase + (elapsedMs * Math.PI * 2) / PULSE_CYCLE_MS) % (Math.PI * 2);
    const intensity =
      PULSE_MIN_INTENSITY +
      ((PULSE_MAX_INTENSITY - PULSE_MIN_INTENSITY) * (1 + Math.sin(phase))) / 2;
    for (const entry of tracked.values()) {
      for (const mesh of entry.meshes) {
        (mesh.material as MeshStandardMaterial).emissiveIntensity = intensity;
      }
    }
  }

  return { refresh, tick };
}
