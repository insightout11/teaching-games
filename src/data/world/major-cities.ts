/**
 * Cities a Live Room flight might pass over: [name, lat, lng]. The first group is hand-picked for recognisability to
 * kids and teens; the second fills the gaps along the busiest routes (Russia, Central Asia, Africa, the Americas) so a
 * long flight has something to name more of the time. Coordinates are city centres to about 0.1°.
 */
const CORE_CITIES: Array<[string, number, number]> = [
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

const MORE_CITIES: Array<[string, number, number]> = [
  // Europe and Russia
  ['Lyon', 45.76, 4.84], ['Marseille', 43.3, 5.37], ['Nice', 43.7, 7.26], ['Bordeaux', 44.84, -0.58], ['Toulouse', 43.6, 1.44], ['Seville', 37.39, -5.99],
  ['Valencia', 39.47, -0.38], ['Porto', 41.15, -8.61], ['Venice', 45.44, 12.32], ['Florence', 43.77, 11.26], ['Turin', 45.07, 7.69], ['Bologna', 44.49, 11.34],
  ['Geneva', 46.2, 6.14], ['Cologne', 50.94, 6.96], ['Düsseldorf', 51.23, 6.78], ['Stuttgart', 48.78, 9.18], ['Leipzig', 51.34, 12.37], ['Dresden', 51.05, 13.74],
  ['Kraków', 50.06, 19.94], ['Gdańsk', 54.35, 18.65], ['Riga', 56.95, 24.1], ['Tallinn', 59.44, 24.75], ['Vilnius', 54.69, 25.28], ['Minsk', 53.9, 27.57],
  ['Belgrade', 44.79, 20.45], ['Zagreb', 45.81, 15.98], ['Sofia', 42.7, 23.32], ['Sarajevo', 43.86, 18.41], ['Skopje', 42.0, 21.43], ['Tirana', 41.33, 19.82],
  ['Thessaloniki', 40.64, 22.94], ['Glasgow', 55.86, -4.25], ['Birmingham', 52.48, -1.9], ['Liverpool', 53.41, -2.99], ['Gothenburg', 57.71, 11.97],
  ['Bergen', 60.39, 5.32], ['Tromsø', 69.65, 18.96], ['Murmansk', 68.97, 33.08], ['Arkhangelsk', 64.54, 40.54], ['Kazan', 55.8, 49.1],
  ['Nizhny Novgorod', 56.33, 44.0], ['Samara', 53.2, 50.15], ['Volgograd', 48.71, 44.51], ['Rostov-on-Don', 47.23, 39.72], ['Sochi', 43.6, 39.73],
  ['Perm', 58.01, 56.23], ['Ufa', 54.74, 55.97], ['Yekaterinburg', 56.84, 60.6], ['Chelyabinsk', 55.16, 61.4], ['Tyumen', 57.15, 65.53], ['Omsk', 54.99, 73.37],
  ['Tomsk', 56.5, 84.97], ['Norilsk', 69.35, 88.2], ['Krasnoyarsk', 56.01, 92.85], ['Irkutsk', 52.29, 104.3], ['Ulan-Ude', 51.83, 107.6], ['Chita', 52.03, 113.5],
  ['Yakutsk', 62.03, 129.73], ['Khabarovsk', 48.48, 135.08], ['Magadan', 59.56, 150.8], ['Petropavlovsk-Kamchatsky', 53.04, 158.65],
  ['Tórshavn', 62.01, -6.77], ['Longyearbyen', 78.22, 15.65], ['Nuuk', 64.18, -51.72],
  // Caucasus, Central Asia and the Middle East
  ['Baku', 40.41, 49.87], ['Tbilisi', 41.72, 44.79], ['Yerevan', 40.18, 44.51], ['Astana', 51.17, 71.45], ['Bishkek', 42.87, 74.59], ['Dushanbe', 38.56, 68.79],
  ['Ashgabat', 37.96, 58.33], ['Samarkand', 39.65, 66.96], ['Urumqi', 43.83, 87.62], ['Kabul', 34.53, 69.17], ['Jeddah', 21.54, 39.17], ['Mecca', 21.42, 39.83],
  ['Muscat', 23.59, 58.41], ['Kuwait City', 29.38, 47.99], ['Manama', 26.23, 50.59], ['Beirut', 33.89, 35.5], ['Damascus', 33.51, 36.29], ['Jerusalem', 31.77, 35.21],
  ['Mashhad', 36.3, 59.6], ['Isfahan', 32.65, 51.67], ['Shiraz', 29.59, 52.58], ['Tabriz', 38.08, 46.29], ['Ankara', 39.93, 32.86], ['Izmir', 38.42, 27.14],
  ['Antalya', 36.9, 30.7], ["Sana'a", 15.35, 44.2], ['Aden', 12.8, 45.03],
  // East, South and Southeast Asia
  ["Xi'an", 34.34, 108.94], ['Shenyang', 41.8, 123.43], ['Dalian', 38.91, 121.6], ['Qingdao', 36.07, 120.38], ['Lanzhou', 36.06, 103.83], ['Lhasa', 29.65, 91.12],
  ['Zhengzhou', 34.75, 113.62], ['Changsha', 28.23, 112.94], ['Xiamen', 24.48, 118.09], ['Nanning', 22.82, 108.37], ['Jinan', 36.65, 117.0], ['Taiyuan', 37.87, 112.55],
  ['Hohhot', 40.84, 111.75], ['Changchun', 43.89, 125.32], ['Pyongyang', 39.04, 125.76], ['Incheon', 37.46, 126.7], ['Nagoya', 35.18, 136.9], ['Hiroshima', 34.39, 132.46],
  ['Sendai', 38.27, 140.87], ['Naha', 26.21, 127.68], ['Da Nang', 16.05, 108.2], ['Hue', 16.46, 107.59], ['Vientiane', 17.97, 102.6], ['Luang Prabang', 19.89, 102.13],
  ['Penang', 5.41, 100.33], ['Johor Bahru', 1.49, 103.74], ['Surabaya', -7.25, 112.75], ['Medan', 3.59, 98.67], ['Bandung', -6.92, 107.6], ['Makassar', -5.15, 119.43],
  ['Cebu', 10.32, 123.89], ['Davao', 7.07, 125.61], ['Mandalay', 21.97, 96.08], ['Naypyidaw', 19.76, 96.08], ['Jaipur', 26.91, 75.79], ['Ahmedabad', 23.02, 72.57],
  ['Pune', 18.52, 73.86], ['Lucknow', 26.85, 80.95], ['Kochi', 9.93, 76.27], ['Panaji', 15.5, 73.83], ['Nagpur', 21.15, 79.09], ['Patna', 25.59, 85.14],
  ['Amritsar', 31.63, 74.87], ['Srinagar', 34.08, 74.8], ['Islamabad', 33.68, 73.05], ['Peshawar', 34.0, 71.58], ['Chittagong', 22.36, 91.78], ['Malé', 4.18, 73.51],
  ['Thimphu', 27.47, 89.64],
  // Africa
  ['Abidjan', 5.36, -4.0], ['Kampala', 0.35, 32.58], ['Kigali', -1.95, 30.06], ['Lusaka', -15.39, 28.32], ['Harare', -17.83, 31.05], ['Maputo', -25.97, 32.57],
  ['Antananarivo', -18.88, 47.51], ['Tripoli', 32.89, 13.19], ['Mombasa', -4.04, 39.67], ['Zanzibar', -6.16, 39.19], ['Windhoek', -22.56, 17.08],
  ['Gaborone', -24.65, 25.91], ['Durban', -29.86, 31.02], ['Mogadishu', 2.05, 45.32], ['Bamako', 12.64, -8.0], ['Ouagadougou', 12.37, -1.52], ['Niamey', 13.51, 2.11],
  ["N'Djamena", 12.13, 15.06], ['Yaoundé', 3.85, 11.5], ['Libreville', 0.42, 9.47], ['Douala', 4.05, 9.7], ['Conakry', 9.64, -13.58], ['Freetown', 8.48, -13.23],
  ['Monrovia', 6.3, -10.8], ['Abuja', 9.07, 7.4], ['Kano', 12.0, 8.52], ['Alexandria', 31.2, 29.92], ['Luxor', 25.7, 32.64], ['Aswan', 24.09, 32.9],
  ['Port Said', 31.26, 32.3], ['Juba', 4.85, 31.58], ['Asmara', 15.34, 38.93], ['Djibouti', 11.59, 43.15], ['Lilongwe', -13.96, 33.77], ['Bulawayo', -20.15, 28.58],
  ['Port Louis', -20.16, 57.5], ['Nouakchott', 18.09, -15.98], ['Rabat', 34.02, -6.84], ['Fez', 34.03, -5.0], ['Tangier', 35.77, -5.8], ['Oran', 35.7, -0.64],
  ['Benghazi', 32.12, 20.07], ['Pretoria', -25.75, 28.19], ['Gqeberha', -33.96, 25.6], ['Las Palmas', 28.1, -15.41], ['Funchal', 32.65, -16.91], ['Ponta Delgada', 37.74, -25.67],
  // North America
  ['Edmonton', 53.55, -113.49], ['Winnipeg', 49.9, -97.14], ['Ottawa', 45.42, -75.7], ['Quebec City', 46.81, -71.21], ['Halifax', 44.65, -63.57], ['Regina', 50.45, -104.62],
  ['Whitehorse', 60.72, -135.05], ['Yellowknife', 62.45, -114.37], ["St. John's", 47.56, -52.71], ['Minneapolis', 44.98, -93.27], ['St. Louis', 38.63, -90.2],
  ['Kansas City', 39.1, -94.58], ['Nashville', 36.16, -86.78], ['New Orleans', 29.95, -90.07], ['San Diego', 32.72, -117.16], ['Portland', 45.52, -122.68],
  ['Salt Lake City', 40.76, -111.89], ['Pittsburgh', 40.44, -80.0], ['Cleveland', 41.5, -81.69], ['Charlotte', 35.23, -80.84], ['Tampa', 27.95, -82.46],
  ['San Antonio', 29.42, -98.49], ['Oklahoma City', 35.47, -97.52], ['Albuquerque', 35.08, -106.65], ['Omaha', 41.26, -95.93], ['Memphis', 35.15, -90.05],
  ['Indianapolis', 39.77, -86.16], ['Columbus', 39.96, -83.0], ['Cincinnati', 39.1, -84.51], ['Milwaukee', 43.04, -87.91], ['Raleigh', 35.78, -78.64],
  ['Boise', 43.62, -116.2], ['Sacramento', 38.58, -121.49], ['Fairbanks', 64.84, -147.72], ['Juneau', 58.3, -134.42], ['Guadalajara', 20.66, -103.35],
  ['Monterrey', 25.67, -100.31], ['Tijuana', 32.51, -117.04], ['Mérida', 20.97, -89.62],
  // Central America, the Caribbean and South America
  ['Guatemala City', 14.63, -90.51], ['San José', 9.93, -84.08], ['San Salvador', 13.69, -89.19], ['Tegucigalpa', 14.07, -87.19], ['Managua', 12.14, -86.25],
  ['Kingston', 17.97, -76.79], ['Santo Domingo', 18.49, -69.93], ['San Juan', 18.47, -66.1], ['Port-au-Prince', 18.54, -72.34], ['Nassau', 25.05, -77.35],
  ['Medellín', 6.24, -75.58], ['Cali', 3.45, -76.53], ['Cartagena', 10.39, -75.48], ['Guayaquil', -2.17, -79.92], ['Cusco', -13.53, -71.97], ['Arequipa', -16.4, -71.54],
  ['Córdoba', -31.42, -64.18], ['Mendoza', -32.89, -68.84], ['Valparaíso', -33.05, -71.62], ['Punta Arenas', -53.16, -70.91], ['Ushuaia', -54.8, -68.3],
  ['Asunción', -25.26, -57.58], ['Santa Cruz', -17.78, -63.18], ['Recife', -8.05, -34.88], ['Salvador', -12.97, -38.5], ['Fortaleza', -3.73, -38.53],
  ['Belo Horizonte', -19.92, -43.94], ['Porto Alegre', -30.03, -51.23], ['Curitiba', -25.43, -49.27], ['Belém', -1.46, -48.5], ['Paramaribo', 5.85, -55.2],
  ['Georgetown', 6.8, -58.16], ['Bariloche', -41.13, -71.31], ['Salta', -24.78, -65.41], ['Rosario', -32.95, -60.64], ['Sucre', -19.03, -65.26],
  // Oceania and the Pacific
  ['Christchurch', -43.53, 172.64], ['Queenstown', -45.03, 168.66], ['Suva', -18.14, 178.44], ['Port Moresby', -9.44, 147.18], ['Gold Coast', -28.0, 153.43],
  ['Hobart', -42.88, 147.33], ['Canberra', -35.28, 149.13], ['Alice Springs', -23.7, 133.88], ['Townsville', -19.26, 146.82], ['Nouméa', -22.27, 166.45],
  ['Papeete', -17.54, -149.57], ['Apia', -13.83, -171.76], ["Nuku'alofa", -21.14, -175.2], ['Hilo', 19.72, -155.09], ['Hagåtña', 13.47, 144.79],
  ['Port Vila', -17.73, 168.32], ['Honiara', -9.43, 159.95],
];

export const MAJOR_CITIES: Array<[string, number, number]> = [...CORE_CITIES, ...MORE_CITIES];
