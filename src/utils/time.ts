/**
 * Formats a duration in days into months and appends the decision count.
 * Temporal Framing (§4.2)
 */
export function formatDuration(days: number, recordCount: number): string {
  if (days <= 0) {
    return `New registration · ${recordCount} decisions`;
  }
  const months = Math.round(days / 30);
  const monthString = months === 1 ? 'month' : 'months';
  return `${months} ${monthString} of verified behavior · ${recordCount} verified decisions`;
}

/**
 * Returns a relative, human-readable timestamp (e.g. "moments ago", "2.1 seconds ago").
 * Temporal Framing (§4.2)
 */
export function formatRelativeTime(timestamp: number | null): string {
  if (!timestamp) return 'Never';
  
  const diffMs = Date.now() - timestamp;
  const diffSec = diffMs / 1000;

  if (diffSec < 5) {
    return 'moments ago';
  }
  if (diffSec < 60) {
    return `${diffSec.toFixed(1)} seconds ago`;
  }
  
  const diffMin = diffSec / 60;
  if (diffMin < 60) {
    const minVal = Math.floor(diffMin);
    return `${minVal} ${minVal === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffHr = diffMin / 60;
  if (diffHr < 24) {
    const hrVal = Math.floor(diffHr);
    return `${hrVal} ${hrVal === 1 ? 'hour' : 'hours'} ago`;
  }

  return new Date(timestamp).toLocaleDateString();
}
