import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createDropPoint } from "../src/track/dropPoint";
import { addPiece, createTrackGraph } from "../src/track/graph";
import { createStarterDocument } from "../src/track/starter";
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
    const document = { graph, dropPoint: createDropPoint([1, 4, 2]) };

    await storage.save("alpha", document);
    await storage.save("beta", document);

    expect((await storage.list()).map((slot) => slot.name).sort()).toEqual(["alpha", "beta"]);
    expect(await storage.load("alpha")).toEqual(document);
    expect(await storage.load("missing")).toBeNull();

    await storage.remove("alpha");
    expect((await storage.list()).map((slot) => slot.name)).toEqual(["beta"]);
    storage.dispose();
  });

  it("debounces autosave and flushes pending work", async () => {
    const storage = newStorage();
    const graph = createTrackGraph();
    addPiece(graph, "goal-cup", { position: [0, 0, 3], yawDeg: 0 });
    const document = { graph, dropPoint: null };

    storage.scheduleAutosave(document);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await storage.load(AUTOSAVE_SLOT)).toEqual(document);

    addPiece(graph, "ramp", { position: [2, 0, 1], yawDeg: 90 });
    storage.scheduleAutosave(document);
    await storage.flushAutosave(document);
    expect(await storage.load(AUTOSAVE_SLOT)).toEqual(document);
    storage.dispose();
  });

  it("protects the autosave slot and trims named lookups", async () => {
    const storage = newStorage();
    const graph = createTrackGraph();
    addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
    const document = { graph, dropPoint: null };

    await storage.save(" alpha ", document);
    expect(await storage.load(" alpha ")).toEqual(document);
    await expect(storage.save(AUTOSAVE_SLOT, document)).rejects.toThrow();
    await expect(storage.remove(` ${AUTOSAVE_SLOT} `)).rejects.toThrow();
    await storage.remove(" alpha ");
    expect(await storage.list()).toEqual([]);
    storage.dispose();
  });

  it("preserves the Drop point in named and autosave slots", async () => {
    const storage = newStorage();
    const document = createStarterDocument();

    await storage.save("starter", document);
    storage.scheduleAutosave(document);
    await storage.flushAutosave(document);

    for (const loaded of [await storage.load("starter"), await storage.load(AUTOSAVE_SLOT)]) {
      expect(loaded?.graph.pieces.size).toBe(5);
      expect(
        [...(loaded?.graph.pieces.values() ?? [])].some((piece) => piece.typeId === "start-gate"),
      ).toBe(false);
      expect(loaded?.dropPoint).toEqual({ position: [0, 4, 0] });
    }
    storage.dispose();
  });
});
