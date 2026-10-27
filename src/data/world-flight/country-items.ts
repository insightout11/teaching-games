/**
 * Country items (Oct 2026, pilot 001): the class earns one for a country it flew over AND talked about (the teacher's
 * "We talked about it" click). Objects, not clothing, so no national dress becomes a costume. Each uses a drawn
 * sticker from /public/stickers. DRAFT list for Matt's review: accuracy and respect first.
 */
export interface CountryItem { country: string; item: string; sticker: string | null; fact: string; artPrompt?: string }

export const COUNTRY_ITEMS: readonly CountryItem[] = [
  { country: 'Egypt', item: 'Felucca sailboat', sticker: 'sailboat', fact: 'Feluccas have sailed the Nile for thousands of years.' },
  { country: 'Saudi Arabia', item: 'Camel', sticker: 'camel', fact: 'Camels can go for days in the desert without drinking.' },
  { country: 'United Arab Emirates', item: 'Pearl shell', sticker: 'shell', fact: 'Before oil, pearl diving was a main job along the Gulf coast.' },
  { country: 'Jordan', item: 'Desert sand', sticker: 'sand-dune', fact: 'Wadi Rum has red sand and huge rocks; films set on Mars were made there.' },
  { country: 'Turkey', item: 'Mosaic lamp', sticker: 'lamp', fact: "Colourful glass mosaic lamps are sold in Istanbul's Grand Bazaar." },
  { country: 'Greece', item: 'Island ferry', sticker: 'ferry', fact: 'Greece has thousands of islands, and ferries connect many of them.' },
  { country: 'Italy', item: 'Pizza', sticker: 'pizza', fact: 'Pizza Margherita comes from Naples.' },
  { country: 'France', item: 'Baguette', sticker: 'bread', fact: "The French baguette is on UNESCO's list of world culture." },
  { country: 'Spain', item: 'Spanish guitar', sticker: 'guitar', fact: 'The modern classical guitar was developed in Spain.' },
  { country: 'United Kingdom', item: 'Double-decker bus', sticker: 'bus', fact: "London's red double-decker buses are famous around the world." },
  { country: 'Germany', item: 'Cuckoo clock', sticker: 'clock', fact: "Cuckoo clocks are made in Germany's Black Forest." },
  { country: 'Switzerland', item: 'Swiss chocolate', sticker: 'chocolate', fact: 'Milk chocolate was first made in Switzerland.' },
  { country: 'Netherlands', item: 'Bicycle', sticker: 'bike', fact: 'The Netherlands has more bicycles than people.' },
  { country: 'Portugal', item: 'Lisbon tram', sticker: 'tram', fact: "Old yellow trams climb Lisbon's steep hills." },
  { country: 'Norway', item: 'Skis', sticker: 'ski', fact: 'Skiing has been part of life in Norway for thousands of years.' },
  { country: 'Morocco', item: 'Mint tea teapot', sticker: 'teapot', fact: 'Mint tea is poured from high up to make bubbles on top.' },
  { country: 'Ethiopia', item: 'Coffee', sticker: 'coffee', fact: 'Coffee is believed to have first been used in Ethiopia.' },
  { country: 'Kenya', item: 'Giraffe', sticker: 'giraffe', fact: "Giraffes live in Kenya's savanna parks." },
  { country: 'Nigeria', item: 'Talking drum', sticker: 'drum', fact: 'The talking drum can copy the tones of spoken words.' },
  { country: 'South Africa', item: 'Penguin', sticker: 'penguin', fact: 'African penguins live on beaches near Cape Town.' },
  { country: 'Iran', item: 'Persian rug', sticker: 'rug', fact: 'Persian rugs are hand-knotted; one can take months to make.' },
  { country: 'India', item: 'Cup of chai', sticker: 'tea', fact: 'Chai is tea cooked with milk and spices.' },
  { country: 'Nepal', item: 'Himalayan peak', sticker: 'mountain', fact: "Eight of the world's ten highest mountains are in Nepal." },
  { country: 'China', item: 'Giant panda', sticker: 'panda', fact: 'Wild giant pandas live only in the mountains of China.' },
  { country: 'Japan', item: 'Bullet train', sticker: 'train', fact: "Japan's Shinkansen bullet trains first ran in 1964." },
  { country: 'South Korea', item: 'Metal chopsticks', sticker: 'chopsticks', fact: 'In Korea, chopsticks are often made of metal.' },
  { country: 'Thailand', item: 'Elephant', sticker: 'elephant', fact: "The elephant is Thailand's national animal." },
  { country: 'Vietnam', item: 'Bowl of pho', sticker: 'noodles', fact: 'Pho is a noodle soup often eaten for breakfast.' },
  { country: 'Indonesia', item: 'Rice', sticker: 'rice', fact: "Bali's rice terraces are watered by a system about 1,000 years old." },
  { country: 'Philippines', item: 'Mango', sticker: 'mango', fact: 'Philippine mangoes are famous for being very sweet.' },
  { country: 'Singapore', item: 'Orchid', sticker: 'flower', fact: "Singapore's national flower is an orchid." },
  { country: 'Australia', item: 'Koala', sticker: 'koala', fact: 'Koalas sleep up to 20 hours a day.' },
  { country: 'New Zealand', item: 'Sheep', sticker: 'sheep', fact: 'New Zealand has about five sheep for every person.' },
  { country: 'Canada', item: 'Maple leaf', sticker: 'leaf', fact: "Canada's flag has a red maple leaf." },
  { country: 'United States of America', item: 'Basketball', sticker: 'basketball', fact: 'Basketball was invented in the United States in 1891.' },
  { country: 'Mexico', item: 'Corn', sticker: 'corn', fact: 'Corn was first grown in Mexico about 9,000 years ago.' },
  { country: 'Brazil', item: 'Football', sticker: 'football', fact: "Brazil has won the men's World Cup five times." },
  { country: 'Argentina', item: 'Tango', sticker: 'dance', fact: 'The tango began in Buenos Aires.' },
  { country: 'Peru', item: 'Potato', sticker: 'potato', fact: 'Potatoes were first grown in Peru, which has thousands of kinds.' },
];

export function countryItemFor(country: string | null | undefined): CountryItem | null {
  if (!country) return null;
  const c = country.trim().toLowerCase();
  return COUNTRY_ITEMS.find((i) => i.country.toLowerCase() === c) ?? null;
}
export const countryUnlockId = (country: string) => `country:${country}`;
