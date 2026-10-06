/** Whole-chapter questions checked against the corrected chapter boundaries. */
export type Check = [string,string,string,string];
export type PackFacts = { predict: [string,string,string]; check: [Check,Check,Check]; talk?: string };
export const correctedPackFacts: Record<string,PackFacts> = {
  'book-alice-2': {
    predict: ['Alice reaches the bank with a mouse and other animals','Alice wins a race run by the dodo','The White Rabbit carries Alice across the pool'],
    check: [
      ['Why does Alice enter the pool?','She has cried enough tears to fill it','The Rabbit pushes her in','She is following a boat'],
      ['Who does Alice try to speak with?','A Mouse swimming nearby','The Queen of Hearts','The White Rabbit’s servant'],
      ['How does the Mouse react when Alice talks about Dinah?','It is upset because Dinah catches mice','It asks to meet Dinah','It gives Alice a prize'],
    ],
    talk:'Should Alice stop talking about Dinah when the Mouse objects?',
  },
  'book-oz-1': {
    predict:['A cyclone carries Dorothy’s house away from Kansas','Dorothy meets the Wizard in Kansas','Toto leads Dorothy along a yellow road'],
    check:[
      ['Why does Dorothy remain inside when the cyclone comes?','She goes back for Toto','She wants to watch the storm','She cannot open the cellar door'],
      ['What happens to the house during the storm?','The wind lifts it into the air','It breaks apart on the farm','It sinks into a river'],
      ['What wakes Dorothy at the end?','The house lands with a bump','A Munchkin knocks at the door','The Wizard calls her name'],
    ],
    talk:'Should Dorothy have gone back for Toto during the storm?',
  },
  'book-peter-1': {
    predict:['Mrs. Darling sees Peter at the nursery window','Wendy sews Peter’s shadow to him','The children fly to Neverland'],
    check:[
      ['Who first tells Mrs. Darling about Peter?','Wendy','Nana','Captain Hook'],
      ['What does Mrs. Darling notice about the children’s minds?','They keep thinking about Peter Pan','They have forgotten their home','They are planning a sea voyage'],
      ['What happens at the nursery window?','Mrs. Darling sees a boy and a small light','The children fly out after Peter','A pirate climbs into the room'],
    ],
    talk:'Should Mrs. Darling tell the children what she saw?',
  },
  'book-peter-2': {
    predict:['Nana catches Peter’s shadow and is later tied outside','Wendy leaves with Peter that night','Captain Hook arrives at the nursery'],
    check:[
      ['What does Nana catch near the window?','Peter’s shadow','A pirate’s hat','Tinker Bell’s light'],
      ['Why does Mr. Darling become angry with Nana?','He feels she has embarrassed him','She flies out of the window','She hides Wendy’s storybook'],
      ['Where is Nana when the parents leave?','Tied outside the house','Sleeping beside Wendy','Travelling with Peter'],
    ],
    talk:'Should Mr. Darling have tied Nana outside?',
  },
  'book-peter-3': {
    predict:['Wendy repairs Peter’s shadow and the children fly away','The children meet Captain Hook on the island','Mrs. Darling sends Peter home with Nana'],
    check:[
      ['Why does Peter return to the nursery?','He is looking for his shadow','He wants the family’s map','He has lost his ship'],
      ['How does Wendy help Peter?','She sews his shadow back on','She teaches him to swim','She hides him in a cupboard'],
      ['How do Wendy, John, and Michael leave?','They learn to fly and go through the window','They board a train with Nana','They sail away with the pirates'],
    ],
    talk:'Should the children leave home with Peter?',
  },
  'book-sherlock-3': {
    predict:['Holmes discovers Mary’s stepfather posed as Hosmer','Hosmer returns to the wedding church','Mary confronts Windibank with Holmes'],
    check:[
      ['Why does Mary visit Holmes?','Her fiancé vanished before their wedding','Her stepfather has disappeared','She cannot find a photograph'],
      ['Why did Windibank pretend to be Hosmer?','He wanted Mary to stay home and keep her income there','He wanted to travel with her','He was hiding from the police'],
      ['What does Holmes do after confronting Windibank?','He does not tell Mary the solution','He brings Mary back to the room','He asks Mary to arrest Windibank'],
    ],
  },
  'book6-treasure-island-3': {
    predict:['Jim meets Ben Gunn and the loyal group defends the stockade','Jim moves the Hispaniola after fighting Hands','Silver takes the map and finds the treasure'],
    check:[
      ['What shows Jim that Silver will kill to win?','Silver murders a sailor who refuses the mutiny','Silver burns the Hispaniola','Silver attacks Ben Gunn'],
      ['Who has lived alone on the island?','Ben Gunn','Israel Hands','Captain Smollett'],
      ['What does Smollett refuse to give Silver?','Flint’s treasure map','The ship’s wheel','Ben Gunn’s boat'],
    ],
  },
  'book6-time-machine-3': {
    predict:['The traveller finds the Morlocks and leads Weena toward safety','The traveller escapes in his machine','Weena becomes leader of the Eloi'],
    check:[
      ['Where does the traveller meet the Morlocks?','Below ground after climbing down a well','Inside his dining room','On the far-future shore'],
      ['What does he take from the Palace of Green Porcelain?','Matches and a metal bar','A new time machine','A letter from Weena'],
      ['Why does he light a fire in the wood?','To keep the Morlocks away','To summon his dinner guests','To melt the bronze doors'],
    ],
  },
};
