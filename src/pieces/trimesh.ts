import type { BufferGeometry } from "three";

/**
 * Extract vertex/index arrays suitable for Rapier trimesh colliders.
 * Thin-shell representation — fine for static guide surfaces (funnels, cups).
 */
export function geometryToTrimesh(geo: BufferGeometry): {
  vertices: Float32Array;
  indices: Uint32Array;
} {
  const indexed = geo.index;
  const positions = geo.getAttribute("position");
  const vertices = new Float32Array(positions.array as ArrayLike<number>);
  if (indexed) {
    return { vertices, indices: new Uint32Array(indexed.array as ArrayLike<number>) };
  }
  const count = positions.count;
  const indices = new Uint32Array(count);
  for (let i = 0; i < count; i++) indices[i] = i;
  return { vertices, indices };
}
