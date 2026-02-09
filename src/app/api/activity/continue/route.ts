import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { ActivityContinueRequest, ActivityContinueResponse } from '@/activities/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');


// Generic prompt for activities without specific handlers
function genericActivityPrompt(req: ActivityContinueRequest): string {
  const exchangeHistory = req.previousExchanges
    .map((e) => `${e.role}: ${e.content}`)
    .join('\n');

  return `You are helping facilitate an ESL classroom activity.

Activity: ${req.activityKey}
Topic: ${req.topicContext}

Previous exchanges:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

${req.requestType === 'follow-up' ? 'Generate a thought-provoking follow-up question that builds on the discussion.' : ''}
${req.requestType === 'challenge' ? 'Generate a challenging question or counter-point to push deeper thinking.' : ''}
${req.requestType === 'hint' ? 'Provide a helpful hint to guide the student.' : ''}
${req.requestType === 'evaluate' ? 'Evaluate with a score (1-10) and constructive feedback.' : ''}

Keep responses appropriate for ESL learners. Be encouraging. Include vocabulary highlights when relevant.`;
}

// Activity-specific prompts
const activityPrompts: Record<string, (req: ActivityContinueRequest) => string> = {
  'would-you-rather': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are helping facilitate a "Would You Rather?" ESL discussion activity.

Topic context: ${req.topicContext}

Previous exchanges:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

Based on the discussion so far, provide:
${req.requestType === 'follow-up' ? '- A thought-provoking follow-up question that deepens the discussion' : ''}
${req.requestType === 'hint' ? '- A helpful hint to guide the student\'s thinking' : ''}
${req.requestType === 'evaluate' ? '- An evaluation with a score (1-10) and constructive feedback' : ''}
- A brief teacher note with a suggested discussion angle (optional)
- 2-3 vocabulary words that could be introduced (optional)

Keep responses appropriate for ESL learners. Be encouraging and focus on language practice.`;
  },

  'hot-take-arena': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are playing "Devil's Advocate" in a classroom debate activity.

Topic context: ${req.topicContext}

Debate so far:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

${req.requestType === 'challenge' ? `Generate a challenging counter-argument or question that:
- Pushes the students to think deeper
- Is fair and debatable (not a "gotcha")
- Uses vocabulary appropriate for ESL learners
- Could realistically change someone's mind` : ''}

${req.requestType === 'follow-up' ? `Generate a follow-up question that:
- Builds on what was just said
- Encourages more elaboration
- Helps quieter students participate` : ''}

${req.requestType === 'evaluate' ? `Evaluate the argument:
- Score the strength of reasoning (1-10)
- Note any good vocabulary usage
- Suggest improvements` : ''}

Include a teacher note and relevant vocabulary when appropriate.`;
  },

  'expert-panel': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are helping facilitate an "Expert Panel" ESL activity where students play specialist roles.

Topic: ${req.topicContext}

Previous exchanges:
${exchangeHistory}

Latest response: ${req.studentResponse}

Request type: ${req.requestType}

Generate a follow-up question for the expert that:
- Builds on their previous answer
- Encourages deeper exploration of their expertise
- Uses appropriate vocabulary for the topic
- Helps practice formal/professional language

Include a teacher note and vocabulary highlights.`;
  },

  'interview-lab': (req) => {
    const exchangeHistory = req.previousExchanges
      .map((e) => `${e.role}: ${e.content}`)
      .join('\n');

    return `You are an AI character being interviewed by ESL students.

Topic/Context: ${req.topicContext}

Interview so far:
${exchangeHistory}

Student's question: ${req.studentResponse}

Respond as the character would, keeping in mind:
- Stay in character with consistent personality
- Use vocabulary appropriate for ESL learners
- Give interesting, conversation-continuing answers
- Encourage follow-up questions

Provide the response in 'nextQuestion' field (it's the character's answer).`;
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ActivityContinueRequest;
    const { activityKey, requestType } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Get the appropriate prompt generator (or use generic fallback)
    const promptGenerator = activityPrompts[activityKey] || genericActivityPrompt;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            nextQuestion: { type: SchemaType.STRING },
            challenge: { type: SchemaType.STRING },
            hint: { type: SchemaType.STRING },
            evaluation: {
              type: SchemaType.OBJECT,
              properties: {
                score: { type: SchemaType.NUMBER },
                feedback: { type: SchemaType.STRING },
              },
            },
            teacherNote: { type: SchemaType.STRING },
            vocabularyHighlight: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
            },
          },
        },
      },
    });

    const prompt = promptGenerator(body);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as ActivityContinueResponse;

    // Ensure we have at least one of the expected fields
    const response: ActivityContinueResponse = {
      nextQuestion: parsed.nextQuestion,
      challenge: parsed.challenge,
      hint: parsed.hint,
      evaluation: parsed.evaluation,
      teacherNote: parsed.teacherNote,
      vocabularyHighlight: parsed.vocabularyHighlight,
    };

    // Provide defaults if AI didn't return expected field
    if (requestType === 'follow-up' && !response.nextQuestion) {
      response.nextQuestion = 'Can you tell us more about your thinking?';
    }
    if (requestType === 'challenge' && !response.challenge) {
      response.challenge = 'What would you say to someone who completely disagrees?';
    }
    if (requestType === 'hint' && !response.hint) {
      response.hint = 'Think about the consequences of each choice.';
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Activity continue error:', error);

    // Return graceful fallback
    const fallbackResponse: ActivityContinueResponse = {
      nextQuestion: 'What else can you tell us about your opinion?',
      teacherNote: 'Consider asking students to elaborate on their reasoning.',
    };

    return NextResponse.json(fallbackResponse);
  }
}
