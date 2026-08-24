import type { SaveSlotInfo } from "../track/storage";

export interface SaveSlotCallbacks {
  onSave: (name: string) => Promise<void>;
  onLoad: (name: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

export interface SaveSlotControls {
  setSlots(slots: SaveSlotInfo[]): void;
  setStatus(message: string): void;
}

/** Touch-sized named-save controls backed by the track storage service. */
export function createSaveSlotControls(
  root: HTMLElement,
  callbacks: SaveSlotCallbacks,
): SaveSlotControls {
  const panel = document.createElement("section");
  panel.id = "save-slots";
  panel.setAttribute("aria-label", "Saved tracks");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "save-slot-name";
  nameInput.placeholder = "Slot name";
  nameInput.setAttribute("aria-label", "Save slot name");
  nameInput.maxLength = 40;

  const slotSelect = document.createElement("select");
  slotSelect.id = "save-slot-list";
  slotSelect.setAttribute("aria-label", "Saved track slots");

  const saveButton = document.createElement("button");
  saveButton.type = "button";
  saveButton.textContent = "Save";

  const loadButton = document.createElement("button");
  loadButton.type = "button";
  loadButton.textContent = "Load";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";

  const status = document.createElement("output");
  status.id = "save-slot-status";
  status.setAttribute("aria-live", "polite");

  panel.append(nameInput, saveButton, slotSelect, loadButton, deleteButton, status);
  root.appendChild(panel);
  let hasSlots = false;

  async function run(action: () => Promise<void>, successMessage: string): Promise<void> {
    saveButton.disabled = true;
    loadButton.disabled = true;
    deleteButton.disabled = true;
    try {
      await action();
      setStatus(successMessage);
    } catch {
      setStatus("Save unavailable");
    } finally {
      saveButton.disabled = false;
      loadButton.disabled = !hasSlots;
      deleteButton.disabled = !hasSlots;
    }
  }

  saveButton.addEventListener("click", () => {
    const name = nameInput.value.trim();
    if (!name) {
      setStatus("Enter a slot name");
      nameInput.focus();
      return;
    }
    void run(() => callbacks.onSave(name), `Saved “${name}”`);
  });

  loadButton.addEventListener("click", () => {
    const name = slotSelect.value;
    if (name) void run(() => callbacks.onLoad(name), `Loaded “${name}”`);
  });

  deleteButton.addEventListener("click", () => {
    const name = slotSelect.value;
    if (name) void run(() => callbacks.onDelete(name), `Deleted “${name}”`);
  });

  function setSlots(slots: SaveSlotInfo[]): void {
    hasSlots = slots.length > 0;
    const selected = slotSelect.value;
    slotSelect.replaceChildren();
    for (const slot of slots) {
      const option = document.createElement("option");
      option.value = slot.name;
      option.textContent = slot.name;
      slotSelect.appendChild(option);
    }
    if (slots.some((slot) => slot.name === selected)) slotSelect.value = selected;
    loadButton.disabled = slots.length === 0;
    deleteButton.disabled = slots.length === 0;
  }

  function setStatus(message: string): void {
    status.textContent = message;
  }

  return { setSlots, setStatus };
}
