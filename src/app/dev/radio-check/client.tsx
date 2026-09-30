'use client';

import { useSearchParams } from 'next/navigation';
import { RadioCheckActivity } from '@/activities/radio-check';
import { StaticActivity } from '@/activities/static';
import type { ActivityProps, RadioCheckContent, StaticContent } from '@/activities/types';

const VOICE: RadioCheckContent = {
  activityKey: 'radio-check',
  topicContext: 'Travel',
  title: 'Travel',
  mode: 'voice',
  segments: [
    { script: 'Good morning passengers. The train to Brighton will now leave from platform seven, not platform four. The train leaves at nine fifteen. Please have your tickets ready.', question: 'Which platform does the train leave from now?', options: ['Platform four', 'Platform seven', 'Platform nine'], correctIndex: 1, keyLine: 'The train to Brighton will now leave from platform seven, not platform four.' },
    { script: 'Hi Sam, it is Maya. I am running late because my bus broke down. Can we meet at the cafe at half past three instead of three? Sorry! See you soon.', question: 'Why is Maya late?', options: ['She missed the train', 'Her bus broke down', 'She got lost'], correctIndex: 1, keyLine: 'I am running late because my bus broke down.' },
  ],
};

const VIDEO: RadioCheckContent = {
  activityKey: 'radio-check',
  topicContext: 'Food',
  title: 'Gotta Eat!',
  mode: 'video',
  youtubeId: 'Z9TIlM96lT8',
  segments: [
    { start: 10, end: 25, question: 'Sample question for the first clip?', options: ['Option one', 'Option two', 'Option three'], correctIndex: 0, keyLine: 'Sample key line.' },
  ],
};

const STATIC: StaticContent = {
  activityKey: 'static',
  topicContext: 'Travel',
  rounds: [
    { sentence: 'The ship to the island leaves at fifteen minutes past ten.', spoken: 'The sheep to the island leaves at fifteen minutes past ten.', target: 'ship', swap: 'sheep', options: ['island', 'ship', 'minutes', 'leaves'], correctIndex: 1 },
    { sentence: 'Turn left at the big hotel and walk to the beach.', spoken: 'Turn left at the big hotel and work to the beach.', target: 'walk', swap: 'work', options: ['hotel', 'beach', 'walk', 'Turn'], correctIndex: 2 },
  ],
};

export function RadioCheckDevClient() {
  const mode = useSearchParams().get('mode');
  const video = mode === 'video';
  const props = { generatedContent: video ? VIDEO : VOICE, students: [], onScore: () => {}, onSetInputSpec: () => {}, onRegisterRemoteVoteHandler: () => {}, onPhaseChange: () => {} } as unknown as ActivityProps;
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {mode === 'static' ? <StaticActivity {...props} generatedContent={STATIC} /> : <RadioCheckActivity {...props} />}
    </div>
  );
}
