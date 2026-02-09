import { NextRequest, NextResponse } from 'next/server';
import type { ConnectionsGroup } from '@/games/connections/types';

export async function POST(request: NextRequest) {
  try {
    const { selectedWords, remainingGroups } = await request.json() as {
      selectedWords: string[];
      remainingGroups: ConnectionsGroup[];
    };

    // Validate input
    if (!selectedWords || selectedWords.length !== 4) {
      return NextResponse.json(
        { error: 'Must select exactly 4 words' },
        { status: 400 }
      );
    }

    if (!remainingGroups || remainingGroups.length === 0) {
      return NextResponse.json(
        { error: 'No remaining groups to check against' },
        { status: 400 }
      );
    }

    // Normalize selected words to uppercase for comparison
    const normalizedSelected = selectedWords.map(w => w.toUpperCase()).sort();

    // Check if the selected words match any remaining group
    for (const group of remainingGroups) {
      const groupWords = group.words.map(w => w.toUpperCase()).sort();

      if (normalizedSelected.length === groupWords.length &&
          normalizedSelected.every((word, index) => word === groupWords[index])) {
        // Found a match!
        return NextResponse.json({
          isCorrect: true,
          matchedGroup: group,
          feedback: `Correct! "${group.category}"`
        });
      }
    }

    // No exact match - check how close they were
    let closestMatch = 0;
    for (const group of remainingGroups) {
      const groupWords = new Set(group.words.map(w => w.toUpperCase()));
      const matchCount = normalizedSelected.filter(w => groupWords.has(w)).length;
      closestMatch = Math.max(closestMatch, matchCount);
    }

    let feedback = 'Not quite. Try again!';
    if (closestMatch === 3) {
      feedback = 'So close! One word away from a group.';
    } else if (closestMatch === 2) {
      feedback = 'Two words are in the same group. Keep looking!';
    }

    return NextResponse.json({
      isCorrect: false,
      feedback
    });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate selection' },
      { status: 500 }
    );
  }
}
