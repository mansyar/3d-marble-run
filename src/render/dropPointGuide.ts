import type { World } from "@dimforge/rapier3d-compat";
import { CylinderGeometry, Mesh, MeshStandardMaterial, type Scene, SphereGeometry } from "three";
import type { DropPointState } from "../build/dropPointPlacement";
import type { Vec3 } from "../pieces/registry";
import { type LandingResult, resolveLanding } from "../sim/landing";
import { createDropPoint, type DropPoint } from "../track/dropPoint";

const MARKER_COLOR = 0x8338ec;
const GUIDE_COLOR = 0x2a9d8f;

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

  const guide = new Mesh(
    new CylinderGeometry(0.025, 0.025, 1, 12),
    new MeshStandardMaterial({
      color: GUIDE_COLOR,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
    }),
  );
  guide.visible = false;
  deps.scene.add(marker, guide);

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
      guide.position.set(
        point.position[0],
        result.position[1] + result.distance / 2,
        point.position[2],
      );
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
      (guide.material as MeshStandardMaterial).dispose();
    },
    get lastResult() {
      return lastResult;
    },
  };
}
