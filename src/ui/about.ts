export interface AboutDialogControls {
  open(): void;
  close(): void;
}

/** Accessible, offline About dialog for the package-derived application version. */
export function createAboutDialog(root: HTMLElement, version: string): AboutDialogControls {
  const dialog = document.createElement("dialog");
  dialog.id = "about-dialog";
  dialog.setAttribute("aria-labelledby", "about-dialog-title");
  dialog.setAttribute("aria-describedby", "about-dialog-version");
  dialog.setAttribute("aria-modal", "true");

  const content = document.createElement("div");
  content.className = "about-dialog-content";

  const title = document.createElement("h2");
  title.id = "about-dialog-title";
  title.textContent = "Marblescape";

  const versionLabel = document.createElement("p");
  versionLabel.id = "about-dialog-version";
  versionLabel.className = "about-dialog-version";
  versionLabel.textContent = `Version v${version}`;

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "about-dialog-close";
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", close);

  content.append(title, versionLabel, closeButton);
  dialog.appendChild(content);
  root.appendChild(dialog);

  let returnFocus: HTMLElement | null = null;

  function open(): void {
    if (dialog.open) return;
    const activeElement = document.activeElement;
    returnFocus = activeElement instanceof HTMLElement ? activeElement : null;
    dialog.showModal();
    closeButton.focus();
  }

  function close(): void {
    if (dialog.open) dialog.close();
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  dialog.addEventListener("close", () => {
    const focusTarget = returnFocus;
    returnFocus = null;
    if (focusTarget?.isConnected) focusTarget.focus();
  });

  return { open, close };
}
