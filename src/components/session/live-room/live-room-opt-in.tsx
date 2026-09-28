'use client';

import { useEffect, useState } from 'react';

/**
 * Per-browser preview of the Live Room while it is off for everyone else.
 * Visiting any dashboard page with ?liveroom=on turns it on in this browser;
 * ?liveroom=off turns it back off.
 */
const KEY = 'lc-live-room';

export function readLiveRoomOptIn(): boolean {
  try {
    return localStorage.getItem(KEY) === 'on';
  } catch {
    return false;
  }
}

export function useLiveRoomOptIn(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(readLiveRoomOptIn()), []);
  return on;
}

export function LiveRoomOptIn() {
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('liveroom');
    if (value !== 'on' && value !== 'off') return;
    try {
      if (value === 'on') localStorage.setItem(KEY, 'on');
      else localStorage.removeItem(KEY);
    } catch {
      // storage blocked — preview can't be remembered
    }
  }, []);
  return null;
}
