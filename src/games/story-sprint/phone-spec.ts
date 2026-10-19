import type { InputSpec } from '@/lib/input-spec';

export function storyWritingPhoneSpec(story: Array<{ text: string }>, topic: string, startedAt: number): InputSpec {
  return {
    type: 'textarea', gameKey: 'story-sprint',
    prompt: `${story.length ? 'Continue' : 'Start'} ${topic ? `the story about ${topic}` : 'the story'} with one sentence`,
    context: story.slice(-3).map(line => ({ text: line.text })),
    placeholder: 'Continue the story with one sentence...', maxLength: 300,
    reviewMode: 'approval', startedAt,
  };
}
