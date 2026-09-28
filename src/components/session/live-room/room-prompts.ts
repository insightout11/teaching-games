/**
 * Conversation starters for the Live Room stage. Written for kids and teens at
 * roughly B1: concrete, personal, easy to answer in one sentence and easy to
 * push further. Deliberately topic-neutral — this is the empty-room warm-up,
 * not a stand-in for topic content.
 */
export interface RoomPrompt {
  prompt: string;
  followUps: string[];
}

export const ROOM_PROMPTS: RoomPrompt[] = [
  { prompt: "What's something you watched, played or argued about this week?", followUps: ['Who else was involved?', 'Would you do it again?'] },
  { prompt: 'If you could live in any city for one year, where would you go?', followUps: ['What would you miss from home?', 'What would you do on your first day?'] },
  { prompt: "What's the best thing you ate recently?", followUps: ['Could you cook it yourself?', 'Describe it without saying its name.'] },
  { prompt: 'Which app or game could you never delete from your phone?', followUps: ['What do your parents think of it?', 'What would you replace it with?'] },
  { prompt: 'If you had a free day tomorrow with no rules, what would you do?', followUps: ['Who would you spend it with?', 'What would you definitely NOT do?'] },
  { prompt: "What's a skill you'd love to learn in one week?", followUps: ['Why that one?', 'Who would you ask to teach you?'] },
  { prompt: 'Describe your perfect weekend in three words.', followUps: ['Now explain each word.', 'How close was last weekend?'] },
  { prompt: 'What animal would make the funniest teacher?', followUps: ['What would it teach?', 'What would its rules be?'] },
  { prompt: "What's something that's popular right now that you don't understand?", followUps: ['Why do you think people like it?', 'Have you tried it?'] },
  { prompt: 'If you could invent one school rule, what would it be?', followUps: ['Who would hate it?', 'How would you make people follow it?'] },
  { prompt: "What's the most interesting place you've ever been?", followUps: ['What did it smell or sound like?', 'Would you take a friend there?'] },
  { prompt: 'Would you rather be able to fly or be invisible?', followUps: ['What would you do first?', 'What could go wrong?'] },
  { prompt: "What's a movie or show everyone should watch?", followUps: ['Explain the story in two sentences.', 'Who is the best character?'] },
  { prompt: 'What do you want to be really good at in five years?', followUps: ['What are you doing about it now?', "What's the hardest part?"] },
  { prompt: "What's something small that always makes your day better?", followUps: ['When did it last happen?', 'Could you do it for someone else?'] },
  { prompt: 'If you could meet anyone, alive or not, who would it be?', followUps: ['What would you ask first?', 'Where would you meet?'] },
];
