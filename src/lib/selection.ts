/**
 * Shared logic for week/question selection across Home and Run pages
 */

export type GroupingMode = 'week' | 'mixed'

/**
 * Normalize weeks based on grouping mode and ensure at least one week is selected
 */
export function normalizeWeeks(
  weeks: number[],
  grouping: GroupingMode,
  fallbackWeek: number = 12
): number[] {
  // Ensure we have at least one week selected
  if (!weeks.length) {
    return [fallbackWeek]
  }

  // In single week mode, only take the first week
  if (grouping === 'week') {
    return [weeks[0]]
  }

  // In mixed mode, return all weeks sorted descending
  return weeks.sort((a, b) => b - a)
}

/**
 * Get assignment IDs to use based on grouping mode
 */
export function getAssignmentIds(
  weeks: number[],
  grouping: GroupingMode
): number[] {
  const normalized = normalizeWeeks(weeks, grouping)
  return grouping === 'mixed' ? normalized : [normalized[0]]
}

/**
 * Parse weeks from URL query parameter
 */
export function parseWeeksFromQuery(raw: string | null): number[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

/**
 * Validate and sanitize question count
 */
export function normalizeCount(count: number | 'all'): number | 'all' {
  if (count === 'all') return 'all'
  const n = Math.max(1, Math.floor(count))
  return n
}

/**
 * Parse count from URL query parameter
 */
export function parseCountFromQuery(raw: string | null): number | 'all' {
  if (!raw) return 10
  if (raw === 'all') return 'all'
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 10
}
