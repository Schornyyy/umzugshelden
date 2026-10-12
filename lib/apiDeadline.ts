import "server-only";

export const API_MAX_DURATION_SECONDS = 30;
export const API_WORK_BUDGET_MS = 25_000;

export function remainingApiTime(deadlineAt: number): number {
  const remaining = deadlineAt - Date.now();
  if (remaining <= 0) {
    throw new Error("Das API-Zeitlimit wurde erreicht. Bitte erneut versuchen.");
  }
  return remaining;
}
