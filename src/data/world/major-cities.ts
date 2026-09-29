/**
 * Major cities a Live Room flight might pass over: [name, lat, lng].
 * Hand-picked for recognisability to kids and teens; coordinates are city
 * centres to about 0.1°.
 */
export const MAJOR_CITIES: Array<[string, number, number]> = [
  // Europe
  ['London', 51.5, -0.1], ['Paris', 48.9, 2.35], ['Madrid', 40.4, -3.7], ['Barcelona', 41.4, 2.2], ['Lisbon', 38.7, -9.1],
  ['Rome', 41.9, 12.5], ['Milan', 45.5, 9.2], ['Naples', 40.85, 14.3], ['Berlin', 52.5, 13.4], ['Munich', 48.1, 11.6],
  ['Hamburg', 53.55, 10], ['Frankfurt', 50.1, 8.7], ['Amsterdam', 52.4, 4.9], ['Brussels', 50.85, 4.35], ['Zurich', 47.4, 8.5],
  ['Vienna', 48.2, 16.4], ['Prague', 50.1, 14.4], ['Warsaw', 52.2, 21], ['Budapest', 47.5, 19.05], ['Copenhagen', 55.7, 12.6],
  ['Stockholm', 59.3, 18.1], ['Oslo', 59.9, 10.75], ['Helsinki', 60.2, 24.9], ['Dublin', 53.35, -6.3], ['Edinburgh', 55.95, -3.2],
  ['Manchester', 53.5, -2.25], ['Athens', 37.95, 23.7], ['Istanbul', 41, 29], ['Bucharest', 44.4, 26.1], ['Kyiv', 50.45, 30.5],
  ['Moscow', 55.75, 37.6], ['Saint Petersburg', 59.95, 30.3], ['Reykjavik', 64.15, -21.9],
  // Middle East & Africa
  ['Cairo', 30.05, 31.25], ['Dubai', 25.2, 55.3], ['Abu Dhabi', 24.45, 54.4], ['Doha', 25.3, 51.5], ['Riyadh', 24.7, 46.7],
  ['Tehran', 35.7, 51.4], ['Baghdad', 33.3, 44.4], ['Tel Aviv', 32.1, 34.8], ['Amman', 31.95, 35.9], ['Casablanca', 33.6, -7.6],
  ['Marrakesh', 31.6, -8], ['Algiers', 36.75, 3.05], ['Tunis', 36.8, 10.2], ['Lagos', 6.45, 3.4], ['Accra', 5.6, -0.2],
  ['Dakar', 14.7, -17.45], ['Nairobi', -1.3, 36.8], ['Addis Ababa', 9, 38.75], ['Kinshasa', -4.3, 15.3], ['Johannesburg', -26.2, 28.05],
  ['Cape Town', -33.9, 18.4], ['Dar es Salaam', -6.8, 39.3], ['Luanda', -8.85, 13.25], ['Khartoum', 15.6, 32.5],
  // Asia
  ['Tokyo', 35.7, 139.7], ['Osaka', 34.7, 135.5], ['Kyoto', 35, 135.75], ['Sapporo', 43.05, 141.35], ['Fukuoka', 33.6, 130.4],
  ['Seoul', 37.55, 127], ['Busan', 35.1, 129.05], ['Beijing', 39.9, 116.4], ['Shanghai', 31.2, 121.5], ['Guangzhou', 23.1, 113.25],
  ['Shenzhen', 22.55, 114.05], ['Hong Kong', 22.3, 114.2], ['Wuhan', 30.6, 114.3], ['Chengdu', 30.65, 104.05], ['Chongqing', 29.55, 106.5],
  ['Xi\'an', 34.25, 108.95], ['Nanjing', 32.05, 118.8], ['Hangzhou', 30.25, 120.15], ['Tianjin', 39.1, 117.2], ['Harbin', 45.75, 126.65],
  ['Kunming', 25.05, 102.7], ['Taipei', 25.05, 121.55], ['Manila', 14.6, 121], ['Hanoi', 21.05, 105.85], ['Ho Chi Minh City', 10.8, 106.65],
  ['Bangkok', 13.75, 100.5], ['Chiang Mai', 18.8, 98.95], ['Phnom Penh', 11.55, 104.9], ['Yangon', 16.85, 96.2], ['Kuala Lumpur', 3.15, 101.7],
  ['Singapore', 1.3, 103.8], ['Jakarta', -6.2, 106.85], ['Bali', -8.65, 115.2], ['Delhi', 28.6, 77.2], ['Mumbai', 19.05, 72.85],
  ['Bengaluru', 12.95, 77.6], ['Chennai', 13.05, 80.25], ['Kolkata', 22.55, 88.35], ['Hyderabad', 17.4, 78.5], ['Karachi', 24.85, 67],
  ['Lahore', 31.55, 74.35], ['Dhaka', 23.8, 90.4], ['Kathmandu', 27.7, 85.3], ['Colombo', 6.9, 79.85], ['Tashkent', 41.3, 69.25],
  ['Almaty', 43.25, 76.9], ['Ulaanbaatar', 47.9, 106.9], ['Vladivostok', 43.1, 131.9], ['Novosibirsk', 55, 82.95],
  // Americas
  ['New York', 40.7, -74], ['Boston', 42.35, -71.05], ['Washington', 38.9, -77.05], ['Philadelphia', 39.95, -75.15], ['Chicago', 41.9, -87.65],
  ['Detroit', 42.35, -83.05], ['Atlanta', 33.75, -84.4], ['Miami', 25.75, -80.2], ['Orlando', 28.55, -81.4], ['Houston', 29.75, -95.35],
  ['Dallas', 32.8, -96.8], ['Austin', 30.25, -97.75], ['Denver', 39.75, -105], ['Phoenix', 33.45, -112.05], ['Las Vegas', 36.15, -115.15],
  ['Los Angeles', 34.05, -118.25], ['San Francisco', 37.75, -122.4], ['Seattle', 47.6, -122.35], ['Toronto', 43.65, -79.4], ['Montreal', 45.5, -73.55],
  ['Vancouver', 49.25, -123.1], ['Calgary', 51.05, -114.05], ['Anchorage', 61.2, -149.9], ['Mexico City', 19.45, -99.15], ['Cancún', 21.15, -86.85],
  ['Havana', 23.1, -82.35], ['Panama City', 8.95, -79.5], ['Bogotá', 4.7, -74.05], ['Lima', -12.05, -77.05], ['Quito', -0.2, -78.5],
  ['Caracas', 10.5, -66.9], ['Santiago', -33.45, -70.65], ['Buenos Aires', -34.6, -58.4], ['Montevideo', -34.9, -56.15], ['São Paulo', -23.55, -46.65],
  ['Rio de Janeiro', -22.9, -43.2], ['Brasília', -15.8, -47.9], ['Manaus', -3.1, -60], ['La Paz', -16.5, -68.15],
  // Oceania
  ['Sydney', -33.85, 151.2], ['Melbourne', -37.8, 144.95], ['Brisbane', -27.45, 153.05], ['Perth', -31.95, 115.85], ['Adelaide', -34.95, 138.6],
  ['Darwin', -12.45, 130.85], ['Cairns', -16.9, 145.75], ['Auckland', -36.85, 174.75], ['Wellington', -41.3, 174.8], ['Honolulu', 21.3, -157.85],
];
