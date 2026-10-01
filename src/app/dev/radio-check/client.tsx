'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SceneIgniterActivity } from '@/activities/scene-igniter';
import { RankItActivity } from '@/activities/rank-it';
import { OpinionShiftActivity } from '@/activities/opinion-shift/activity';
import { GrammarProofActivity } from '@/activities/grammar-proof/activity';
import { useSessionStore } from '@/stores/session-store';
import { SceneScriptPanel } from '@/components/student/scene-script-panel';
import type { InputSpec } from '@/lib/input-spec';
import { RadioCheckActivity } from '@/activities/radio-check';
import { StaticActivity } from '@/activities/static';
import { BlackBoxActivity } from '@/activities/black-box';
import type { ActivityProps, RadioCheckContent, StaticContent, BlackBoxContent, SceneIgniterContent, RankItContent } from '@/activities/types';

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

const BLACK_BOX: BlackBoxContent = {
  activityKey: 'black-box',
  topicContext: 'Travel',
  passages: [
    { text: 'Our ferry leaves the harbour at thirteen minutes past eight. Please bring warm coats, because the coast is windy and the island has no shops.', gaps: ['ferry', 'harbour', 'thirteen', 'coats', 'coast', 'island'], decoys: ['thirty', 'hotel', 'cost', 'highland'] },
  ],
};

const SCENE: SceneIgniterContent = {
  activityKey: 'scene-igniter',
  topicContext: 'Airports',
  scenes: [{
    title: 'The Missing Suitcase',
    genre: 'comedy',
    context: "At a tiny airport at midnight, the traveller's suitcase is missing, and the only person at the desk is very, very sleepy.",
    cast: [
      { id: 'A', name: 'Maya', role: 'a worried traveller', want: 'wants her suitcase before her wedding tomorrow' },
      { id: 'B', name: 'Leo', role: 'a sleepy desk agent', want: 'wants to finish his shift and go home' },
    ],
    lines: [
      { lineIndex: 1, character: 'A', text: 'Excuse me, Leo? My suitcase never came out.', direction: 'nervously' },
      { lineIndex: 2, character: 'B', text: 'Mm? Suitcase? What colour is it, Maya?', direction: 'yawning' },
      { lineIndex: 3, character: 'A', text: 'It is bright pink, with a big yellow flower!' },
      { lineIndex: 4, character: 'B', text: 'Oh no. I think it went to Paris.', direction: 'slowly' },
    ],
    improvPrompt: 'The scene continues… a pink suitcase suddenly rolls past on its own!',
    improvScript: [],
  }],
};

const RANK: RankItContent = {
  activityKey: 'rank-it',
  topicContext: 'Animals',
  challenges: [{
    id: 'c1',
    prompt: 'Rank these animals from fastest to slowest',
    items: [
      { id: 'a', name: 'Cheetah', hiddenFact: 'Up to 110 km/h in short bursts.' },
      { id: 'b', name: 'Horse', hiddenFact: 'About 70 km/h at a gallop.' },
      { id: 'c', name: 'Ostrich', hiddenFact: 'Up to 70 km/h, faster than it looks!' },
      { id: 'd', name: 'Rabbit', hiddenFact: 'Around 55 km/h when escaping.' },
    ],
    correctOrder: ['a', 'c', 'b', 'd'],
    correctRationale: 'Ostriches are surprisingly fast runners.',
  }],
};

export function RadioCheckDevClient() {
  const [spec, setSpec] = useState<InputSpec | null>(null);
  const [seeded] = useState(() => {
    if (typeof window !== 'undefined') {
      useSessionStore.getState().recordGrammarCheck({ target: 'past simple', total: 3, results: { Mia: { name: 'Mia', right: 1 }, Sam: { name: 'Sam', right: 2 }, Kai: { name: 'Kai', right: 0 } } });
      useSessionStore.getState().recordPulse({ text: 'Homework should be banned.', type: 'likert', votes: { Mia: { name: 'Mia', choice: '2' }, Sam: { name: 'Sam', choice: '4' }, Kai: { name: 'Kai', choice: '1' } } });
    }
    return true;
  });
  const mode = useSearchParams().get('mode');
  const video = mode === 'video';
  const props = { generatedContent: video ? VIDEO : VOICE, students: [], onScore: () => {}, onSetInputSpec: () => {}, onRegisterRemoteVoteHandler: (h: unknown) => { (window as unknown as { __vote?: unknown }).__vote = h; }, onPhaseChange: () => {} } as unknown as ActivityProps;
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {mode === 'wings' ? <GrammarProofActivity {...props} sessionSettings={{} as ActivityProps['sessionSettings']} generatedContent={{ activityKey: 'grammar-proof', topicContext: 'Travel', grammarTarget: 'past simple', prompt: 'Write 2 sentences about your last trip.', exampleSentences: ['I flew to Rome.', 'We ate pasta.'], wingsSentences: [{ text: 'Yesterday we goed to the beach.', isCorrect: false, explanation: '"go" is irregular: went.' }, { text: 'Last summer I visited my aunt.', isCorrect: true, explanation: 'Regular past simple: visited.' }, { text: 'She buyed a ticket at the station.', isCorrect: false, explanation: '"buy" is irregular: bought.' }] } as unknown as ActivityProps['generatedContent']} /> : mode === 'shift' && seeded ? <OpinionShiftActivity {...props} generatedContent={{ activityKey: 'opinion-shift', topicContext: 'x', beforePrompt: 'Before', nowPrompt: 'Now' } as unknown as ActivityProps['generatedContent']} /> : mode === 'rank' ? <RankItActivity {...props} generatedContent={RANK} /> : mode === 'scene' ? (
        <div className="flex gap-6">
          <div className="flex-1"><SceneIgniterActivity {...props} generatedContent={SCENE} students={[{ id: 's1', name: 'Ana' }, { id: 's2', name: 'Ben' }] as unknown as ActivityProps['students']} onSetInputSpec={(x: InputSpec | null) => setSpec(x)} /></div>
          <div className="w-80 shrink-0 rounded-3xl border border-white/10 bg-slate-900 p-4">{spec ? <SceneScriptPanel spec={spec} displayName="Ana" studentId="s1" /> : <p className="text-white/40">phone</p>}</div>
        </div>
      ) : mode === 'static' ? <StaticActivity {...props} generatedContent={STATIC} /> : mode === 'black-box' ? <BlackBoxActivity {...props} generatedContent={BLACK_BOX} /> : <RadioCheckActivity {...props} />}
    </div>
  );
}
