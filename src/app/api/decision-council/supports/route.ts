import { NextRequest, NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai';
import type { AISchema } from '@/lib/ai';
import { requireAuth } from '@/lib/auth-credits';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProposalInput {
  id: string;
  label: string;
  text: string;
}

interface ProposalSupport {
  proposalId: string;
  proposalLabel: string;
  forPoints: string[];
  againstPoints: string[];
  evidence: string[];
  speakerPrompt: string;
}

function cleanText(value: unknown, maxLength = 500): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanStringArray(value: unknown, maxItems: number, maxLength = 180): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function fallbackSupport(
  proposal: ProposalInput,
  contextBrief: string,
  sourceDetails: string[]
): ProposalSupport {
  const evidence = sourceDetails.length > 0
    ? sourceDetails.slice(0, 2)
    : [
        contextBrief ||
          `Use one detail from the lesson to test whether Proposal ${proposal.label} is realistic.`,
      ];

  return {
    proposalId: proposal.id,
    proposalLabel: proposal.label,
    forPoints: [
      'This proposal gives the class a clear action to evaluate.',
      'It directly answers the council question and can be explained quickly.',
    ],
    againstPoints: [
      'It may need a more realistic plan or clearer limits.',
      'It may not work equally well for every person or situation.',
    ],
    evidence,
    speakerPrompt: `Explain why Proposal ${proposal.label} is practical, then respond to one concern.`,
  };
}

function normalizeSupport(
  raw: Partial<ProposalSupport> | undefined,
  proposal: ProposalInput,
  contextBrief: string,
  sourceDetails: string[]
): ProposalSupport {
  const fallback = fallbackSupport(proposal, contextBrief, sourceDetails);
  return {
    proposalId: proposal.id,
    proposalLabel: proposal.label,
    forPoints: cleanStringArray(raw?.forPoints, 2, 150),
    againstPoints: cleanStringArray(raw?.againstPoints, 2, 150),
    evidence: cleanStringArray(raw?.evidence, 3, 180),
    speakerPrompt: cleanText(raw?.speakerPrompt, 180) || fallback.speakerPrompt,
  };
}

async function verifyTeacherOwnsSession(sessionId: string, teacherId: string) {
  if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') return null;

  if (!UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, class_id')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { data: cls, error: classError } = await supabase
    .from('classes')
    .select('teacher_id')
    .eq('id', session.class_id)
    .single();

  if (classError || !cls || cls.teacher_id !== teacherId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { teacher, error: authError } = await requireAuth();
    if (authError || !teacher) return authError!;

    const body = await request.json();
    const sessionId = cleanText(body?.sessionId, 80);
    if (sessionId) {
      const ownershipError = await verifyTeacherOwnsSession(sessionId, teacher.id);
      if (ownershipError) return ownershipError;
    }

    const topic = cleanText(body?.topic, 160);
    const councilQuestion = cleanText(body?.councilQuestion, 220);
    const contextBrief = cleanText(body?.contextBrief, 700);
    const sourceDetails = cleanStringArray(body?.sourceDetails, 5, 240);
    const usefulPhrases = cleanStringArray(body?.usefulPhrases, 6, 120);
    const proposals: ProposalInput[] = Array.isArray(body?.proposals)
      ? body.proposals
          .map((proposal: Record<string, unknown>, index: number) => ({
            id: cleanText(proposal?.id, 120) || `proposal-${index}`,
            label: cleanText(proposal?.label, 8) || String.fromCharCode(65 + index),
            text: cleanText(proposal?.text, 500),
          }))
          .filter((proposal: ProposalInput) => proposal.text.length > 0)
          .slice(0, 4)
      : [];

    if (proposals.length === 0) {
      return NextResponse.json({ error: 'At least one proposal is required' }, { status: 400 });
    }

    const fallback = proposals.map((proposal) =>
      fallbackSupport(proposal, contextBrief, sourceDetails)
    );

    const schema: AISchema = {
      type: 'object',
      properties: {
        supports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposalId: { type: 'string' },
              proposalLabel: { type: 'string' },
              forPoints: { type: 'array', items: { type: 'string' } },
              againstPoints: { type: 'array', items: { type: 'string' } },
              evidence: { type: 'array', items: { type: 'string' } },
              speakerPrompt: { type: 'string' },
            },
            required: [
              'proposalId',
              'proposalLabel',
              'forPoints',
              'againstPoints',
              'evidence',
              'speakerPrompt',
            ],
          },
        },
      },
      required: ['supports'],
    };

    const prompt = `Generate teacher discussion notes for an ESL Decision Council.

Topic: ${topic || 'the lesson topic'}
Council question: ${councilQuestion}
Context brief: ${contextBrief || 'No context brief was provided.'}

Source details:
${sourceDetails.length > 0 ? sourceDetails.map((detail) => `- ${detail}`).join('\n') : '- No source details were provided.'}

Useful phrases:
${usefulPhrases.length > 0 ? usefulPhrases.map((phrase) => `- ${phrase}`).join('\n') : '- No useful phrases were provided.'}

Student proposals:
${proposals.map((proposal) => `Proposal ${proposal.label} (${proposal.id}): ${proposal.text}`).join('\n')}

Rules:
- Return exactly one support object for each proposal.
- Keep proposalId and proposalLabel exactly as provided.
- forPoints: 2 concise reasons a teacher can use to invite support.
- againstPoints: 2 concise concerns a teacher can use to invite challenge.
- evidence: 1-3 concise details. Use the source details when they exist. If there is no source detail, use topic-grounded classroom evidence.
- speakerPrompt: 1 short prompt that helps a student speak for 20-30 seconds.
- Do not include student names.
- Keep language clear for intermediate ESL students.
- Return JSON only.`;

    try {
      const parsed = await generateJSON<{ supports?: Array<Partial<ProposalSupport>> }>(
        prompt,
        schema,
        { taskClass: 'activity-facilitation' }
      );

      const byId = new Map((parsed.supports ?? []).map((support) => [support.proposalId, support]));
      const supports = proposals.map((proposal) => {
        const normalized = normalizeSupport(byId.get(proposal.id), proposal, contextBrief, sourceDetails);
        return {
          ...fallbackSupport(proposal, contextBrief, sourceDetails),
          ...normalized,
          forPoints: normalized.forPoints.length > 0
            ? normalized.forPoints
            : fallbackSupport(proposal, contextBrief, sourceDetails).forPoints,
          againstPoints: normalized.againstPoints.length > 0
            ? normalized.againstPoints
            : fallbackSupport(proposal, contextBrief, sourceDetails).againstPoints,
          evidence: normalized.evidence.length > 0
            ? normalized.evidence
            : fallbackSupport(proposal, contextBrief, sourceDetails).evidence,
        };
      });

      return NextResponse.json({ supports });
    } catch (error) {
      console.warn('[decision-council/supports] AI generation failed, using fallback:', error);
      return NextResponse.json({ supports: fallback, fallback: true });
    }
  } catch (error) {
    console.error('[decision-council/supports] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
