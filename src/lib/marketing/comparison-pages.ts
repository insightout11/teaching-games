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
