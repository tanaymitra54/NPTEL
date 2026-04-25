/**
 * Shared logic for topic/question selection across Home and Run pages
 */

export type GroupingMode = 'week' | 'mixed'

/**
 * Normalize selected topic IDs based on grouping mode and ensure at least one is selected.
 */
export function normalizeWeeks(
  weeks: number[],
  grouping: GroupingMode,
  fallbackWeek: number = 1
): number[] {
  if (!weeks.length) {
    return [fallbackWeek]
  }

  if (grouping === 'week') {
    return [weeks[0]]
  }

  return weeks.sort((a, b) => a - b)
}

/**
 * Get assignment IDs to use based on grouping mode.
 */
export function getAssignmentIds(
  weeks: number[],
  grouping: GroupingMode
): number[] {
  const normalized = normalizeWeeks(weeks, grouping)
  return grouping === 'mixed' ? normalized : [normalized[0]]
}

/**
 * Parse selected topic IDs from URL query parameter.
 */
export function parseWeeksFromQuery(raw: string | null): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/**
 * Validate and sanitize question count.
 */
export function normalizeCount(count: number | 'all'): number | 'all' {
  if (count === 'all') return 'all'
  const n = Math.max(1, Math.floor(count))
  return n
}

/**
 * Parse count from URL query parameter.
 */
export function parseCountFromQuery(raw: string | null): number | 'all' {
  if (!raw) return 10
  if (raw === 'all') return 'all'
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 10
}
