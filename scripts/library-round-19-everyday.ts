import { parseWritingBlocks } from './library-round-19-overrides';

export const everydayWriting = parseWritingBlocks(`
Cooking
L=A sharp smell can tell us food is ready.|A cook tastes a dish before serving it.|Clean tools help keep a kitchen safe.
H=Cooking joins careful preparation with choices about flavor and texture.|The same vegetable can taste different when steamed or roasted.|A recipe provides a starting point, but cooks often adjust it.
V=ingredient~A food used to make a dish|recipe~Instructions for preparing food|chop~To cut food into small pieces~I would chop the carrots.|stir~To move food around with a spoon~I would stir the soup.|seasoning~Something added to change flavor~A little seasoning could help.|simmer~To cook gently below boiling~The soup can simmer slowly.|taste~To try a small amount of food~I would taste the sauce first.
S=I would stir the soup slowly.|A carrot could make it sweeter.|I like cooking with my family.|I would wash the vegetables first.|My meal might smell wonderful.|I want to try a new spice.
T=If I cooked for friends, I would ask what they enjoy eating.|I would rather learn one flexible recipe than memorize ten fixed ones.|A small taste could help me decide what the dish needs.|I think cleaning as I cook makes the meal calmer.|I wonder how roasting changes the flavor of carrots.|I would invite someone else to choose the final seasoning.

Baking
L=A warm oven makes dough change.|Bread can grow larger before it goes inside.|A baked loaf has a firm crust.
H=Yeast releases gas that forms bubbles inside rising dough.|The oven's heat sets that airy structure in place.|Bakers balance wet and dry ingredients to control texture.
V=dough~A soft mixture used before baking|yeast~A tiny organism that makes dough rise~Yeast can make bread fluffy.|crust~The firm outside of baked bread~I like a crunchy crust.|knead~To press and fold dough repeatedly~I would knead the dough.|bubbles~Small pockets of gas~Bubbles can make bread light.|loaf~One shaped piece of bread~Our loaf could smell delicious.|oven~A heated box used to bake food
S=I would bake a small loaf.|The dough might stick to my hands.|I like the smell of warm bread.|I would wait for the timer.|A crust can make a crunch.|I want to knead the dough.
T=If my bread failed to rise, I would check the yeast and the warmth.|I would rather bake with a friend than follow a recipe alone.|A crisp crust and soft middle would be my perfect loaf.|I wonder how changing the flour would affect texture.|Waiting for dough to rise might teach me patience.|I would share the first warm slice with someone else.

Fruits
L=A fruit can taste sweet or sour.|Some fruits have one big stone inside.|Others hold many tiny seeds.
H=Fruit forms around seeds after a flower develops.|Color and smell can help animals find ripe fruit.|Different climates support different kinds of fruit trees.
V=peel~The outer skin of a fruit~I would peel an orange.|pulp~The soft inside of many fruits~The fruit pulp might be juicy.|stone~A hard seed inside some fruits~I would avoid biting the stone.|berry~A small juicy fruit~I like a sweet berry.|ripe~Ready to eat~A ripe banana smells sweet.|orchard~A place where fruit trees grow~I would visit an orchard.|juice~Liquid pressed from fruit~My cup of juice could be cold.
S=I would choose a sweet peach.|A sour fruit makes my face change.|I like fruit with a crunchy bite.|I would wash it first.|A berry could stain my fingers.|I want to try a new fruit.
T=If I visited an orchard, I would ask how growers know fruit is ready.|I would rather taste a new fruit than judge it by color.|A sour flavor can be as enjoyable as a sweet one.|I wonder which fruit travels well without getting bruised.|I would compare the seeds inside two very different fruits.|Fresh fruit and cooked fruit can feel like different foods.

Vegetables
L=We eat many different plant parts.|A potato grows below the soil.|A pea grows inside a pod.
H=Roots, stems, leaves, and flowers all appear on dinner plates.|Heating can soften a vegetable or bring out sweetness.|A garden offers a useful way to see where food begins.
V=root vegetable~A vegetable grown for its underground root~I would pull up a root vegetable.|leafy greens~Vegetables eaten for their leaves~I would wash leafy greens.|pod~A case holding seeds~A pea pod can open easily.|stem~The plant part holding leaves up~I could eat a crunchy stem.|roast~To cook with dry heat~I would roast the carrots.|garden bed~A small planted area~My garden bed could grow lettuce.|crunchy~Making a crisp sound when bitten~I like crunchy vegetables.
S=I would grow a carrot.|A pea pod could open in my hand.|I like crunchy cucumber slices.|I would taste a cooked pepper.|My garden might need more space.|I could help wash the leaves.
T=If I grew vegetables, I would start with something easy to observe.|I would rather roast a carrot than eat it raw.|A pea pod makes the plant's seeds easy to see.|I wonder which part of a plant tastes best in soup.|A school garden could make lunch more interesting.|I would compare how the same vegetable tastes before and after cooking.

Breakfast
L=Morning food can be warm or cold.|Some families eat together before school.|A quick meal can still feel special.
H=Breakfast traditions vary with climate, work routines, and available foods.|A morning meal can mix grains, fruit, and protein.|There is no single breakfast that suits every person.
V=porridge~Soft grains cooked in liquid~I would try warm porridge.|toast~Bread browned by heat~My toast could be crisp.|cereal~A grain food often eaten in the morning~I might choose cereal.|morning meal~Food eaten early in the day~Our morning meal could be simple.|grain~A seed used as food~Oats are one grain.|protein~A nutrient used to build and repair bodies~Breakfast can include protein.|lunchbox~A box for carrying food~I could pack breakfast in a lunchbox.
S=I would eat warm toast.|A banana makes my breakfast easy.|I like sitting with my family.|My morning meal might be quick.|I would try food from another country.|I want a drink of water too.
T=If I had an early start, I would prepare breakfast the night before.|I would rather have a slow family meal than eat while traveling.|A breakfast from another culture could give me a new favorite.|I wonder why some people prefer savory morning food.|I think a useful breakfast should fit a person's day.|Sharing breakfast can make the morning less rushed.

School Lunch
L=Lunch time gives a break from lessons.|Friends can sit and talk together.|A lunchbox keeps food in one place.
H=School meals reflect local food customs and kitchen resources.|A clear lunch routine helps students eat without rushing.|Students may need different options for allergies or other needs.
V=lunchbox~A container used to carry a meal~My lunchbox could hold fruit.|cafeteria~A room where school meals are served~I would find a seat in the cafeteria.|tray~A flat object for carrying dishes~My lunch tray could hold fruit.|packed lunch~A meal brought from home~I might bring a packed lunch.|allergy~A body reaction to a particular food~An allergy may change lunch choices.|menu~A list of meals offered~I would check the lunch menu.|leftovers~Food remaining after a meal~I could pack leftovers tomorrow.
S=I would sit with a new classmate.|My lunchbox could hold fruit.|I like a quiet lunch table.|I might try a new soup.|A friend could share a story.|I would drink water with lunch.
T=If I planned a school menu, I would ask students what they enjoy.|I would rather have enough time to eat than a larger dessert.|A friendly lunch table can help someone feel included.|I wonder how schools handle different food allergies.|I think students should know what is in their meals.|Packing leftovers could save time on a busy morning.

Caring for Pets
L=A pet needs care even on busy days.|Its bowl should be clean.|A quiet corner can help it rest.
H=Pet care depends on the animal's species and individual habits.|Regular routines make feeding and exercise easier to remember.|A family should agree on responsibilities before bringing an animal home.
V=feeding~Giving an animal suitable food~I would help with feeding time.|grooming~Cleaning and brushing an animal~I would help with grooming.|water bowl~A dish holding water for a pet~The water bowl needs cleaning.|leash~A line used to guide a dog~I would carry the leash.|vet~A doctor who cares for animals~I would ask a vet for advice.|bedding~Material making a soft resting place~My pet's bedding could be washable.|routine~A regular way of doing daily tasks~A pet routine helps my family.
S=I would fill the water bowl.|A pet might need a quiet bed.|I like brushing soft fur.|I would ask an adult for help.|My family could share pet jobs.|I want my pet to feel safe.
T=If I wanted a pet, I would first learn what that species needs.|A shared family plan seems fairer than one child doing everything.|I would rather buy good food than a fancy toy.|A quiet resting space matters when the house is noisy.|I wonder how a pet shows that it is uncomfortable.|A vet's advice could change the way I care for an animal.

School Day
L=A bell may tell students when to move.|Some lessons need books, others need art tools.|A short break can refresh everyone.
H=A school timetable divides learning into different kinds of work.|Transitions between classes can shape how calm the day feels.|Students may learn better when they have time to move and talk.
V=timetable~A plan showing when lessons happen~I would check the timetable.|bell~A sound marking a change at school~I heard the school bell.|lesson~A period for learning|break time~A short rest between activities~I would play at break time.|subject~An area of study at school|classroom~A room where students learn|assembly~A gathering of students and teachers~I would sit with my class at assembly.
S=I would start with art.|A break gives me time to run.|I like reading with a friend.|My classroom could have plants.|The bell might make me hurry.|I would pack my bag early.
T=If I planned a school day, I would place a movement break between long lessons.|I would rather begin with a difficult subject while my mind is fresh.|A calm transition can make the next class easier.|I wonder whether shorter lessons help some students focus.|The timetable should leave time for questions, not only answers.|I would ask classmates which part of the day feels rushed.

Classroom Rules
L=Rules can help quiet students speak.|A turn lets one person finish an idea.|A class can change a rule that fails.
H=Useful rules describe actions students can actually practice.|Fairness does not always mean everyone needs the same support.|A class works better when students understand the reason for a rule.
V=take turns~To let people act one after another~We can take turns speaking.|interrupt~To speak before another person finishes~I would not interrupt my friend.|raise a hand~To signal a wish to speak~I would raise a hand.|fairness~Care in treating people justly~Fairness matters in our class.|agreement~A choice accepted by a group~Our agreement could help everyone.|quiet signal~A sign asking for less noise~We could invent a quiet signal.|respect~Care for others and their choices~I would show respect by listening.
S=I would wait for my turn.|A quiet friend needs time to speak.|I like rules that make games fair.|I could help make one class rule.|A kind voice helps everyone.|I would listen before answering.
T=If we wrote our own rules, I would ask why each one matters.|I would rather have a few clear agreements than a long list.|A quiet signal could help without embarrassing anyone.|I think fairness means noticing different needs.|I wonder when a rule should change.|Students might follow a rule better if they helped create it.

Making Friends
L=A simple hello can begin a friendship.|Playing together helps people relax.|A new friend may like different things.
H=Friendship grows when people feel heard rather than judged.|Small invitations can include someone who is standing alone.|Disagreements are easier when both friends can explain their feelings.
V=introduction~The first time people tell each other who they are~I would make a kind introduction.|invitation~An offer to join an activity|playmate~Someone who plays with another person~A new playmate could join us.|listen~To pay attention to someone's words|include~To make someone part of a group~I would include a new student.|disagreement~A difference in opinion~A disagreement need not end a friendship.|apology~Words showing regret for a mistake~I might offer an apology.
S=I would say hello first.|A new child could join our game.|I like friends who listen.|I would ask about their favorite book.|We might like different things.|I could invite them to sit with us.
T=If someone stood alone, I would offer a small invitation without pressure.|A friendship can grow even when people enjoy different games.|I would rather ask a real question than say a perfect greeting.|When friends disagree, I think listening should come before fixing.|I wonder how someone knows they feel included.|A sincere apology could be more useful than a gift.

Family Traditions
L=A family may repeat a favorite story.|Some people cook together on special days.|A tradition can start with one small choice.
H=Traditions often carry memories as well as actions.|Families can adapt a custom when members move or grow older.|A new ritual can become meaningful through repetition and shared care.
V=ritual~An action repeated with special meaning~Our bedtime story is a ritual.|recipe~Instructions for preparing food~My family has a recipe we share.|keepsake~An object kept for its memory~A photo can be a keepsake.|gathering~A time when people come together~Our gathering might include cousins.|memory~Something remembered from the past~A family memory can feel warm.|custom~A shared way of doing things~Our family custom could involve music.|celebration~A special event marking something important~Our celebration could be simple.
S=I would help make a family meal.|Our story could change each year.|I like looking at old photos.|A small tradition can feel special.|I would ask my grandparents questions.|My family might start a new game.
T=If I started a family tradition, it would be easy for everyone to join.|I would rather keep a shared story than an expensive object.|A recipe can bring back a memory as soon as it smells familiar.|I wonder how traditions change when families move.|Different homes may celebrate the same day in different ways.|I think a new ritual needs people more than decorations.

Birthday Parties
L=A birthday can be quiet or noisy.|A small game helps guests meet.|A kind card can feel important.
H=Parties reflect the person being celebrated, not a fixed set of decorations.|Planning for different guests can make everyone comfortable.|A shared activity often lasts longer in memory than a costly gift.
V=invitation~A request to come to an event~I would send an invitation.|guest~A person invited to a gathering~A new guest might feel shy.|cake~A sweet baked food for celebrations~I would decorate a cake.|party game~An activity played by guests~Our party game could be simple.|gift~Something given to another person|card~Paper with a written message~I would make a card.|celebrate~To mark a happy event together~We could celebrate outside.
S=I would choose a treasure hunt.|A shy guest might need a friend.|I like making birthday cards.|A small party sounds fun.|I would ask what the birthday child likes.|A cake could have fruit on top.
T=If I planned a party, I would choose games that new guests can join.|I would rather receive a thoughtful card than another toy.|A quiet celebration might suit some people better than a crowd.|I wonder what makes a guest feel welcome at once.|I would ask the birthday person before choosing the music.|The best memory might be something nobody planned.

Festivals Around the World
L=Some festivals fill streets with color.|Others happen at home with family.|People may prepare food for many days.
H=Festival customs often connect a community with its history.|Music, clothing, and shared meals can carry different meanings in different places.|Visitors learn more when they ask rather than assume.
V=parade~A public walk or procession for celebration~I would watch a parade.|lantern~A light inside a protective cover~A lantern could glow at night.|costume~Special clothing worn for an event~I might design a costume.|feast~A large special meal~Our feast could include many dishes.|custom~A shared way of doing something|procession~A group moving together for an event~I would watch a procession pass.|respect~Care for other people's practices~I would show respect while visiting.
S=I would watch the lanterns glow.|A parade could have bright music.|I would ask before taking photos.|I like trying festival food.|A costume might tell a story.|I would listen to a local guide.
T=If I joined a festival abroad, I would learn its meaning first.|I would rather hear a family's story than only see decorations.|A shared meal might show what a community values.|I wonder how visitors can take part without taking over.|Different festivals can be joyful in very different ways.|I think respectful questions make travel more interesting.

Holidays
L=A holiday can happen close to home.|Some people rest while others explore.|A free afternoon can become a small adventure.
H=Time away from routine can make familiar places feel new.|Families may have different budgets, distances, and energy for travel.|A meaningful break does not require an expensive journey.
V=day trip~A journey completed in one day~I would plan a day trip.|picnic~A meal eaten outside~Our picnic could be near home.|souvenir~Something kept to remember a visit~I might make my own souvenir.|itinerary~A plan for a journey~My itinerary could stay flexible.|rest day~A day set aside for recovery~I would enjoy one rest day.|sightseeing~Visiting places to see what is there~Sightseeing could start on our street.|staycation~Time off spent near home~A staycation might include a picnic.
S=I would visit a nearby park.|A free day could feel special.|I like making holiday plans.|My family might stay at home.|I would pack a picnic.|I want time to rest too.
T=If I had a holiday at home, I would explore a place I usually ignore.|I would rather have a slow day than a crowded schedule.|A small souvenir could be a drawing instead of a purchase.|I wonder why some trips feel longer in memory than on a calendar.|Different family budgets should not decide who gets a good break.|I would leave one day unplanned for surprises.

Jobs People Do
L=Many jobs help a town run.|A baker works while others sleep.|A driver may know many streets.
H=Every job combines visible tasks with less visible planning.|Workers often depend on people in other roles.|Asking someone about their work can reveal skills we never noticed.
V=baker~A person who makes bread and cakes~I would visit a baker.|driver~A person who operates a vehicle|builder~A person who makes structures|nurse~A person trained to care for patients~I would thank a nurse.|mechanic~A person who repairs machines~A mechanic could fix my bike.|delivery~Taking goods to a destination~A delivery might arrive early.|shift~A set period of work~A night shift could be tiring.
S=I would ask a baker about bread.|A builder could make a bridge.|I like watching people fix things.|A driver might know a shortcut.|I would thank a helpful nurse.|I want to try a new job.
T=If I spent a day with a mechanic, I would ask how they spot problems.|I would rather learn several practical skills than choose one title now.|A town needs workers whose jobs we seldom notice.|I wonder which job starts before sunrise.|A good team might include a driver, cook, builder, and planner.|I would ask adults what surprised them most about their work.
`);
