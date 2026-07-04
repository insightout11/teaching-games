export interface ComparisonPageData {
  slug: string;
  title: string;
  h1: string;
  description: string;
  competitor: string;
  heroCopy: string;
  verdict: string;
  rows: { label: string; lessonCaptain: string; alternative: string }[];
  bestFor: string[];
  useCases: { title: string; copy: string; links: { label: string; href: string }[] }[];
  decisionGuide: { chooseLessonCaptain: string[]; chooseAlternative: string[] };
  faqs: { q: string; a: string }[];
  cta: string;
  related: { label: string; href: string }[];
}

export const COMPARISON_PAGES: ComparisonPageData[] = [
  {
    slug: 'kahoot-alternative-for-esl',
    title: 'Kahoot Alternative for ESL Teachers | LessonCaptain',
    h1: 'A Kahoot alternative built for live ESL lessons',
    description:
      'LessonCaptain gives online English teachers more than quiz rounds: source-based lessons, speaking activities, student devices, live scoring, and full class flow.',
    competitor: 'Kahoot',
    heroCopy:
      'Kahoot is strong for quick quizzes. ESL lessons need more: warm-ups, vocabulary, comprehension, speaking, role-play, debate, review, and a teacher screen that works over Zoom or Meet.',
    verdict:
      'Use Kahoot when you only need a quiz. Use LessonCaptain when you want a complete live English lesson students participate in from their own devices.',
    rows: [
      {
        label: 'Lesson shape',
        lessonCaptain: 'Full lesson arc: warm-up, input, practice, speaking, review, and landing.',
        alternative: 'Mostly standalone quiz rounds.',
      },
      {
        label: 'ESL speaking',
        lessonCaptain: 'Includes debate, role-play, discussion, ranking, and final-response activities.',
        alternative: 'Speaking usually happens outside the tool.',
      },
      {
        label: 'Content source',
        lessonCaptain: 'Build from a topic, article, text, or YouTube video.',
        alternative: 'Teacher usually prepares or searches for a quiz.',
      },
      {
        label: 'Online teaching',
        lessonCaptain: 'Designed for screen-share plus student phones in Zoom, Meet, or Teams.',
        alternative: 'Works online, but the classroom quiz format is the center.',
      },
    ],
    bestFor: [
      'Online ESL tutors who need more than review quizzes',
      'Conversation classes where students must speak, not only tap answers',
      'Teachers who want one tool for planning and running the live lesson',
    ],
    useCases: [
      {
        title: 'Vocabulary review that becomes speaking',
        copy: 'Run a fast retrieval round, then ask students to explain choices, use words in sentences, or defend an answer.',
        links: [
          { label: 'ESL vocabulary games', href: '/esl-vocabulary-games' },
          { label: 'GridRush', href: '/classroom-games/grid-rush' },
        ],
      },
      {
        title: 'Online classes where every student answers',
        copy: 'Students join from phones while the teacher shares the prompt, timer, reveal, and next speaking step.',
        links: [
          { label: 'Online ESL games', href: '/online-esl-games' },
          { label: 'Quick Pulse', href: '/classroom-activities/quick-pulse' },
        ],
      },
      {
        title: 'Discussion after the quiz moment',
        copy: 'Move from correct answers into opinions, rankings, decisions, and reflection without leaving the live lesson.',
        links: [
          { label: 'ESL speaking activities', href: '/esl-speaking-activities' },
          { label: 'Decision Council', href: '/classroom-activities/decision-council' },
        ],
      },
    ],
    decisionGuide: {
      chooseLessonCaptain: [
        'You want one flow for warm-up, practice, speaking, review, and landing.',
        'Students need to explain or discuss after answering.',
        'You teach over Zoom, Meet, Teams, or a tutoring platform.',
      ],
      chooseAlternative: [
        'You only need a standalone quiz round.',
        'Your class already has prepared quiz content.',
        'The goal is fast whole-class review rather than a full ESL lesson.',
      ],
    },
    faqs: [
      {
        q: 'Is LessonCaptain a direct Kahoot replacement?',
        a: 'It can cover quiz-style review, but it is broader than a Kahoot replacement. LessonCaptain is built for live ESL lesson flow: games, student responses, speaking tasks, source material, and lesson wrap-up.',
      },
      {
        q: 'Can students join LessonCaptain games from phones like Kahoot?',
        a: 'Yes. Students join from any browser on a phone, tablet, or laptop without student accounts, while the teacher controls the shared screen.',
      },
      {
        q: 'When should ESL teachers still use Kahoot?',
        a: 'Use Kahoot when the lesson only needs a quick quiz or existing quiz set. Use LessonCaptain when the activity needs vocabulary, discussion, role-play, source material, or a complete class arc.',
      },
    ],
    cta: 'Build a live ESL lesson',
    related: [
      { label: 'Classroom games', href: '/classroom-games' },
      { label: 'Classroom activities', href: '/classroom-activities' },
      { label: 'Video to lesson', href: '/video-lesson' },
    ],
  },
  {
    slug: 'wordwall-alternative-for-esl',
    title: 'Wordwall Alternative for ESL Teachers | LessonCaptain',
    h1: 'A Wordwall alternative for live online English classes',
    description:
      'LessonCaptain turns ESL topics and source material into live lessons with games, student participation, speaking tasks, and teacher control.',
    competitor: 'Wordwall',
    heroCopy:
      'Wordwall is useful for activity templates. LessonCaptain is built around the live class itself: the teacher screen, student devices, AI-generated content, and a sequence that moves toward speaking.',
    verdict:
      'Use Wordwall for reusable standalone activities. Use LessonCaptain when the activity needs to sit inside a live online lesson with student responses and teacher flow.',
    rows: [
      {
        label: 'Primary use',
        lessonCaptain: 'Run a complete live ESL class from one cockpit.',
        alternative: 'Create or reuse individual classroom activities.',
      },
      {
        label: 'Generated content',
        lessonCaptain: 'AI builds prompts, vocabulary, questions, scenarios, and games from your topic.',
        alternative: 'Teachers generally supply or adapt the content.',
      },
      {
        label: 'Student participation',
        lessonCaptain: 'Students join live from any browser; no student accounts required.',
        alternative: 'Participation depends on the selected template and setup.',
      },
      {
        label: 'Speaking-first flow',
        lessonCaptain: 'Activities are designed to produce discussion, role-play, debate, and reflection.',
        alternative: 'Many templates are excellent for drills but not full speaking lessons.',
      },
    ],
    bestFor: [
      'Teachers who already have a topic but not a ready lesson',
      'Online tutors who want students active from phones while screen-sharing',
      'Classes that need speaking output after vocabulary or grammar practice',
    ],
    useCases: [
      {
        title: 'No-prep topic-to-activity lessons',
        copy: 'Start with a topic and generate prompts, questions, scenarios, vocabulary, and student response moments.',
        links: [
          { label: 'AI lesson generator', href: '/ai-esl-lesson-plan-generator' },
          { label: 'Classroom activities', href: '/classroom-activities' },
        ],
      },
      {
        title: 'Speaking activities after drills',
        copy: 'Move beyond matching and word games into role-play, debate, decisions, and personal output.',
        links: [
          { label: 'ESL speaking activities', href: '/esl-speaking-activities' },
          { label: 'Scenario Simulator', href: '/classroom-activities/scenario-simulator' },
        ],
      },
      {
        title: 'Live online participation',
        copy: 'Keep the teacher screen, student devices, timers, reveals, and follow-up tasks in one teacher-led flow.',
        links: [
          { label: 'Online ESL games', href: '/online-esl-games' },
          { label: 'Video to lesson', href: '/video-lesson' },
        ],
      },
    ],
    decisionGuide: {
      chooseLessonCaptain: [
        'You want AI-generated content from a topic, article, text, or video.',
        'The activity needs student responses and teacher control during a live class.',
        'Speaking output matters as much as matching, sorting, or drilling.',
      ],
      chooseAlternative: [
        'You need a reusable printable or template-style activity.',
        'You already have a Wordwall activity library that fits the lesson.',
        'Students are practising a narrow drill rather than a full live class sequence.',
      ],
    },
    faqs: [
      {
        q: 'How is LessonCaptain different from Wordwall for ESL?',
        a: 'Wordwall is strong for reusable templates and standalone activities. LessonCaptain is designed around the live ESL class: generated content, teacher screen, student devices, speaking tasks, and lesson flow.',
      },
      {
        q: 'Can LessonCaptain make vocabulary and grammar activities?',
        a: 'Yes. LessonCaptain includes vocabulary games, grammar and writing games, quizzes, and speaking activities that can be generated from a topic or source material.',
      },
      {
        q: 'When should a teacher still use Wordwall?',
        a: 'Use Wordwall when you want a familiar template or reusable drill. Use LessonCaptain when you need a live online lesson with participation, discussion, and teacher-led progression.',
      },
    ],
    cta: 'Try a live lesson',
    related: [
      { label: 'Showcase', href: '/showcase' },
      { label: 'No-device games', href: '/classroom-games/no-devices' },
      { label: 'ESL activities', href: '/classroom-activities' },
    ],
  },
  {
    slug: 'ai-esl-lesson-plan-generator',
    title: 'AI ESL Lesson Plan Generator for Live Online Classes | LessonCaptain',
    h1: 'An AI ESL lesson plan generator that gives you a running class',
    description:
      'Generate a playable ESL lesson from a topic, article, text, or YouTube video. LessonCaptain turns planning into a live teacher-led class.',
    competitor: 'document-style AI lesson generators',
    heroCopy:
      'Most AI lesson plan generators hand you a document. LessonCaptain turns the plan into a live lesson: teacher screen, student devices, games, discussions, scoring, and a clear wrap-up.',
    verdict:
      'Use a document generator when you want notes. Use LessonCaptain when you want something you can screen-share and teach immediately.',
    rows: [
      {
        label: 'Output',
        lessonCaptain: 'A live lesson flow with activities students can join.',
        alternative: 'A written plan, worksheet, or list of tasks.',
      },
      {
        label: 'Source material',
        lessonCaptain: 'YouTube videos, articles, pasted text, or simple topics.',
        alternative: 'Often text-first or worksheet-first.',
      },
      {
        label: 'Student side',
        lessonCaptain: 'Students answer, vote, play, and reflect from their devices.',
        alternative: 'Students usually receive instructions outside the generator.',
      },
      {
        label: 'Teacher time',
        lessonCaptain: 'Designed to move from idea to live class in minutes.',
        alternative: 'The teacher still has to turn the plan into slides, links, or activities.',
      },
    ],
    bestFor: [
      'Online English teachers who want prep time down without making class passive',
      'Video and article-based lessons',
      'Tutors who need a reliable structure for 1:1 or small-group lessons',
    ],
    useCases: [
      {
        title: 'YouTube video lessons',
        copy: 'Turn a video into vocabulary, comprehension checks, prediction, discussion, and student participation.',
        links: [
          { label: 'Video to lesson', href: '/video-lesson' },
          { label: 'ESL video lesson plans', href: '/video-lesson' },
        ],
      },
      {
        title: 'Topic-based online classes',
        copy: 'Generate a live sequence from a simple topic, then run games, speaking tasks, and reflection in class.',
        links: [
          { label: 'Online ESL games', href: '/online-esl-games' },
          { label: 'Classroom games', href: '/classroom-games' },
        ],
      },
      {
        title: 'Speaking-focused lesson plans',
        copy: 'Use AI planning as the start, then lead students into role-play, debate, decisions, and final answers.',
        links: [
          { label: 'ESL speaking activities', href: '/esl-speaking-activities' },
          { label: 'Conversation guide', href: '/blog/conversation-class-activities-for-online-esl' },
        ],
      },
    ],
    decisionGuide: {
      chooseLessonCaptain: [
        'You want the plan to become a playable live lesson.',
        'Students need to join, answer, vote, play, or reflect during class.',
        'You teach from videos, articles, pasted text, or fast topic prompts.',
      ],
      chooseAlternative: [
        'You only need a document, worksheet, or static lesson outline.',
        'You prefer to build slides and activities manually after planning.',
        'The lesson will be delivered offline without student devices.',
      ],
    },
    faqs: [
      {
        q: 'Is LessonCaptain an AI lesson plan generator?',
        a: 'Yes, but it is built to go beyond a written plan. LessonCaptain creates lesson material that can be run live with teacher screen, student responses, games, and speaking activities.',
      },
      {
        q: 'Can I generate an ESL lesson from a YouTube video?',
        a: 'Yes. The video lesson tool creates vocabulary, comprehension, discussion, and activity flow from a YouTube video so the teacher can run it in class.',
      },
      {
        q: 'How is this different from asking ChatGPT for a lesson plan?',
        a: 'A chat response gives you text. LessonCaptain turns the idea into a structured live class with student participation and interactive activities.',
      },
    ],
    cta: 'Generate a free video lesson',
    related: [
      { label: 'Video to lesson', href: '/video-lesson' },
      { label: 'Classroom games', href: '/classroom-games' },
      { label: 'Pricing', href: '/pro' },
    ],
  },
];

export function getComparisonPage(slug: string): ComparisonPageData | undefined {
  return COMPARISON_PAGES.find((page) => page.slug === slug);
}
