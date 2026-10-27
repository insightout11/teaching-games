import stopsData from '@/data/world-flight/city-stops.json';

export type CityStopKind = 'restaurant' | 'market' | 'station' | 'sights';
export type CityAccessoryType = 'sun-hat' | 'scarf' | 'sunglasses' | 'bag' | 'bracelet' | 'cap' | 'badge' | 'umbrella';

export interface CityStopItem {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  sticker: string | null;
  artPrompt: string;
  fromCityPacks: string | null;
}

export interface CityStopAccessory {
  id: string;
  name: string;
  type: CityAccessoryType;
  colors: [string, string];
  motif: string;
  description: string;
}

export interface CityStop<T> {
  place: string;
  scene: string;
  items: [T, T, T];
}

export interface CityStops {
  restaurant: CityStop<CityStopItem>;
  market: CityStop<CityStopAccessory>;
  station: CityStop<CityStopItem>;
  sights: CityStop<CityStopItem>;
}

const STOPS = stopsData as unknown as Record<string, CityStops>;

/** Data only: consumers choose how to run the scene and award its souvenirs. */
export function cityStops(cityId: string): CityStops | null {
  return Object.prototype.hasOwnProperty.call(STOPS, cityId) ? STOPS[cityId] : null;
}
