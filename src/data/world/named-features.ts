/**
 * Things worth pointing out from the window: rivers, lakes, mountains, straits, islands and famous sights. Each is
 * [name, kind, lat, lng, radius in km]: the plane is "over" it while it is within that radius of the point. Rivers are
 * several points along their course. Coarse on purpose (it drives one line of text, not navigation), and every
 * coordinate is a recognisable spot good to a few kilometres.
 */
export type FeatureKind = 'river' | 'lake' | 'mountain' | 'strait' | 'island' | 'sight';

export const NAMED_FEATURES: Array<[string, FeatureKind, number, number, number]> = [
  // Rivers
  ['the Nile', 'river', 30.0, 31.2, 45], ['the Nile', 'river', 25.7, 32.6, 45], ['the Nile', 'river', 15.6, 32.5, 45],
  ['the Amazon River', 'river', -3.1, -60.0, 90], ['the Amazon River', 'river', -2.2, -54.7, 90],
  ['the Mississippi River', 'river', 35.1, -90.1, 60], ['the Mississippi River', 'river', 38.6, -90.2, 60], ['the Mississippi River', 'river', 30.0, -90.1, 60],
  ['the Yangtze River', 'river', 31.2, 121.5, 60], ['the Yangtze River', 'river', 30.6, 114.3, 60], ['the Yangtze River', 'river', 29.6, 106.5, 60],
  ['the Yellow River', 'river', 34.8, 113.7, 60], ['the Yellow River', 'river', 36.1, 103.8, 60],
  ['the Mekong River', 'river', 11.6, 104.9, 60], ['the Mekong River', 'river', 17.9, 102.6, 60], ['the Mekong River', 'river', 10.0, 105.8, 60],
  ['the Ganges', 'river', 25.3, 83.0, 60], ['the Ganges', 'river', 23.0, 88.5, 60], ['the Ganges', 'river', 26.5, 80.3, 60],
  ['the Danube', 'river', 48.2, 16.4, 45], ['the Danube', 'river', 47.5, 19.0, 45], ['the Danube', 'river', 44.8, 20.5, 45], ['the Danube', 'river', 44.0, 26.5, 45],
  ['the Rhine', 'river', 50.9, 6.97, 40], ['the Rhine', 'river', 47.6, 7.6, 40],
  ['the Volga', 'river', 56.3, 44.0, 60], ['the Volga', 'river', 48.7, 44.5, 60],
  ['the Congo River', 'river', -4.3, 15.3, 70], ['the Congo River', 'river', 0.5, 25.2, 70],
  ['the Niger River', 'river', 13.5, 2.1, 60], ['the Zambezi River', 'river', -15.6, 30.4, 50],
  ['the Tigris and Euphrates', 'river', 33.3, 44.4, 70], ['the St. Lawrence River', 'river', 46.8, -71.2, 60],
  ['the Murray River', 'river', -34.7, 139.4, 70], ['the Rio de la Plata', 'river', -34.6, -58.2, 70],
  ['the Seine', 'river', 48.9, 2.35, 25], ['the Thames', 'river', 51.5, -0.1, 25], ['the Tiber', 'river', 41.9, 12.5, 20],
  // Lakes and inland seas
  ['the Caspian Sea', 'lake', 41.5, 50.5, 330], ['the Aral Sea', 'lake', 45.0, 60.0, 110], ['Lake Baikal', 'lake', 53.5, 108.0, 160],
  ['Lake Victoria', 'lake', -1.0, 33.0, 130], ['Lake Tanganyika', 'lake', -6.3, 29.5, 130], ['Lake Chad', 'lake', 13.0, 14.0, 90],
  ['Lake Superior', 'lake', 47.7, -87.5, 150], ['Lake Michigan', 'lake', 44.0, -87.0, 110], ['Lake Huron', 'lake', 45.0, -82.2, 110],
  ['Lake Erie', 'lake', 42.2, -81.2, 90], ['Lake Ontario', 'lake', 43.7, -77.8, 80], ['Lake Titicaca', 'lake', -15.9, -69.4, 60],
  ['Lake Geneva', 'lake', 46.4, 6.5, 30], ['the Dead Sea', 'lake', 31.5, 35.5, 30], ['Lake Balkhash', 'lake', 46.5, 74.0, 150],
  ['Lake Nicaragua', 'lake', 11.6, -85.4, 60], ['Lake Constance', 'lake', 47.6, 9.4, 25],
  // Mountains and volcanoes
  ['Mount Everest', 'mountain', 27.99, 86.93, 90], ['Mont Blanc', 'mountain', 45.83, 6.86, 55], ['Mount Fuji', 'mountain', 35.36, 138.73, 70],
  ['Mount Kilimanjaro', 'mountain', -3.07, 37.35, 80], ['Denali', 'mountain', 63.07, -151.0, 120], ['Mount Aconcagua', 'mountain', -32.65, -70.0, 100],
  ['Mount Etna', 'mountain', 37.75, 15.0, 60], ['Mount Vesuvius', 'mountain', 40.82, 14.43, 35], ['Mount Elbrus', 'mountain', 43.35, 42.44, 80],
  ['Mount Ararat', 'mountain', 39.7, 44.3, 70], ['the Matterhorn', 'mountain', 45.98, 7.66, 35], ['Mount Kenya', 'mountain', -0.15, 37.31, 60],
  ['Mauna Kea', 'mountain', 19.82, -155.47, 80], ['Mount St. Helens', 'mountain', 46.2, -122.2, 60], ['Mount Rainier', 'mountain', 46.85, -121.76, 60],
  // Straits, canals and capes
  ['the Strait of Gibraltar', 'strait', 35.97, -5.6, 55], ['the Suez Canal', 'strait', 30.5, 32.3, 45], ['the Bosphorus', 'strait', 41.1, 29.05, 35],
  ['the Panama Canal', 'strait', 9.1, -79.7, 45], ['the Strait of Malacca', 'strait', 2.5, 101.5, 130], ['the Strait of Hormuz', 'strait', 26.5, 56.5, 80],
  ['the English Channel', 'strait', 50.2, -0.5, 100], ['the Bering Strait', 'strait', 65.8, -168.9, 90], ['the Strait of Dover', 'strait', 51.0, 1.4, 40],
  ['the Cape of Good Hope', 'strait', -34.36, 18.47, 60], ['Cape Horn', 'strait', -55.98, -67.27, 100], ['the Strait of Magellan', 'strait', -53.5, -70.5, 90],
  ['the Gulf of Aqaba', 'strait', 28.8, 34.9, 50], ['the Dardanelles', 'strait', 40.2, 26.4, 35],
  // Islands and island groups
  ['Iceland', 'island', 64.9, -18.5, 250], ['Hawaii', 'island', 20.5, -157.0, 330], ['Crete', 'island', 35.2, 24.9, 100], ['Sicily', 'island', 37.6, 14.0, 130],
  ['Sardinia', 'island', 40.0, 9.0, 100], ['Corsica', 'island', 42.1, 9.1, 70], ['Cyprus', 'island', 35.0, 33.2, 90], ['Madagascar', 'island', -19.0, 46.7, 420],
  ['Sri Lanka', 'island', 7.8, 80.7, 200], ['the Maldives', 'island', 3.2, 73.2, 170], ['the Galapagos Islands', 'island', -0.7, -90.6, 170],
  ['the Canary Islands', 'island', 28.3, -15.5, 160], ['the Azores', 'island', 38.7, -27.2, 220], ['the Bahamas', 'island', 24.5, -77.5, 250],
  ['the Balearic Islands', 'island', 39.5, 2.9, 110], ['Greenland', 'island', 72.0, -40.0, 600], ['Tasmania', 'island', -42.0, 146.6, 200],
  ['New Zealand’s North Island', 'island', -38.5, 175.5, 250], ['New Zealand’s South Island', 'island', -43.7, 170.5, 280],
  ['Bali', 'island', -8.4, 115.2, 80], ['Java', 'island', -7.5, 110.5, 340], ['Sumatra', 'island', -0.6, 101.5, 450], ['Borneo', 'island', 0.5, 114.0, 450],
  ['Hokkaido', 'island', 43.4, 142.8, 200], ['Taiwan', 'island', 23.7, 121.0, 180], ['the Philippines', 'island', 12.5, 122.0, 400], ['Fiji', 'island', -17.7, 178.0, 200],
  ['Tahiti', 'island', -17.65, -149.45, 90], ['Puerto Rico', 'island', 18.2, -66.5, 100], ['Cuba', 'island', 21.6, -79.0, 400], ['Jamaica', 'island', 18.1, -77.3, 100],
  ['Ireland', 'island', 53.4, -8.0, 220], ['Great Britain', 'island', 54.0, -2.5, 380], ['Newfoundland', 'island', 48.7, -56.0, 250], ['Svalbard', 'island', 78.7, 16.0, 250],
  // Famous sights
  ['the Grand Canyon', 'sight', 36.1, -112.1, 90], ['Niagara Falls', 'sight', 43.08, -79.07, 40], ['Angkor Wat', 'sight', 13.41, 103.87, 45],
  ['the Great Wall of China', 'sight', 40.4, 116.0, 100], ['Victoria Falls', 'sight', -17.92, 25.86, 45], ['Uluru', 'sight', -25.34, 131.04, 80],
  ['Yellowstone', 'sight', 44.6, -110.5, 100], ['Death Valley', 'sight', 36.5, -117.1, 90], ['the Salar de Uyuni', 'sight', -20.1, -67.5, 100],
  ['Iguazu Falls', 'sight', -25.7, -54.4, 50], ['Machu Picchu', 'sight', -13.16, -72.55, 60], ['the Great Barrier Reef', 'sight', -18.3, 147.7, 320],
  ['the Pyramids of Giza', 'sight', 29.98, 31.13, 35], ['Petra', 'sight', 30.33, 35.44, 40], ['the Taj Mahal', 'sight', 27.17, 78.04, 45],
  ['Stonehenge', 'sight', 51.18, -1.83, 30], ['the Giant’s Causeway', 'sight', 55.24, -6.51, 30], ['the Norwegian fjords', 'sight', 61.0, 6.5, 130],
  ['the Dolomites', 'sight', 46.4, 11.8, 70], ['Ha Long Bay', 'sight', 20.9, 107.1, 60], ['the Maasai Mara', 'sight', -1.5, 35.1, 80],
  ['the Serengeti', 'sight', -2.35, 34.8, 110], ['the Okavango Delta', 'sight', -19.3, 22.9, 90], ['Table Mountain', 'sight', -33.96, 18.4, 40],
  ['the Palm Islands of Dubai', 'sight', 25.12, 55.13, 30], ['Cappadocia', 'sight', 38.65, 34.85, 60], ['the Loire Valley', 'sight', 47.4, 0.7, 80],
  ['Mount Rushmore', 'sight', 43.88, -103.46, 45], ['the Everglades', 'sight', 25.4, -80.9, 90], ['Banff', 'sight', 51.18, -115.57, 70],
];
