import type { CabinMysteryContent } from '../types'

// ============================================
// The Switched Suitcase — Static Case Template
// Hand-authored V1 case. Do not modify the clue graph without re-validating
// the full evidence chain and all role cards.
//
// Logic: Evidence 1 → red herring (Kim). Evidence 2 → clears Kim, narrows to
// Row 11–12 passengers. Evidence 3 → proves Priya opened Row 11 bin and moved
// the bag into Row 12. Solution is deducible from Evidence 2 + 3 alone.
// ============================================

export const switchedSuitcase: CabinMysteryContent = {
  activityKey: 'cabin-mystery',
  schemaVersion: 1,
  caseId: 'switched-suitcase',
  title: 'The Switched Suitcase',
  setting: 'Flight AC-202, London to Lisbon, cruising at 35,000ft',
  topicContext: '', // populated by topic at lesson generation time; empty for static use
  incident:
    'A black rolling suitcase belonging to passenger Marcus Reeves (Seat 11B) has disappeared from his overhead bin. ' +
    'In its place is an almost identical bag — same brand, same colour. ' +
    'The crew believe the bags were switched after takeoff, not stolen. ' +
    'Someone on this flight moved Marcus\'s suitcase and has not admitted it.',

  topicAdaptations: [
    'travel and airports',
    'possessions and belongings',
    'clothing',
    'jobs and workplaces',
    'past tense / past continuous',
    'apologies and explanations',
    'asking for and giving directions',
  ],

  // ──────────────────────────────────────────
  // PASSENGER MANIFEST
  // ──────────────────────────────────────────
  suspects: [
    { id: 'suspect-priya',   name: 'Priya Chen',     seatOrRole: 'Seat 12A',                   isCulprit: true  },
    { id: 'suspect-marcus',  name: 'Marcus Reeves',  seatOrRole: 'Seat 11B',                   isCulprit: false },
    { id: 'suspect-kim',     name: 'Officer Kim',    seatOrRole: 'Lead Flight Attendant',       isCulprit: false },
    { id: 'suspect-dolores', name: 'Dolores Santos', seatOrRole: 'Seat 11A',                   isCulprit: false },
    { id: 'suspect-jake',    name: 'Jake Osei',      seatOrRole: 'Seat 13A',                   isCulprit: false },
    { id: 'suspect-amara',   name: 'Captain Amara',  seatOrRole: 'Seat 10B (off-duty pilot)',   isCulprit: false },
    { id: 'suspect-fiona',   name: 'Fiona Walsh',    seatOrRole: 'Seat 10A',                   isCulprit: false },
    { id: 'suspect-ben',     name: 'Ben Nakamura',   seatOrRole: 'Seat 13B',                   isCulprit: false },
  ],

  // ──────────────────────────────────────────
  // REQUIRED ROLES (4)
  // Mystery is fully solvable with only these four.
  // ──────────────────────────────────────────
  requiredRoles: [

    // ── ROLE 1: CULPRIT ──────────────────────
    {
      id: 'role-priya',
      suspectId: 'suspect-priya',
      isRequired: true,
      isCulprit: true,

      publicIdentity:
        'A quiet traveller in Seat 12A. She seems anxious and keeps glancing toward the overhead bins.',

      alibi:
        'I was in my seat the whole time after takeoff. I got up once to get my medication from my bag.',

      privateSecret:
        'You reached into the overhead bin at Row 11 by mistake — your bin is Row 12. ' +
        'You pulled out a black suitcase, thinking it was yours, and carried it back to your seat. ' +
        'When you opened it, you realised immediately it wasn\'t yours. You panicked. ' +
        'You stood up, placed Marcus\'s bag into the Row 12 bin beside your own bag, and said nothing. ' +
        'You were too embarrassed to admit the mistake.',

      clue:
        'Your own bag has always been in the Row 12 bin. Marcus\'s bag is now also in the Row 12 bin — you put it there.',

      mustRevealTrigger: {
        condition: 'if asked: "Did you open or move any suitcase after takeoff?"',
        reveal:
          'I... yes. I took the wrong bag from Row 11 by mistake. I thought it was mine. ' +
          'When I realised, I put it into my bin. I didn\'t know what else to do.',
      },

      answerBank: {
        safeAnswer: 'I was reading my book. I didn\'t notice anything unusual.',
        locationAnswer: 'I was in Seat 12A. I only got up once to get my medication.',
        conditionalAnswers: [
          {
            trigger: 'asked about the overhead bin or Row 11',
            response:
              'I opened the bin above Row 11 by mistake. I thought it was mine. The bags look exactly the same.',
            isRequired: true,
          },
          {
            trigger: 'asked if you touched or moved a suitcase',
            response:
              'I picked up a bag from Row 11. I thought it was mine. When I realised it wasn\'t, I moved it to my bin.',
            isRequired: true,
          },
          {
            trigger: 'asked where Marcus\'s bag is now',
            response:
              'It\'s in the Row 12 bin. My bag is there too. I put it there when I realised my mistake.',
            isRequired: true,
          },
        ],
        deflectionLines: [
          'I don\'t really remember exactly what I was doing.',
          'The aisle was busy — lots of people were moving around.',
          'I was feeling unwell. I wasn\'t paying attention to other passengers.',
        ],
        improv:
          'You may describe how identical the bags look. You must not say you never touched or moved a suitcase if asked directly.',
      },

      sentenceStems: [
        'I was sitting in Seat 12A the whole time, and when I got up...',
        'The bags look so similar that I...',
        'I didn\'t mean to — I was looking for my medication and...',
      ],

      goal:
        'Help the class understand what happened. Do not confess until someone asks you directly about touching or moving a suitcase.',

      culpritContext:
        'You made an honest mistake and panicked. You are not a thief. ' +
        'When asked directly, explain what really happened. ' +
        'During the activity, protect your dignity as long as you can — but you are not trying to deceive the class permanently.',
    },

    // ── ROLE 2: VICTIM ────────────────────────
    {
      id: 'role-marcus',
      suspectId: 'suspect-marcus',
      isRequired: true,
      isCulprit: false,

      publicIdentity:
        'A confident, slightly impatient business traveller. He reported the missing suitcase to the crew.',

      alibi:
        'I was in my seat working on my laptop from takeoff. I only discovered the bag problem when I went to get my laptop charger.',

      privateSecret:
        'The bag contains a signed contract that must be delivered today. ' +
        'You are much more stressed about this than you are showing.',

      clue:
        'Your bag has a small dent on the left corner and a worn wheel. ' +
        'The bag that replaced it in your bin is pristine — no damage anywhere. They are not the same bag.',

      mustRevealTrigger: {
        condition: 'if asked: "How do you know your bag is different from the one found?"',
        reveal:
          'My bag has a dent on the left corner and a worn wheel. This bag is in perfect condition. They are clearly not the same.',
      },

      answerBank: {
        safeAnswer: 'I was working on my laptop until I noticed the bag was wrong.',
        locationAnswer: 'Seat 11B. I did not move until I discovered the wrong bag.',
        conditionalAnswers: [
          {
            trigger: 'asked how you identified the bags',
            response:
              'My bag has a dent on the left corner and a worn wheel. The other bag is perfect. Easy to tell apart once you look closely.',
            isRequired: true,
          },
          {
            trigger: 'asked what is inside the bag',
            response: 'Important work documents. That is all I will say.',
            isRequired: false,
          },
        ],
        deflectionLines: [],
        improv:
          'You may add detail about why the bag matters to you, but do not name the contract specifically.',
      },

      sentenceStems: [
        'When I checked the overhead bin, I immediately knew...',
        'I can identify my bag because...',
        'I was in my seat the whole time, so...',
      ],

      goal:
        'You want the mystery solved. Answer questions clearly and cooperatively. You are the victim, not a suspect.',
    },

    // ── ROLE 3: RED HERRING ───────────────────
    {
      id: 'role-kim',
      suspectId: 'suspect-kim',
      isRequired: true,
      isCulprit: false,

      publicIdentity:
        'Professional and efficient. Was seen carrying bags through the Row 11–12 area during boarding. Currently leading the investigation.',

      alibi:
        'During boarding I reorganised bags in Rows 7 to 10. To reach those rows from the front galley, ' +
        'I walked through Rows 11 and 12 several times while carrying bags. ' +
        'After takeoff, I was in the rear galley preparing beverages.',

      privateSecret:
        'Three passengers asked you to help with heavy bags during boarding. ' +
        'Each time, you walked through Rows 11 and 12 carrying those bags to their correct positions in Rows 7–10. ' +
        'You know this looks suspicious, but you never opened any bin in those rows.',

      clue:
        'The cabin boarding record lists only Rows 7 to 10 as reorganised. ' +
        'Rows 11 and 12 are not listed. You walked through — you did not open those bins.',

      mustRevealTrigger: {
        condition: 'if asked: "Did you open any bin in Row 11 or 12?"',
        reveal:
          'No. I walked through those rows carrying bags to Rows 7 to 10. ' +
          'I never opened Row 11 or Row 12\'s bins. The boarding record will confirm this.',
      },

      answerBank: {
        safeAnswer: 'I was doing my job. I reorganised bags in Rows 7 to 10.',
        locationAnswer:
          'After takeoff, I was in the rear galley. I only came to Rows 11 and 12 when the incident was reported.',
        conditionalAnswers: [
          {
            trigger: 'asked which rows you reorganised',
            response:
              'Only Rows 7 to 10. I passed through Rows 11 and 12 on the way each time, but I never opened those bins. Check the boarding record.',
            isRequired: true,
          },
          {
            trigger: 'asked why you were seen near Row 11 or 12',
            response:
              'I passed through those rows several times while carrying bags to my work area. I was passing through, not working there.',
            isRequired: true,
          },
        ],
        deflectionLines: [
          'I handle bags on every flight. Passengers often assume I was working in their row.',
          'Check the boarding record. That is what it is for.',
        ],
        improv:
          'You may explain how the boarding process works. You must not claim you were never near Rows 11 or 12 — you were, but only walking through.',
      },

      sentenceStems: [
        'During boarding, I walked through Rows 11 and 12, but...',
        'The cabin record shows I only worked in...',
        'After takeoff, I was in the galley...',
      ],

      goal:
        'You did nothing wrong. Answer calmly and professionally. Your boarding record is your alibi.',
    },

    // ── ROLE 4: KEY WITNESS ───────────────────
    {
      id: 'role-dolores',
      suspectId: 'suspect-dolores',
      isRequired: true,
      isCulprit: false,

      publicIdentity:
        'A sharp, observant older traveller. She noticed something unusual but has not volunteered it.',

      alibi:
        'I was in Seat 11A the whole flight. I was reading and watching the aisle — old habit from years of travel.',

      privateSecret:
        'About 20 minutes after takeoff, you saw the woman from Seat 12A walk to the Row 11 overhead bin, ' +
        'remove a black suitcase, and carry it back toward Row 12. ' +
        'A few minutes later, she stood up again, opened the Row 12 bin, and placed the bag inside. ' +
        'She looked flustered both times.',

      clue:
        'She took a suitcase from Row 11 and moved it to Row 12. You saw both movements clearly from Seat 11A.',

      mustRevealTrigger: {
        condition: 'if asked: "Did you see anyone take or move a suitcase after takeoff?"',
        reveal:
          'Yes. The woman from Seat 12A. About 20 minutes after takeoff she removed a suitcase from the Row 11 bin ' +
          'and carried it back toward her seat. A few minutes later she opened the Row 12 bin and placed it inside.',
      },

      answerBank: {
        safeAnswer: 'I was reading my book. It was a quiet flight until the announcement.',
        locationAnswer: 'Seat 11A. I did not move once.',
        conditionalAnswers: [
          {
            trigger: 'asked what you saw in the aisle',
            response:
              'People were walking around in the first hour. Nothing unusual... except one thing I noticed near the bins.',
            isRequired: false,
          },
          {
            trigger: 'asked about the bins or moving luggage',
            response:
              'The woman from Seat 12A took a suitcase from Row 11 and placed it into Row 12 a few minutes later. She seemed confused both times.',
            isRequired: true,
          },
        ],
        deflectionLines: [],
        improv:
          'You may describe how flustered Priya appeared when she returned to her seat.',
      },

      sentenceStems: [
        'I was watching the aisle because...',
        'About 20 minutes after takeoff, I saw...',
        'She came from Seat 12A and reached into Row 11\'s bin, and then...',
      ],

      goal:
        'You have the key observation. Share it — but only when someone asks you directly about the bins or moving luggage.',
    },
  ],

  // ──────────────────────────────────────────
  // OPTIONAL ROLES (4)
  // Added in order as class size grows. None carry a load-bearing clue.
  // ──────────────────────────────────────────
  optionalRoles: [

    // ── ROLE 5 (5+ students): PARTIAL WITNESS ─
    {
      id: 'role-jake',
      suspectId: 'suspect-jake',
      isRequired: false,
      isCulprit: false,

      publicIdentity:
        'A relaxed student traveller in Seat 13A. Had his headphones in most of the flight.',

      alibi:
        'I was watching videos on my phone with my headphones in. Pretty zoned out most of the time.',

      privateSecret:
        'You saw the woman from Seat 12A walk past you toward the front of the cabin — toward Row 11, ' +
        'not toward the rear where the lavatories are. On the way back she was carrying something dark.',

      clue:
        'She walked the wrong direction for the bathroom, and she was carrying something on the way back.',

      mustRevealTrigger: {
        condition: 'if asked: "Did you see anyone walk past you carrying something after takeoff?"',
        reveal:
          'Yeah, the woman from 12A walked toward Row 11 — not toward the bathrooms. ' +
          'On the way back she had something with her. Looked like a bag.',
      },

      answerBank: {
        safeAnswer: 'I had my headphones in. I wasn\'t really paying attention.',
        locationAnswer: 'Seat 13A. Directly behind Row 12.',
        conditionalAnswers: [
          {
            trigger: 'asked what direction she walked',
            response: 'Toward the front. Not toward the back where the bathrooms are.',
            isRequired: true,
          },
          {
            trigger: 'asked if she was carrying anything',
            response:
              'On the way back she had something dark with her — looked like a bag or case.',
            isRequired: true,
          },
        ],
        deflectionLines: ['I wasn\'t really watching. I was in my own world.'],
        improv: 'You may describe what you were listening to or watching.',
      },

      sentenceStems: [
        'I had my headphones in, but I noticed...',
        'She walked past me toward the front of the plane...',
        'On the way back she was carrying...',
      ],

      goal: 'You have a small but useful clue. Share it if someone asks about movement in the aisle.',
    },

    // ── ROLE 6 (6+ students): AUTHORITY ──────
    {
      id: 'role-amara',
      suspectId: 'suspect-amara',
      isRequired: false,
      isCulprit: false,

      publicIdentity:
        'An off-duty pilot travelling as a passenger in Seat 10B. She notices things most passengers miss.',

      alibi:
        'I was reading in Seat 10B. I watched the boarding process — it is a professional habit I cannot switch off.',

      privateSecret:
        'During boarding, you noticed two nearly identical black suitcases being placed in the Row 11 bin. ' +
        'One had a small dent on the left corner; the other was pristine. ' +
        'You thought it was a mix-up waiting to happen but said nothing.',

      clue:
        'Two almost identical bags went into Row 11 at boarding. One dented, one perfect. ' +
        'From the aisle they looked identical.',

      mustRevealTrigger: {
        condition: 'if asked: "What did you notice about the bags during boarding?"',
        reveal:
          'Two identical black bags went into Row 11 during boarding. One had a dent on the left corner. ' +
          'The other was perfect. From the aisle you cannot tell them apart.',
      },

      answerBank: {
        safeAnswer: 'I observed the boarding from my seat. Everything looked standard.',
        locationAnswer: 'Seat 10B. I had a clear view of Rows 11 and 12.',
        conditionalAnswers: [
          {
            trigger: 'asked about the bags during boarding',
            response:
              'Two identical bags in Row 11 at boarding. One dented, one perfect. A mix-up waiting to happen.',
            isRequired: true,
          },
          {
            trigger: 'asked about Officer Kim',
            response:
              'She walked through Rows 11 and 12 several times carrying bags toward the front. She was passing through, not reorganising those rows.',
            isRequired: false,
          },
        ],
        deflectionLines: [
          'I was off-duty. I try not to monitor every detail when I am not working.',
        ],
        improv:
          'You may describe what the boarding process looked like from a professional perspective.',
      },

      sentenceStems: [
        'As someone who flies professionally, I noticed...',
        'When I sat down, I observed two bags in Row 11...',
        'From the aisle the two bags looked...',
      ],

      goal: 'Share what you know confidently. You are a credible witness.',
    },

    // ── ROLE 7 (7+ students): EXPERIENCED OBSERVER ─
    {
      id: 'role-fiona',
      suspectId: 'suspect-fiona',
      isRequired: false,
      isCulprit: false,

      publicIdentity:
        'A businesswoman in Seat 10A who flies weekly. Efficient and direct.',

      alibi:
        'I was working with noise-cancelling headphones from takeoff. I did not notice the problem until the announcement.',

      privateSecret:
        'Within 15 minutes of takeoff — before the drink service, before many passengers were moving — ' +
        'you noticed a yellow plastic luggage tag clip on the floor near Row 11.',

      clue:
        'The clip was there very early. That means it fell during or immediately after takeoff, not later.',

      mustRevealTrigger: {
        condition: 'if asked: "Did you notice anything on the floor near Row 11?"',
        reveal:
          'There was a yellow plastic clip on the floor near Row 11 very early in the flight. ' +
          'Before the drink service even started.',
      },

      answerBank: {
        safeAnswer: 'I was working with my headphones on. I did not notice much.',
        locationAnswer: 'Seat 10A. I can see the aisle behind me from my seat.',
        conditionalAnswers: [
          {
            trigger: 'asked about the floor or the clip',
            response:
              'I saw the yellow clip near Row 11 early — before the drink service, before many people were walking around.',
            isRequired: true,
          },
        ],
        deflectionLines: ['I mind my own business on flights.'],
        improv:
          'You may comment on how early the clip was there and what that suggests.',
      },

      sentenceStems: [
        'I noticed the clip near Row 11 very early in the flight...',
        'It was there before the drink service, which means...',
        'As someone who travels frequently, I notice...',
      ],

      goal: 'Direct and factual. Share what you saw if asked.',
    },

    // ── ROLE 8 (8 students): UNRELIABLE NARRATOR ─
    {
      id: 'role-ben',
      suspectId: 'suspect-ben',
      isRequired: false,
      isCulprit: false,

      publicIdentity:
        'A nervous first-time flyer in Seat 13B. He was watching everything — but gets confused easily.',

      alibi:
        'I kept my seatbelt on the whole time. I was watching everything because I was scared.',

      privateSecret:
        'You think you saw one or two people near the overhead bins after takeoff, ' +
        'but you cannot say exactly who or exactly when. Everything on a plane is unfamiliar to you.',

      clue:
        'Someone definitely opened a bin near the front of your area. But you cannot say exactly who.',

      mustRevealTrigger: {
        condition: 'if asked: "How many people did you see near the overhead bins after takeoff?"',
        reveal:
          'I think one? Maybe two? Honestly I might be mixing up two different times. ' +
          'The bins all look the same to me.',
      },

      answerBank: {
        safeAnswer: 'I was watching everything. First flights make you pay attention.',
        locationAnswer: 'Seat 13B. Right behind Row 12.',
        conditionalAnswers: [
          {
            trigger: 'asked what you saw near the bins',
            response:
              'I saw movement near the bins. One or maybe two people. I am not totally sure.',
            isRequired: false,
          },
        ],
        deflectionLines: ['I might be wrong. Everything on planes looks the same to me.'],
        improv:
          'You may express confusion about what is normal versus unusual on a flight.',
      },

      sentenceStems: [
        'I was watching very carefully because...',
        'I am not totally sure, but I think I saw...',
        'Everything on planes looks the same to me, so...',
      ],

      goal:
        'Be honest about your uncertainty. Your confusion adds texture without changing the logic of the case.',
    },
  ],

  // ──────────────────────────────────────────
  // EVIDENCE CARDS (exactly 3)
  // Card 1: establishes incident + red herring
  // Card 2: clears red herring, narrows to passengers
  // Card 3: clinches — both bin events, both bags in Row 12
  // ──────────────────────────────────────────
  evidenceCards: [
    {
      cardNumber: 1,
      label: 'Evidence Card 1: The Luggage Tag Clip',
      content:
        'A yellow plastic luggage tag clip was found on the floor of the aisle near Seat 12A. ' +
        'The crew confirmed it matches the type attached to Marcus Reeves\' suitcase — ' +
        'the same clip style as the tag still on his bag.',
      corroboratesRoleIds: ['role-marcus'],
      contradictsRoleIds: [],
      pointsToward: 'red-herring',
      implication:
        'Marcus\'s bag passed through the Row 12 area at some point after takeoff. ' +
        'Officer Kim was seen carrying bags through that section during boarding. But is she the only one who could have done this?',
      unlocksQuestionIds: ['Q101', 'Q102', 'Q103', 'CQ-D1', 'CQ-J1', 'CQ-F1', 'CQ-M1'],
      includesFallbackClue: false,
    },
    {
      cardNumber: 2,
      label: 'Evidence Card 2: The Cabin Boarding Record',
      content:
        'The flight crew\'s official boarding log shows Officer Kim reorganised carry-on bags in Rows 7 to 10 during boarding. ' +
        'She walked through Rows 11 and 12 on her way to her work area but did not open those bins. ' +
        'Rows 11 and 12 were last handled by passengers before the aircraft doors were sealed.',
      corroboratesRoleIds: ['role-kim'],
      contradictsRoleIds: [],
      pointsToward: 'narrowed',
      implication:
        'Officer Kim walked through the area but never opened those bins. ' +
        'Whoever moved Marcus\'s bag is a passenger — seated in or near Rows 11 or 12.',
      unlocksQuestionIds: ['Q201', 'Q202', 'Q203', 'CQ-K1', 'CQ-K2', 'CQ-K3', 'CQ-A2'],
      includesFallbackClue: true, // fallback injected here if role-kim not assigned
    },
    {
      cardNumber: 3,
      label: 'Evidence Card 3: The Captain\'s Flight Log',
      content:
        'The crew\'s in-flight incident log records two overhead bin events in the first 30 minutes of flight. ' +
        'First: the bin at Row 11 was opened and a suitcase was removed by a passenger travelling from the direction of Row 12. ' +
        'Second: approximately four minutes later, the bin at Row 12 was opened by the same passenger and a bag was placed inside. ' +
        'The Row 12 bin now contains two black suitcases.',
      corroboratesRoleIds: ['role-dolores', 'role-jake'],
      contradictsRoleIds: ['role-priya'],
      pointsToward: 'culprit',
      implication:
        'A passenger from Seat 12A removed a bag from Row 11 and placed it in Row 12. ' +
        'Only one passenger sits in Seat 12A.',
      unlocksQuestionIds: [],   // no formal question round after Evidence 3
      includesFallbackClue: true, // fallback injected here if role-dolores or role-jake not assigned
    },
  ],

  // ──────────────────────────────────────────
  // FALLBACK CLUES
  // Appended to evidence card content when a required role is not assigned.
  // ──────────────────────────────────────────
  fallbackClues: [
    {
      clueText:
        'A passenger seated in Row 11 confirmed that approximately 20 minutes after takeoff, ' +
        'the traveller from Seat 12A removed a suitcase from the Row 11 bin, carried it toward Row 12, ' +
        'and returned a few minutes later to place it in the Row 12 bin.',
      appearsInCardNumber: 3,
      onlyIfRoleIdMissing: 'role-dolores',
    },
    {
      clueText:
        'A passenger seated in Row 13 noted that the traveller from Seat 12A walked toward the front of the cabin ' +
        'and returned carrying what appeared to be a dark bag.',
      appearsInCardNumber: 3,
      onlyIfRoleIdMissing: 'role-jake',
    },
    {
      clueText:
        'Crew records confirm that no flight attendant opened the overhead bins at Rows 11 or 12 ' +
        'after the aircraft doors were sealed.',
      appearsInCardNumber: 2,
      onlyIfRoleIdMissing: 'role-kim',
    },
  ],

  // ──────────────────────────────────────────
  // QUESTION BANK
  // Target-first UX: student selects a character, then sees available questions.
  // Always-available and evidence-specific questions apply to any target.
  // Character-specific questions only appear when that character is the target.
  // ──────────────────────────────────────────
  questionBank: {
    alwaysAvailable: [
      { id: 'Q001', text: 'Where were you when the incident occurred?',          targetType: 'any' },
      { id: 'Q002', text: 'What were you doing during the first hour of the flight?', targetType: 'any' },
      { id: 'Q003', text: 'Did you notice anything unusual?',                    targetType: 'any' },
      { id: 'Q004', text: 'Who can confirm your story?',                         targetType: 'any' },
      { id: 'Q005', text: 'Is there anything you have not told us yet?',         targetType: 'any' },
    ],

    evidenceSpecific: [
      {
        afterCardNumber: 1,
        questions: [
          { id: 'Q101', text: 'Did you see anyone carrying a black suitcase in the aisle after takeoff?', targetType: 'any' },
          { id: 'Q102', text: 'Do you know anything about the yellow luggage clip found near Seat 12A?',  targetType: 'any' },
          { id: 'Q103', text: 'Were you near Row 11 or Row 12 at any point during the flight?',          targetType: 'any' },
        ],
      },
      {
        afterCardNumber: 2,
        questions: [
          { id: 'Q201', text: 'Which passengers were seated in Rows 11 and 12?',                         targetType: 'any' },
          { id: 'Q202', text: 'Did you see anyone open an overhead bin after boarding was complete?',    targetType: 'any' },
          { id: 'Q203', text: 'If the Flight Attendant did not move the bag, who else could have?',      targetType: 'any' },
        ],
      },
    ],

    characterSpecific: [
      {
        targetSuspectId: 'suspect-priya',
        questions: [
          { id: 'CQ-P1', text: 'Did you open or move any suitcase after takeoff?',             targetType: 'specific', targetSuspectId: 'suspect-priya' },
          { id: 'CQ-P2', text: 'Why did you leave your seat during the first hour?',           targetType: 'specific', targetSuspectId: 'suspect-priya' },
          { id: 'CQ-P3', text: 'Is your bag currently in the Row 12 bin?',                     targetType: 'specific', targetSuspectId: 'suspect-priya' },
        ],
      },
      {
        targetSuspectId: 'suspect-marcus',
        questions: [
          { id: 'CQ-M1', text: 'How do you know your bag is different from the one found in your bin?', targetType: 'specific', targetSuspectId: 'suspect-marcus' },
          { id: 'CQ-M2', text: 'What is inside your suitcase that you have not mentioned?',             targetType: 'specific', targetSuspectId: 'suspect-marcus' },
        ],
      },
      {
        targetSuspectId: 'suspect-kim',
        questions: [
          { id: 'CQ-K1', text: 'Which rows did you actually reorganise during boarding?',                    targetType: 'specific', targetSuspectId: 'suspect-kim' },
          { id: 'CQ-K2', text: 'Did you open any bin in Row 11 or Row 12?',                                 targetType: 'specific', targetSuspectId: 'suspect-kim' },
          { id: 'CQ-K3', text: 'Why were you seen carrying bags through the Row 11 and 12 area?',           targetType: 'specific', targetSuspectId: 'suspect-kim' },
        ],
      },
      {
        targetSuspectId: 'suspect-dolores',
        questions: [
          { id: 'CQ-D1', text: 'Did you see anyone take or move a suitcase after takeoff?',                 targetType: 'specific', targetSuspectId: 'suspect-dolores' },
          { id: 'CQ-D2', text: 'You were sitting in Row 11 — what did you observe in the aisle?',           targetType: 'specific', targetSuspectId: 'suspect-dolores' },
        ],
      },
      {
        targetSuspectId: 'suspect-jake',
        questions: [
          { id: 'CQ-J1', text: 'Did you see anyone walk past your seat carrying something after takeoff?',  targetType: 'specific', targetSuspectId: 'suspect-jake' },
          { id: 'CQ-J2', text: 'Which direction was she walking — toward the front or the back?',           targetType: 'specific', targetSuspectId: 'suspect-jake' },
        ],
      },
      {
        targetSuspectId: 'suspect-amara',
        questions: [
          { id: 'CQ-A1', text: 'What did you notice about the bags in Row 11 during boarding?',             targetType: 'specific', targetSuspectId: 'suspect-amara' },
          { id: 'CQ-A2', text: 'Did you see Officer Kim open any bins in Rows 11 or 12?',                   targetType: 'specific', targetSuspectId: 'suspect-amara' },
        ],
      },
      {
        targetSuspectId: 'suspect-fiona',
        questions: [
          { id: 'CQ-F1', text: 'Did you notice anything on the floor near Row 11?',                         targetType: 'specific', targetSuspectId: 'suspect-fiona' },
          { id: 'CQ-F2', text: 'When exactly did you first see the yellow clip?',                           targetType: 'specific', targetSuspectId: 'suspect-fiona' },
        ],
      },
      {
        targetSuspectId: 'suspect-ben',
        questions: [
          { id: 'CQ-B1', text: 'How many people did you see near the overhead bins after takeoff?',         targetType: 'specific', targetSuspectId: 'suspect-ben' },
          { id: 'CQ-B2', text: 'Can you describe what you saw in the aisle after takeoff?',                 targetType: 'specific', targetSuspectId: 'suspect-ben' },
        ],
      },
    ],
  },

  // ──────────────────────────────────────────
  // SOLUTION (shown only at reveal phase)
  // ──────────────────────────────────────────
  solution: {
    culpritRoleId: 'role-priya',
    culpritSuspectId: 'suspect-priya',

    explanation:
      'Priya Chen reached into the overhead bin at Row 11 by mistake while looking for her medication. ' +
      'She pulled out Marcus\'s suitcase — almost identical to hers. She carried it back to her seat, ' +
      'opened it, realised immediately it was not hers, and panicked. ' +
      'She stood up, placed Marcus\'s bag into the Row 12 bin alongside her own bag, and said nothing. ' +
      'The suitcase was never stolen — just moved by accident, then hidden out of embarrassment.',

    timeline: [
      {
        time: 'During boarding',
        event:
          'Marcus\'s bag and Priya\'s bag are placed in adjacent bins: Row 11 and Row 12. ' +
          'They are almost identical in appearance. ' +
          'Officer Kim walks through Rows 11 and 12 several times carrying bags to her work area in Rows 7–10.',
        relatedRoleId: 'role-kim',
      },
      {
        time: 'Takeoff',
        event: 'All passengers seated. Overhead bins closed.',
      },
      {
        time: '+15 minutes',
        event: 'Fiona notices a yellow luggage tag clip on the floor near Row 11.',
        relatedRoleId: 'role-fiona',
      },
      {
        time: '+20 minutes',
        event:
          'Priya gets up to retrieve her medication. She opens the Row 11 bin by mistake and removes Marcus\'s bag. ' +
          'The luggage clip falls to the floor as she lifts the bag. ' +
          'Jake sees her walk past him toward the front of the cabin. ' +
          'Dolores observes her take the bag from Row 11.',
        relatedRoleId: 'role-priya',
      },
      {
        time: '+24 minutes',
        event:
          'Priya opens Marcus\'s bag at her seat and realises it is not hers. She panics. ' +
          'She stands up, walks back to Row 12, opens the bin, and places Marcus\'s bag inside alongside her own. ' +
          'Dolores observes this second movement.',
        relatedRoleId: 'role-priya',
      },
      {
        time: '+60 minutes',
        event:
          'Marcus gets up to retrieve his laptop charger. He finds the wrong bag in his bin and reports it to the crew.',
        relatedRoleId: 'role-marcus',
      },
      {
        time: 'Investigation begins',
        event:
          'Officer Kim surveys the cabin. The captain\'s log is checked. ' +
          'Both bags — Marcus\'s and Priya\'s — are found in the Row 12 bin.',
      },
    ],

    clueChain: [
      {
        cardNumber: 1,
        insight:
          'Marcus\'s luggage clip was found near Seat 12A — his bag passed through that area. ' +
          'Officer Kim was seen carrying bags through Row 11–12 during boarding, making her the first suspect.',
        pointedTo: 'red-herring',
      },
      {
        cardNumber: 2,
        insight:
          'The boarding record shows Officer Kim only reorganised Rows 7–10. ' +
          'She walked through Rows 11–12 but never opened those bins. ' +
          'The suspect must be a passenger in or near those rows.',
        pointedTo: 'narrowed',
      },
      {
        cardNumber: 3,
        insight:
          'The flight log records two events: Row 11 bin opened and a bag removed, then Row 12 bin opened and a bag placed inside — ' +
          'both by a passenger from the direction of Seat 12A. ' +
          'Only one passenger sits in Seat 12A.',
        pointedTo: 'culprit',
      },
    ],

    redHerringExplanation:
      'Officer Kim was genuinely seen carrying bags through Rows 11 and 12 during boarding, which made her the natural first suspect. ' +
      'The yellow clip found near Seat 12A fell from Marcus\'s bag when Priya lifted it — not from anything Kim did. ' +
      'Both facts are true. Both are misleading. ' +
      'The boarding record — which confirms Kim\'s exact work area — is the key to clearing her. ' +
      'A student who suspected Kim after Evidence 1 was reasoning correctly from incomplete information.',

    finalRevealScript:
      'The suitcases were never stolen. They look almost identical — same brand, same colour, same size. ' +
      'Priya Chen reached into the wrong bin. Row 11 instead of Row 12. ' +
      'She carried Marcus\'s bag back to her seat, realised the mistake immediately, and put it into the Row 12 bin beside her own. ' +
      'She said nothing because she was embarrassed, not because she was guilty of anything criminal. ' +
      'The yellow clip fell when she lifted the bag. Officer Kim never touched those bins — she walked through the area on her way to Rows 7 to 10. ' +
      'The class could have solved this from Evidence 2 alone: once you know the flight attendant never opened those bins, ' +
      'the only person who could have moved the bag is a passenger in Rows 11 or 12. ' +
      'Evidence 3 confirmed which one.',

    culpritSidePrompt:
      'Time to tell your side. You made an honest mistake. ' +
      'Tell the class: Why did you get up? What did you feel when you opened the wrong bag? Why didn\'t you say anything?',

    culpritSideSentenceStems: [
      'I got up because I needed my medication and I...',
      'When I opened the bag and saw it wasn\'t mine, I felt...',
      'I didn\'t say anything because I was...',
    ],
  },
}
