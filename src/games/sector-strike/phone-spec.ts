import type { InputSpec } from '@/lib/input-spec';

export interface PublicSector { index: number; team: 'x' | 'o' | null }

export function sectorPhoneSpec(cells: PublicSector[], team: 'x' | 'o', picker: string, targets?: number[], question?: string): InputSpec {
  return {
    type: 'confirm', gameKey: 'sector-strike',
    prompt: question || `${picker}: call a sector, such as A1.`,
    instruction: `${team === 'x' ? 'Azure' : 'Ember'} Squadron`,
    buttonLabel: 'Ready',
    sectorBoard: cells.map(cell => ({
      label: `${'ABCDEFGH'[cell.index % 8]}${Math.floor(cell.index / 8) + 1}`,
      owner: cell.team === 'x' ? 'Azure' : cell.team === 'o' ? 'Ember' : null,
      selectable: targets ? targets.includes(cell.index) : cell.team === null,
    })),
  };
}
