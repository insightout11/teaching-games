import type { WeatherCondition } from '@/components/world-flight/arrival-scene/types';

/**
 * Real current weather under the plane (Open-Meteo, free, no key) mapped onto
 * World Flight's weather conditions.
 */
export interface LiveWeather {
  condition: WeatherCondition;
  /** 0–100 % of the sky covered. */
  cloudCover: number;
  windKph: number;
  /** Short description for the class, e.g. "light rain". */
  label: string;
}

/** WMO weather codes (as Open-Meteo reports them) → a condition and a label. */
export function fromWeatherCode(code: number, cloudCover: number, lat: number, isDay: boolean): { condition: WeatherCondition; label: string } {
  if (code >= 95) return { condition: 'storm', label: 'thunderstorms' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { condition: 'snow', label: code >= 75 || code === 86 ? 'heavy snow' : 'snow' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'rain', label: code >= 63 && code !== 80 ? 'heavy rain' : code <= 57 ? 'drizzle' : 'rain' };
  }
  if (code === 45 || code === 48) return { condition: 'overcast', label: 'fog' };
  if (cloudCover >= 70 || code === 3) return { condition: 'overcast', label: 'cloudy' };
  if (!isDay && Math.abs(lat) >= 60 && cloudCover < 40) return { condition: 'aurora', label: 'clear, northern lights' };
  return { condition: 'clear', label: cloudCover >= 30 || code === 2 ? 'partly cloudy' : 'clear skies' };
}
