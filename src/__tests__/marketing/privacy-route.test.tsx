import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { metadata } from '@/app/(marketing)/privacy/page';

function source(relativePath: string) {
  return readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('teacher beta privacy route and links', () => {
  it('declares the approved operator, contact, market, and retention wording', () => {
    const page = source('src/app/(marketing)/privacy/page.tsx');

    expect(metadata.title).toBe('Teacher Beta Privacy Notice | LessonCaptain');
    expect(page).toContain('operated under the name Lesson Captain');
    expect(page).toContain('beta@lessoncaptain.com');
    expect(page).toContain('online English teachers worldwide');
    expect(page).toContain('up to 12 months');
    expect(page).toContain('may remain until the next claim triggers cleanup');
  });

  it('links the beta consent and marketing footer to the notice', () => {
    const form = source('src/app/(marketing)/beta/BetaApplicationForm.tsx');
    const footer = source('src/components/homepage/MarketingFooter.tsx');

    expect(form).toContain('href="/privacy"');
    expect(form).toContain('Teacher Beta Privacy Notice');
    expect(footer).toContain("{ label: 'Privacy', href: '/privacy' }");
  });

  it('limits the beta application funnel to online teachers worldwide', () => {
    const page = source('src/app/(marketing)/beta/page.tsx');
    const form = source('src/app/(marketing)/beta/BetaApplicationForm.tsx');

    expect(page).toContain('online English teachers worldwide');
    expect(page).not.toContain('online or in person');
    expect(form).toContain('name="teachingFormat" value="online"');
    expect(form).not.toContain("['in-person', 'In person']");
    expect(form).not.toContain("['hybrid', 'Hybrid']");
  });
});
