import { PIECE_COLORS } from "../pieces/materials";
import { PIECE_TYPE_IDS, type PieceTypeId } from "../pieces/registry";

const PIECE_LABELS: Record<PieceTypeId, string> = {
  straight: "Straight",
  curve: "Curve",
  ramp: "Ramp",
  funnel: "Funnel",
  "goal-cup": "Goal cup",
  splitter: "Splitter",
  bumper: "Bumper",
};

export type TraySelection = PieceTypeId | "drop-point";
const DROP_POINT_LABEL = "Drop point";
const DROP_POINT_COLOR = 0x8338ec;

/**
 * Bottom tray HUD — one big tappable shape preview per piece type.
 * Pure DOM; emits selection events upward.
 */

export function createTray(
  root: HTMLElement,
  onSelect: (selection: TraySelection | null) => void,
): { setActive: (selection: TraySelection | null) => void } {
  const tray = document.createElement("div");
  tray.id = "hud-tray";

  const buttons = new Map<TraySelection, HTMLButtonElement>();

  function addButton(selection: TraySelection, labelText: string, color: number): void {
    const btn = document.createElement("button");
    btn.className = "tray-btn";
    btn.type = "button";
    btn.dataset.typeId = selection;
    btn.setAttribute("aria-label", `Place ${labelText}`);
    btn.setAttribute("aria-pressed", "false");
    const preview = document.createElement("span");
    preview.className = `tray-preview tray-preview-${selection}`;
    preview.setAttribute("aria-hidden", "true");
    preview.style.setProperty("--tray-color", `#${color.toString(16).padStart(6, "0")}`);
    btn.appendChild(preview);
    const label = document.createElement("span");
    label.className = "tray-label";
    label.textContent = labelText;
    btn.appendChild(label);
    btn.addEventListener("click", () => {
      const alreadyActive = btn.classList.contains("active");
      setActive(alreadyActive ? null : selection);
      onSelect(alreadyActive ? null : selection);
    });
    buttons.set(selection, btn);
    tray.appendChild(btn);
  }

  for (const typeId of Object.keys(PIECE_TYPE_IDS) as PieceTypeId[]) {
    addButton(typeId, PIECE_LABELS[typeId], PIECE_COLORS[typeId]);
  }
  const separator = document.createElement("span");
  separator.className = "tray-separator";
  separator.setAttribute("aria-hidden", "true");
  tray.appendChild(separator);
  addButton("drop-point", DROP_POINT_LABEL, DROP_POINT_COLOR);

  function syncRovingFocus(activeId: TraySelection | null): void {
    let first = true;
    for (const [id, btn] of buttons) {
      const shouldFocus = activeId ? id === activeId : first;
      btn.tabIndex = shouldFocus ? 0 : -1;
      first = false;
    }
  }

  function setActive(typeId: TraySelection | null): void {
    for (const [id, btn] of buttons) {
      btn.classList.toggle("active", id === typeId);
      btn.setAttribute("aria-pressed", String(id === typeId));
    }
    tray.classList.toggle("placing", typeId !== null);
    syncRovingFocus(typeId);
    if (typeId && buttons.has(typeId)) {
      const btn = buttons.get(typeId);
      if (btn && tray.scrollWidth > tray.clientWidth) {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        btn.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }

  root.appendChild(tray);
  syncRovingFocus(null);

  function updateScrollState(): void {
    const atStart = tray.scrollLeft <= 1;
    const atEnd = tray.scrollLeft + tray.clientWidth >= tray.scrollWidth - 1;
    tray.classList.toggle("at-start", atStart);
    tray.classList.toggle("at-end", atEnd);
  }
  let raf = 0;
  function scheduleUpdate(): void {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      updateScrollState();
    });
  }
  tray.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  // initial mask state and after fonts/images settle
  requestAnimationFrame(updateScrollState);
  window.addEventListener("load", updateScrollState);
  tray.addEventListener("keydown", (ev: KeyboardEvent) => {
    const step = (buttons.values().next().value?.offsetWidth ?? 64) + 8;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      tray.scrollBy({ left: -step, behavior });
    } else if (ev.key === "ArrowRight") {
      ev.preventDefault();
      tray.scrollBy({ left: step, behavior });
    } else if (ev.key === "Home") {
      ev.preventDefault();
      tray.scrollTo({ left: 0, behavior });
    } else if (ev.key === "End") {
      ev.preventDefault();
      tray.scrollTo({ left: tray.scrollWidth, behavior });
    }
    const activeEl = document.activeElement as HTMLElement | null;
    const focusedBtn =
      activeEl &&
      activeEl instanceof HTMLButtonElement &&
      buttons.has(activeEl.dataset.typeId as TraySelection)
        ? activeEl
        : null;
    if (!focusedBtn) return;
    const order = [...buttons.values()];
    const idx = order.indexOf(focusedBtn);
    if (ev.key === "ArrowLeft" && idx > 0) {
      const target = order[idx - 1];
      target.focus();
      syncRovingFocus(target.dataset.typeId as TraySelection);
    } else if (ev.key === "ArrowRight" && idx < order.length - 1) {
      const target = order[idx + 1];
      target.focus();
      syncRovingFocus(target.dataset.typeId as TraySelection);
    } else if (ev.key === "Home" && order.length > 0) {
      order[0].focus();
      syncRovingFocus(order[0].dataset.typeId as TraySelection);
    } else if (ev.key === "End" && order.length > 0) {
      order[order.length - 1].focus();
      syncRovingFocus(order[order.length - 1].dataset.typeId as TraySelection);
    }
  });

  // expose for tests if needed
  (tray as unknown as { __updateScrollState?: () => void }).__updateScrollState = updateScrollState;

  return { setActive };
}
