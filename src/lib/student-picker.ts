export interface StudentPickerHistory {
  pickedIds: string[];
  lastPickedId: string | null;
}

/** Random order without replacement; roster updates preserve the current cycle. */
export function pickRandomStudent(
  studentIds: string[],
  history: StudentPickerHistory,
): { studentId: string | null; history: StudentPickerHistory } {
  const ids = Array.from(new Set(studentIds));
  if (ids.length === 0) {
    return { studentId: null, history: { pickedIds: [], lastPickedId: null } };
  }

  let pickedIds = history.pickedIds.filter(id => ids.includes(id));
  let candidates = ids.filter(id => !pickedIds.includes(id));
  if (candidates.length === 0) {
    pickedIds = [];
    candidates = ids;
  }
  // Avoid repeating the last student at the boundary between cycles.
  const alternatives = candidates.filter(id => id !== history.lastPickedId);
  if (alternatives.length > 0) candidates = alternatives;
  const studentId = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    studentId,
    history: { pickedIds: [...pickedIds, studentId], lastPickedId: studentId },
  };
}
