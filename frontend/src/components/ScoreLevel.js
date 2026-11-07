// One definition of the score words, shared by the watch page and the history pages.
export function scoreLevel(score) {
  if (score === null || score === undefined) {
    return { label: "אין מדידות", colorVar: "var(--color-muted)" };
  }
  if (score >= 0.7) return { label: "קשוב", colorVar: "var(--color-success)" };
  if (score >= 0.4) return { label: "קשב חלקי", colorVar: "var(--color-warning)" };
  return { label: "קשב נמוך", colorVar: "var(--color-danger)" };
}
