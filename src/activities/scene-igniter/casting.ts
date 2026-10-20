import type { SceneIgniterCastMember, SceneIgniterLine, SceneIgniterScene } from '../types';

type Person = { id: string; name: string };
export type SceneCastSize = 2 | 3 | 4 | 5 | 6 | 7 | 8;
export function sceneCastSize(count?: number): SceneCastSize {
  return (typeof count === 'number' && Number.isFinite(count) ? Math.max(2, Math.min(8, Math.floor(count))) : 4) as SceneCastSize;
}
export function sceneCharacterIds(count: SceneCastSize): string[] {
  return 'ABCDEFGH'.slice(0, count).split('');
}
export function sceneCastOf(scene: SceneIgniterScene): SceneIgniterCastMember[] {
  return Array.from(new Set(scene.lines.map(line => line.character))).slice(0, 8)
    .map(id => scene.cast?.find(member => member.id === id) ?? { id, name: `Character ${id}`, role: '', want: '' });
}
export function sceneGroups<T extends Person>(students: T[], scenes: SceneIgniterScene[]): readonly [T[], T[]] {
  const first = scenes[0] ? sceneCastOf(scenes[0]).length : 4;
  const second = scenes[1] ? sceneCastOf(scenes[1]).length : 0;
  return [students.slice(0, first), students.slice(first, first + second)];
}
export function assignSceneRoles<T extends Person>(lines: SceneIgniterLine[], students: T[]): Map<string, T> {
  const roles = new Map<string, T>();
  if (!students.length) return roles;
  const counts = new Map<string, number>();
  lines.forEach(line => counts.set(line.character, (counts.get(line.character) ?? 0) + 1));
  const load = new Map(students.map(student => [student.id, 0]));
  Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).forEach(([character, count]) => {
    const pick = students.reduce((a, b) => (load.get(a.id)! <= load.get(b.id)! ? a : b));
    roles.set(character, pick);
    load.set(pick.id, load.get(pick.id)! + count);
  });
  return roles;
}
export function rolesMatchGroup<T extends Person>(roles: Map<string, T>, group: T[]): boolean {
  return roles.size > 0 && Array.from(roles.values()).every(actor => group.some(student => student.id === actor.id));
}
export function withCharacterNames(text: string, cast: SceneIgniterCastMember[]): string {
  return text.replace(/(^|[\s,])([A-H])(?=[!?,.])/g, (match, before, id) => {
    const name = cast.find(member => member.id === id)?.name;
    return name ? before + name : match;
  });
}

export interface SceneActorCard {
  role: 'actor';
  character: { name: string; role: string; want: string };
  characters: Array<{ name: string; role: string; want: string }>;
  scene: { title: string; genre: string | null };
  lines: Array<{ i: number; by: string; text: string; direction: string | null; cue: { by: string | null; text: string } | null }>;
  current: number;
  take: 1 | 2;
  mode: 'script' | 'improv';
  note: string | null;
  improv: { prompt: string } | null;
}
export interface SceneAudienceCard {
  role: 'audience';
  job: 'director' | 'narrator' | 'critic';
  title: string;
  instruction: string;
  scene: string;
  context: string;
  progress: string;
}
export function audienceJobs<T extends Person>(students: T[], roles: Map<string, T>): Map<string, SceneAudienceCard['job']> {
  const actors = new Set<string>();
  roles.forEach(student => actors.add(student.id));
  const audience = students.filter(student => !actors.has(student.id));
  return new Map(audience.map((student, i) => [student.id, i === 0 ? 'director' : i === 1 ? 'narrator' : 'critic']));
}

/** Only each actor's own lines/cues, or a complete audience job. Multiple parts
 * held by one actor are combined rather than overwriting their first script.
 */
export function scenePhoneCards<T extends Person>(scene: SceneIgniterScene, roles: Map<string, T>, students: T[],
  phase: string, current: number, take: 1 | 2, notes: Record<string, string>): Record<string, unknown> {
  const cast = sceneCastOf(scene);
  const jobs = audienceJobs(students, roles);
  const per: Record<string, unknown> = { __room: true };
  students.forEach(student => {
    const mine = cast.filter(member => roles.get(member.id)?.id === student.id);
    let card: SceneActorCard | SceneAudienceCard;
    if (mine.length) {
      const character = mine.find(member => member.id === scene.lines[current]?.character) ?? mine[0];
      card = {
        role: 'actor', character, characters: mine, scene: { title: scene.title, genre: scene.genre ?? null },
        lines: scene.lines.map((line, i) => ({ line, i })).filter(({ line }) => mine.some(member => member.id === line.character))
          .map(({ line, i }) => ({ i, by: cast.find(member => member.id === line.character)?.name ?? line.character,
            text: withCharacterNames(line.text, cast), direction: line.direction ?? null,
            cue: i ? { by: cast.find(member => member.id === scene.lines[i - 1].character)?.name ?? null,
              text: withCharacterNames(scene.lines[i - 1].text, cast) } : null })),
        current: phase === 'take' ? current : -1, take, mode: phase === 'improv' ? 'improv' : 'script',
        note: notes[student.id] ?? null, improv: phase === 'improv' ? { prompt: scene.improvPrompt } : null,
      };
    } else {
      const job = jobs.get(student.id) ?? 'critic';
      card = {
        role: 'audience', job, title: job === 'director' ? 'Director' : job === 'narrator' ? 'Narrator' : 'Scene critic',
        instruction: job === 'director' ? 'Listen to the scene. At the teacher\'s signal, say “Cut!” Then suggest one change for the next take.'
          : job === 'narrator' ? 'When the teacher calls you, read the scene setup below aloud. Then listen to the actors.'
            : 'Listen closely. When the teacher calls you after the take, give one compliment and one helpful tip.',
        scene: scene.title, context: scene.context,
        progress: phase === 'take' ? `Take ${take} · line ${current + 1} of ${scene.lines.length}` : phase === 'improv' ? 'The actors are improvising.' : 'Wait for the teacher to call you.',
      };
    }
    per[student.id] = card;
    if (students.filter(other => other.name === student.name).length === 1) per[student.name] = card;
  });
  return per;
}
