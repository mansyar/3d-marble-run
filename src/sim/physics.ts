import RAPIER from "@dimforge/rapier3d-compat";

/**
 * Initializes the Rapier WASM runtime and returns a physics world with
 * Earth-like gravity. Units are meters / seconds.
 */
export async function createPhysics(): Promise<RAPIER.World> {
  await RAPIER.init();
  return new RAPIER.World({ x: 0, y: -9.81, z: 0 });
}
