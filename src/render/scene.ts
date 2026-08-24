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

const TABLE_COLOR = 0xc79a63;
const SKY_COLOR = 0xfbf7ef;

export interface SceneHandle {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
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
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  scene.background = new Color(SKY_COLOR);

  // Procedural studio reflections — the toy-plastic gloss source. No assets.
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    200,
  );
  camera.position.set(6, 7, 9);
  camera.lookAt(0, 0, 0);

  // Bright, soft, even lighting: warm sky bounce plus one soft key light.
  const hemisphere = new HemisphereLight(0xffffff, 0xd8c3a5, 0.9);
  const sun = new DirectionalLight(0xfff4e0, 1.6);
  sun.position.set(8, 14, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 15;
  sun.shadow.camera.bottom = -15;
  scene.add(hemisphere, sun);

  // The playroom table the whole toy world sits on.
  const table = new Mesh(
    new PlaneGeometry(60, 60),
    new MeshStandardMaterial({ color: TABLE_COLOR, roughness: 0.9 }),
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

  let lastTime = performance.now();
  renderer.setAnimationLoop(() => {
    const now = performance.now();
    onFrame?.(now - lastTime);
    lastTime = now;
    renderer.render(scene, camera);
  });

  return { scene, camera, renderer };
}
