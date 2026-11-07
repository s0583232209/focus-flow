export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString("he-IL");
}

// Seconds -> mm:ss
export function formatClock(totalSeconds) {
  const whole = Math.max(0, Math.round(totalSeconds));
  const minutes = String(Math.floor(whole / 60)).padStart(2, "0");
  const seconds = String(whole % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function formatDuration(startIso, endIso) {
  return formatClock((new Date(endIso) - new Date(startIso)) / 1000);
}

// A reading's position means seconds in a video and a percentage in a text.
export function formatPosition(position, contentType) {
  return contentType === "text" ? `${position}%` : formatClock(position);
}
