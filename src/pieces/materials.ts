import { MeshStandardMaterial } from "three";
import type { PieceTypeId } from "./registry";

/**
 * One bold hue per piece type (product-guidelines: shape + hue dual coding).
 * Warm toy-plastic gloss comes from low roughness; no textures anywhere.
 */
export const PIECE_COLORS: Record<PieceTypeId, number> = {
  straight: 0xd62828, // red
  curve: 0xf18805, // orange
  ramp: 0x2a9d8f, // green
  funnel: 0x3a86ff, // blue
  "goal-cup": 0xffc300, // reward gold
  splitter: 0xe85d04, // burnt orange (curve's shade family)
  bumper: 0xf4978e, // light coral (red-family tint, reads as toy rubber)
};

export function makePieceMaterial(typeId: PieceTypeId): MeshStandardMaterial {
  return new MeshStandardMaterial({
    color: PIECE_COLORS[typeId],
    roughness: 0.35,
    metalness: 0,
  });
}
