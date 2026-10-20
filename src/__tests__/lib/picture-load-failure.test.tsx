import React from 'react';
import { expect, it, vi } from 'vitest';
import { FreePictureView } from '@/components/ui/free-picture';

const state = vi.hoisted(() => ({ failed: null as string | null }));
vi.mock('react', async importOriginal => ({ ...await importOriginal<typeof import('react')>(),
  useState: () => [state.failed, (url: string) => { state.failed = url; }],
}));
Object.assign(globalThis, { React });

it('removes the picture and credit after the actual image error handler fires', () => {
  const picture = { id: '1', title: 'Photo', credit: 'Author · CC BY', thumbUrl: 'https://upload.wikimedia.org/broken.jpg', imageUrl: 'https://upload.wikimedia.org/original.jpg', pageUrl: 'https://commons.wikimedia.org/wiki/File:Photo.jpg' };
  state.failed = null;
  const tree = FreePictureView({ picture });
  const img = React.Children.toArray(tree!.props.children).find(child => React.isValidElement(child) && child.type === 'img') as React.ReactElement<{ onError: () => void }>;
  img.props.onError();
  expect(FreePictureView({ picture })).toBeNull();
  expect(FreePictureView({ picture: { ...picture, thumbUrl: 'https://upload.wikimedia.org/next.jpg' } })).not.toBeNull();
});
