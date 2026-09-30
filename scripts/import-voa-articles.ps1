param()

$ErrorActionPreference = 'Stop'
$root = 'https://learningenglish.voanews.com'
$candidates = @(
  @{ slug='gerunds-infinitives'; url='/a/everyday-grammar-gerunds-infinitives/2722827.html'; tags=@('grammar','gerunds','infinitives','verbs','writing','english-learning') },
  @{ slug='phrasal-verbs'; url='/a/everyday-grammar-introducing-phrasal-verbs/3010251.html'; tags=@('grammar','phrasal-verbs','vocabulary','verbs','register','english-learning') },
  @{ slug='commas'; url='/a/take-a-break-with-commas/3789406.html'; tags=@('grammar','punctuation','commas','writing','clarity','english-learning') },
  @{ slug='recommendations'; url='/a/grammar-and-recommendations-/7155122.html'; tags=@('grammar','recommendations','modals','speaking','choices','english-learning') },
  @{ slug='uncertainty'; url='/a/grammar-and-uncertainty/7296527.html'; tags=@('grammar','uncertainty','questions','verbs','communication','english-learning') },
  @{ slug='price-questions'; url='/a/grammar-and-the-economy-prices/7117170.html'; tags=@('grammar','prices','questions','shopping','economics','english-learning') },
  @{ slug='subject-verb-agreement'; url='/a/subject-verb-agreement-/5127843.html'; tags=@('grammar','subject-verb-agreement','verbs','singular','plural','english-learning') },
  @{ slug='do-does-agreement'; url='/a/everyday-grammar-do-does-you-understand-subject-verb-agreement/2977592.html'; tags=@('grammar','subject-verb-agreement','do-does','verbs','writing','english-learning') },
  @{ slug='native-speaker-mistakes'; url='/a/can-you-catch-these-native-speaker-mistakes/3666483.html'; tags=@('grammar','common-mistakes','usage','writing','vocabulary','english-learning') },
  @{ slug='grammar-quiz'; url='/a/test-yourself-with-this-everyday-grammar-quiz/5427968.html'; tags=@('grammar','review','quiz','usage','practice','english-learning') },
  @{ slug='articles'; url='/a/using-right-article-everyday-grammar/2819461.html'; tags=@('grammar','articles','nouns','writing','usage','english-learning') },
  @{ slug='transitions'; url='/a/everyday-grammar-using-transitions-for-smoother-writing/3029586.html'; tags=@('grammar','transitions','writing','cohesion','connectors','english-learning') },
  @{ slug='future-tenses'; url='/a/everyday-grammar-fun-with-future-tenses/2935173.html'; tags=@('grammar','future-tense','verbs','predictions','plans','english-learning') },
  @{ slug='changing-grammar-rules'; url='/a/everyday-grammar-three-grammar-rules-that-are-dying/3053579.html'; tags=@('grammar','language-change','usage','prepositions','pronouns','english-learning') },
  @{ slug='permission-modals'; url='/a/everyday-grammar-modals-permission-can-may/2877141.html'; tags=@('grammar','modals','politeness','requests','permission','english-learning') },
  @{ slug='disagreement'; url='/a/everyday-grammar-disagreements-in-conversation/3725998.html'; tags=@('grammar','conversation','opinions','disagreement','politeness','english-learning') },
  @{ slug='exercise-grammar'; url='/a/grammar-for-exercise/6865254.html'; tags=@('grammar','exercise','health','phrasal-verbs','gerunds','english-learning') },
  @{ slug='exercise-grammar-part-2'; url='/a/grammar-for-exercise-part-2/6876693.html'; tags=@('grammar','exercise','health','prepositions','vocabulary','english-learning') },
  @{ slug='wishes'; url='/a/everyday-grammar-making-wishes/3218288.html'; tags=@('grammar','wishes','verbs','hypotheticals','hopes','english-learning') },
  @{ slug='news-subject-verb-agreement'; url='/a/subject-verb-agreement-and-the-news/5137616.html'; tags=@('grammar','news','subject-verb-agreement','nouns','singular','english-learning') },
  @{ slug='auxiliary-verbs'; url='/a/auxiliary-verbs-in-everyday-speech-/6381177.html'; tags=@('grammar','auxiliary-verbs','pronunciation','speech','listening','english-learning') },
  @{ slug='comparatives-superlatives'; url='/a/everyday-grammar-comparatives-superlatives/2989386.html'; tags=@('grammar','adjectives','comparatives','superlatives','descriptions','english-learning') },
  @{ slug='past-present-perfect'; url='/a/everyday-grammar-simple-past-and-present-perfect/2752310.html'; tags=@('grammar','past-tense','present-perfect','verbs','time','english-learning') },
  @{ slug='thingamajig'; url='/a/what-is-this-thing-called-words-and-their-stories/2855544.html'; tags=@('vocabulary','idioms','objects','informal-english','words-and-stories','english-learning') },
  @{ slug='world-is-your-oyster'; url='/a/words-and-their-stories-the-world-is-your-oyster/3937500.html'; tags=@('vocabulary','idioms','animals','ocean','expressions','english-learning') },
  @{ slug='arm-twisting'; url='/a/words-and-their-stories-arm-twisting/4414858.html'; tags=@('vocabulary','idioms','persuasion','communication','expressions','english-learning') },
  @{ slug='monkeys-to-potatoes'; url='/a/words-and-their-stories-from-monkeys-to-potatoes/4141925.html'; tags=@('vocabulary','idioms','food','animals','expressions','english-learning') },
  @{ slug='real-mccoy'; url='/a/words-and-their-stories-the-real-mccoy/3389659.html'; tags=@('vocabulary','idioms','authenticity','history','expressions','english-learning') },
  @{ slug='shark-idioms'; url='/a/words-and-their-stories-sharks/3882789.html'; tags=@('vocabulary','idioms','animals','popular-culture','expressions','english-learning') },
  @{ slug='alice-in-wonderland-expressions'; url='/a/3240888.html'; tags=@('vocabulary','idioms','literature','Alice-in-Wonderland','expressions','english-learning') },
  @{ slug='stay-on-your-toes'; url='/a/words-and-their-stories-stay-on-your-toes/4276571.html'; tags=@('vocabulary','idioms','movement','attention','expressions','english-learning') },
  @{ slug='pan-out'; url='/a/words-and-their-stories-expressions-that-dont-pan-out-92004109/115808.html'; tags=@('vocabulary','idioms','gold-rush','history','expressions','english-learning') },
  @{ slug='golden-expressions'; url='/a/words-and-their-stories-golden-rules-and-golden-oldies-95641684/118653.html'; tags=@('vocabulary','idioms','gold','values','expressions','english-learning') },
  @{ slug='green-expressions'; url='/a/words-and-their-stories-green-expressions-94649004/118650.html'; tags=@('vocabulary','idioms','colors','plants','expressions','english-learning') }
  ,@{ slug='are-infinitives-verbs'; url='/a/are-infinitives-really-verbs-/5769834.html'; tags=@('grammar','infinitives','verbs','sentence-structure','usage','english-learning') }
  ,@{ slug='split-infinitives'; url='/a/how-to-split-infinitives-when-you-have-to/5996599.html'; tags=@('grammar','infinitives','word-order','verbs','writing','english-learning') }
  ,@{ slug='progressive-activities-places'; url='/a/the-progressive-activities-and-places/5109273.html'; tags=@('grammar','progressive-tense','actions','places','verbs','english-learning') }
  ,@{ slug='showing-annoyance-progressive'; url='/a/present-progressive-tense-and-showing-annoyance/4948466.html'; tags=@('grammar','progressive-tense','emotions','conversation','verbs','english-learning') }
  ,@{ slug='meet-perfect-tenses'; url='/a/have-you-met-the-perfect-tenses/3628488.html'; tags=@('grammar','perfect-tense','verbs','time','tense','english-learning') }
  ,@{ slug='contractions'; url='/a/don-t-be-afraid-of-contractions-/4590043.html'; tags=@('grammar','contractions','pronunciation','informal-english','writing','english-learning') }
  ,@{ slug='reported-speech-historic-present'; url='/a/everyday-grammar-reported-speech-and-historic-present-tense/4010017.html'; tags=@('grammar','reported-speech','present-tense','storytelling','verbs','english-learning') }
  ,@{ slug='past-forms-present-future'; url='/a/using-past-forms-to-describe-present-future/5010896.html'; tags=@('grammar','past-tense','future','hypotheticals','verbs','english-learning') }
  ,@{ slug='past-ability'; url='/a/past-ability-could-was-able-to-managed-to/5139503.html'; tags=@('grammar','past-tense','modal-verbs','ability','verbs','english-learning') }
  ,@{ slug='express-purpose'; url='/a/common-ways-to-express-purpose/3836668.html'; tags=@('grammar','infinitives','purpose','sentence-structure','writing','english-learning') }
  ,@{ slug='verbs-perception'; url='/a/verbs-of-perception-/5099933.html'; tags=@('grammar','verbs','perception','senses','sentence-structure','english-learning') }
  ,@{ slug='may-might-must'; url='/a/everyday-grammar-may-might-must-modals-certainty/2887387.html'; tags=@('grammar','modal-verbs','certainty','possibility','verbs','english-learning') }
  ,@{ slug='modal-auxiliaries'; url='/a/everyday-grammar-learn-about-modal-auxiliaries/3854950.html'; tags=@('grammar','modal-verbs','auxiliary-verbs','advice','verbs','english-learning') }
  ,@{ slug='could-have-would-have-should-have'; url='/a/everyday-grammar-could-have-should-have-would-have/3391128.html'; tags=@('grammar','modal-verbs','past','possibility','verbs','english-learning') }
  ,@{ slug='passive-modals'; url='/a/learning-passive-modals-it-can-be-done/4364766.html'; tags=@('grammar','modal-verbs','passive-voice','sentence-structure','verbs','english-learning') }
  ,@{ slug='many-uses-would'; url='/a/the-many-uses-of-would-in-everyday-speech/4455867.html'; tags=@('grammar','modal-verbs','would','conversation','politeness','english-learning') }
  ,@{ slug='preferences'; url='/a/how-to-talk-about-preferences/4605975.html'; tags=@('grammar','modal-verbs','preferences','conversation','politeness','english-learning') }
  ,@{ slug='modals-phone-calls'; url='/a/modal-verbs-and-phone-calls/6454154.html'; tags=@('grammar','modal-verbs','phone-calls','conversation','requests','english-learning') }
  ,@{ slug='under-below-beneath-underneath'; url='/a/under-below-beneath-and-underneath/4785334.html'; tags=@('grammar','prepositions','place','vocabulary','sentence-structure','english-learning') }
  ,@{ slug='excited-about-learning'; url='/a/what-are-you-excited-about-learning-/5306861.html'; tags=@('grammar','prepositions','learning','interests','conversation','english-learning') }
  ,@{ slug='two-word-prepositions'; url='/a/two-word-prepositions-in-voa-stories/5332890.html'; tags=@('grammar','prepositions','phrasal-phrases','writing','sentence-structure','english-learning') }
  ,@{ slug='when-not-to-use-to'; url='/a/when-not-to-use-the-word-to-/5539710.html'; tags=@('grammar','infinitives','prepositions','usage','sentence-structure','english-learning') }
  ,@{ slug='apologies-prepositions'; url='/a/apologies-and-prepositions/5843179.html'; tags=@('grammar','prepositions','apologies','politeness','conversation','english-learning') }
  ,@{ slug='writers-helpful-feedback'; url='/a/giving-writers-helpful-feedback-/6535732.html'; tags=@('writing','feedback','revision','communication','education','english-learning') }
  ,@{ slug='contrast-concession-writing'; url='/a/improve-writing-contrast-concession/3163659.html'; tags=@('writing','contrast','concession','connectors','essay-writing','english-learning') }
  ,@{ slug='fewer-words-say-more'; url='/a/use-fewer-words-but-say-more/4638445.html'; tags=@('writing','clarity','editing','word-choice','communication','english-learning') }
  ,@{ slug='polite-requests-email'; url='/a/making-polite-requests-in-email/6667153.html'; tags=@('writing','email','polite-requests','register','communication','english-learning') }
  ,@{ slug='polite-requests-email-part-two'; url='/a/making-polite-requests-in-email-part-2/6685275.html'; tags=@('writing','email','polite-requests','register','communication','english-learning') }
  ,@{ slug='harris-possessive'; url='/a/is-it-harris-or-harris-s-/7751232.html'; tags=@('grammar','possessives','punctuation','names','writing','english-learning') }
  ,@{ slug='discourse-markers'; url='/a/everyday-grammar-using-discourse-markers/3799169.html'; tags=@('grammar','discourse-markers','conversation','speaking','connectors','english-learning') }
  ,@{ slug='okay-meaning'; url='/a/everyday-grammar-ok/3808829.html'; tags=@('vocabulary','conversation','informal-english','expressions','meaning','english-learning') }
  ,@{ slug='you-know'; url='/a/everyday-grammar-you-know/4162343.html'; tags=@('vocabulary','conversation','fillers','informal-english','speaking','english-learning') }
  ,@{ slug='interjections'; url='/a/mmm-that-s-good-get-to-know-interjections/4537773.html'; tags=@('grammar','interjections','emotions','conversation','exclamations','english-learning') }
  ,@{ slug='road-signs-english'; url='/a/the-road-signs-of-english/4650241.html'; tags=@('vocabulary','idioms','directions','signs','expressions','english-learning') }
  ,@{ slug='diminutives'; url='/a/diminutives-make-many-things-smaller/4814152.html'; tags=@('grammar','word-formation','suffixes','nouns','meaning','english-learning') }
  ,@{ slug='of-course'; url='/a/the-ways-we-use-of-course-/4857530.html'; tags=@('vocabulary','conversation','expressions','politeness','meaning','english-learning') }
  ,@{ slug='practice-memory'; url='/a/the-more-i-practice-the-more-i-remember/4995040.html'; tags=@('learning','practice','memory','comparatives','grammar','english-learning') }
  ,@{ slug='intensifiers'; url='/a/what-are-intensifiers-/5276666.html'; tags=@('grammar','adverbs','intensifiers','descriptions','emphasis','english-learning') }
  ,@{ slug='grammar-cool'; url='/a/is-grammar-cool-/5296783.html'; tags=@('grammar','language','learning','questions','conversation','english-learning') }
  ,@{ slug='modifiers-science-writing'; url='/a/modifiers-in-science-writing-/6296865.html'; tags=@('grammar','modifiers','science','writing','adjectives','english-learning') }
  ,@{ slug='grammar-olympics'; url='/a/grammar-the-olympics-ordinal-numbers-expressions-of-surprise-/6432633.html'; tags=@('grammar','sports','ordinal-numbers','surprise','expressions','english-learning') }
  ,@{ slug='science-prefixes-measurements'; url='/a/grammar-for-science-technology-prefixes-measurements/7633826.html'; tags=@('grammar','science','technology','prefixes','measurements','english-learning') }
  ,@{ slug='hedging'; url='/a/it-s-kind-of-just-hedging/7689850.html'; tags=@('grammar','conversation','hedging','register','modifiers','english-learning') }
  ,@{ slug='indirect-questions'; url='/a/do-you-know-what-an-indirect-question-is/4439120.html'; tags=@('grammar','questions','indirect-questions','politeness','speaking','english-learning') }
  ,@{ slug='subject-questions'; url='/a/forming-questions-part-1-subject-questions/4550920.html'; tags=@('grammar','questions','subject-questions','word-order','speaking','english-learning') }
  ,@{ slug='yes-no-questions'; url='/a/forming-questions-part-2-yes-no-questions/4565799.html'; tags=@('grammar','questions','yes-no-questions','word-order','speaking','english-learning') }
  ,@{ slug='where-learned-english'; url='/a/where-did-you-learn-english-forming-questions-part-3-object-questions/4578531.html'; tags=@('grammar','questions','past-tense','learning','conversation','english-learning') }
  ,@{ slug='ask-clarification'; url='/a/how-to-ask-for-clarification/4726030.html'; tags=@('conversation','questions','clarification','politeness','speaking','english-learning') }
  ,@{ slug='short-yes-no-questions'; url='/a/short-form-yes-no-questions/4898081.html'; tags=@('grammar','questions','short-forms','conversation','speaking','english-learning') }
  ,@{ slug='question-words'; url='/a/everyday-grammar-question-words/5513164.html'; tags=@('grammar','questions','question-words','speaking','word-order','english-learning') }
  ,@{ slug='question-contractions'; url='/a/contractions-with-question-words-/6402013.html'; tags=@('grammar','questions','contractions','word-forms','speaking','english-learning') }
  ,@{ slug='sports-teams'; url='/a/talking-about-sports-teams/7575416.html'; tags=@('sports','teams','conversation','vocabulary','grammar','english-learning') }
  ,@{ slug='pow-whizz-onomatopoeia'; url='/a/everyday-grammar-pow-whizz-what-are-onomatopoeia/3018658.html'; tags=@('grammar','onomatopoeia','sounds','vocabulary','writing','english-learning') }
  ,@{ slug='who-makes-grammar-rules'; url='/a/who-makes-grammar-rules/3325780.html'; tags=@('grammar','language-change','rules','usage','communication','english-learning') }
  ,@{ slug='british-american-english'; url='/a/six-difference-between-britsh-and-american-english/3063743.html'; tags=@('vocabulary','dialects','British-English','American-English','language','english-learning') }
  ,@{ slug='old-grammar-rules'; url='/a/it-s-time-to-break-these-old-grammar-rules/4598241.html'; tags=@('grammar','language-change','usage','writing','rules','english-learning') }
  ,@{ slug='grammar-jeopardy'; url='/a/grammar-games-at-home-part-1-jeopardy/5345471.html'; tags=@('grammar','games','practice','questions','home-learning','english-learning') }
  ,@{ slug='tech-apps-grammar'; url='/a/tech-communication-apps-and-grammar/5397845.html'; tags=@('technology','communication','apps','grammar','writing','english-learning') }
  ,@{ slug='language-variation-us'; url='/a/language-variation-in-the-us/6589493.html'; tags=@('language','dialects','United-States','communication','culture','english-learning') }
  ,@{ slug='give-reasons'; url='/a/giving-reasons-/6486250.html'; tags=@('writing','reasons','connectors','opinions','communication','english-learning') }
  ,@{ slug='euphemisms'; url='/a/euphemisms/3950918.html'; tags=@('vocabulary','euphemisms','politeness','register','communication','english-learning') }
  ,@{ slug='physical-therapy-prevention'; url='/a/how-physical-therapists-can-prevent-future-health-problems/7921334.html'; tags=@('health','exercise','physical-therapy','prevention','wellness','english-learning') }
  ,@{ slug='daylight-saving-health'; url='/a/how-daylight-savings-time-affects-health/8001173.html'; tags=@('health','sleep','time','wellness','daily-life','english-learning') }
  ,@{ slug='adhd-cases-questions'; url='/a/rise-in-adhd-cases-raises-questions/7958876.html'; tags=@('health','attention','research','children','wellness','english-learning') }
  ,@{ slug='flowering-plants-gardeners'; url='/a/new-flowering-plants-for-gardeners-to-try/7983372.html'; tags=@('plants','gardening','nature','flowers','home','english-learning') }
  ,@{ slug='bad-air-quality-risk'; url='/a/how-to-reduce-risks-of-bad-air-quality/7980912.html'; tags=@('health','air-quality','environment','prevention','wellness','english-learning') }
  ,@{ slug='fruits-vegetables-garden'; url='/a/new-fruits-and-vegetables-for-gardeners-to-try/7983385.html'; tags=@('gardening','plants','food','nutrition','nature','english-learning') }
  ,@{ slug='computer-vision-trouble'; url='/a/experts-provide-tips-for-avoiding-computer-linked-vision-trouble/7953508.html'; tags=@('health','technology','vision','habits','wellness','english-learning') }
  ,@{ slug='device-muscle-strength'; url='/a/study-electrical-medical-device-helps-improve-muscle-strength-/7972394.html'; tags=@('health','technology','exercise','research','wellness','english-learning') }
  ,@{ slug='saying-no-work'; url='/a/saying-no-at-work-can-be-good-for-your-health/7945653.html'; tags=@('wellness','work','communication','boundaries','health','english-learning') }
  ,@{ slug='vegetables-preparation'; url='/a/what-is-the-healthiest-way-to-prepare-vegetables-/7967294.html'; tags=@('food','vegetables','nutrition','cooking','health','english-learning') }
  ,@{ slug='dementia-risk-middle-age'; url='/a/how-to-lower-your-risk-of-dementia-starting-in-middle-age/7937612.html'; tags=@('health','memory','aging','wellness','research','english-learning') }
  ,@{ slug='dementia-globally'; url='/a/dementia-a-growing-worldwide-health-problem/4941121.html'; tags=@('health','aging','memory','global-health','wellness','english-learning') }
  ,@{ slug='teens-substance-use'; url='/a/study-most-us-teens-do-not-drink-smoke/7906241.html'; tags=@('teens','health','research','choices','wellness','english-learning') }
  ,@{ slug='overgrown-garden'; url='/a/a-guide-to-recovering-overgrown-garden/7906323.html'; tags=@('gardening','plants','outdoors','nature','home','english-learning') }
  ,@{ slug='mini-horses-greece'; url='/a/mini-horses-in-greece-bring-joy-to-sick-disabled/7904925.html'; tags=@('animals','Greece','wellness','accessibility','community','english-learning') }
  ,@{ slug='new-us-food-guidelines'; url='/a/new-us-food-guidelines-eat-less-meat-more-beans-/7899072.html'; tags=@('food','nutrition','health','guidelines','choices','english-learning') }
  ,@{ slug='wintertime-meals'; url='/a/good-wintertime-meals-are-warm-healthy-and-tasty/7903502.html'; tags=@('food','cooking','winter','health','nutrition','english-learning') }
  ,@{ slug='winter-gardeners'; url='/a/winter-work-for-the-gardeners-/7900424.html'; tags=@('gardening','plants','winter','nature','home','english-learning') }
  ,@{ slug='deep-breathing-stress'; url='/a/deep-breathing-can-reduce-stress-anxiety/7871604.html'; tags=@('health','breathing','stress','wellness','habits','english-learning') }
  ,@{ slug='diabetes-worldwide'; url='/a/study-more-than-800-million-have-diabetes-worldwide-many-untreated/7869300.html'; tags=@('health','research','global-health','science','wellness','english-learning') }
  ,@{ slug='exercise-outdoors'; url='/a/group-helps-people-exercise-outdoors/7872994.html'; tags=@('exercise','outdoors','community','health','wellness','english-learning') }
  ,@{ slug='preventing-stroke'; url='/a/doctors-give-new-guidelines-for-preventing-stroke/7867936.html'; tags=@('health','prevention','guidelines','wellness','research','english-learning') }
  ,@{ slug='walking-effects'; url='/a/what-are-the-good-effects-of-walking-/7865636.html'; tags=@('walking','exercise','health','wellness','daily-life','english-learning') }
  ,@{ slug='bees-dogs-cancer'; url='/a/can-bees-dogs-identify-cancer-earlier-than-machines-/7861654.html'; tags=@('animals','science','research','health','technology','english-learning') }
  ,@{ slug='tropical-plants-winter'; url='/a/how-to-keep-tropical-plants-through-the-winter/7854261.html'; tags=@('plants','gardening','seasons','nature','home','english-learning') }
  ,@{ slug='feeling-down-winter'; url='/a/how-to-keep-from-feeling-down-in-the-winter/7854053.html'; tags=@('wellness','seasons','emotions','habits','health','english-learning') }
  ,@{ slug='protecting-bulbs-cold'; url='/a/protecting-bulbs-from-animals-and-cold-weather/7845393.html'; tags=@('gardening','plants','animals','weather','nature','english-learning') }
  ,@{ slug='how-hard-train'; url='/a/how-hard-should-you-train-/7823051.html'; tags=@('fitness','exercise','health','habits','wellness','english-learning') }
  ,@{ slug='brain-cleans-itself'; url='/a/study-how-the-brain-cleans-itself/7818127.html'; tags=@('science','brain','sleep','research','health','english-learning') }
  ,@{ slug='life-expectancy-limits'; url='/a/has-human-life-expectancy-reached-its-limit-/7817392.html'; tags=@('health','aging','research','society','science','english-learning') }
  ,@{ slug='adverb-adjective-conversation'; url='/a/adverbs-and-adjectives/3702382.html'; tags=@('grammar','adjectives','adverbs','conversation','register','english-learning') }
  ,@{ slug='good-nice-adjectives'; url='/a/everyday-grammar-good-and-nice-common-adjectives-many-uses/4056631.html'; tags=@('grammar','adjectives','word-choice','meaning','conversation','english-learning') }
  ,@{ slug='participial-adjectives'; url='/a/the-exciting-world-of-participial-adjectives/4489551.html'; tags=@('grammar','adjectives','participles','descriptions','word-forms','english-learning') }
  ,@{ slug='adjective-word-order'; url='/a/what-is-the-word-order-of-adjectives-/4775294.html'; tags=@('grammar','adjectives','word-order','descriptions','writing','english-learning') }
  ,@{ slug='be-adjective-infinitive'; url='/a/a-common-form-be-adjective-infinitive-/5284365.html'; tags=@('grammar','adjectives','infinitives','sentence-patterns','speaking','english-learning') }
  ,@{ slug='fiction-adjective-clauses'; url='/a/fiction-adjective-phrases-and-adjective-clauses/5419952.html'; tags=@('grammar','adjectives','clauses','fiction','writing','english-learning') }
  ,@{ slug='as-as-comparisons-one'; url='/a/part-1-making-comparison-with-as-as/5447902.html'; tags=@('grammar','adjectives','comparisons','sentence-patterns','speaking','english-learning') }
  ,@{ slug='as-as-comparisons-two'; url='/a/part-2-comparing-equal-amounts-with-as-as/5466442.html'; tags=@('grammar','adjectives','comparisons','quantities','sentence-patterns','english-learning') }
  ,@{ slug='adjectives-extreme'; url='/a/taking-adjectives-to-the-extreme/5630124.html'; tags=@('grammar','adjectives','intensifiers','emphasis','descriptions','english-learning') }
  ,@{ slug='news-breaking'; url='/a/why-is-the-news-always-breaking/5827030.html'; tags=@('vocabulary','adjectives','news','expressions','word-choice','english-learning') }
  ,@{ slug='describing-mornings'; url='/a/describing-your-day-mornings/6241274.html'; tags=@('adjectives','daily-life','routines','descriptions','morning','english-learning') }
  ,@{ slug='adjective-clauses-reason'; url='/a/a-reason-to-understand-adjective-clauses/5734619.html'; tags=@('grammar','adjectives','clauses','sentence-structure','writing','english-learning') }
  ,@{ slug='adverb-problems'; url='/a/beating-problems-with-adverbs-everyday-grammar/2843494.html'; tags=@('grammar','adverbs','adjectives','word-choice','speaking','english-learning') }
  ,@{ slug='amplifiers-downtoners'; url='/a/amplifiers-downtoners/3714862.html'; tags=@('grammar','adverbs','emphasis','conversation','modifiers','english-learning') }
  ,@{ slug='always-adverbs'; url='/a/everyday-grammar/3597426.html'; tags=@('grammar','adverbs','frequency','routines','sentence-structure','english-learning') }
  ,@{ slug='adverb-clauses'; url='/a/when-you-hear-an-adverb-clause-youll-know/4385222.html'; tags=@('grammar','adverbs','clauses','sentence-structure','writing','english-learning') }
  ,@{ slug='just-already-still-yet'; url='/a/four-adverbs-just-already-still-yet-/4618921.html'; tags=@('grammar','adverbs','time','meaning','word-choice','english-learning') }
  ,@{ slug='so-so-that'; url='/a/what-s-the-difference-so-and-so-that-/4627372.html'; tags=@('grammar','connectors','adverbs','purpose','sentence-structure','english-learning') }
  ,@{ slug='function-words-speech'; url='/a/function-words-in-everyday-speech-/6354435.html'; tags=@('grammar','function-words','speech','pronunciation','listening','english-learning') }
  ,@{ slug='demonstratives'; url='/a/grammar-demonstrative-pronouns-determiners/3347315.html'; tags=@('grammar','demonstratives','pronouns','determiners','writing','english-learning') }
  ,@{ slug='grammar-pronunciation'; url='/a/there-transformation-pronunciation-grammar/3559691.html'; tags=@('grammar','pronunciation','sentence-patterns','emphasis','speaking','english-learning') }
  ,@{ slug='starting-with-conjunctions'; url='/a/everyday-grammer-starting-sentences-with-conjunctions/3960264.html'; tags=@('grammar','conjunctions','writing','sentence-structure','connectors','english-learning') }
  ,@{ slug='word-the'; url='/a/everyday-grammar-the-reasons-for-the-word-the/4066317.html'; tags=@('grammar','articles','the','determiners','word-choice','english-learning') }
  ,@{ slug='ever-words'; url='/a/everyday-grammar-use-ever-words-whenever-you-like/4300264.html'; tags=@('grammar','pronouns','adverbs','ever-words','sentence-structure','english-learning') }
  ,@{ slug='whose'; url='/a/everyday-grammar-the-mysterious-word-whose-/4479936.html'; tags=@('grammar','pronouns','possessives','questions','word-choice','english-learning') }
  ,@{ slug='zero-article'; url='/a/what-is-the-zero-article-/4794387.html'; tags=@('grammar','articles','nouns','determiners','sentence-structure','english-learning') }
  ,@{ slug='if-whether-one'; url='/a/if-and-whether-part-1/5646993.html'; tags=@('grammar','conjunctions','conditionals','questions','sentence-structure','english-learning') }
  ,@{ slug='if-whether-two'; url='/a/if-and-whether-part-2/5667799.html'; tags=@('grammar','conjunctions','conditionals','questions','sentence-structure','english-learning') }
  ,@{ slug='but-common-word'; url='/a/but-a-small-common-and-important-word-/6598987.html'; tags=@('grammar','conjunctions','connectors','contrast','writing','english-learning') }
  ,@{ slug='autumn-adjectives'; url='/a/phrases-adjectives-determiners-to-describe-autumn/6249266.html'; tags=@('adjectives','seasons','autumn','descriptions','vocabulary','english-learning') }
  ,@{ slug='describing-midday'; url='/a/describing-your-day-midday-activities-/6253876.html'; tags=@('adjectives','daily-life','routines','descriptions','midday','english-learning') }
  ,@{ slug='describing-evening'; url='/a/describing-your-day-the-evening/6267836.html'; tags=@('adjectives','daily-life','routines','descriptions','evening','english-learning') }
)

$path = 'src\data\voa-library.json'
$existing = @(Get-Content -Raw -LiteralPath $path | ConvertFrom-Json)
while ($existing.Count -eq 1 -and $existing[0] -is [array]) { $existing = @($existing[0]) }
$urls = @{}
$ids = @{}
foreach ($item in $existing) { if ($item.id) { $ids[[string]$item.id] = $true }; $itemUrl = [string]$item.url; if (-not [string]::IsNullOrWhiteSpace($itemUrl)) { $urls[$itemUrl.TrimEnd('/').ToLowerInvariant()] = $true } }
$newItems = [System.Collections.Generic.List[object]]::new()

foreach ($candidate in $candidates) {
  $url = "$root$($candidate.url)"
  $normalized = $url.TrimEnd('/').ToLowerInvariant()
  if ($ids.ContainsKey("voa-article-$($candidate.slug)")) { Write-Output "SKIP · ID already imported · $url"; continue }
  if ($urls.ContainsKey($normalized)) { Write-Output "SKIP · already imported · $url"; continue }
  $html = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).Content
  $h1 = [regex]::Match($html, '(?is)<h1[^>]*>(.*?)</h1>')
  if (!$h1.Success) { throw "Missing title: $url" }
  $title = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($h1.Groups[1].Value, '<[^>]+>', ' '))).Trim()
  $bodyMatch = [regex]::Match($html, '<div class="wsw"\s*>')
  $bodyStart = if ($bodyMatch.Success) { $bodyMatch.Index } else { -1 }
  $bodyEnd = -1
  if ($bodyStart -ge 0) {
    $depth = 0
    foreach ($token in [regex]::Matches($html.Substring($bodyStart), '(?is)<div\b[^>]*>|</div>')) {
      if ($token.Value -match '^</div') { $depth-- } else { $depth++ }
      if ($depth -eq 0) { $bodyEnd = $bodyStart + $token.Index + $token.Length; break }
    }
  }
  if ($bodyStart -lt 0 -or $bodyEnd -le $bodyStart) { throw "Could not isolate article body: $url" }
  $body = $html.Substring($bodyStart, $bodyEnd - $bodyStart)
  $glossary = [regex]::Match($body, '(?i)Words in This Story|Words in This Stories|Vocabulary')
  if ($glossary.Success) { $body = $body.Substring(0, $glossary.Index) }
  $paragraphs = [System.Collections.Generic.List[string]]::new()
  foreach ($match in [regex]::Matches($body, '(?is)<p[^>]*>(.*?)</p>')) {
    $plain = [regex]::Replace($match.Groups[1].Value, '(?is)<(script|style)[^>]*>.*?</\1>', ' ')
    $plain = [regex]::Replace($plain, '(?i)<br\s*/?>', ' ')
    $plain = [System.Net.WebUtility]::HtmlDecode(([regex]::Replace($plain, '(?is)<[^>]+>', ' ')))
    $plain = [regex]::Replace($plain, '\s+', ' ').Trim()
    if ($plain -and $plain -notmatch '^(No media source|Direct link|Pop-out player|\d+:\d+)') { $paragraphs.Add($plain) }
  }
  $summary = $paragraphs -join "`n`n"
  $wordCount = ($summary -split '\s+' | Where-Object { $_ }).Count
  if ($wordCount -lt 150 -or $wordCount -gt 900) { Write-Output "HOLD · $title · $wordCount words"; continue }
  if ($summary -match '(?i)Reuters|Associated Press|Agence France-Presse|AP News') { Write-Output "HOLD · $title · third-party source mention"; continue }
  if ($summary -match '(?i)(suicid|self-harm|graphic|killed|murder|lyrics|song sings|song at the end)') { Write-Output "HOLD · $title · safety or third-party content"; continue }
  $descriptionMatch = [regex]::Match($html, '(?is)<meta name="description" content="([^"]+)"')
  $description = if ($descriptionMatch.Success) { [System.Net.WebUtility]::HtmlDecode($descriptionMatch.Groups[1].Value).Trim() } else { "A VOA Learning English lesson about $title." }
  $newItems.Add([ordered]@{
    id = "voa-article-$($candidate.slug)"
    title = $title
    kind = 'text'
    author = 'VOA Learning English'
    url = $url
    youtubeId = $null
    durationSecs = $null
    wordCount = $wordCount
    summary = $summary
    images = @()
    description = $description
    topicTags = @($candidate.tags)
    genre = 'expository'
    difficultyLevel = 'Intermediate'
    cefr = 'B1'
    ageBand = 'all'
    place = $null
    license = 'Public domain (VOA Learning English original text)'
    attribution = 'VOA Learning English; original article text, excluding third-party media and glossary.'
    needsReview = $false
  })
  $urls[$normalized] = $true
  Write-Output "SCREENED · $title · $wordCount words"
}

$all = [System.Collections.Generic.List[object]]::new()
foreach ($item in $existing) { $all.Add($item) }
foreach ($item in $newItems) { $all.Add($item) }
ConvertTo-Json -InputObject $all -Depth 25 | Set-Content -LiteralPath $path -Encoding utf8
Write-Output "Added $($newItems.Count) original VOA Learning English articles."
