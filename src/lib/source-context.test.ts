import { describe, it, expect } from 'vitest';
import { buildSourceContext } from './source-context';
import type { SourceMaterial } from '@/types/source-material';

function material(overrides: Partial<SourceMaterial> = {}): SourceMaterial {
  return { sourceType: 'text', title: 'Main', summary: '', ...overrides };
}

describe('buildSourceContext — supporting sources', () => {
  it('returns empty string with no source', () => {
    expect(buildSourceContext(undefined)).toBe('');
  });

  it('grounds on the primary only when there are no supporting sources', () => {
    const out = buildSourceContext(material({ briefingText: 'Primary body about whales.' }));
    expect(out).toContain('Primary body about whales.');
    expect(out).not.toContain('Supporting source');
  });

  it('appends supporting sources after the primary block', () => {
    const out = buildSourceContext(
      material({
        briefingText: 'Primary body about whales.',
        supportingSources: [{ sourceType: 'text', title: 'Plankton notes', text: 'Supporting body about plankton.' }],
      }),
    );
    expect(out).toContain('Primary body about whales.');
    expect(out).toContain('Supporting body about plankton.');
    expect(out).toContain('Supporting source 1');
    expect(out).toContain('Plankton notes');
    // Primary leads, supporting follows.
    expect(out.indexOf('Primary body about whales.')).toBeLessThan(out.indexOf('Supporting body about plankton.'));
  });

  it('skips supporting sources with empty text', () => {
    const out = buildSourceContext(
      material({
        briefingText: 'Primary body.',
        supportingSources: [{ sourceType: 'text', title: 'Blank', text: '   ' }],
      }),
    );
    expect(out).not.toContain('Supporting source');
    expect(out).not.toContain('Blank');
  });

  it('still grounds on supporting material even when the primary body is empty', () => {
    const out = buildSourceContext(
      material({
        summary: '',
        supportingSources: [{ sourceType: 'text', title: 'Only support', text: 'Just supporting text.' }],
      }),
    );
    expect(out).toContain('Just supporting text.');
  });
});
