/** Hand-authored event summaries and whole-chapter checks for book reading packs. */
export type ChapterSpec = {
  id: string;
  events?: string;
  upper?: string;
  predict: [string, string, string]; // real outcome, plausible alternative, plausible alternative
  check: [[string, string, string, string], [string, string, string, string], [string, string, string, string]];
  talk?: string;
};

export const chapterSpecs: ChapterSpec[] = [
  {
    id: 'book-jungle-1',
    events: 'A baby finds safety in a wolf cave|Mother Wolf refuses to give him to Shere Khan|Baloo speaks for Mowgli at the pack meeting|Bagheera’s gift helps the pack accept Mowgli|Mowgli learns from Baloo and Bagheera|Shere Khan turns younger wolves against Mowgli|Mowgli goes toward the village to find fire',
    upper: 'A baby enters the wolf cave despite Shere Khan|The wolf parents defend Mowgli before the pack|Baloo and Bagheera secure Mowgli’s place|Mowgli learns jungle life while the tiger waits|Bagheera warns Mowgli to find fire|Mowgli heads to the village between two homes',
    predict: ['The wolves accept the child, but he must seek fire', 'The tiger takes the child from the cave', 'The family returns and takes the child home'],
    check: [
      ['Why does the baby reach the wolves?', 'His family escapes a hunting tiger', 'Baloo brings him from the village', 'He follows Bagheera into the cave'],
      ['How does Mowgli become part of the pack?', 'Baloo promises help and Bagheera offers a bull', 'The tiger gives up his claim', 'The village asks the wolves to keep him'],
      ['Why does Mowgli go toward the village?', 'Bagheera tells him to find fire', 'He wants to leave his wolf family', 'He is searching for the tiger’s cubs'],
    ],
  },
  {
    id: 'book-jungle-2',
    events: 'Monkeys take Mowgli into the trees|They want him to teach them to build|Baloo and Bagheera ask Kaa for help|Kaa joins the rescue at the ruins|Kaa confuses the monkeys and frees Mowgli|Mowgli learns to listen to warnings',
    predict: ['Kaa helps the friends free Mowgli from the monkeys', 'Mowgli agrees to lead the monkeys', 'The monkeys bring Mowgli back themselves'],
    check: [
      ['Why do the monkeys take Mowgli?', 'They want him to teach them new skills', 'They want him to find Shere Khan', 'They think he stole their food'],
      ['Why do Baloo and Bagheera ask Kaa?', 'The monkeys fear him and he can reach the ruins', 'He knows the village people', 'He promises to pay the monkeys'],
      ['What does Mowgli understand afterward?', 'His curiosity put his friends in danger', 'The monkeys were following jungle law', 'Baloo wanted him to stay with Kaa'],
    ],
  },
  {
    id: 'book-jungle-3',
    events: 'Messua welcomes Mowgli into the village|Mowgli learns village ways but feels different|The tiger still plans to kill Mowgli|Mowgli and the wolves trap the tiger with cattle|Villagers fear Mowgli’s strange power|Mowgli returns to his wolf brothers',
    predict: ['Mowgli defeats the tiger but is driven from the village', 'The villagers help Mowgli join their council', 'The tiger becomes a protector of the cattle'],
    check: [
      ['Who gives Mowgli a home in the village?', 'Messua', 'Buldeo', 'Bagheera'],
      ['How does Mowgli stop Shere Khan?', 'He drives cattle into the valley with the wolves', 'He hides the tiger inside the village', 'He asks Buldeo to catch the tiger'],
      ['Why can Mowgli not remain in the village?', 'The people fear he used magic', 'Messua asks him to find food', 'The cattle will not obey him'],
    ],
  },
  {
    id: 'book-jungle-4',
    events: 'Kotick grows up different from other seals|He sees hunters kill seals on the beach|The adults refuse to leave their island|Kotick searches distant seas for safety|He finds a hidden beach people cannot reach|Other seals follow Kotick to the new home',
    predict: ['Kotick finds a hidden beach and leads the seals there', 'Kotick persuades the hunters to stop', 'The seals decide the old beach is safe'],
    check: [
      ['What makes Kotick search for a new home?', 'He sees hunters killing seals', 'He wants warmer water', 'His mother sends him to find fish'],
      ['Why is the hidden beach safer?', 'Rocks and difficult waves keep people away', 'Hunters promise not to visit', 'It has no other animals'],
      ['How do the other seals finally respond?', 'They follow Kotick and see the beach', 'They ask the hunters for permission', 'They move before Kotick returns'],
    ],
  },
  {
    id: 'book-alice-1',
    events: 'Alice notices a rabbit with a watch|She follows it down a deep hole|A tiny key opens a door to a garden|A drink makes Alice shrink|Cake makes Alice too tall for the door|Alice cries and fills the floor with tears|Each change creates another problem',
    upper: 'Alice follows a hurried rabbit|She lands among locked doors|A key reveals a garden beyond a small door|A drink makes her smaller but the key stays high|Food makes her too large again|Alice faces tears and confusing changes',
    predict: ['Alice changes size but still cannot enter the garden', 'The rabbit gives Alice the garden key', 'Alice returns home through the rabbit hole'],
    check: [
      ['Why does Alice enter the rabbit hole?', 'She follows a rabbit carrying a watch', 'Her sister sends her underground', 'She loses a golden key'],
      ['What stops Alice after she shrinks?', 'The key is on the table above her', 'The rabbit locks every door', 'The garden disappears'],
      ['How does Alice feel as her size changes?', 'Confused by the new problems', 'Proud that she solved everything', 'Angry with her sister'],
    ],
  },
  {
    id: 'book-alice-2',
    events: 'Alice swims through a pool of her own tears|A mouse and other animals join her|The dodo starts a strange race|Everyone wins and Alice gives sweets|Alice mentions her cat Dinah|The frightened animals leave Alice alone',
    predict: ['Alice makes new friends, then scares them by mentioning her cat', 'The mouse helps Alice reach the garden', 'The animals choose Dinah to lead the race'],
    check: [
      ['Where does Alice meet the animals?', 'In a pool made from her tears', 'Inside the rabbit’s house', 'At the garden gate'],
      ['How is the race decided?', 'The dodo says everyone has won', 'The mouse arrives first', 'Alice chooses the fastest bird'],
      ['Why do the animals leave Alice?', 'They are frightened when she talks about her cat', 'They are angry about the sweets', 'They want to find the rabbit'],
    ],
  },
  {
    id: 'book-alice-3',
    events: 'The dodo plans a race to dry everyone|The runners all receive the title of winner|Alice gives sweets as prizes|The mouse tells a hard-to-follow story|Alice praises her cat in front of mice|The animals leave and Alice reflects on her words',
    upper: 'The dodo begins a race with no clear rules|All the animals win and receive prizes|The mouse begins a story Alice struggles to follow|Alice’s talk of Dinah upsets the animals|Alice learns to consider others’ feelings',
    predict: ['Everyone wins the race, but Alice’s words drive the animals away', 'The mouse wins and leads Alice to the garden', 'The dodo cancels the race before it begins'],
    check: [
      ['Why does the dodo suggest a race?', 'The wet animals need to get dry', 'Alice wants to win a prize', 'The mouse challenges the rabbit'],
      ['What does Alice give the runners?', 'Small sweets from her pocket', 'A golden key', 'Pieces of cake'],
      ['Why does Alice end up alone?', 'She forgets that mice may fear her cat', 'She refuses to hear the mouse’s tale', 'She takes back everyone’s prizes'],
    ],
  },
  {
    id: 'book-alice-4',
    events: 'The White Rabbit mistakes Alice for Mary Ann|Alice grows too large for the house|Bill the lizard is sent down the chimney|Stones become cakes that make Alice shrink|Alice escapes and meets a huge puppy|She distracts the puppy and continues alone',
    predict: ['Alice shrinks, escapes the house, and avoids a puppy', 'The rabbit keeps Alice as his servant', 'Bill finds a way to make the house bigger'],
    check: [
      ['Why does Alice enter the little house?', 'The rabbit mistakes her for his servant', 'She knows a garden is inside', 'A puppy chases her through the door'],
      ['What lets Alice escape from the house?', 'A cake makes her small again', 'Bill opens a secret passage', 'The rabbit gives her a key'],
      ['How does Alice get past the puppy?', 'She distracts it with a stick', 'She feeds it the cakes', 'She hides in the chimney'],
    ],
  },
  {
    id: 'book-oz-1',
    events: 'A cyclone approaches Dorothy’s Kansas farm|The house lifts with Dorothy and Toto inside|They land in a bright new country|The house has killed a feared witch|Dorothy receives silver shoes and directions|She follows the yellow road to seek help',
    predict: ['A storm carries Dorothy to a strange land and she seeks a wizard', 'Dorothy hides safely in the farm shelter', 'Toto leads the family to another Kansas farm'],
    check: [
      ['Why is Dorothy inside the house during the cyclone?', 'She goes back for Toto', 'She cannot find her aunt', 'She is looking for silver shoes'],
      ['What does the fallen house do?', 'It kills the Wicked Witch of the East', 'It destroys the Emerald City', 'It blocks the yellow road'],
      ['What does Dorothy decide to do next?', 'Ask the Wizard how to get home', 'Stay with the Munchkins forever', 'Search for another cyclone'],
    ],
  },
  {
    id: 'book-oz-2',
    events: 'The Munchkins explain the witch and silver shoes|Dorothy asks how she can return to Kansas|They tell her about the Wizard and yellow road|The good Witch gives Dorothy a protective mark|Dorothy begins walking toward the Emerald City|She hopes the Wizard can help her go home',
    upper: 'The Munchkins explain why Dorothy has the shoes|Dorothy seeks a way home|The yellow road leads toward the Wizard|The good Witch protects and warns Dorothy|Dorothy leaves for the Emerald City',
    predict: ['A good witch protects Dorothy as she starts for the Wizard', 'Dorothy gives the shoes back to the Munchkins', 'The Munchkins take Dorothy directly to Kansas'],
    check: [
      ['Why are the Munchkins grateful to Dorothy?', 'Her house ended the wicked witch’s rule', 'She built them a new road', 'She found their lost dog'],
      ['What does the good Witch do before Dorothy leaves?', 'She gives a protective mark and advice', 'She takes the silver shoes', 'She sends a cyclone for Dorothy'],
      ['Why does Dorothy follow the yellow road?', 'It leads to the Wizard who may send her home', 'It leads to her old farm', 'It is the only safe place for Toto'],
    ],
  },
  {
    id: 'book-oz-3',
    events: 'Dorothy finds a speaking Scarecrow tied to a pole|She frees him and hears he wants a brain|He joins her journey to see the Wizard|The new friends share stories as they walk|They help each other through the wood|Both hope the Wizard can answer their wishes|Dorothy feels less lonely with a companion',
    upper: 'Dorothy discovers a speaking Scarecrow|She frees him and learns his wish|They decide to visit the Wizard together|Their different skills help on the road|Dorothy feels less alone as they continue|Both hope to find answers in the Emerald City',
    predict: ['Dorothy frees the Scarecrow and they travel together', 'The Scarecrow stays in the field guarding corn', 'The Wizard arrives and gives him a brain'],
    check: [
      ['Why does the Scarecrow need Dorothy’s help?', 'He is tied to a pole', 'He has lost the yellow road', 'He cannot find Toto'],
      ['What does the Scarecrow hope the Wizard will give him?', 'A brain', 'Silver shoes', 'A new farm'],
      ['How does the journey change for Dorothy?', 'She feels less lonely with a companion', 'She decides to return to Kansas alone', 'She stops trusting the road'],
    ],
  },
  {
    id: 'book-oz-4',
    events: 'The Scarecrow falls into holes in the rough road|They rest and compare their different needs|Dorothy describes Kansas and the cyclone|The Scarecrow tells how he was made|He wants brains after the crows mock him|They enter a dark forest and shelter in a cottage',
    predict: ['Dorothy and the Scarecrow reach a dark forest and shelter together', 'The Scarecrow leaves to guard the farmer’s corn', 'Dorothy returns to Kansas through the brook'],
    check: [
      ['Why does Dorothy keep helping the Scarecrow on the road?', 'He falls into holes he cannot see', 'He is hurt by every brick', 'He refuses to enter the forest'],
      ['What makes the Scarecrow wish for brains?', 'Crows know he cannot think like a person', 'Dorothy says he cannot eat', 'The farmer promises him a prize'],
      ['How do they spend the night?', 'Dorothy sleeps while the Scarecrow watches', 'They walk back to the farm', 'They sleep beside the brook'],
    ],
  },
  {
    id: 'book-peter-1',
    events: 'Peter visits the Darling nursery|Wendy helps him sew on his shadow|Peter describes Neverland and invites the children|Wendy weighs excitement against leaving home|She thinks about trusting an unexpected visitor|Wendy considers her brothers’ needs',
    predict: ['Peter invites the children away, but Wendy considers the risks', 'Peter stays to live with the Darling family', 'Nana leads Peter back to Neverland'],
    check: [
      ['Why does Peter enter the nursery?', 'He wants to hear Wendy’s stories', 'He is looking for Nana', 'He has come to find a map'],
      ['How does Wendy help Peter?', 'She sews his shadow back', 'She teaches him to fly', 'She hides him from the Lost Boys'],
      ['Why does Wendy pause before accepting his invitation?', 'She must think about home and her brothers', 'She dislikes all stories', 'She cannot see the island'],
    ],
  },
  {
    id: 'book-peter-2',
    events: 'Peter tells Wendy about the Lost Boys|He hopes she will tell them stories|Fairy dust and happy thoughts help them fly|Wendy chooses to leave with her brothers|She wonders what the Lost Boys need|Wendy remembers her family and keeps her promise open',
    upper: 'Peter explains life with the Lost Boys|He asks Wendy to become their storyteller|The children learn to fly|Wendy decides to leave the nursery|She wants to learn before making a promise',
    predict: ['Wendy flies away but will not promise to stay with the Lost Boys', 'Wendy sends Peter back alone', 'The Lost Boys arrive to live in the nursery'],
    check: [
      ['Why does Peter want Wendy in Neverland?', 'She can tell stories to the Lost Boys', 'She can repair his house', 'She knows where Captain Hook lives'],
      ['What helps the children fly?', 'Fairy dust and happy thoughts', 'The nursery window', 'Nana’s collar'],
      ['What does Wendy decide about caring for the Lost Boys?', 'She will learn their needs before promising', 'She will never speak to them', 'She has already agreed to stay forever'],
    ],
  },
  {
    id: 'book-peter-3',
    events: 'The children fly through the night|Peter warns them about pirates|Neverland comes into view below|Wendy realizes they depend on Peter|The siblings try to stay safe together|Wendy plans to ask questions and protect her brothers',
    predict: ['The children see Neverland, but Wendy worries about its dangers', 'Captain Hook welcomes them into a safe house', 'The children turn back before seeing the island'],
    check: [
      ['What danger does Peter describe?', 'Captain Hook and his pirates', 'A tiger in the sky', 'The Darling family dog'],
      ['Why do the children depend on Peter?', 'Only he knows the way to Neverland', 'He carries their food', 'He owns the only boat'],
      ['How does Wendy respond to the uncertain trip?', 'She keeps close to her brothers and plans ahead', 'She flies away by herself', 'She asks pirates for directions'],
    ],
  },
  {
    id: 'book-peter-4',
    events: 'Peter gives a strange direction over the sea|The long flight makes the children tired|Peter catches Michael when he falls|Wendy worries when Peter disappears again|They finally see Neverland and hear of pirates|Wendy watches over her brothers without Peter',
    predict: ['Peter saves Michael during the long flight, then leaves again', 'Michael lands safely on a passing ship', 'The children decide to sleep on the sea'],
    check: [
      ['What makes the flight difficult?', 'It lasts so long that the children grow cold and tired', 'The yellow road disappears', 'Toto follows the children'],
      ['How does Peter help Michael?', 'He catches him as he falls', 'He builds him a boat', 'He calls the Lost Boys to carry him'],
      ['Why is Wendy uneasy near Neverland?', 'Peter keeps leaving them to manage alone', 'Her brothers refuse to fly', 'She has lost their parents’ address'],
    ],
  },
  {
    id: 'book-sherlock-1',
    events: 'A king asks Holmes to find Irene’s photograph|Holmes watches Irene and stages a false fire|Irene discovers Holmes’s trick and follows him|She leaves a letter promising not to harm the king|Holmes asks for Irene’s portrait instead of a ring|Watson reflects on her clever choice',
    predict: ['Irene outwits Holmes but promises not to expose the king', 'Holmes burns the photograph inside her house', 'The king marries Irene to hide the photograph'],
    check: [
      ['Why does the king hire Holmes?', 'He fears Irene has a private photograph', 'His ring has been stolen', 'Irene has disappeared from London'],
      ['How does Holmes learn where the photograph is?', 'A false fire makes Irene run to its hiding place', 'Watson finds it in the garden', 'The king tells him her secret'],
      ['Why does Holmes admire Irene?', 'She recognizes his plan and protects herself', 'She gives him the king’s ring', 'She joins him as an assistant'],
    ],
  },
  {
    id: 'book-sherlock-2',
    events: 'Wilson describes a strange well-paid job|Holmes notices clues around Wilson’s shop|He realizes the job keeps Wilson away|Police catch Spaulding at a tunnel by the bank|Wilson understands how the job hid a crime',
    predict: ['The odd job hides a plan to tunnel into a bank', 'The League gives Wilson a permanent promotion', 'Wilson’s assistant is secretly his brother'],
    check: [
      ['Why is Wilson paid to copy words?', 'To keep him away while thieves dig a tunnel', 'To test his reading ability', 'To help the bank prepare records'],
      ['What clue makes Holmes examine the area?', 'The assistant’s dirty knees', 'A missing red wig', 'A letter from the king'],
      ['Who is Vincent Spaulding really?', 'The criminal John Clay', 'A bank guard', 'The League’s founder'],
    ],
  },
  {
    id: 'book-sherlock-3',
    events: 'Mary asks Holmes why Hosmer Angel vanished|Holmes studies Mary’s family and the odd courtship|Typed letters help expose a disguise|Her stepfather used the false fiancé to keep her money|Mary struggles to believe the explanation|Holmes cannot decide how Mary will live with the truth',
    upper: 'Mary explains the missing fiancé|Holmes notices strange details about her stepfather|The letters reveal that Hosmer was a disguise|Windibank hoped to keep Mary’s income|Mary finds the truth painful and chooses what to believe',
    predict: ['Holmes finds that Mary’s stepfather was the missing fiancé', 'Hosmer was trapped before the wedding', 'Mary’s fiancé had already married someone else'],
    check: [
      ['Why does Mary visit Holmes?', 'Her fiancé vanished before their wedding', 'Her father has lost his job', 'She cannot find a typed letter'],
      ['What was Windibank trying to keep?', 'The money Mary brought into the household', 'The king’s photograph', 'A tunnel under a bank'],
      ['Why is the solution hard for Mary?', 'It means someone she trusted deceived her', 'It means she must move abroad', 'It proves Holmes has no evidence'],
    ],
  },
  {
    id: 'book-sherlock-4',
    events: 'James is accused after his father dies|Holmes finds clues beyond their argument|John Turner admits the killing|Turner explains the pressure McCarthy put on him|Holmes sees why James was wrongly blamed|Careful evidence changes the first story',
    predict: ['Holmes finds that John Turner, not James, killed McCarthy', 'James confesses to killing his father', 'Alice discovers the murder weapon in her home'],
    check: [
      ['Why does Alice ask Holmes for help?', 'She believes James has been wrongly accused', 'She wants to leave the valley', 'She cannot find her father'],
      ['What caused the conflict between Turner and McCarthy?', 'McCarthy used an old crime to pressure Turner', 'They disagreed about a bank account', 'Turner wanted James to leave town'],
      ['What changes Holmes’s view of James?', 'The clues point beyond the father-son quarrel', 'James gives away the murder weapon', 'Watson says Alice is mistaken'],
    ],
  },
  {
    id: 'book-aesop-1',
    events: 'A lion catches a mouse that disturbed him|The mouse promises help and the lion lets it go|Hunters trap the lion in a net|The mouse cuts the ropes and frees him|The lion learns small creatures can help|Both animals have different useful strengths',
    predict: ['The mouse later frees the lion from a net', 'The mouse hides from the lion forever', 'The lion escapes by pulling the net apart'],
    check: [
      ['Why does the lion release the mouse?', 'He chooses to show mercy', 'He needs the mouse to find food', 'The hunters frighten him away'],
      ['How does the mouse help the lion?', 'It gnaws through the net', 'It calls the other lions', 'It opens a cage door'],
      ['What changes in the lion’s thinking?', 'He sees that a small animal can be useful', 'He decides never to sleep', 'He fears every mouse'],
    ],
  },
  {
    id: 'book-aesop-2',
    events: 'A wolf accuses a lamb of muddying water|The lamb explains why that is impossible|The wolf invents another accusation|The wolf ignores reasonable answers|The wolf uses power rather than evidence|The fable asks readers to notice unfair excuses',
    upper: 'A wolf wants an excuse to attack a lamb|The lamb answers the first false accusation|The wolf changes his story again|The wolf has already decided to attack|The lamb’s careful answers cannot change his decision',
    predict: ['The wolf keeps inventing excuses despite the lamb’s answers', 'The wolf accepts the lamb’s explanation', 'The lamb discovers it really muddied the stream'],
    check: [
      ['Why can the lamb not muddy the wolf’s water?', 'It is drinking downstream', 'It has not entered the water', 'The wolf drinks from another stream'],
      ['What does the wolf do when one claim fails?', 'He invents another accusation', 'He apologizes to the lamb', 'He asks another animal to decide'],
      ['What makes the wolf’s argument unfair?', 'He ignores evidence because he wants to attack', 'He cannot hear the lamb', 'He has forgotten where he lives'],
    ],
  },
  {
    id: 'book-aesop-3',
    events: 'An ass admires a grasshopper’s song|It decides dew must make the song beautiful|The ass eats only dew and becomes weak|It learns that different bodies need different food|Copying success without thought can be harmful|The ass needs to understand its own needs',
    upper: 'The ass admires a grasshopper’s song|It copies the grasshopper’s diet of dew|The ass grows weak without enough food|It learns that different animals have different needs|The fable warns against copying without thought',
    predict: ['The ass grows weak because dew is not enough food', 'The ass learns to sing like the grasshopper', 'The grasshopper teaches the ass another song'],
    check: [
      ['Why does the ass eat only dew?', 'It thinks dew makes the grasshopper sing well', 'It cannot find grass', 'The grasshopper orders it to'],
      ['What happens to the ass?', 'It becomes weak', 'It sings beautifully', 'It turns into a grasshopper'],
      ['What did the ass fail to consider?', 'Its body needs more food than a grasshopper’s', 'Dew is difficult to find', 'The grasshopper dislikes singing'],
    ],
  },
  {
    id: 'book-aesop-4',
    events: 'A bone sticks in a wolf’s throat|A crane agrees to remove it for a reward|The crane removes the bone safely|The wolf refuses to pay the promised reward|The crane learns that promises depend on character',
    upper: 'The wolf needs help with a bone in his throat|The crane removes it after a promise of payment|The wolf says escaping his mouth is reward enough|The crane sees that the wolf broke his promise|The crane leaves safely with a hard lesson|A promise is valuable only if someone keeps it',
    predict: ['The crane saves the wolf, but he refuses to pay', 'The wolf pays the crane twice the reward', 'The crane decides to leave the bone in place'],
    check: [
      ['Why does the wolf call the crane?', 'Its long beak can reach the bone', 'It can bring a doctor', 'It knows where the wolf’s food is'],
      ['What does the wolf say after the rescue?', 'Leaving his mouth alive is reward enough', 'He has lost the promised reward', 'The crane should return tomorrow'],
      ['What does the crane learn?', 'A dangerous person may not keep a promise', 'Wolves never swallow bones', 'Helping others is always wrong'],
    ],
  },
  {
    id: 'book6-treasure-island-1',
    predict: ['Jim discovers a treasure map among Billy’s papers', 'Billy leaves Jim a ship', 'The pirates take Jim to their island'],
    check: [
      ['Why do pirates search Billy’s room?', 'They want a packet in his papers', 'They want the inn’s money', 'They want Dr. Livesey'],
      ['What does Jim take to Livesey and Trelawney?', 'Captain Flint’s treasure map', 'Billy’s medicine', 'Pew’s walking stick'],
      ['How does Jim differ from Trelawney?', 'Jim notices danger while Trelawney is excited', 'Jim refuses to sail', 'Trelawney has met Flint'],
    ],
  },
  {
    id: 'book6-treasure-island-2',
    predict: ['Jim overhears Silver planning a mutiny', 'Silver warns Jim of a hidden storm', 'The captain gives Silver command'],
    check: [
      ['Why does Smollett move the weapons?', 'He worries about the crew and their knowledge', 'The ship is too heavy', 'Silver has asked him to'],
      ['Where does Jim hear Silver’s plan?', 'Inside an apple barrel', 'In the captain’s cabin', 'At the inn'],
      ['Why do the loyal passengers prepare quietly?', 'An open fight could let the pirates seize the ship', 'They want to surprise Trelawney', 'They are waiting for another ship'],
    ],
  },
  {
    id: 'book6-treasure-island-3',
    predict: ['Jim survives an attack and moves the ship', 'Jim gives Silver the map', 'Ben Gunn sails home alone'],
    check: [
      ['What shows Jim that the mutiny is deadly?', 'Silver kills a sailor who refuses to join', 'The ship runs aground', 'Ben Gunn steals the map'],
      ['Who has lived alone on the island?', 'Ben Gunn', 'Israel Hands', 'Captain Smollett'],
      ['Why does Jim leave the stockade?', 'He hopes to move the ship away from the pirates', 'He wants to join Silver', 'He is searching for food'],
    ],
  },
  {
    id: 'book6-treasure-island-4',
    predict: ['Ben Gunn has already moved the treasure', 'Silver finds the gold under the map mark', 'Jim gives the treasure to the pirates'],
    check: [
      ['What happens when the pirates reach the marked place?', 'They find that the treasure is gone', 'They find Flint waiting there', 'They uncover a new ship'],
      ['How does Silver treat Jim?', 'He sometimes protects Jim and sometimes threatens him', 'He always helps Jim escape', 'He never speaks to Jim'],
      ['What remains with Jim after the voyage?', 'Memories of violence despite his new wealth', 'A wish to join the pirates', 'The lost map'],
    ],
  },
  {
    id: 'book6-time-machine-1',
    predict: ['The traveller’s machine vanishes in the distant future', 'His guests destroy the machine', 'He finds people like those in London'],
    check: [
      ['What does the Time Traveller demonstrate to his guests?', 'A small model of a time machine', 'A map of the future', 'A new kind of clock'],
      ['How do the Eloi first seem to him?', 'Gentle but weak and careless', 'Dangerous and heavily armed', 'Identical to his guests'],
      ['What prevents his immediate return?', 'The machine disappears', 'He forgets the year', 'His guests close the door'],
    ],
  },
  {
    id: 'book6-time-machine-2',
    predict: ['The traveller suspects another people live near the Eloi', 'Weena finds and repairs the machine', 'The Eloi explain every danger to him'],
    check: [
      ['Why does Weena become close to the traveller?', 'He rescues her from a river', 'He gives her his machine', 'He teaches her to read'],
      ['What do the Eloi fear?', 'Darkness', 'Rain', 'Travellers'],
      ['What does the traveller see at night?', 'A white shape that disappears into a well', 'A ship leaving the garden', 'His guests looking for him'],
    ],
  },
  {
    id: 'book6-time-machine-3',
    predict: ['The traveller finds Morlocks and must protect Weena', 'The Eloi build a second machine', 'The Morlocks invite him home'],
    check: [
      ['Who maintains the underground machines?', 'The Morlocks', 'The Eloi', 'The traveller’s guests'],
      ['Where does the traveller find his machine?', 'Behind a locked door', 'Under a river', 'In Weena’s home'],
      ['Why does he use fire?', 'To defend himself against the Morlocks', 'To power the time machine', 'To signal his guests'],
    ],
  },
  {
    id: 'book6-time-machine-4',
    predict: ['The traveller returns home but later disappears again', 'Weena returns with him', 'His guests travel together into the future'],
    check: [
      ['What happens to Weena during the escape?', 'She is lost in the fire and confusion', 'She boards the machine', 'She leads the Morlocks away'],
      ['What does the traveller see in a far future age?', 'A dim world with a swollen sun', 'A new city of Eloi', 'His own house unchanged'],
      ['Why does the narrator still wonder at the end?', 'The traveller leaves again and never returns', 'The machine was never built', 'Weena writes a letter'],
    ],
  },
  {
    id: 'book6-frankenstein-1',
    predict: ['Victor creates a living being and flees from it', 'Walton discovers a new country', 'Elizabeth builds a machine with Victor'],
    check: [
      ['Who hears Victor’s account on an Arctic ship?', 'Robert Walton', 'Henry Clerval', 'William'],
      ['What does Victor pursue as a student?', 'The secret of giving life to a body', 'A route to the Arctic', 'A way to heal Elizabeth'],
      ['How does Victor react when his creation lives?', 'He is frightened and abandons it', 'He introduces it to his family', 'He immediately teaches it language'],
    ],
  },
  {
    id: 'book6-frankenstein-2',
    predict: ['Victor stays silent while Justine is wrongly condemned', 'The creature admits the murder at once', 'Justine escapes with Henry'],
    check: [
      ['What news brings Victor back to Geneva?', 'His brother William has been murdered', 'Walton has returned from the Arctic', 'Elizabeth has left home'],
      ['Why does Victor suspect the creature?', 'He sees it near where William died', 'It sends him a confession', 'Justine identifies it'],
      ['What is Victor’s failure during Justine’s trial?', 'He does not reveal his suspicions', 'He hides the missing picture', 'He refuses to return home'],
    ],
  },
  {
    id: 'book6-frankenstein-3',
    predict: ['Victor destroys the companion he started making', 'The creature leaves with a new friend', 'The family in the cottage adopts the creature'],
    check: [
      ['How does the creature learn about people?', 'By watching a family near its shelter', 'By attending Victor’s school', 'By travelling with Walton'],
      ['What does it ask Victor to make?', 'A companion who could share its life', 'A larger laboratory', 'A ship to the Arctic'],
      ['Why does Victor destroy the unfinished companion?', 'He fears two beings might cause harm', 'He has lost his tools', 'Elizabeth asks him to stop'],
    ],
  },
  {
    id: 'book6-frankenstein-4',
    predict: ['Victor dies while pursuing the creature, and Walton turns home', 'Victor and the creature reconcile in Geneva', 'Walton reaches his destination'],
    check: [
      ['Who is killed on Victor’s wedding night?', 'Elizabeth', 'Walton', 'Justine'],
      ['Why does Walton turn his ship back?', 'The crew asks to return to safety', 'He has found the creature', 'The ship has reached Geneva'],
      ['How does the creature react to Victor’s death?', 'It mourns him', 'It celebrates with the sailors', 'It asks Walton to create another being'],
    ],
  },
  {
    id: 'book6-call-of-wild-1',
    predict: ['Buck is taken from his comfortable home and learns harsh new rules', 'Buck chooses to leave the ranch by himself', 'Judge Miller sends Buck to school'],
    check: [
      ['Where does Buck live before he is taken?', 'Judge Miller’s ranch', 'A northern camp', 'John Thornton’s cabin'],
      ['Why do the men want Buck?', 'They need strong dogs for the gold rush', 'They want to show him at a fair', 'They need a guard for the ranch'],
      ['What does the man in the red sweater teach Buck?', 'Resisting him brings pain', 'All people can be trusted', 'He should stop watching others'],
    ],
  },
  {
    id: 'book6-call-of-wild-2',
    predict: ['Buck defeats Spitz and becomes the lead dog', 'Spitz gives Buck his place willingly', 'Buck returns to the ranch'],
    check: [
      ['How does Buck keep warm in the snow?', 'He curls up in it', 'He sleeps inside the sled', 'He follows the drivers indoors'],
      ['Who challenges Buck in the team?', 'Spitz', 'Thornton', 'Judge Miller'],
      ['What changes after Buck defeats Spitz?', 'Buck takes the lead position', 'The team stops travelling', 'The drivers send Buck home'],
    ],
  },
  {
    id: 'book6-call-of-wild-3',
    predict: ['Thornton saves Buck before the sled breaks through ice', 'The owners finally let the dogs rest', 'Buck leads the team across the ice'],
    check: [
      ['What is wrong with the team’s new owners?', 'They demand too much and run short of food', 'They refuse to travel at all', 'They know the ice too well'],
      ['Why does Thornton intervene?', 'The owners try to force an exhausted Buck onward', 'Buck has stolen his supplies', 'He wants to buy the whole team'],
      ['What pulls Buck in two directions afterward?', 'Loyalty to Thornton and a call from the wild', 'A wish to return to Spitz and the ranch', 'Fear of all other dogs'],
    ],
  },
  {
    id: 'book6-call-of-wild-4',
    predict: ['After Thornton dies, Buck joins the wolves', 'Buck returns to Judge Miller', 'Thornton follows Buck into the forest'],
    check: [
      ['What does Buck find when he returns to camp?', 'Thornton and his companions have been killed', 'The sled team is waiting', 'His old ranch family has arrived'],
      ['What does Buck do after losing Thornton?', 'He joins the wolves', 'He stays at the empty camp', 'He follows another gold seeker'],
      ['How does the story describe his change?', 'It grows from many experiences and choices', 'It happens suddenly in one moment', 'It erases his memory of Thornton'],
    ],
  },
  {
    id: 'book6-around-world-1',
    predict: ['Fogg begins his journey and rescues Aouda despite the delay', 'Fix arrests Fogg in India', 'Fogg ends his wager before leaving London'],
    check: [
      ['What does Fogg wager?', 'He can travel around the world in eighty days', 'He can build a railway in India', 'He can find the bank robber'],
      ['Why does Fix follow Fogg?', 'He suspects Fogg of a bank robbery', 'He hopes to win the wager', 'He is Aouda’s relative'],
      ['How do the travellers cross an unfinished railway section?', 'They hire an elephant', 'They build new tracks', 'They return to London'],
    ],
  },
  {
    id: 'book6-around-world-2',
    predict: ['Passepartout is separated from Fogg and Aouda', 'Fogg gives up the wager in Calcutta', 'Fix tells Fogg his true purpose'],
    check: [
      ['What delays the group in Calcutta?', 'A case about Passepartout entering a temple', 'A broken elephant', 'A storm at sea'],
      ['Why does Aouda continue with Fogg?', 'The relative they sought has moved away', 'She wants to follow Fix', 'She owns the next ship'],
      ['What happens to Passepartout?', 'He boards a ship alone after being separated', 'He returns to India', 'He finds the bank robber'],
    ],
  },
  {
    id: 'book6-around-world-3',
    predict: ['Fogg risks losing time to rescue Passepartout', 'Fogg refuses to stop for Passepartout', 'Fix finally arrests Fogg on the train'],
    check: [
      ['Where is the group travelling by train?', 'Across the United States', 'Across India', 'Across England'],
      ['What happens to Passepartout during an attack?', 'He is taken away', 'He escapes with Fix', 'He wins the wager'],
      ['Why does Fogg turn back?', 'To rescue Passepartout', 'To find a faster train', 'To avoid Aouda'],
    ],
  },
  {
    id: 'book6-around-world-4',
    predict: ['Fogg discovers he gained a day and wins the wager', 'Fix proves Fogg was the robber', 'Aouda decides to leave Fogg'],
    check: [
      ['Why is Fogg released after Fix arrests him?', 'The real bank robber has been caught', 'Fix loses the warrant', 'Passepartout pays a fine'],
      ['What does Aouda ask Fogg?', 'To marry her', 'To repeat the journey', 'To take her to India'],
      ['How has travelling east affected their date?', 'They gained a day', 'They lost a month', 'They stayed on the same date'],
    ],
  },
  {
    id: 'book6-secret-garden-1',
    predict: ['Mary finds a buried key and wonders about the locked garden', 'Mary’s uncle opens the garden for her', 'Martha tells Mary to return to India'],
    check: [
      ['Why is Mary sent to her uncle’s house?', 'Her parents die after a sickness', 'She asks to visit the moor', 'Her school closes'],
      ['Who speaks plainly to Mary about life outside?', 'Martha', 'Colin', 'Dickon'],
      ['What makes Mary curious about the garden?', 'She finds a key near its locked wall', 'She receives a letter from her uncle', 'A gardener gives her a map'],
    ],
  },
  {
    id: 'book6-secret-garden-2',
    predict: ['Mary begins restoring the garden and meets Colin', 'The robin destroys the garden key', 'Mary’s uncle closes the garden again'],
    check: [
      ['How does Mary find the garden door?', 'She follows a robin', 'Dickon shows her a map', 'Colin sends her there'],
      ['Who helps Mary care for the plants?', 'Dickon', 'Her uncle', 'Robert Walton'],
      ['What does Colin believe about his health?', 'He will never walk', 'He can run across the moor', 'He has no reason to rest'],
    ],
  },
  {
    id: 'book6-secret-garden-3',
    predict: ['Colin visits the garden and gains confidence with the others', 'Colin refuses to leave his room', 'Mary closes the garden forever'],
    check: [
      ['What does Mary share with Colin?', 'The secret of the garden', 'A letter from India', 'A railway timetable'],
      ['What does Dickon help Colin notice?', 'Birds, plants, and changes in the soil', 'Hidden treasure', 'A locked room in the house'],
      ['How does Mary change?', 'She becomes more ready to share and help', 'She decides never to visit Colin', 'She stops caring about the garden'],
    ],
  },
  {
    id: 'book6-secret-garden-4',
    predict: ['Colin’s father returns and sees him standing in the garden', 'Colin leaves without seeing his father', 'Mary returns to India before the reunion'],
    check: [
      ['Why does Colin’s father avoid the manor?', 'It reminds him of his wife’s death', 'He is working on a ship', 'He fears the garden key'],
      ['What brings him back?', 'A dream and a letter from his brother', 'A message from Fix', 'A promise to Dickon'],
      ['What surprises him in the garden?', 'Colin can stand and move confidently', 'The garden has been sold', 'Mary has locked the door'],
    ],
  },
];
