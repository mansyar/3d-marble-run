/**
 * Resolves which marble the chase cam should follow next. Given the currently
 * followed id, the spawner's active ids, and the ids removed this step, it
 * either keeps the follow, hands off to the newest remaining marble, or
 * returns null when nothing is left (caller eases back to free orbit).
 */
export function resolveFollowTarget(
  followedId: number | null,
  activeIds: readonly number[],
  removedIds: readonly number[] = [],
): number | null {
  if (followedId === null) return null;
  const removed = new Set(removedIds);
  const stillActive = !removed.has(followedId) && activeIds.includes(followedId);
  if (stillActive) return followedId;
  // Followed marble is gone (goal, out-of-bounds, stuck recycle, pool shrink,
  // or already stale): ride the newest remaining marble, else go back to free.
  const remaining = activeIds.filter((id) => !removed.has(id));
  return remaining.length > 0 ? remaining[remaining.length - 1] : null;
}
