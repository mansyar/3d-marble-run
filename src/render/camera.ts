import { type PerspectiveCamera, Spherical, Vector2, Vector3 } from "three";

export interface FreeOrbitCameraOptions {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  /** Prevents camera gestures while a piece placement/move owns the pointer. */
  isLocked?: () => boolean;
  /** Camera target to restore when the user resets the view. */
  initialTarget?: CameraTarget;
}

export type CameraMode = "free" | "chase";
export type CameraTarget = readonly [number, number, number];

export interface FreeOrbitCamera {
  reset(): void;
  dispose(): void;
  mode(): CameraMode;
  toggleMode(): CameraMode;
  update(elapsedMs: number, chaseTarget: CameraTarget | null): void;
}

const MIN_RADIUS = 3;
const MAX_RADIUS = 28;
const MIN_POLAR_ANGLE = 0.18;
const MAX_POLAR_ANGLE = 1.48;
const ROTATE_SPEED = 0.008;
const PAN_SPEED = 0.0025;
const PINCH_ZOOM_SPEED = 0.004;
const WHEEL_ZOOM_SPEED = 0.001;
const MODE_TRANSITION_MS = 800;

type MouseMode = "rotate" | "pan";

type ModeTransition =
  | { kind: "none" }
  | { kind: "toChase"; elapsedMs: number; fromPos: Vector3; fromLook: Vector3 }
  | { kind: "toFree"; elapsedMs: number; fromPos: Vector3; fromLook: Vector3 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

/** Adds bounded orbit, zoom, and pan gestures to the main Three.js camera. */
export function createFreeOrbitCamera(options: FreeOrbitCameraOptions): FreeOrbitCamera {
  const { camera, domElement, isLocked } = options;
  const target = new Vector3(...(options.initialTarget ?? [0, 0, 0]));
  const resetTarget = target.clone();
  const spherical = new Spherical().setFromVector3(camera.position.clone().sub(target));
  spherical.radius = clamp(spherical.radius, MIN_RADIUS, MAX_RADIUS);
  spherical.phi = clamp(spherical.phi, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE);
  const initialSpherical = spherical.clone();
  const offset = new Vector3();
  const right = new Vector3();
  const up = new Vector3();
  const activePointers = new Map<number, Vector2>();
  let mouseMode: MouseMode | null = null;
  let pinchDistance = 0;
  let pinchMidpoint = new Vector2();
  let cameraMode: CameraMode = "free";
  let transition: ModeTransition = { kind: "none" };
  const chaseLookAt = new Vector3();
  const chasePosition = new Vector3();
  const chaseOffset = new Vector3(5, 4, 7);
  const scratchLook = new Vector3();
  const scratchDest = new Vector3();
  const scratchSpherical = new Spherical();
  function applyCamera(): void {
    spherical.radius = clamp(spherical.radius, MIN_RADIUS, MAX_RADIUS);
    spherical.phi = clamp(spherical.phi, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE);
    offset.setFromSpherical(spherical);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
  }

  function pan(deltaX: number, deltaY: number): void {
    camera.updateMatrixWorld();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    const scale = spherical.radius * PAN_SPEED;
    target.addScaledVector(right, -deltaX * scale);
    target.addScaledVector(up, deltaY * scale);
    target.x = clamp(target.x, -30, 30);
    target.y = clamp(target.y, -2, 8);
    target.z = clamp(target.z, -30, 30);
  }

  function rotate(deltaX: number, deltaY: number): void {
    spherical.theta -= deltaX * ROTATE_SPEED;
    spherical.phi -= deltaY * ROTATE_SPEED;
  }

  function zoom(delta: number): void {
    spherical.radius *= Math.exp(delta);
  }

  function points(): Vector2[] {
    return [...activePointers.values()];
  }

  function midpoint(a: Vector2, b: Vector2): Vector2 {
    return new Vector2((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  function beginTouchGesture(): void {
    const current = points();
    if (current.length === 1) {
      mouseMode = "rotate";
      pinchDistance = 0;
      pinchMidpoint = current[0].clone();
    } else if (current.length === 2) {
      pinchDistance = current[0].distanceTo(current[1]);
      pinchMidpoint = midpoint(current[0], current[1]);
      mouseMode = null;
    }
  }

  function onPointerDown(event: PointerEvent): void {
    if (cameraMode === "chase" || isLocked?.()) return;

    if (event.pointerType === "mouse") {
      if (event.button === 0) mouseMode = "rotate";
      else if (event.button === 1 || event.button === 2) mouseMode = "pan";
      else return;
    }

    activePointers.set(event.pointerId, new Vector2(event.clientX, event.clientY));
    if (event.pointerType !== "mouse") beginTouchGesture();
    domElement.setPointerCapture?.(event.pointerId);
    domElement.classList.add("camera-orbiting");
    event.preventDefault();
  }

  function onPointerMove(event: PointerEvent): void {
    const previous = activePointers.get(event.pointerId);
    if (!previous) return;

    const current = new Vector2(event.clientX, event.clientY);
    activePointers.set(event.pointerId, current);
    if (event.pointerType !== "mouse" && activePointers.size >= 2) {
      const [first, second] = points();
      const nextDistance = first.distanceTo(second);
      const nextMidpoint = midpoint(first, second);
      zoom((pinchDistance - nextDistance) * PINCH_ZOOM_SPEED);
      pan(nextMidpoint.x - pinchMidpoint.x, nextMidpoint.y - pinchMidpoint.y);
      pinchDistance = nextDistance;
      pinchMidpoint = nextMidpoint;
    } else if (mouseMode === "rotate") {
      rotate(current.x - previous.x, current.y - previous.y);
    } else if (mouseMode === "pan") {
      pan(current.x - previous.x, current.y - previous.y);
    } else {
      return;
    }
    // While easing back to the orbit framing, keep target/spherical in sync but
    // let the transition own the camera transform (it lands on this framing).
    if (transition.kind !== "toFree") applyCamera();
    event.preventDefault();
  }

  function endPointer(event: PointerEvent): void {
    activePointers.delete(event.pointerId);
    domElement.releasePointerCapture?.(event.pointerId);
    if (event.pointerType !== "mouse" && activePointers.size > 0) {
      beginTouchGesture();
    } else if (activePointers.size === 0) {
      mouseMode = null;
      domElement.classList.remove("camera-orbiting");
    }
  }

  function onWheel(event: WheelEvent): void {
    if (cameraMode === "chase" || isLocked?.()) return;
    zoom(event.deltaY * WHEEL_ZOOM_SPEED);
    if (transition.kind !== "toFree") applyCamera();
    event.preventDefault();
  }

  function onContextMenu(event: MouseEvent): void {
    if (activePointers.size > 0) event.preventDefault();
  }

  function reset(): void {
    target.copy(resetTarget);
    spherical.copy(initialSpherical);
    transition = { kind: "none" };
    applyCamera();
  }

  function mode(): CameraMode {
    return cameraMode;
  }

  function setMode(nextMode: CameraMode): void {
    if (cameraMode === nextMode) return;
    const fromPos = camera.position.clone();
    const fromLook = (cameraMode === "chase" ? chaseLookAt : target).clone();
    cameraMode = nextMode;
    activePointers.clear();
    mouseMode = null;
    domElement.classList.remove("camera-orbiting");
    if (prefersReducedMotion()) {
      transition = { kind: "none" };
      if (cameraMode === "free") applyCamera();
      return;
    }
    if (cameraMode === "free") {
      // Compute the destination orbit framing now; the flight eases toward it
      // (and toward whatever framing the user dials in mid-flight).
      applyCamera();
      transition = { kind: "toFree", elapsedMs: 0, fromPos, fromLook };
    } else {
      transition = { kind: "toChase", elapsedMs: 0, fromPos, fromLook };
    }
  }

  function toggleMode(): CameraMode {
    setMode(cameraMode === "free" ? "chase" : "free");
    return cameraMode;
  }

  function advanceTransition(active: { elapsedMs: number }, elapsedMs: number): number {
    active.elapsedMs += elapsedMs;
    const t = Math.min(active.elapsedMs / MODE_TRANSITION_MS, 1);
    if (t >= 1) transition = { kind: "none" };
    return easeInOutCubic(t);
  }

  function update(elapsedMs: number, targetPosition: CameraTarget | null): void {
    if (cameraMode === "chase") {
      if (!targetPosition) {
        // Nothing to ride yet — arrive instantly rather than flying to nowhere.
        transition = { kind: "none" };
        return;
      }
      chaseLookAt.set(targetPosition[0], targetPosition[1], targetPosition[2]);
      chasePosition.copy(chaseLookAt).add(chaseOffset);
      if (transition.kind === "toChase") {
        // Fly from the captured orbit framing to the (live) chase framing.
        const { fromPos, fromLook } = transition;
        const eased = advanceTransition(transition, elapsedMs);
        camera.position.lerpVectors(fromPos, chasePosition, eased);
        camera.lookAt(scratchLook.copy(fromLook).lerp(chaseLookAt, eased));
        return;
      }
      const blend = 1 - Math.exp(-Math.min(elapsedMs, 100) * 0.01);
      camera.position.lerp(chasePosition, blend);
      camera.lookAt(chaseLookAt);
      return;
    }
    if (transition.kind === "toFree") {
      // Ease from the chase framing back to the current orbit framing. The
      // destination is recomputed from the live orbit state so orbit/zoom
      // input during the flight lands exactly where the user dialed in.
      const { fromPos, fromLook } = transition;
      const eased = advanceTransition(transition, elapsedMs);
      const destination = scratchDest
        .setFromSpherical(
          scratchSpherical.set(
            clamp(spherical.radius, MIN_RADIUS, MAX_RADIUS),
            clamp(spherical.phi, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE),
            spherical.theta,
          ),
        )
        .add(target);
      camera.position.lerpVectors(fromPos, destination, eased);
      camera.lookAt(scratchLook.copy(fromLook).lerp(target, eased));
    }
  }

  function dispose(): void {
    domElement.removeEventListener("pointerdown", onPointerDown);
    domElement.removeEventListener("pointermove", onPointerMove);
    domElement.removeEventListener("pointerup", endPointer);
    domElement.removeEventListener("pointercancel", endPointer);
    domElement.removeEventListener("wheel", onWheel);
    domElement.removeEventListener("contextmenu", onContextMenu);
    domElement.classList.remove("camera-orbiting");
  }

  domElement.addEventListener("pointerdown", onPointerDown);
  domElement.addEventListener("pointermove", onPointerMove);
  domElement.addEventListener("pointerup", endPointer);
  domElement.addEventListener("pointercancel", endPointer);
  domElement.addEventListener("wheel", onWheel, { passive: false });
  domElement.addEventListener("contextmenu", onContextMenu);

  applyCamera();
  return { reset, dispose, mode, toggleMode, update };
}
