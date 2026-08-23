export function recordSubmissionConfirmation(
  confirmedKeys: Set<string>,
  confirmationKey: string,
  currentResponseCount: number,
): { newlyConfirmed: boolean; responseCount: number } {
  if (confirmedKeys.has(confirmationKey)) {
    return { newlyConfirmed: false, responseCount: currentResponseCount };
  }
  confirmedKeys.add(confirmationKey);
  return { newlyConfirmed: true, responseCount: currentResponseCount + 1 };
}
