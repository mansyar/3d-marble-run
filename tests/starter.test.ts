import { ColliderDesc, RigidBodyDesc } from "@dimforge/rapier3d-compat";
import { Scene } from "three";
import { describe, expect, it, vi } from "vitest";
import { spawnStaticPiece } from "../src/pieces/builders";
import { MARBLE_RADIUS } from "../src/pieces/marble";
import { createGoalTracker, type GoalEntry } from "../src/sim/goals";
import { createPhysics } from "../src/sim/physics";
import type { TrackGraph } from "../src/track/graph";
import { createStarterGraph } from "../src/track/starter";
import { loadInitialTrack } from "../src/track/startup";

function connectedRefs(graph: TrackGraph): number {
  let count = 0;
  for (const piece of graph.pieces.values()) {
    for (const connection of Object.values(piece.connections)) {
      if (connection) count += 1;
    }
  }
  return count;
}

describe("starter track", () => {
  it("creates a five-piece connected starter contraption", () => {
    const graph = createStarterGraph();

    expect([...graph.pieces.values()].map((piece) => piece.typeId).sort()).toEqual([
      "curve",
      "funnel",
      "goal-cup",
      "ramp",
      "straight",
    ]);
    expect(graph.nextId).toBe(6);
    expect(connectedRefs(graph)).toBe(8);

    for (const piece of graph.pieces.values()) {
      for (const connection of Object.values(piece.connections)) {
        if (!connection) continue;
        const partner = graph.pieces.get(connection.pieceId);
        expect(partner?.connections[connection.portId]).toEqual({
          pieceId: piece.id,
          portId: expect.any(String),
        });
      }
    }
  });

  it("lets a marble traverse the starter path into the goal cup", async () => {
    const graph = createStarterGraph();
    const world = await createPhysics();
    const scene = new Scene();
    for (const piece of graph.pieces.values()) {
      spawnStaticPiece(scene, world, piece.typeId, piece.placement);
    }

    const body = world.createRigidBody(RigidBodyDesc.dynamic().setTranslation(0, 4, 0));
    world.createCollider(ColliderDesc.ball(MARBLE_RADIUS), body);
    const goals = createGoalTracker();
    let entries: GoalEntry[] = [];

    for (let step = 0; step < 600 && entries.length === 0; step += 1) {
      world.step();
      const position = body.translation();
      entries = goals.update(graph.pieces.values(), [
        { id: 1, position: [position.x, position.y, position.z] },
      ]);
    }

    expect(entries).toHaveLength(1);
    expect(entries[0]?.goalPieceId).toBe("piece-5");
  });
});

describe("startup track loading", () => {
  it("loads the autosave without replacing it with the starter", async () => {
    const saved = createStarterGraph();
    const storage = {
      load: vi.fn(async () => saved),
      flushAutosave: vi.fn(async () => undefined),
    };

    const graph = await loadInitialTrack(storage);

    expect(graph).toBe(saved);
    expect(storage.flushAutosave).not.toHaveBeenCalled();
  });

  it("creates and persists the starter when no autosave exists", async () => {
    const storage = {
      load: vi.fn(async () => null),
      flushAutosave: vi.fn(async () => undefined),
    };

    const graph = await loadInitialTrack(storage);

    expect(graph.pieces.size).toBe(5);
    expect(storage.flushAutosave).toHaveBeenCalledWith(graph);
  });
});
