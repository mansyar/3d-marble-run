import { Mesh, MeshPhysicalMaterial, SphereGeometry } from "three";

/** Shared across every marble — geometry and material are created exactly once. */
export const MARBLE_RADIUS = 0.1;

let geometry: SphereGeometry | null = null;
let material: MeshPhysicalMaterial | null = null;

/**
 * The signature candy-glass marble. Clearcoat + low roughness over a deep
 * candy-red base gives the glossy toy look without costly transmission passes
 * (mobile budget). Callers must NOT dispose or mutate the shared material.
 */
export function createMarbleMesh(): Mesh<SphereGeometry, MeshPhysicalMaterial> {
  if (!geometry) geometry = new SphereGeometry(MARBLE_RADIUS, 24, 16);
  if (!material) {
    material = new MeshPhysicalMaterial({
      color: 0xe5383b,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
    });
  }
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  return mesh;
}
