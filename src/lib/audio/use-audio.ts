'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getAudioPrefs,
  setSfxEnabled,
  setVolume,
  subscribeAudioPrefs,
  type AudioPrefs,
} from './manager';

const SERVER_PREFS: AudioPrefs = { sfxEnabled: true, volume: 0.8 };

/**
 * Read/write the teacher's device audio preferences.
 *
 * Starts from the server-side defaults and syncs to localStorage after mount, so
 * the markup matches on hydration and the real preference lands a tick later.
 */
export function useAudioPrefs() {
  const [prefs, setPrefs] = useState<AudioPrefs>(SERVER_PREFS);

  useEffect(() => {
    setPrefs(getAudioPrefs());
    return subscribeAudioPrefs(setPrefs);
  }, []);

  const toggleSfx = useCallback(() => {
    setSfxEnabled(!getAudioPrefs().sfxEnabled);
  }, []);

  return {
    ...prefs,
    setSfxEnabled,
    setVolume,
    toggleSfx,
  };
}
