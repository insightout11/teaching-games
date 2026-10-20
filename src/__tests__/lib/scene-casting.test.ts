import { describe, expect, it } from 'vitest';
import { assignSceneRoles, audienceJobs, rolesMatchGroup, sceneCastSize, sceneCharacterIds, sceneGroups, scenePhoneCards, withCharacterNames } from '@/activities/scene-igniter/casting';
import type { SceneActorCard, SceneAudienceCard, SceneCastSize } from '@/activities/scene-igniter/casting';
import type { SceneIgniterScene } from '@/activities/types';

const people = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `student-${i}`, name: `Student ${i}` }));
const sceneFor = (count: SceneCastSize): SceneIgniterScene => ({ title: 'The lost bag', context: 'At a busy station.',
  cast: sceneCharacterIds(count).map(id => ({ id, name: `Name ${id}`, role: 'traveller', want: 'Find the bag' })),
  lines: Array.from({ length: count * 3 }, (_, i) => ({ character: sceneCharacterIds(count)[i % count], lineIndex: i + 1, text: `PRIVATE line ${i}` })),
  improvPrompt: 'The bag starts talking.', improvScript: [],
});

describe('larger Scene Igniter casts', () => {
  it.each([2, 3, 4, 5, 6, 7, 8] as const)('casts %i characters without dropping a part', count => {
    const scene = sceneFor(count), students = people(count), roles = assignSceneRoles(scene.lines, students);
    expect(roles.size).toBe(count);
    expect(new Set(Array.from(roles.values()).map(person => person.id)).size).toBe(count);
    const cards = scenePhoneCards(scene, roles, students, 'take', 0, 1, {});
    students.forEach(student => {
      const card = cards[student.id] as SceneActorCard;
      expect(card.role).toBe('actor'); expect(card.lines).toHaveLength(3);
    });
  });
  it('clamps invalid sizes and retains letter names through H', () => {
    expect(sceneCastSize()).toBe(4); expect(sceneCastSize(NaN)).toBe(4);
    expect(sceneCastSize(1)).toBe(2); expect(sceneCastSize(20)).toBe(8);
    const scene = sceneFor(8);
    expect(withCharacterNames('E, wait! H!', scene.cast!)).toBe('Name E, wait! Name H!');
  });
  it('uses the generated cast sizes for both groups, including older four-part content', () => {
    const students = people(20);
    expect(sceneGroups(students, [sceneFor(8), sceneFor(8)]).map(group => group.length)).toEqual([8, 8]);
    expect(sceneGroups(students, [sceneFor(4), sceneFor(3)]).map(group => group.length)).toEqual([4, 3]);
  });
  it('combines parts on one phone in a small class instead of overwriting the script', () => {
    const scene = sceneFor(4), students = people(1), roles = assignSceneRoles(scene.lines, students);
    const card = scenePhoneCards(scene, roles, students, 'take', 5, 2, { 'student-0': 'Slow down' })['student-0'] as SceneActorCard;
    expect(card.characters).toHaveLength(4); expect(card.lines).toHaveLength(12);
    expect(card.character.name).toBe('Name B'); expect(card.note).toBe('Slow down');
  });
  it.each([9, 10, 16, 30])('gives every non-actor in a class of %i a complete job', count => {
    const scene = sceneFor(8), students = people(count), roles = assignSceneRoles(scene.lines, students.slice(0, 8));
    const jobs = audienceJobs(students, roles), cards = scenePhoneCards(scene, roles, students, 'take', 4, 1, {});
    expect(jobs.size).toBe(count - 8);
    students.slice(8).forEach(student => {
      const card = cards[student.id] as SceneAudienceCard;
      expect(card.role).toBe('audience'); expect(card.instruction.length).toBeGreaterThan(20);
      expect(card.context).toBe(scene.context); expect(card.progress).toContain('line 5');
      expect(JSON.stringify(card)).not.toContain('PRIVATE');
    });
    expect(jobs.get('student-8')).toBe('director');
    if (count > 9) expect(jobs.get('student-9')).toBe('narrator');
    if (count > 10) expect(jobs.get('student-10')).toBe('critic');
  });
  it('rotates actor and audience jobs for a second cast', () => {
    const students = people(12), scene = sceneFor(6), groups = sceneGroups(students, [scene, scene]);
    const jobs1 = audienceJobs(students, assignSceneRoles(scene.lines, groups[0]));
    const jobs2 = audienceJobs(students, assignSceneRoles(scene.lines, groups[1]));
    expect(rolesMatchGroup(assignSceneRoles(scene.lines, groups[0]), groups[1])).toBe(false);
    expect(rolesMatchGroup(assignSceneRoles(scene.lines, groups[1]), groups[1])).toBe(true);
    expect(jobs1.has('student-0')).toBe(false); expect(jobs2.has('student-0')).toBe(true);
    expect(jobs1.has('student-6')).toBe(true); expect(jobs2.has('student-6')).toBe(false);
  });
  it('keeps only own lines and their immediate cues on an actor phone', () => {
    const scene = sceneFor(8), students = people(8), roles = assignSceneRoles(scene.lines, students);
    const card = scenePhoneCards(scene, roles, students, 'improv', 0, 2, {})['student-0'] as SceneActorCard;
    expect(card.lines.map(line => line.i)).toEqual([0, 8, 16]);
    expect(JSON.stringify(card)).not.toContain('PRIVATE line 1"');
    expect(card.mode).toBe('improv'); expect(card.improv?.prompt).toBe(scene.improvPrompt);
  });
  it('does not use ambiguous name aliases for private scripts', () => {
    const students = [{ id: 'a', name: 'Same' }, { id: 'b', name: 'Same' }], scene = sceneFor(2);
    const cards = scenePhoneCards(scene, assignSceneRoles(scene.lines, students), students, 'casting', 0, 1, {});
    expect(cards.a).toBeDefined(); expect(cards.b).toBeDefined(); expect(cards.Same).toBeUndefined();
    expect(assignSceneRoles(scene.lines, []).size).toBe(0);
  });
});
