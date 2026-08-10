import { describe, expect, it } from 'vitest';
import {
  getActiveSideChannelItem,
  getSideChannelLifecycle,
  SIDE_CHANNEL_TTL_MS,
  type SideChannelItem,
} from '@/lib/side-channel';

function item(overrides: Partial<SideChannelItem> = {}): SideChannelItem {
  return {
    id: 'radio-1',
    kind: 'write',
    title: 'Quick write',
    prompt: 'Which clue helped?',
    createdAt: '2026-08-08T10:00:00.000Z',
    ...overrides,
  };
}

describe('Crew Radio lifecycle', () => {
  it('keeps a prompt live before its explicit expiry', () => {
    const prompt = item({ expiresAt: '2026-08-08T11:00:00.000Z' });
    const now = Date.parse('2026-08-08T10:59:59.000Z');

    expect(getSideChannelLifecycle(prompt, now)).toBe('active');
    expect(getActiveSideChannelItem(prompt, now)).toBe(prompt);
  });

  it('expires a prompt at its explicit expiry', () => {
    const prompt = item({ expiresAt: '2026-08-08T11:00:00.000Z' });
    const now = Date.parse('2026-08-08T11:00:00.000Z');

    expect(getSideChannelLifecycle(prompt, now)).toBe('expired');
    expect(getActiveSideChannelItem(prompt, now)).toBeNull();
  });

  it('expires legacy prompts one hour after creation', () => {
    const prompt = item();
    const now = Date.parse(prompt.createdAt) + SIDE_CHANNEL_TTL_MS;

    expect(getSideChannelLifecycle(prompt, now)).toBe('expired');
  });
});
