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
  {
    slug: 'no-prep-esl-games-for-online-teachers',
    title: 'No-Prep ESL Games for Online Teachers',
    description:
      'Practical no-prep ESL game formats for online teachers who need a useful activity quickly without building slides or worksheets.',
    date: '2026-07-04',
    audience: 'busy online ESL teachers',
    sections: [
      {
        heading: 'No-prep does not mean no structure',
        body: [
          'A no-prep ESL game should still have a language target, a simple rule, and a clear finish. The problem with many last-minute activities is not that they are simple; it is that they do not lead anywhere after the first answer.',
          'For online classes, the best no-prep games use material already in front of you: the lesson topic, a short text, a student mistake, a video title, a picture, or vocabulary from last class. The teacher should be able to start quickly, but students should still produce useful English.',
          'A good rule of thumb: if setup takes longer than the first round, choose a simpler format. If the activity ends without a sentence, add a speaking landing.',
        ],
      },
      {
        heading: 'Fast formats that work with almost any topic',
        body: [
          'Use Quick Pulse when you need the room to respond immediately. Ask a simple choice question, collect answers, then ask two students to explain why they chose differently.',
          'Use GridRush or Vocab Sprint when the class needs energy and retrieval. Give a topic, run a short timed round, then pause for pronunciation, examples, and one useful sentence from each student.',
          'Use Would You Rather, Rank It, or Decision Council when the lesson needs opinions. These formats do not need much content because the task creates the language: reasons, comparisons, agreement, disagreement, and revision.',
          'Use Video to Lesson when you have a YouTube link but no plan. A short clip can become prediction, vocabulary, comprehension, and discussion without needing a separate slide deck.',
        ],
      },
      {
        heading: 'A 30-minute no-prep online lesson',
        body: [
          'Start with a two-minute Quick Pulse question connected to the topic. Do not over-explain; use the first answers to find what students already know.',
          'Run a ten-minute vocabulary or quiz game. Keep the first round easy, then make students explain, correct, or personalize selected answers.',
          'Move into a twelve-minute speaking task. A ranking, decision, or role-play gives students a reason to use the words from the first half of the lesson.',
          'Finish with a final answer. Ask students to write one sentence they can say confidently, one word they want to remember, or one opinion that changed.',
        ],
      },
      {
        heading: 'Common mistakes with no-prep games',
        body: [
          'The first mistake is choosing a game because it is fun before choosing the language. Pick the language target first, then the game.',
          'The second mistake is running too many rounds. One strong round with feedback and speaking is usually better than five rounds that never slow down.',
          'The third mistake is ending at the scoreboard. Scores create attention, but the teacher still needs a language landing: a corrected sentence, a spoken example, a summary, or a reflection.',
        ],
      },
    ],
    links: [
      { label: 'Online ESL games', href: '/online-esl-games' },
      { label: 'Quick Pulse', href: '/classroom-activities/quick-pulse' },
      { label: 'Video to lesson', href: '/video-lesson' },
    ],
  },
  {
    slug: 'esl-games-for-adults-online',
    title: 'ESL Games for Adults in Online Lessons',
    description:
      'ESL games for adult learners that feel purposeful: vocabulary, discussion, role-play, problem solving, and professional English practice.',
    date: '2026-07-04',
    audience: 'adult ESL and business English teachers',
    sections: [
      {
        heading: 'Adult ESL games need a reason',
        body: [
          'Adult learners usually respond better when a game feels connected to real communication. The activity can still be playful, but it should not feel childish or detached from the lesson goal.',
          'The best games for adults involve decisions, evidence, practical language, or useful repetition. Students should be able to see why the activity helps: it prepares them for a meeting, interview, travel problem, presentation, conversation, or exam task.',
          'This does not mean every adult ESL game must be serious. It means the teacher should frame the game around a useful outcome: clearer vocabulary, faster recall, better reasons, more natural questions, or more confident speaking.',
        ],
      },
      {
        heading: 'Game types that adults usually accept',
        body: [
          'Vocabulary games work well when the words come from real topics. Use GridRush, Vocab Sprint, Connections, or Synonym Showdown to practise business terms, travel language, academic vocabulary, or phrases from a video.',
          'Decision games work especially well with adults. Decision Council, Problem Solvers, and Rank It give learners a reason to compare options, explain trade-offs, and use polite disagreement.',
          'Role-play works when the scenario is specific. Scenario Simulator and Conversation Rounds can practise client calls, job interviews, complaints, negotiation, medical appointments, housing issues, or travel problems.',
          'Debate works best when the format protects the conversation. Hot Take Arena or a structured ranking task gives students a clear role so disagreement feels like the activity, not a personal conflict.',
        ],
      },
      {
        heading: 'A sample adult ESL game sequence',
        body: [
          'Begin with a short poll: "Which problem is most common in your work?" or "Which option would you choose?" This gives the teacher a map of the room.',
          'Run a vocabulary game using words from the topic. Do not stop at definitions. Ask students to use the words in professional or personal sentences.',
          'Move into a decision or role-play. Students should solve a problem, negotiate an outcome, or recommend a course of action.',
          'End by asking students to repeat the most useful phrase from the lesson and say where they could use it outside class.',
        ],
      },
      {
        heading: 'How to keep adult games professional',
        body: [
          'Use realistic prompts. Adults are more willing to play when the situation resembles something they might actually say or hear.',
          'Avoid over-celebrating winners. Use scores for energy, then shift attention to strong language, useful phrases, and improved answers.',
          'Let students opt into difficulty. A beginner can give a simple reason. A stronger student can add a counterargument, condition, or example.',
        ],
      },
    ],
    links: [
      { label: 'ESL speaking activities', href: '/esl-speaking-activities' },
      { label: 'Decision Council', href: '/classroom-activities/decision-council' },
      { label: 'Scenario Simulator', href: '/classroom-activities/scenario-simulator' },
    ],
  },
  {
    slug: 'esl-vocabulary-review-activities',
    title: 'ESL Vocabulary Review Activities That Lead to Speaking',
    description:
      'Vocabulary review activities for ESL classes that go beyond matching and memorizing, with retrieval, word connections, and speaking output.',
    date: '2026-07-04',
    audience: 'vocabulary and review lesson teachers',
    sections: [
      {
        heading: 'Vocabulary review needs retrieval and reuse',
        body: [
          'Many vocabulary review activities only check recognition. Students match a word, choose a definition, or repeat a sentence. That can be useful, but it does not prove they can use the word when speaking.',
          'A stronger review sequence has three moves: retrieve the word, clarify the meaning, then reuse it in a new sentence or task. The game creates speed and attention; the follow-up creates learning evidence.',
          'This is especially important online because students can look passive even when they understand. A live vocabulary game gives every student a response moment, then the teacher can choose answers for correction and speaking.',
        ],
      },
      {
        heading: 'Review formats by vocabulary skill',
        body: [
          'For fast recall, use GridRush or Vocab Sprint. Give students a topic or category, run a short timed round, then ask them to explain two answers.',
          'For word relationships, use Word Chain, Connections, or Synonym Showdown. These help students see collocations, near-synonyms, categories, and meaning boundaries.',
          'For source-based vocabulary, use Video to Lesson, Vocab Radar, or Listening Gap Fill. Students meet words in context before they have to use them in discussion.',
          'For speaking transfer, finish with In Your Words, Decision Council, or a short role-play where the reviewed words become tools for communication.',
        ],
      },
      {
        heading: 'A practical review lesson flow',
        body: [
          'Start with a quick recall round. Keep it short enough that students want another turn, not so long that the class becomes a word list.',
          'Choose five useful answers and clarify them. Ask for pronunciation, part of speech, one example, and one common mistake or contrast.',
          'Run a second round with a constraint. Students must use phrases, not single words; synonyms, not repeated answers; or examples from a specific context.',
          'End with speaking. Ask students to summarize a video, defend a decision, tell a short story, or answer a personal question using three target words.',
        ],
      },
      {
        heading: 'How to measure whether review worked',
        body: [
          'Do not only count correct answers. Track whether students can use the word after the game, pronounce it clearly, choose it in the right context, and explain the difference from a similar word.',
          'Ask for a second attempt after feedback. If the second sentence is stronger than the first, the review activity did more than entertain.',
          'Bring the words back later in the lesson. Vocabulary is more likely to stick when it returns in discussion, role-play, or a final reflection.',
        ],
      },
    ],
    links: [
      { label: 'ESL vocabulary games', href: '/esl-vocabulary-games' },
      { label: 'Vocab Sprint', href: '/classroom-games/vocab-sprint' },
      { label: 'Vocab Radar', href: '/classroom-activities/vocab-radar' },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
