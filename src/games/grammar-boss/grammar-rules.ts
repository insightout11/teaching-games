import { GrammarTarget } from './types';

export interface GrammarRule {
  rule: string;
  example: string;
  mistakes: string[];
}

export const GRAMMAR_RULES: Record<GrammarTarget, GrammarRule> = {
  [GrammarTarget.PresentSimple]: {
    rule: 'Subject + base verb (add -s/-es for he/she/it)',
    example: 'She works at a hospital every day.',
    mistakes: ['NOT: She work → She works', 'NOT: He don\'t like → He doesn\'t like'],
  },
  [GrammarTarget.PresentContinuous]: {
    rule: 'Subject + am/is/are + verb-ing',
    example: 'They are studying for the exam right now.',
    mistakes: ['NOT: She studying → She is studying', 'NOT: I am work → I am working'],
  },
  [GrammarTarget.PastSimple]: {
    rule: 'Subject + verb-ed (or irregular past form)',
    example: 'We visited the museum last weekend.',
    mistakes: ['NOT: She goed → She went', 'NOT: Did you went? → Did you go?'],
  },
  [GrammarTarget.PastContinuous]: {
    rule: 'Subject + was/were + verb-ing',
    example: 'I was reading when the phone rang.',
    mistakes: ['NOT: They was playing → They were playing'],
  },
  [GrammarTarget.PresentPerfect]: {
    rule: 'Subject + have/has + past participle',
    example: 'I have lived in Tokyo for three years.',
    mistakes: ['NOT: I have went → I have gone', 'NOT: She have seen → She has seen'],
  },
  [GrammarTarget.PresentPerfectContinuous]: {
    rule: 'Subject + have/has + been + verb-ing',
    example: 'She has been working here since 2020.',
    mistakes: ['NOT: I have been wait → I have been waiting'],
  },
  [GrammarTarget.PastPerfect]: {
    rule: 'Subject + had + past participle',
    example: 'They had already left when we arrived.',
    mistakes: ['NOT: I had went → I had gone', 'NOT: She had already eat → She had already eaten'],
  },
  [GrammarTarget.FutureWill]: {
    rule: 'Subject + will + base verb',
    example: 'I will call you tomorrow morning.',
    mistakes: ['NOT: I will to go → I will go', 'NOT: She will goes → She will go'],
  },
  [GrammarTarget.FutureGoingTo]: {
    rule: 'Subject + am/is/are + going to + base verb',
    example: 'We are going to travel to Spain next summer.',
    mistakes: ['NOT: I going to leave → I am going to leave'],
  },
  [GrammarTarget.FutureContinuous]: {
    rule: 'Subject + will + be + verb-ing',
    example: 'This time tomorrow, I will be flying to London.',
    mistakes: ['NOT: I will be go → I will be going'],
  },
  [GrammarTarget.Conditional]: {
    rule: 'If + condition clause, + result clause (varies by type)',
    example: 'If it rains, we will stay inside.',
    mistakes: ['NOT: If I will see him → If I see him (1st conditional)', 'NOT: If I would know → If I knew (2nd conditional)'],
  },
  [GrammarTarget.Passive]: {
    rule: 'Subject + be (conjugated) + past participle',
    example: 'The book was written by a famous author.',
    mistakes: ['NOT: The cake made by her → The cake was made by her'],
  },
  [GrammarTarget.RelativeClause]: {
    rule: 'Main clause + who/which/that/where/whose + extra information',
    example: 'The teacher who helped me was very kind.',
    mistakes: ['NOT: The man which → The man who (for people)', 'NOT: The book who → The book which/that (for things)'],
  },
  [GrammarTarget.ReportedSpeech]: {
    rule: 'Reporting verb + (that) + shifted tense/pronouns',
    example: 'She said that she was feeling tired.',
    mistakes: ['NOT: He said he is → He said he was (tense shift)', 'NOT: She told that → She said that / She told me that'],
  },
};
