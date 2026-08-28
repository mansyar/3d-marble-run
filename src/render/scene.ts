import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { getQualityMode, type QualityMode, resolveQuality } from "../core/quality";

const TABLE_COLOR = 0xc79a63;
const SKY_COLOR = 0xfbf7ef;
const MOBILE_VIEWPORT_QUERY = "(max-width: 768px)";
const DESKTOP_CAMERA_POSITION = [6, 7, 9] as const;
const DESKTOP_CAMERA_TARGET = [0, 0, 0] as const;
const MOBILE_CAMERA_POSITION = [6.5, 8, 11.5] as const;
const MOBILE_CAMERA_TARGET = [0.5, 1, 2.5] as const;

export interface SceneHandle {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  initialCameraTarget: readonly [number, number, number];
  applyQuality: (mode: QualityMode) => void;
}

/**
 * Boots the Three.js renderer inside the given container: a warm wooden
 * playroom-table world with bright, soft, even lighting per product-guidelines.
 * Handles responsive resizing and starts the render loop.
 */
export function initScene(
  container: HTMLElement,
  onFrame?: (elapsedMs: number) => void,
): SceneHandle {
  const compactViewport =
    window.matchMedia(MOBILE_VIEWPORT_QUERY).matches || navigator.maxTouchPoints > 0;
  const deviceMemory = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
  const qualityMode = getQualityMode();
  const caps = resolveQuality({ compact: compactViewport, deviceMemory }, qualityMode);
  const renderer = new WebGLRenderer({
    antialias: qualityMode === "high" || !compactViewport,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, caps.dprCap));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(SKY_COLOR);

  // Procedural studio reflections — the toy-plastic gloss source. No assets.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  );
  const initialCameraPosition: readonly [number, number, number] = compactViewport
    ? MOBILE_CAMERA_POSITION
    : DESKTOP_CAMERA_POSITION;
  const initialCameraTarget: readonly [number, number, number] = compactViewport
    ? MOBILE_CAMERA_TARGET
    : DESKTOP_CAMERA_TARGET;
  camera.position.set(...initialCameraPosition);
  camera.lookAt(...initialCameraTarget);

  // Bright, soft, even lighting: warm sky bounce plus one soft key light.
  const hemisphere = new HemisphereLight(0xffffff, 0xd8c3a5, 0.95);
  const sun = new DirectionalLight(0xfff4e0, 1.6);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.radius = 2;
  sun.shadow.mapSize.set(caps.shadowSize, caps.shadowSize);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  scene.add(hemisphere, sun);

  // The playroom table the whole toy world sits on.
  const table = new Mesh(
    new PlaneGeometry(60, 60),
    new MeshStandardMaterial({ color: TABLE_COLOR, roughness: 0.85 }),
  );
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  function onResize(): void {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", onResize);

  function applyQuality(mode: QualityMode): void {
    const nextCaps = resolveQuality({ compact: compactViewport, deviceMemory }, mode);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, nextCaps.dprCap));
    sun.shadow.mapSize.set(nextCaps.shadowSize, nextCaps.shadowSize);
    // Force shadow map reallocation on next render.
    sun.shadow.map = null;
  }

  let lastTime = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    onFrame?.(now - lastTime);
    lastTime = now;
    renderer.render(scene, camera);
  });

  return { scene, camera, renderer, initialCameraTarget, applyQuality };
}
