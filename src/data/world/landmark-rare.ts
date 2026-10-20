import type { WeatherCondition } from '@/components/world-flight/arrival-scene/weather';

export const LANDMARK_TIMES = ['day', 'dusk', 'night', 'dawn'] as const;
export type LandmarkTimeOfDay = typeof LANDMARK_TIMES[number];
export interface LandmarkRarePhoto {
  landmark: string;
  /** Both fields must match the flight's existing state. No extra weather rolls. */
  when: { timeOfDay: LandmarkTimeOfDay; weather: WeatherCondition };
  title: string;
}

/** Photo opportunities, not probabilities, scores or a weather forecast.
 * Titles describe only observable weather/light inputs. Rain does not imply a rainbow
 * or a mirror on the salt flat; dawn does not imply a solstice or visible sunlight.
 * Snow conditions require actual snow weather, not a guessed month or a snowy drawing.
 */
export const LANDMARK_RARE: readonly LandmarkRarePhoto[] = [
  { landmark: 'norwegian-fjords', when: { timeOfDay: 'night', weather: 'aurora' }, title: 'Northern Lights over the Norwegian fjords' },
  { landmark: 'denali', when: { timeOfDay: 'night', weather: 'aurora' }, title: 'Northern Lights over Denali' },
  { landmark: 'pyramids', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'The Pyramids of Giza at dawn' },
  { landmark: 'great-wall', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling on the Great Wall' },
  { landmark: 'grand-canyon', when: { timeOfDay: 'dusk', weather: 'storm' }, title: 'A storm over the Grand Canyon at dusk' },
  { landmark: 'fuji', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'Mount Fuji in the clear dawn sky' },
  { landmark: 'everest', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'A clear dawn over Everest' },
  { landmark: 'matterhorn', when: { timeOfDay: 'dusk', weather: 'clear' }, title: 'The Matterhorn at dusk' },
  { landmark: 'kilimanjaro', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'Kilimanjaro at dawn' },
  { landmark: 'niagara', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling at Niagara Falls' },
  { landmark: 'angkor-wat', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'Angkor Wat at dawn' },
  { landmark: 'uluru', when: { timeOfDay: 'dusk', weather: 'clear' }, title: 'Uluru in the evening light' },
  { landmark: 'victoria-falls', when: { timeOfDay: 'day', weather: 'storm' }, title: 'A storm over Victoria Falls' },
  { landmark: 'iguazu-falls', when: { timeOfDay: 'day', weather: 'rain' }, title: 'Rain falling over Iguazu Falls' },
  { landmark: 'machu-picchu', when: { timeOfDay: 'dawn', weather: 'overcast' }, title: 'A cloudy dawn at Machu Picchu' },
  { landmark: 'salar-de-uyuni', when: { timeOfDay: 'dusk', weather: 'clear' }, title: 'A clear evening over the salt flat' },
  { landmark: 'petra', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'Petra at dawn' },
  { landmark: 'taj-mahal', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'The Taj Mahal at dawn' },
  { landmark: 'stonehenge', when: { timeOfDay: 'dawn', weather: 'clear' }, title: 'Stonehenge in the dawn light' },
  { landmark: 'dolomites', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling in the Dolomites' },
  { landmark: 'ha-long-bay', when: { timeOfDay: 'dawn', weather: 'overcast' }, title: 'A cloudy dawn in Ha Long Bay' },
  { landmark: 'banff', when: { timeOfDay: 'dusk', weather: 'snow' }, title: 'Evening snow in Banff' },
  { landmark: 'mauna-kea', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling on Mauna Kea' },
  { landmark: 'teide', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling on Teide' },
  { landmark: 'ruapehu', when: { timeOfDay: 'day', weather: 'snow' }, title: 'Snow falling on Ruapehu' },
];
