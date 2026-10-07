import { describe, expect, it } from 'vitest';
import { isStudentPath } from './student-paths';

describe('isStudentPath', () => {
  it('covers student and family pages only', () => {
    ['/join/abc', '/questions/abc', '/debrief/tok', '/journey/tok', '/logbook/tok'].forEach((p) => expect(isStudentPath(p)).toBe(true));
    ['/home', '/classes/1', '/logbooks', '/joint', '/', null].forEach((p) => expect(isStudentPath(p)).toBe(false));
  });
});
