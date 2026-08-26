import type { AudioEngine } from "../audio/engine";
import type { SoundPreferences } from "../audio/preferences";

export interface SoundToggleDeps {
  preferences: SoundPreferences;
  engine: AudioEngine;
}

/**
 * Compact, persisted sound mute toggle for the top HUD. Rendering/input
 * glue: the mute state lives in `SoundPreferences` and the `AudioEngine`
 * (both unit-tested); this widget only binds them to one button.
 */
export function createSoundToggle(root: HTMLElement, deps: SoundToggleDeps): void {
  const { preferences, engine } = deps;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "sound-toggle";
  button.setAttribute("aria-label", "Toggle sound effects");

  function render(): void {
    const muted = preferences.isMuted();
    button.textContent = muted ? "Sound: Off" : "Sound: On";
    button.setAttribute("aria-pressed", String(!muted));
  }

  button.addEventListener("click", () => {
    const muted = !preferences.isMuted();
    preferences.setMuted(muted);
    engine.setMuted(muted);
    render();
  });

  render();
  root.appendChild(button);
}
