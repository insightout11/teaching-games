export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  audience: string;
  sections: { heading: string; body: string[] }[];
  links: { label: string; href: string }[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'online-esl-games-for-one-on-one-lessons',
    title: 'Online ESL Games That Work in One-on-One Lessons',
    description:
      'Practical ESL game formats for online tutors teaching exactly one student over Zoom, Meet, or a marketplace classroom.',
    date: '2026-07-03',
    audience: '1:1 online ESL tutors',
    sections: [
      {
        heading: 'The 1:1 problem',
        body: [
          'Many classroom games assume a group. One-on-one tutors need games that still create retrieval, choice, and speaking without pretending there is a crowd.',
          'The best 1:1 games use a timer, a visible challenge, or a teacher-vs-student rhythm. The student should feel pressure to think, but not pressure to perform for classmates who are not there.',
        ],
      },
      {
        heading: 'Formats that hold up',
        body: [
          'Vocabulary races work well because the student competes against the clock. GridRush, Vocab Sprint, Word Chain, and Synonym Showdown all turn one learner into an active participant.',
          'Deduction and clue games also work because the teacher can become the second voice. World Lens, Radar Fix, Brain Teasers, and 20 Questions give the student a reason to explain evidence.',
        ],
      },
      {
        heading: 'Make the student speak after the answer',
        body: [
          'The game answer is only the first step. After every answer, ask the student to use the word in a sentence, explain why they chose it, or connect it to their own life.',
          'That extra step is where a game becomes a language lesson instead of a quick distraction.',
        ],
      },
    ],
    links: [
      { label: '1:1 friendly games', href: '/classroom-games/no-devices' },
      { label: 'World Lens', href: '/classroom-games/world-lens' },
      { label: 'Video to lesson', href: '/video-lesson' },
    ],
  },
  {
    slug: 'zoom-esl-games-students-join-from-phones',
    title: 'Zoom ESL Games Students Can Join From Their Phones',
    description:
      'How to run live ESL games over Zoom or Google Meet while students answer from any browser, with no app installs.',
    date: '2026-07-03',
    audience: 'online group teachers',
    sections: [
      {
        heading: 'Why phone participation changes the lesson',
        body: [
          'A screen-shared slide deck makes students watch. A live lesson link makes them act. When students answer from their phones, every learner can respond at the same time instead of waiting for the loudest voice.',
          'The teacher still controls the room: the shared screen shows the prompt, timer, reveal, and leaderboard while student devices collect answers quietly.',
        ],
      },
      {
        heading: 'Good Zoom game flow',
        body: [
          'Start with a short warm-up prompt, move into a content game, then end with a speaking or reflection task. This keeps the lesson from becoming a random game night.',
          'For example: Quick Pulse to start, Flash Quiz or GridRush for retrieval, then In Your Words or Final Word to land the lesson.',
        ],
      },
      {
        heading: 'Avoid setup friction',
        body: [
          'Students should not need accounts. A browser link or QR code is enough. If joining takes longer than the game, the tool is stealing class time.',
          'Keep the teacher screen share stable and let students use whatever device is already next to them.',
        ],
      },
    ],
    links: [
      { label: 'Classroom games', href: '/classroom-games' },
      { label: 'Quick Pulse', href: '/classroom-activities/quick-pulse' },
      { label: 'Kahoot alternative for ESL', href: '/kahoot-alternative-for-esl' },
    ],
  },
  {
    slug: 'conversation-class-activities-for-online-esl',
    title: 'Conversation Class Activities for Online ESL Lessons',
    description:
      'Speaking-first ESL activities that give online conversation classes structure, repetition, and a clear landing.',
    date: '2026-07-03',
    audience: 'conversation class teachers',
    sections: [
      {
        heading: 'Conversation needs structure',
        body: [
          'A good conversation class is not just a list of questions. Students need a reason to listen, respond, revise, and use better language the second time.',
          'Structure does not mean killing spontaneity. It means giving the conversation a shape: choose, defend, compare, solve, reflect.',
        ],
      },
      {
        heading: 'Use activity types, not only topics',
        body: [
          'The same topic can become a ranking task, a dilemma, a role-play, a prediction, or a decision council. Changing the task changes the language students need.',
          'For example, travel can become World Lens for observation, Scenario Simulator for role-play, or Decision Council for persuasion.',
        ],
      },
      {
        heading: 'Always land the lesson',
        body: [
          'End with a final answer, final word, opinion shift, or quick reflection. Students remember the last clear thing they said.',
          'A landing activity also gives the teacher evidence: what vocabulary came back, what opinions changed, and who can explain the lesson in their own words.',
        ],
      },
    ],
    links: [
      { label: 'Classroom activities', href: '/classroom-activities' },
      { label: 'Scenario Simulator', href: '/classroom-activities/scenario-simulator' },
      { label: 'Decision Council', href: '/classroom-activities/decision-council' },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
