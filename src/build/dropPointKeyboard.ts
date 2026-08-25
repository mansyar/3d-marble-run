/** Whether the Drop point controller owns a global undo/redo shortcut. */
export function shouldHandleDropPointShortcut(active: boolean, toolEnabled: boolean): boolean {
  return active || toolEnabled;
}
