import "./style.css";
import { type BootPhase, createBootController } from "./core/boot";

const bootScreen = document.querySelector<HTMLElement>("#boot-screen");
const bootRetry = document.querySelector<HTMLElement>("#boot-retry");
const retryButton = document.querySelector<HTMLButtonElement>("#boot-retry-button");

/**
 * The physics runtime (Rapier + embedded WASM, ~2/3 of the payload) lives in
 * ./app and is fetched as a separate cacheable chunk while the branded boot
 * screen from index.html is already on screen.
 */
const controller = createBootController(async () => {
  await import("./app");
});

function renderPhase(phase: BootPhase): void {
  if (phase === "ready") {
    bootScreen?.classList.add("boot-done");
    window.setTimeout(() => bootScreen?.remove(), 400);
  } else if (phase === "failed") {
    bootScreen?.classList.add("boot-failed");
    if (bootRetry) bootRetry.hidden = false;
  }
}

controller.onPhase(renderPhase);
retryButton?.addEventListener("click", () => controller.retry());
controller.begin();
