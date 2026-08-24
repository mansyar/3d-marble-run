import { type PerspectiveCamera, Spherical, Vector2, Vector3 } from "three";

export interface FreeOrbitCameraOptions {
  camera: PerspectiveCamera;
  domElement: HTMLElement;
  /** Prevents camera gestures while a piece placement/move owns the pointer. */
  isLocked?: () => boolean;
}

export interface FreeOrbitCamera {
  reset(): void;
  dispose(): void;
}

const MIN_RADIUS = 3;
const MAX_RADIUS = 28;
const MIN_POLAR_ANGLE = 0.18;
const MAX_POLAR_ANGLE = 1.48;
const ROTATE_SPEED = 0.008;
const PAN_SPEED = 0.0025;
const PINCH_ZOOM_SPEED = 0.004;
const WHEEL_ZOOM_SPEED = 0.001;

type MouseMode = "rotate" | "pan";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Adds bounded orbit, zoom, and pan gestures to the main Three.js camera. */
export function createFreeOrbitCamera(options: FreeOrbitCameraOptions): FreeOrbitCamera {
  const { camera, domElement, isLocked } = options;
  const target = new Vector3(0, 0, 0);
  const initialTarget = target.clone();
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
    if (isLocked?.()) return;

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
    applyCamera();
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
    if (isLocked?.()) return;
    zoom(event.deltaY * WHEEL_ZOOM_SPEED);
    applyCamera();
    event.preventDefault();
  }

  function onContextMenu(event: MouseEvent): void {
    if (activePointers.size > 0) event.preventDefault();
  }

  function reset(): void {
    target.copy(initialTarget);
    spherical.copy(initialSpherical);
    applyCamera();
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
  return { reset, dispose };
}
