import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addPiece, createTrackGraph } from "../src/track/graph";
import { assessTrackHealth } from "../src/track/health";
import { createStarterGraph } from "../src/track/starter";
import { AUTOSAVE_SLOT, createTrackStorage } from "../src/track/storage";

let databaseNumber = 0;

function newStorage() {
  databaseNumber += 1;
  return createTrackStorage({
    databaseName: `marblescape-test-${databaseNumber}`,
    debounceMs: 5,
  });
}

describe("track storage", () => {
  it("saves, lists, loads, and deletes named slots", async () => {
    const storage = newStorage();
    const graph = createTrackGraph();
    addPiece(graph, "straight", { position: [1, 0, 2], yawDeg: 45 });

    await storage.save("alpha", graph);
    await storage.save("beta", graph);

    expect((await storage.list()).map((slot) => slot.name).sort()).toEqual(["alpha", "beta"]);
    expect(await storage.load("alpha")).toEqual(graph);
    expect(await storage.load("missing")).toBeNull();

    await storage.remove("alpha");
    expect((await storage.list()).map((slot) => slot.name)).toEqual(["beta"]);
    storage.dispose();
  });

  it("debounces autosave and flushes pending work", async () => {
    const storage = newStorage();
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [0, 0, 3], yawDeg: 0 });

    storage.scheduleAutosave(graph);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await storage.load(AUTOSAVE_SLOT)).toEqual(graph);

    addPiece(graph, "ramp", { position: [2, 0, 1], yawDeg: 90 });
    storage.scheduleAutosave(graph);
    await storage.flushAutosave(graph);
    expect(await storage.load(AUTOSAVE_SLOT)).toEqual(graph);
    storage.dispose();
  });

  it("protects the autosave slot and trims named lookups", async () => {
    const storage = newStorage();
    const graph = createTrackGraph();
    addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });

    await storage.save(" alpha ", graph);
    expect(await storage.load(" alpha ")).toEqual(graph);
    await expect(storage.save(AUTOSAVE_SLOT, graph)).rejects.toThrow();
    await expect(storage.remove(` ${AUTOSAVE_SLOT} `)).rejects.toThrow();
    await storage.remove(" alpha ");
    expect(await storage.list()).toEqual([]);
    storage.dispose();
  });

  it("preserves a connected start gate in named and autosave slots", async () => {
    const storage = newStorage();
    const graph = createStarterGraph();

    await storage.save("starter", graph);
    storage.scheduleAutosave(graph);
    await storage.flushAutosave(graph);

    for (const loaded of [await storage.load("starter"), await storage.load(AUTOSAVE_SLOT)]) {
      expect(loaded?.pieces.size).toBe(6);
      expect(
        [...(loaded?.pieces.values() ?? [])].filter((piece) => piece.typeId === "start-gate"),
      ).toHaveLength(1);
      expect(loaded && assessTrackHealth(loaded).status).toBe("ready");
    }
    storage.dispose();
  });
});
