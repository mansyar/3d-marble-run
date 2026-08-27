import { describe, expect, it, vi } from "vitest";
import { createBootController } from "../src/core/boot";

/** Resolvable/rejectable promise handle for driving async boot flows in tests. */
interface Deferred {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: unknown) => void;
}

function createDeferred(): Deferred {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("createBootController", () => {
  it("starts in the loading phase before begin is called", () => {
    const controller = createBootController(() => Promise.resolve());
    expect(controller.phase()).toBe("loading");
  });

  it("invokes start exactly once per begin", async () => {
    const start = vi.fn(() => Promise.resolve());
    const controller = createBootController(start);
    controller.begin();
    controller.begin();
    await vi.waitFor(() => expect(controller.phase()).toBe("ready"));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("transitions to ready when start resolves", async () => {
    const deferred = createDeferred();
    const controller = createBootController(() => deferred.promise);
    controller.begin();
    expect(controller.phase()).toBe("loading");
    deferred.resolve();
    await vi.waitFor(() => expect(controller.phase()).toBe("ready"));
  });

  it("transitions to failed when start rejects", async () => {
    const deferred = createDeferred();
    const controller = createBootController(() => deferred.promise);
    controller.begin();
    deferred.reject(new Error("wasm unavailable"));
    await vi.waitFor(() => expect(controller.phase()).toBe("failed"));
  });

  it("retry from ready is ignored and does not re-run start", async () => {
    const start = vi.fn(() => Promise.resolve());
    const controller = createBootController(start);
    controller.begin();
    await vi.waitFor(() => expect(controller.phase()).toBe("ready"));
    controller.retry();
    expect(controller.phase()).toBe("ready");
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("retry from failed returns to loading and re-runs start", async () => {
    const first = createDeferred();
    const second = createDeferred();
    const runs = [first.promise, second.promise];
    let attempt = 0;
    const controller = createBootController(() => runs[attempt++] ?? second.promise);
    controller.begin();
    first.reject(new Error("offline"));
    await vi.waitFor(() => expect(controller.phase()).toBe("failed"));
    controller.retry();
    expect(controller.phase()).toBe("loading");
    second.resolve();
    await vi.waitFor(() => expect(controller.phase()).toBe("ready"));
    expect(attempt).toBe(2);
  });

  it("retry while a start attempt is in flight does not re-run start", async () => {
    const deferred = createDeferred();
    const start = vi.fn(() => deferred.promise);
    const controller = createBootController(start);
    controller.begin();
    controller.retry();
    deferred.reject(new Error("slow"));
    await vi.waitFor(() => expect(controller.phase()).toBe("failed"));
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("notifies listeners of each phase transition", () => {
    const first = createDeferred();
    const second = createDeferred();
    const runs = [first.promise, second.promise];
    let attempt = 0;
    const controller = createBootController(() => runs[attempt++] ?? second.promise);
    const listener = vi.fn();
    controller.onPhase(listener);
    expect(listener).not.toHaveBeenCalled();
    controller.begin();
    first.reject(new Error("offline"));
    return vi
      .waitFor(() => expect(controller.phase()).toBe("failed"))
      .then(() => {
        controller.retry();
        expect(listener.mock.calls.map(([phase]) => phase)).toEqual(["failed", "loading"]);
      });
  });

  it("does not notify listeners when the phase does not change", async () => {
    const start = vi.fn(() => Promise.resolve());
    const controller = createBootController(start);
    const listener = vi.fn();
    controller.onPhase(listener);
    controller.begin();
    controller.begin();
    await vi.waitFor(() => expect(controller.phase()).toBe("ready"));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("ready");
  });

  it("stops notifying after unsubscribe", async () => {
    const deferred = createDeferred();
    const controller = createBootController(() => deferred.promise);
    const listener = vi.fn();
    const unsubscribe = controller.onPhase(listener);
    unsubscribe();
    controller.begin();
    deferred.reject(new Error("offline"));
    await vi.waitFor(() => expect(controller.phase()).toBe("failed"));
    expect(listener).not.toHaveBeenCalled();
  });
});
