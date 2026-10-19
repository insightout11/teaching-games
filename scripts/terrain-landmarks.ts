/** Original teaching copy; approximate coordinates, radii in km. Not hazard zones.
 * Reference links are for factual verification, not copied prose or live requests.
 * This editorial list is dedicated to CC0 along with its generated representation.
 */
export interface TeachingLandmark {
  name: string; kind: 'volcano' | 'canyon'; lat: number; lng: number;
  radiusKm: number; fact: string; source: string;
}
const usgs = 'https://www.usgs.gov/volcanoes/';
const nps = 'https://www.nps.gov/';
const unesco = 'https://whc.unesco.org/en/list/';
export const TEACHING_LANDMARKS: TeachingLandmark[] = [
  { name: 'Mount Etna', kind: 'volcano', lat: 37.75, lng: 15, radiusKm: 20, fact: 'Etna rises above the Italian island of Sicily.', source: unesco + '1427/' },
  { name: 'Mount Vesuvius', kind: 'volcano', lat: 40.82, lng: 14.43, radiusKm: 12, fact: 'Its eruption in AD 79 buried the Roman city of Pompeii.', source: unesco + '829/' },
  { name: 'Mount Fuji', kind: 'volcano', lat: 35.36, lng: 138.73, radiusKm: 20, fact: 'This Japanese volcano has inspired artists for centuries.', source: unesco + '1418/' },
  { name: 'Kilimanjaro', kind: 'volcano', lat: -3.07, lng: 37.36, radiusKm: 25, fact: 'This volcanic mountain is the highest mountain in Africa.', source: unesco + '403/' },
  { name: 'Kilauea', kind: 'volcano', lat: 19.42, lng: -155.29, radiusKm: 15, fact: 'Lava from this Hawaiian volcano helps build new land.', source: usgs + 'kilauea' },
  { name: 'Mauna Loa', kind: 'volcano', lat: 19.48, lng: -155.61, radiusKm: 18, fact: 'This broad Hawaiian shield volcano grew from many lava flows.', source: usgs + 'mauna-loa' },
  { name: 'Mauna Kea', kind: 'volcano', lat: 19.82, lng: -155.47, radiusKm: 15, fact: 'Much of this Hawaiian volcanic mountain lies beneath the sea.', source: usgs + 'mauna-kea' },
  { name: 'Haleakala', kind: 'volcano', lat: 20.71, lng: -156.25, radiusKm: 18, fact: 'This volcano forms the eastern part of the island of Maui.', source: nps + 'hale/' },
  { name: 'Mount St. Helens', kind: 'volcano', lat: 46.2, lng: -122.18, radiusKm: 15, fact: 'Its 1980 eruption changed the shape of the mountain.', source: usgs + 'mount-st.-helens' },
  { name: 'Mount Rainier', kind: 'volcano', lat: 46.85, lng: -121.76, radiusKm: 20, fact: 'Glaciers cover the slopes of this Washington volcano.', source: nps + 'mora/' },
  { name: 'Mount Hood', kind: 'volcano', lat: 45.37, lng: -121.7, radiusKm: 15, fact: 'This Cascade volcano is the highest mountain in Oregon.', source: usgs + 'mount-hood' },
  { name: 'Mount Shasta', kind: 'volcano', lat: 41.41, lng: -122.19, radiusKm: 18, fact: 'This volcano towers above northern California.', source: usgs + 'mount-shasta' },
  { name: 'Lassen Peak', kind: 'volcano', lat: 40.49, lng: -121.51, radiusKm: 15, fact: 'Lassen erupted in the early twentieth century.', source: nps + 'lavo/' },
  { name: 'Crater Lake / Mount Mazama', kind: 'volcano', lat: 42.94, lng: -122.11, radiusKm: 15, fact: 'Crater Lake fills a basin left by the collapse of Mount Mazama.', source: nps + 'crla/' },
  { name: 'Yellowstone Caldera', kind: 'volcano', lat: 44.43, lng: -110.67, radiusKm: 35, fact: 'Underground volcanic heat helps power the park\u2019s geysers.', source: usgs + 'yellowstone' },
  { name: 'Novarupta', kind: 'volcano', lat: 58.27, lng: -155.16, radiusKm: 15, fact: 'Its 1912 eruption filled an Alaskan valley with hot volcanic material.', source: nps + 'katm/' },
  { name: 'Mount Redoubt', kind: 'volcano', lat: 60.49, lng: -152.74, radiusKm: 18, fact: 'This ice-covered volcano stands beside Alaska\u2019s Cook Inlet.', source: usgs + 'redoubt' },
  { name: 'Mount Spurr', kind: 'volcano', lat: 61.3, lng: -152.25, radiusKm: 18, fact: 'This Alaskan volcano lies west of Anchorage.', source: usgs + 'spurr' },
  { name: 'Mount Cleveland', kind: 'volcano', lat: 52.82, lng: -169.95, radiusKm: 12, fact: 'This volcano is on an island in Alaska\u2019s Aleutian chain.', source: usgs + 'cleveland' },
  { name: 'Mount Erebus', kind: 'volcano', lat: -77.53, lng: 167.17, radiusKm: 20, fact: 'This Antarctic volcano rises from Ross Island.', source: 'https://www.bas.ac.uk/data/our-data/publication/harnessing-erebus-volcanos-thermal-energy-to-power-year-round-monitoring/' },
  { name: 'Tongariro', kind: 'volcano', lat: -39.13, lng: 175.64, radiusKm: 12, fact: 'This volcano is part of a sacred landscape in New Zealand.', source: unesco + '421/' },
  { name: 'Ruapehu', kind: 'volcano', lat: -39.28, lng: 175.57, radiusKm: 12, fact: 'A crater lake sits near the summit of this New Zealand volcano.', source: 'https://www.geonet.org.nz/volcano/ruapehu' },
  { name: 'Ngauruhoe', kind: 'volcano', lat: -39.16, lng: 175.63, radiusKm: 5, fact: 'This steep volcanic cone belongs to the Tongariro volcanic complex.', source: 'https://www.geonet.org.nz/volcano/tongariro' },
  { name: 'Teide', kind: 'volcano', lat: 28.27, lng: -16.64, radiusKm: 18, fact: 'This volcano on Tenerife is the highest peak in Spain.', source: unesco + '1258/' },
  { name: 'Pico', kind: 'volcano', lat: 38.47, lng: -28.4, radiusKm: 12, fact: 'This volcanic mountain rises on Pico Island in the Azores.', source: unesco + '1117/' },
  { name: 'Piton de la Fournaise', kind: 'volcano', lat: -21.24, lng: 55.71, radiusKm: 18, fact: 'This shield volcano is on Reunion Island in the Indian Ocean.', source: unesco + '1317/' },
  { name: 'Mount Bromo', kind: 'volcano', lat: -7.94, lng: 112.95, radiusKm: 8, fact: 'Bromo is a volcano on the Indonesian island of Java.', source: 'https://www.unesco.org/en/mab/bromo-tengger-semeru-arjuno' },
  { name: 'Krakatau', kind: 'volcano', lat: -6.1, lng: 105.42, radiusKm: 15, fact: 'This volcanic island group lies between Java and Sumatra.', source: unesco + '608/' },
  { name: 'Mount Mayon', kind: 'volcano', lat: 13.26, lng: 123.69, radiusKm: 15, fact: 'This Philippine volcano is known for its cone shape.', source: 'https://www.phivolcs.dost.gov.ph/mayon-volcano-observatory/' },
  { name: 'Mount Pinatubo', kind: 'volcano', lat: 15.14, lng: 120.35, radiusKm: 18, fact: 'Its 1991 eruption sent ash high into the atmosphere.', source: 'https://pubs.usgs.gov/fs/1997/fs113-97/' },
  { name: 'Grand Canyon', kind: 'canyon', lat: 36.1, lng: -112.1, radiusKm: 35, fact: 'The Colorado River helped carve this canyon through layers of rock.', source: nps + 'grca/' },
  { name: 'Black Canyon of the Gunnison', kind: 'canyon', lat: 38.57, lng: -107.73, radiusKm: 15, fact: 'The Gunnison River cut this narrow canyon in Colorado.', source: nps + 'blca/' },
  { name: 'Zion Canyon', kind: 'canyon', lat: 37.3, lng: -112.95, radiusKm: 15, fact: 'The Virgin River flows between tall sandstone walls.', source: nps + 'zion/' },
  { name: 'Canyon de Chelly', kind: 'canyon', lat: 36.15, lng: -109.45, radiusKm: 18, fact: 'Navajo families continue to live in this canyon landscape.', source: nps + 'cach/' },
  { name: 'Grand Canyon of the Yellowstone', kind: 'canyon', lat: 44.72, lng: -110.49, radiusKm: 12, fact: 'Waterfalls drop into this colourful Yellowstone River canyon.', source: nps + 'yell/learn/nature/grand-canyon.htm' },
  { name: 'New River Gorge', kind: 'canyon', lat: 38.07, lng: -81.08, radiusKm: 20, fact: 'The New River carved this gorge through the Appalachian Mountains.', source: nps + 'neri/' },
  { name: 'Santa Elena Canyon', kind: 'canyon', lat: 29.17, lng: -103.61, radiusKm: 12, fact: 'The Rio Grande runs through this canyon on the United States\u2013Mexico border.', source: nps + 'bibe/' },
  { name: 'Canyonlands', kind: 'canyon', lat: 38.17, lng: -109.76, radiusKm: 25, fact: 'The Green and Colorado rivers meet among these Utah canyons.', source: nps + 'cany/' },
  { name: 'Bighorn Canyon', kind: 'canyon', lat: 45.3, lng: -108.2, radiusKm: 20, fact: 'This canyon crosses the border between Montana and Wyoming.', source: nps + 'bica/' },
  { name: 'Walnut Canyon', kind: 'canyon', lat: 35.17, lng: -111.51, radiusKm: 8, fact: 'Ancient cliff dwellings are sheltered in this Arizona canyon.', source: nps + 'waca/' },
];
