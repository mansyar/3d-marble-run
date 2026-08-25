import type { World } from "@dimforge/rapier3d-compat";
import {
  DynamicDrawUsage,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  type Scene,
  SphereGeometry,
} from "three";
import type { DropPointState } from "../build/dropPointPlacement";
import type { Vec3 } from "../pieces/registry";
import { type LandingResult, resolveLanding } from "../sim/landing";
import { createDropPoint, type DropPoint } from "../track/dropPoint";

const MARKER_COLOR = 0x8338ec;
const GUIDE_COLOR = 0x2a9d8f;
const GUIDE_DOT_RADIUS = 0.04;
const GUIDE_DOT_SPACING = 0.35;
const GUIDE_MAX_DOTS = 59;

export interface DropPointGuideDeps {
  scene: Scene;
  world: World;
  state: DropPointState;
  trackBodies: ReadonlyMap<number, string>;
  onLandingChange?: (result: LandingResult) => void;
}

export interface DropPointGuide {
  setPreview: (position: Vec3 | null) => LandingResult;
  refresh: () => LandingResult;
  dispose: () => void;
  readonly lastResult: LandingResult;
}

/** Render the overhead marker and its live vertical landing guide. */
export function createDropPointGuide(deps: DropPointGuideDeps): DropPointGuide {
  const marker = new Mesh(
    new SphereGeometry(0.12, 16, 8),
    new MeshStandardMaterial({ color: MARKER_COLOR, roughness: 0.45 }),
  );
  marker.castShadow = true;
  marker.visible = false;

  const guide = new InstancedMesh(
    new SphereGeometry(GUIDE_DOT_RADIUS, 8, 6),
    new MeshBasicMaterial({
      color: GUIDE_COLOR,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      depthTest: false,
    }),
    GUIDE_MAX_DOTS,
  );
  guide.instanceMatrix.setUsage(DynamicDrawUsage);
  guide.frustumCulled = false;
  guide.visible = false;
  deps.scene.add(marker, guide);
  const dotTransform = new Object3D();

  let preview: DropPoint | null | undefined;
  let lastResult: LandingResult = {
    status: "no-landing",
    position: null,
    normal: null,
    distance: null,
    pieceId: null,
  };
  let lastKey = "";

  function publish(result: LandingResult, point: DropPoint | null): void {
    const key = `${point?.position.join(",") ?? "none"}:${result.status}:${result.pieceId ?? ""}:${result.distance ?? ""}`;
    lastResult = result;
    if (key === lastKey) return;
    lastKey = key;
    deps.onLandingChange?.(result);
  }

  function render(point: DropPoint | null): LandingResult {
    if (!point) {
      marker.visible = false;
      guide.visible = false;
      publish(
        lastResult.status === "invalid-position"
          ? lastResult
          : {
              status: "no-landing",
              position: null,
              normal: null,
              distance: null,
              pieceId: null,
            },
        null,
      );
      return lastResult;
    }

    marker.visible = true;
    marker.position.set(...point.position);
    const result = resolveLanding(deps.world, point, deps.trackBodies);
    if (result.status === "ready" && result.position && result.distance !== null) {
      guide.visible = true;
      guide.position.set(point.position[0], result.position[1], point.position[2]);
      const dotCount = Math.min(
        GUIDE_MAX_DOTS,
        Math.max(2, Math.ceil(result.distance / GUIDE_DOT_SPACING) + 1),
      );
      dotTransform.scale.set(1, 1 / result.distance, 1);
      for (let index = 0; index < dotCount; index += 1) {
        dotTransform.position.set(0, index / (dotCount - 1), 0);
        dotTransform.updateMatrix();
        guide.setMatrixAt(index, dotTransform.matrix);
      }
      guide.count = dotCount;
      guide.instanceMatrix.needsUpdate = true;
      guide.scale.set(1, result.distance, 1);
    } else {
      guide.visible = false;
    }
    publish(result, point);
    return result;
  }

  function currentPoint(): DropPoint | null {
    return preview === undefined ? deps.state.point : preview;
  }

  return {
    setPreview(position) {
      preview = position === null ? undefined : createDropPoint(position);
      return render(currentPoint());
    },
    refresh() {
      return render(currentPoint());
    },
    dispose() {
      deps.scene.remove(marker, guide);
      marker.geometry.dispose();
      (marker.material as MeshStandardMaterial).dispose();
      guide.geometry.dispose();
      guide.material.dispose();
    },
    get lastResult() {
      return lastResult;
    },
  };
}
