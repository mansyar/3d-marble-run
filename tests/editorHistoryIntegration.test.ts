import { PerspectiveCamera } from "three";
import { describe, expect, it } from "vitest";
import { createDropPointController } from "../src/build/dropPointController";
import { createDropPointState } from "../src/build/dropPointPlacement";
import { createEditorHistory } from "../src/core/editorHistory";
import type { Placement } from "../src/pieces/registry";
import { DeleteCommand, MoveCommand, PlaceCommand } from "../src/track/commands";
import { addPiece, connect, createTrackGraph, getPiece } from "../src/track/graph";

interface PointerLike {
  clientX: number;
  clientY: number;
}

interface KeyboardLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  preventDefault: () => void;
}

interface GlobalWindowHolder {
  window?: {
    addEventListener: (...args: unknown[]) => void;
  };
}

function createPointerSurface(): {
  domElement: HTMLElement;
  dispatch: (type: string) => void;
} {
  const listeners = new Map<string, (event: PointerLike) => void>();
  const domElement = {
    addEventListener(type: string, listener: (event: PointerLike) => void) {
      listeners.set(type, listener);
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 100, height: 100 } as DOMRect;
    },
  } as unknown as HTMLElement;

  return {
    domElement,
    dispatch(type) {
      listeners.get(type)?.({ clientX: 50, clientY: 50 });
    },
  };
}

function createCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 10, 10);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return camera;
}

function withFakeWindow<T>(run: (dispatchKey: (event: Partial<KeyboardLike>) => void) => T): T {
  const globalObject = globalThis as unknown as GlobalWindowHolder;
  const previousWindow = globalObject.window;
  let keydownListener: ((event: KeyboardLike) => void) | undefined;
  globalObject.window = { addEventListener() {} };
  globalObject.window.addEventListener = (...args: unknown[]) => {
    keydownListener = args[1] as (event: KeyboardLike) => void;
  };
  try {
    return run((event) => {
      keydownListener?.({
        key: "",
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        preventDefault: () => {},
        ...event,
      });
    });
  } finally {
    globalObject.window = previousWindow;
  }
}

function createDropPointEditorController(
  history: ReturnType<typeof createEditorHistory>,
  state = createDropPointState(),
  sync = () => {},
) {
  const surface = createPointerSurface();
  const controller = createDropPointController({
    camera: createCamera(),
    domElement: surface.domElement,
    state,
    history,
    sync,
    onChange: () => {},
  });
  return { controller, dispatch: surface.dispatch, state };
}

describe("integrated editor history", () => {
  it("undoes a Drop point edit before an earlier graph command", () => {
    withFakeWindow(() => {
      const graph = createTrackGraph();
      const history = createEditorHistory();
      history.execute(
        graph,
        new PlaceCommand("piece-1", "straight", {
          position: [0, 0, 0],
          yawDeg: 0,
        }),
      );
      const { controller, dispatch, state } = createDropPointEditorController(history);

      controller.begin();
      dispatch("pointerup");
      expect(state.point).not.toBeNull();

      expect(history.undo()).toBe(true);
      expect(state.point).toBeNull();
      expect(getPiece(graph, "piece-1")).toBeDefined();
      expect(history.undo()).toBe(true);
      expect(getPiece(graph, "piece-1")).toBeUndefined();
    });
  });

  it("restores connected pieces after a mixed Drop point and move history", () => {
    withFakeWindow(() => {
      const graph = createTrackGraph();
      const first = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
      const second = addPiece(graph, "straight", { position: [0, 0, 2], yawDeg: 0 });
      expect(connect(graph, first, "b", second, "a")).toBe(true);
      const before = structuredClone(getPiece(graph, first));
      if (!before) throw new Error("expected first piece");
      const after: Placement = { position: [5, 0, 5], yawDeg: 90 };
      const history = createEditorHistory();
      history.execute(graph, new MoveCommand(first, before.placement, after, undefined, before));
      const { controller, dispatch, state } = createDropPointEditorController(history);

      controller.begin();
      dispatch("pointerup");
      expect(state.point).not.toBeNull();
      expect(getPiece(graph, second)?.connections.a).toBeNull();

      expect(history.undo()).toBe(true);
      expect(history.undo()).toBe(true);
      expect(getPiece(graph, first)?.placement).toEqual(before.placement);
      expect(getPiece(graph, first)?.connections.b).toEqual({
        pieceId: second,
        portId: "a",
      });
      expect(getPiece(graph, second)?.connections.a).toEqual({
        pieceId: first,
        portId: "b",
      });
    });
  });

  it("restores deleted connections after a mixed Drop point and delete history", () => {
    withFakeWindow(() => {
      const graph = createTrackGraph();
      const first = addPiece(graph, "straight", { position: [0, 0, 0], yawDeg: 0 });
      const second = addPiece(graph, "straight", { position: [0, 0, 2], yawDeg: 0 });
      expect(connect(graph, first, "b", second, "a")).toBe(true);
      const snapshot = structuredClone(getPiece(graph, first));
      if (!snapshot) throw new Error("expected first piece");
      const history = createEditorHistory();
      history.execute(graph, new DeleteCommand(first, snapshot));
      const { controller, dispatch, state } = createDropPointEditorController(history);

      controller.begin();
      dispatch("pointerup");
      expect(history.undo()).toBe(true);
      expect(history.undo()).toBe(true);
      expect(getPiece(graph, first)?.connections.b).toEqual({
        pieceId: second,
        portId: "a",
      });
      expect(getPiece(graph, second)?.connections.a).toEqual({
        pieceId: first,
        portId: "b",
      });
      expect(state.point).toBeNull();
    });
  });

  it("does not record a cancelled Drop point preview", () => {
    withFakeWindow(() => {
      const history = createEditorHistory();
      const { controller, dispatch, state } = createDropPointEditorController(history);

      controller.begin();
      dispatch("pointermove");
      controller.cancel();

      expect(state.point).toBeNull();
      expect(history.canUndo()).toBe(false);
      expect(history.canRedo()).toBe(false);
    });
  });

  it("synchronizes the scene when controller history changes graph state", () => {
    withFakeWindow(() => {
      const graph = createTrackGraph();
      const history = createEditorHistory();
      history.execute(
        graph,
        new PlaceCommand("piece-1", "straight", {
          position: [0, 0, 0],
          yawDeg: 0,
        }),
      );
      let syncCount = 0;
      const { controller } = createDropPointEditorController(history, undefined, () => {
        syncCount += 1;
      });

      expect(controller.undo()).toBe(true);
      expect(getPiece(graph, "piece-1")).toBeUndefined();
      expect(syncCount).toBe(1);
      expect(controller.redo()).toBe(true);
      expect(getPiece(graph, "piece-1")).toBeDefined();
      expect(syncCount).toBe(2);
    });
  });

  it("routes keyboard Undo and Redo through shared history", () => {
    withFakeWindow((dispatchKey) => {
      const graph = createTrackGraph();
      const history = createEditorHistory();
      history.execute(
        graph,
        new PlaceCommand("piece-1", "straight", {
          position: [0, 0, 0],
          yawDeg: 0,
        }),
      );
      let syncCount = 0;
      createDropPointEditorController(history, undefined, () => {
        syncCount += 1;
      });

      dispatchKey({ key: "z", ctrlKey: true });
      expect(getPiece(graph, "piece-1")).toBeUndefined();
      dispatchKey({ key: "z", ctrlKey: true, shiftKey: true });
      expect(getPiece(graph, "piece-1")).toBeDefined();
      dispatchKey({ key: "z", ctrlKey: true });
      dispatchKey({ key: "y", ctrlKey: true });
      expect(getPiece(graph, "piece-1")).toBeDefined();
      expect(syncCount).toBe(4);
    });
  });
});
