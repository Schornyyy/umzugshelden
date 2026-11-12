export const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function nextB2bFollowUp(sentAt: number, previousEmailCount: number) {
  if (!Number.isFinite(sentAt) || sentAt < 0) {
    throw new Error("Der Versandzeitpunkt ist ungültig.");
  }
  if (!Number.isInteger(previousEmailCount) || previousEmailCount < 0) {
    throw new Error("Die Anzahl vorheriger E-Mails ist ungültig.");
  }
  const followUpDays = previousEmailCount === 0 ? 3 : 7;
  return {
    followUpDays,
    nextFollowUpAt: sentAt + followUpDays * DAY_IN_MS,
  };
}

