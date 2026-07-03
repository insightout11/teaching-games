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
        heading: 'What makes a 1:1 ESL game work',
        body: [
          'Many ESL games are built for teams, shouting, and peer comparison. That breaks down when there is only one student on the call. A strong one-on-one game needs three things: a visible task, a clear finish line, and a reason to speak after the answer.',
          'The best formats use the teacher as the second voice. You can be the clue giver, challenger, timer, judge, or fake opponent. The student should feel momentum without feeling like the activity is pretending there is a full class in the room.',
          'A useful test is simple: if the student gives a one-word answer and the game is over, it is probably too thin for tutoring. If the answer naturally leads to a sentence, correction, follow-up, or personal example, it can carry a lesson.',
        ],
      },
      {
        heading: 'Five formats that hold up with one student',
        body: [
          'Timed vocabulary races are usually the safest starting point. Use GridRush, Vocab Sprint, Word Chain, or Synonym Showdown when you want fast retrieval. The student competes against the clock, then explains two or three answers in full sentences.',
          'Deduction games work because the teacher can control the clues. World Lens, Radar Fix, Brain Teasers, and 20 Questions make the student listen, infer, and justify. These are especially useful for B1 and above because the language is not only vocabulary; it is evidence: "I think it is..." and "It cannot be... because..."',
          'Choice games are useful when the student is quiet. Give two options and force a decision: which picture, which solution, which opinion, which ending. Once the student chooses, ask for one reason, one counterargument, and one revised answer.',
          'Story games work when the student needs fluency more than accuracy. Start with a picture, a short video, or three random words. The student builds the story, then retells it with a target grammar point or new vocabulary.',
          'Teacher-versus-student games are good in short bursts. Let the student challenge your answer, correct your sentence, or beat your score. The competition is playful, but the real goal is repetition without sounding like a drill.',
        ],
      },
      {
        heading: 'A 45-minute one-on-one lesson flow',
        body: [
          'Start with a three-minute confidence warm-up. Ask a low-pressure question related to the topic, then write two useful phrases on screen. The goal is not correction yet; it is getting the student talking quickly.',
          'Spend ten minutes on a retrieval game. Pick vocabulary from the current unit, a video, or the student\'s homework. Keep the rounds short, then pause after every few answers for pronunciation, example sentences, or a quick contrast with a similar word.',
          'Move into a deeper task for fifteen minutes. This is where deduction, ranking, or role-play helps. The student should explain choices, listen to your pushback, and revise at least one answer.',
          'Use the next ten minutes for transfer. Ask the student to use the same language in a personal answer, mini-presentation, problem-solving task, or short written note that they read aloud.',
          'Finish with a two-minute landing. Ask: "What is one word you used well today?", "What answer changed?", or "What sentence do you want to remember?" This makes the game feel like part of a lesson, not a reward after the lesson.',
        ],
      },
      {
        heading: 'How to keep the game from becoming filler',
        body: [
          'Choose the language target before choosing the game. If the target is past tense storytelling, a speed quiz is probably the wrong tool. If the target is vocabulary recall, a long role-play may be too loose.',
          'Correct one pattern at a time. One-on-one students can receive more feedback than group students, but too much correction kills the rhythm. Pick the biggest pattern, give a model sentence, and run another round where the student has to use it.',
          'End each game with output. The answer is not the learning evidence. The sentence after the answer is. Ask the student to explain, compare, justify, personalize, or teach the word back to you.',
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
        heading: 'Why phone participation changes an online ESL class',
        body: [
          'A screen-shared slide deck makes students watch. A live lesson link makes them act. When every student can answer from a phone browser, you get responses from the quiet students, the late joiners, and the learners who need a few extra seconds before speaking.',
          'This matters in Zoom and Google Meet because turn-taking is fragile. If only one student can speak at a time, the loudest student often becomes the class rhythm. Phone participation lets everyone answer first, then the teacher chooses whose answer becomes the discussion point.',
          'The teacher still controls the room. The shared screen can show the prompt, timer, reveal, and scoreboard while student devices quietly collect answers. That keeps the lesson teacher-led instead of sending students into separate apps or tabs with no shared focus.',
        ],
      },
      {
        heading: 'A reliable Zoom ESL game flow',
        body: [
          'Start with a one-question warm-up that students can answer from their phones. Quick Pulse works well here because the teacher can see the room instantly: who is present, who understands the topic, and which answers are worth opening up.',
          'Move into a content game next. Use Flash Quiz for checking understanding, GridRush for vocabulary retrieval, or a picture-based activity when students need observation language. Keep the first round easy so everyone learns the join-and-answer routine.',
          'After the game, slow the class down. Pick two or three answers and ask students to explain them out loud. The phone gives you participation data, but speaking is still where the ESL value lands.',
          'End with a short reflection task such as In Your Words or Final Word. Ask students to write one sentence, vote on the strongest answer, or say whether their opinion changed. This gives the activity a clear ending instead of fading out when the timer stops.',
        ],
      },
      {
        heading: 'Setup rules that save class time',
        body: [
          'Students should not need accounts. A browser link or QR code is enough. If joining takes longer than the game, the tool is stealing class time.',
          'Put the join link in chat before explaining the activity. Then explain the task while students are joining instead of waiting in silence. For younger learners, keep the shared screen on the join instructions until the first responses appear.',
          'Assume at least one student has only one device. If a learner is using Zoom on a phone, they may not be able to switch tabs easily. Keep a screen-share fallback: the student can answer verbally while the rest of the class answers on devices.',
          'Do not overuse leaderboards. Scores can create energy, but they can also shut down hesitant speakers. Use them for quick vocabulary rounds, then switch to anonymous answers or discussion when the goal is risk-taking.',
        ],
      },
      {
        heading: 'Troubleshooting common online class problems',
        body: [
          'For late joiners, choose games where a student can enter mid-round without ruining the activity. Quick Pulse, Flash Quiz, and short vocabulary rounds recover better than long team games.',
          'For quiet groups, ask students to submit an answer first and speak second. It is easier to call on a student when their answer is already visible, and it gives them a sentence to start from.',
          'For mixed levels, make the first answer simple and the follow-up harder. Everyone can choose A or B, but stronger students can explain exceptions, give examples, or challenge the prompt.',
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
        heading: 'Conversation classes need more than questions',
        body: [
          'A good conversation class is not just a list of discussion questions. Questions can start a lesson, but they rarely create enough repetition, listening, or language growth on their own. Students need a reason to choose words carefully, respond to classmates, and improve their second attempt.',
          'Structure does not mean killing spontaneity. It means giving the conversation a shape: choose, defend, compare, solve, reflect. The topic can stay natural while the task gives students a job to do with the language.',
          'This is especially important online. Silence feels longer on Zoom, students cannot easily read the room, and weak prompts produce short answers. A structured activity gives students a visible path into the conversation.',
        ],
      },
      {
        heading: 'Choose the activity type before the topic',
        body: [
          'The same topic can become a ranking task, dilemma, role-play, prediction, interview, debate, or decision council. Changing the task changes the language students need. A ranking task produces comparison language. A dilemma produces advice and conditionals. A role-play produces functional phrases. A prediction task produces evidence and speculation.',
          'For example, travel can become World Lens for observation, Scenario Simulator for role-play, or Decision Council for persuasion. Food can become a ranking task, a customer complaint role-play, a cultural comparison, or a business decision about opening a restaurant.',
          'This matters for SEO pages and lesson planning for the same reason: "conversation topic" is too broad. Teachers search for activities because they need a repeatable class format, not just another list of questions.',
        ],
      },
      {
        heading: 'A practical 60-minute conversation lesson',
        body: [
          'Use the first five minutes for a low-stakes entry question. Students answer quickly, then you collect two useful phrases on screen. Do not overcorrect yet; the goal is to establish the topic and get voices into the room.',
          'Spend ten minutes on input. This can be a short video, image, poll, quote, or problem. Ask students to notice, predict, or summarize before they give opinions. This gives weaker speakers material to use later.',
          'Use twenty minutes for the main speaking task. Pick one format: Decision Council, Scenario Simulator, Hot Take Arena, ranking, or role-play. Keep the instructions simple, but make the outcome concrete. The class should have to choose, solve, persuade, or agree on something.',
          'Spend fifteen minutes recycling language. Ask students to repeat the task with a twist, switch roles, defend the opposite view, or improve their first answer using two target phrases.',
          'Use the final five minutes for a landing. Ask each student for a final answer, final word, opinion shift, or sentence they want corrected. Students remember the last clear thing they said.',
        ],
      },
      {
        heading: 'How to make speaking measurable',
        body: [
          'Conversation progress is easy to under-measure because the class feels fluid. Track one or two signals: longer turns, more follow-up questions, better repair phrases, more precise vocabulary, or more willingness to disagree politely.',
          'A landing activity gives the teacher evidence. What vocabulary came back? Which opinions changed? Who can explain the lesson in their own words? Who still needs sentence frames?',
          'For online classes, collect answers before and after discussion. The contrast shows progress: a first instinct, then a revised answer after input, peer examples, and teacher feedback.',
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
