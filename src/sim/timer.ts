/** Formats the spawner's elapsed run time as MM:SS.t (tenths of a second). */
export function formatRunTime(elapsedMs: number): string {
  const safeElapsedMs = Math.max(0, elapsedMs);
  const totalTenths = Math.floor(safeElapsedMs / 100);
  const totalSeconds = Math.floor(totalTenths / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = totalTenths % 10;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}
