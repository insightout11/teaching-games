/** Explicitly authored metadata for ready-made Taboo/Hot Seat decks. No AI call
 * or guess from an arbitrary word. Ambiguous/abstract words intentionally have no entry.
 */
const QUERIES: Record<string, string> = {
  cat: 'domestic cat animal', kitten: 'small kitten animal', dog: 'domestic dog animal', puppy: 'small puppy dog',
  elephant: 'African elephant animal', giraffe: 'giraffe animal wildlife', zebra: 'zebra animal wildlife',
  penguin: 'penguin bird animal', dolphin: 'dolphin marine mammal', shark: 'shark marine animal',
  turtle: 'turtle animal shell', crocodile: 'crocodile animal reptile', butterfly: 'butterfly insect wings',
  bee: 'honey bee insect', ant: 'ant insect animal', spider: 'spider animal web',
  dinosaur: 'dinosaur museum skeleton', volcano: 'volcano mountain landscape', waterfall: 'waterfall river landscape',
  mountain: 'mountain natural landscape', glacier: 'glacier ice landscape', island: 'island coastal landscape',
  ocean: 'ocean water waves', beach: 'sandy beach coast', desert: 'desert sand dunes', forest: 'forest trees landscape',
  rainbow: 'rainbow sky weather', snowflake: 'snowflake ice crystal', tornado: 'tornado weather funnel',
  bicycle: 'bicycle pedal vehicle', skateboard: 'skateboard sports equipment', helicopter: 'helicopter aircraft vehicle',
  airplane: 'airplane passenger aircraft', aeroplane: 'airplane passenger aircraft', tractor: 'farm tractor vehicle',
  submarine: 'submarine vessel exterior', spaceship: 'spacecraft museum model', telescope: 'astronomical telescope instrument',
  microscope: 'laboratory microscope instrument', robot: 'robot machine exhibition', rocket: 'space rocket launchpad',
  astronaut: 'astronaut space suit', planet: 'solar system planet',
  apple: 'red apple fruit', banana: 'banana yellow fruit', pineapple: 'pineapple tropical fruit',
  watermelon: 'watermelon green fruit', strawberry: 'strawberry red fruit', carrot: 'carrot orange vegetable',
  broccoli: 'broccoli green vegetable', potato: 'potato vegetable food', cucumber: 'cucumber green vegetable',
  pizza: 'pizza baked food', sandwich: 'sandwich bread food', pancake: 'pancake cooked food',
  popcorn: 'popcorn popped corn', chocolate: 'chocolate food bar',
  umbrella: 'umbrella rain object', backpack: 'backpack school bag', suitcase: 'suitcase travel luggage',
  passport: 'passport travel document cover', toothbrush: 'toothbrush bathroom object',
  violin: 'violin musical instrument', piano: 'piano musical instrument', guitar: 'guitar musical instrument',
  library: 'library books interior', museum: 'museum gallery interior', airport: 'airport terminal exterior',
  restaurant: 'restaurant dining interior', hospital: 'hospital building exterior',
};

export function bankedPictureQuery(word: string): string {
  const key = word.trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(QUERIES, key) ? QUERIES[key] : '';
}
