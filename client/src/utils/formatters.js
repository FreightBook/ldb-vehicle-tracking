/**
 * Formats a duration in seconds to a human-readable interval (e.g. 10800s -> "3h", 1800s -> "30m", 45s -> "45s")
 */
export function formatPollInterval(sec) {
  if (!sec) return '3h';
  if (sec >= 3600) {
    const hours = sec / 3600;
    return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
  }
  if (sec >= 60) {
    return `${Math.round(sec / 60)}m`;
  }
  return `${sec}s`;
}
