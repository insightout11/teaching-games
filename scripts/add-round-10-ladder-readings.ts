import fs from 'node:fs';

type Draft = {
  id: string;
  title: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2';
  ageBand: 'kids' | 'teens';
  topicTags: string[];
  flightQuestion: string;
  text: string;
};

const drafts: Draft[] = [
  {
    id: 'round10-ladder-kids-a1-pond-journal', title: 'Our School Pond Journal', cefr: 'A1', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'education', 'cities'],
    flightQuestion: 'Should the class leave pond plants for the tadpoles?',
    text: `Our class has a small pond near the school gate in our city. On Monday, we see green plants in the water. We also see five tiny tadpoles. Our teacher gives us a journal. We draw what we see. We do not put our hands in the pond.

On Wednesday, the water looks low. The sun is hot. We ask, “Do the tadpoles have enough water?” The teacher says we can look again tomorrow. We write the date and draw the water line. We learn that a good question needs careful looking.

On Friday, there is rain. The water line is high again. A bird drinks beside the pond. We see that the water helps more than one animal. We want to clean the area, but we leave the pond plants in place. Small animals can hide there. In our journal, we write one idea: pick up litter on the path, and let the pond stay a home for living things.`,
  },
  {
    id: 'round10-ladder-kids-a1-beetle-garden', title: 'Beetles in the Garden', cefr: 'A1', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'education'],
    flightQuestion: 'Should the children move the beetles from their garden?',
    text: `Mina and her class work in the school garden. They find two beetles under a leaf. One beetle is brown. One is black. The children want to know where the beetles go, so they make a simple map. Their teacher asks them to watch and draw, not to take the beetles home.

At first, the children think the beetles eat the flowers. They look again after lunch. The beetles are near old leaves on the ground. Mina writes this in her book. She learns that a first idea can be wrong. Looking twice can help.

The class puts water near the plants and takes plastic off the soil. They leave the old leaves where some little animals live. They make a sign for other students: “Please walk on the path.” On the next day, they see a worm and another beetle. Their garden is a place for plants, small animals, and people to learn together.`,
  },
  {
    id: 'round10-ladder-kids-a1-family-sleep-timer', title: 'The Family Sleep Timer', cefr: 'A1', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'family', 'technology', 'society'],
    flightQuestion: 'Should every family member use the same screen timer?',
    text: `Leo likes games on the family tablet. His sister likes to draw on it. At night, they both want one more turn. Their mother asks how they feel in the morning. Leo says he is tired at school. His sister says she is tired too.

The family makes a plan. They set a timer on the tablet. When it rings, Leo puts the game away. His sister finishes her drawing and saves it. They read a short book before bed. The first night is hard. Leo feels cross, so he tells his family. They listen and move the timer five minutes later on game night.

After a week, the children talk about the plan. They can wake up more easily. Their friends have different plans at home, and that is okay. Leo learns that a rule works best when people can explain what they need. The family keeps the timer, but they check the rule together each Sunday.`,
  },
  {
    id: 'round10-ladder-kids-a1-neighbor-board', title: 'A Board for Neighbors', cefr: 'A1', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'family', 'technology', 'society', 'cities'],
    flightQuestion: 'Should the neighbors keep paper notes beside their phone board?',
    text: `Asha and her father live on a busy city street. Some neighbors use a phone board to share news. Asha sees a message: “Mrs Lim needs help with her shopping.” She wants to help. Her father says they should ask Mrs Lim what she needs first.

Mrs Lim says she can carry small bags, but big bags hurt her arm. Asha and her father take the big bags home with her. Mrs Lim is happy. She also says she cannot always see messages on a phone. The neighbors talk about this at their meeting.

They put a paper board in the building too. People can read a note there or use the phone board. Asha asks everyone before she shares a name or a photo. She learns that helping means listening. It also means keeping people safe and comfortable. The new plan lets more families take part, including neighbors who do not use the phone app.`,
  },
  {
    id: 'round10-ladder-kids-a2-welcome-circle', title: 'The Welcome Circle', cefr: 'A2', ageBand: 'kids',
    topicTags: ['psychology', 'society', 'education', 'culture'],
    flightQuestion: 'Should classmates ask new students how they like to be welcomed?',
    text: `A new student, Amir, joins the class on Monday. Some children want to clap and sing. Others think a quiet hello is better. Their teacher asks them to wait and ask Amir what he prefers. Amir says a big song would make him nervous, but he would like someone to show him the library.

The class starts a welcome circle. Each child may say one friendly thing or show a place in the school. Nobody has to speak in front of everyone. Amir shares a game he played at his old school. Lina says her family plays a different game at home. The children try both games at break time.

After a week, the teacher asks how the circle worked. Amir says he felt more comfortable because the class listened. The children learn that families and schools have different customs. A welcome can be warm without being loud. They write down several ways to greet the next new student and remember to ask first.`,
  },
  {
    id: 'round10-ladder-kids-a2-festival-library', title: 'The Class Festival Library', cefr: 'A2', ageBand: 'kids',
    topicTags: ['psychology', 'society', 'education', 'culture'],
    flightQuestion: 'Should a class display only the festivals most students know?',
    text: `The school library wants a display about celebrations. At first, the class chooses pictures of the festival most children know. Then Mei notices that several classmates celebrate other days. One student says her family has no festival this month. The teacher asks everyone to share only what they feel happy sharing.

Small groups make cards. A card can show a food, a greeting, a song, or a family activity. It does not have to speak for a whole country. Mei writes about a special meal at home and asks her grandmother to check the words. Another student draws a quiet day when his family visits relatives.

The class leaves an empty space on the shelf for more cards later. They do not ask anyone to wear a costume or answer a question if they feel shy. Visitors can read the cards and ask polite questions. The display helps the children learn that culture is made of many personal stories, not one rule for everyone.`,
  },
  {
    id: 'round10-ladder-kids-b1-river-birds', title: 'The River Bird Survey', cefr: 'B1', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography', 'cities'],
    flightQuestion: 'Should the class close the river path during nesting season?',
    text: `The river beside Nila’s city bends around a small island. Her class wants to find out why more birds gather there in spring. They draw a map with the river bend, a footpath, trees, and a patch of reeds. Each group watches for ten minutes at the same time of day. They count birds but do not touch nests.

The first group sees only three birds. A second group sees eight after a rain shower. Their teacher warns them that one count cannot prove the reason. The class visits again, records the weather, and compares the island with a busy part of the riverbank. The reeds give insects shelter, and some birds feed on those insects.

Nila suggests closing the whole footpath. Another student thinks a short quiet section would protect the nests while letting people walk by the river. The class writes both ideas in a letter to the park team. Their map and repeated counts help them explain why this particular part of the river matters.`,
  },
  {
    id: 'round10-ladder-kids-b1-moth-garden', title: 'The Night Moth Garden', cefr: 'B1', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography'],
    flightQuestion: 'Should the town dim garden lights to help night moths?',
    text: `A community garden sits between two roads in Sami’s neighborhood. His science group notices that moths visit the flowers at dusk, but few appear near the bright lamps beside the east road. They draw the garden and mark the lamps, flowers, and darker corners. Over four evenings, they count moths without catching them.

Their counts suggest a pattern, but the group knows other things may matter. The darker corner also has more flowers. They ask the gardener which plants bloom at night and learn that moths carry pollen between some flowers. The children add plant names to their map and plan a second survey.

Some neighbors want brighter lights for the path. Sami thinks the town could keep the walking path safe while dimming lamps beside the flower beds. The group presents both needs at a garden meeting. They explain how a small change in one place might help animals without leaving people in the dark. The town agrees to test the idea for a month.`,
  },
  {
    id: 'round10-ladder-kids-b1-family-focus-lab', title: 'A Family Focus Experiment', cefr: 'B1', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'school'],
    flightQuestion: 'Should Rina’s family switch off every phone during homework?',
    text: `Rina uses a tablet for homework, but messages from her friends often interrupt her. Her younger brother needs the same tablet to read a school article. Their family decides to test a plan for one week instead of arguing about one strict rule.

On three evenings, Rina turns off message alerts for twenty minutes. On the other evenings, she leaves them on. She writes down when she finishes her reading and how focused she feels. Her brother records whether he can get the tablet when he needs it. Their mother reminds them that a timer cannot measure every feeling, so they talk as well as collect numbers.

Rina finishes sooner without alerts, but her brother sometimes needs to ask a question. The family creates a shared homework time and keeps one way to contact each other. Rina tells her class about the experiment. Other families describe different routines, and nobody claims that one rule must work for everyone. The lesson is to test a change, listen, and adjust it together.`,
  },
  {
    id: 'round10-ladder-kids-b1-wellbeing-message', title: 'A Kinder Class Message Board', cefr: 'B1', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'school'],
    flightQuestion: 'Should the class allow anonymous messages on its board?',
    text: `The class has an online board for homework questions. At first, students post only about lessons. Soon someone writes, “I feel worried about tomorrow’s presentation.” Several classmates answer kindly, but one message says the student should stop worrying. The teacher asks the class how a public board can support people without making them feel exposed.

They ask families for ideas and agree on simple rules. Students may share study tips, but nobody has to explain private feelings online. A worried student can ask the teacher for a quiet conversation. The board also has a link to the school support team. Before posting, students pause to think about how their words may sound to another person.

For a week, the class reads sample messages and discusses which replies show care. They learn that technology can help a group, but it cannot replace listening face to face. Their final rules protect learning, privacy, and wellbeing. Families receive a copy so they know how the board is used.`,
  },
  {
    id: 'round10-ladder-kids-b1-recipe-map', title: 'Recipes on a Family Map', cefr: 'B1', ageBand: 'kids',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society'],
    flightQuestion: 'Should the class put family recipes on a public map?',
    text: `When her class studies local history, Maya brings a recipe from her grandfather. He first cooked the dish in a coastal town, using fish from the morning market. After the family moved inland, he used beans instead. Maya marks both places on a map and writes the dates beside them.

Other students bring food stories too. One family changed a recipe because an ingredient was expensive. Another makes the same meal only when relatives meet. The class learns that a dish can travel with people and change with the place where they live. They compare the stories with old market photographs and learn why a new road changed what the town could buy.

The teacher asks before putting any recipe online. Some families are happy to share; others want to keep a detail private. Maya includes only the parts her grandfather approves. Their class map shows movement, trade, and family choices. It also shows that no single recipe represents everyone from one place.`,
  },
  {
    id: 'round10-ladder-kids-b1-market-supper', title: 'The Market Supper Project', cefr: 'B1', ageBand: 'kids',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society', 'cities'],
    flightQuestion: 'Should the supper use only foods grown near the town?',
    text: `Tariq’s class plans a supper for families at the city hall. Before choosing dishes, they visit the market with a map. A seller explains that fruit once came by boat from the river, while trucks now bring it from farms farther away. An older neighbor remembers when the market opened only twice a week.

Students ask relatives what they like to cook and what they can afford. One family brings a dish from a different region. Another asks for a meal without nuts. The class realizes that a shared table needs clear labels and several choices. They write short cards explaining where ingredients came from and how recipes changed over time.

Some students argue that every dish should use local food. Tariq points out that the city’s own history includes travel and trade. The group chooses a mix of nearby produce and family recipes from other places. At the supper, guests talk about memories and new tastes. The project turns a meal into a map of people, places, and change.`,
  },
  {
    id: 'round10-ladder-kids-b2-urban-wetland', title: 'The Wetland beside the Station', cefr: 'B2', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography', 'cities'],
    flightQuestion: 'Should the station extend its platform into the wetland?',
    text: `Behind the city’s railway station lies a narrow wetland that many passengers barely notice. When plans for a longer platform appear, Isha’s class decides to investigate what lives there before offering an opinion. They divide the area into sections on a map, measure water depth after rain, and count the birds they can identify from a distance.

The students find frogs in the shallows and dragonfly larvae in the water. Their teacher explains that these animals depend on connected habitats: a dry path, reeds, and pools that remain wet long enough for young animals to develop. The wetland also absorbs some heavy rain, although the class cannot measure exactly how much flooding it prevents.

Rail passengers need safe access, and the town may need a longer platform. The class proposes a survey by professional ecologists before any work begins. They suggest comparing alternative platform shapes and recording wildlife through different seasons. Their evidence cannot settle the decision alone, but it makes the hidden wetland visible to the people who will decide its future.`,
  },
  {
    id: 'round10-ladder-kids-b2-coral-watch', title: 'Coral Watch on the Island', cefr: 'B2', ageBand: 'kids',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography'],
    flightQuestion: 'Should visitors avoid the reef while its coral recovers?',
    text: `The island reef attracts visitors, but its coral has become pale after a period of unusually warm water. A school science club joins a local guide to observe the reef from marked places. They record water temperature, photograph the same small area each week, and note where fish are still feeding. The guide warns them that a few photographs cannot reveal the whole reef’s health.

Coral is made by living animals, and the structures they build provide shelter for many species. Their location matters: the sheltered side of the island has calmer water than the exposed side, so the two areas may change differently. The club plots both sites on a map instead of treating the reef as one uniform place.

Some residents earn money by guiding visitors, while others want the reef closed until it recovers. The students discuss limited visits on fixed routes, with a review after several months. They present their observations as evidence, not a final verdict. Protecting the habitat and supporting families both matter in the island’s decision.`,
  },
  {
    id: 'round10-ladder-kids-b2-accessible-app', title: 'Designing an App Everyone Can Use', cefr: 'B2', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'school'],
    flightQuestion: 'Should the school launch its app before every family can use it?',
    text: `A school plans an app for homework notices and wellbeing resources. The first design looks attractive, but a student called Noor discovers that her grandmother cannot read the small text when she helps with homework. Another family shares one phone, so alerts arrive at a time when nobody can check them.

Instead of assuming the app will work for everyone, the student design team interviews families. They ask about text size, language, internet access, and whether private support messages should appear on a shared screen. The answers reveal practical barriers as well as feelings: some people worry they will miss important information or expose a personal problem.

The team makes the text larger, adds a paper notice option, and separates private wellbeing contacts from public class updates. They test the revised design with the same families and record what still fails. The principal wants to launch quickly, but the students argue for another round of testing. A useful school tool should help people learn without making some families invisible.`,
  },
  {
    id: 'round10-ladder-kids-b2-sleep-study', title: 'The Class Sleep Study', cefr: 'B2', ageBand: 'kids',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'school'],
    flightQuestion: 'Should the class publish every student’s sleep results?',
    text: `After a week of tired mornings, a class asks whether late screen use affects concentration. Their teacher suggests a voluntary study, but insists that students must never feel pressured to share private routines. Families can choose to keep a simple diary at home, recording bedtime and how alert a child feels the next morning.

The class discusses what the diary can and cannot show. A child might sleep poorly because of noise, illness, or worry rather than a phone. The group compares anonymous patterns, not named students, and avoids claiming that a single week proves a cause. They also ask whether homework deadlines make it difficult to put devices away early.

Some pupils want a school rule banning screens after dinner. Others point out that families have different schedules and may use a device for reading or contacting relatives. The class recommends clearer homework times and optional screen reminders. The study teaches them to protect privacy, question simple explanations, and design health advice that people can actually follow.`,
  },
  {
    id: 'round10-ladder-kids-b2-food-route', title: 'A Meal across Three Places', cefr: 'B2', ageBand: 'kids',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society'],
    flightQuestion: 'Should a museum label one family dish as traditional?',
    text: `Leila’s family recipe began near a mountain village, travelled to a port, and changed again when her grandparents moved to a city. She traces those places on a map for a local museum project. The earliest version used a grain grown near the village. At the port, cooks added a spice brought by traders. In the city, her grandmother changed the cooking time to fit a small apartment kitchen.

The museum wants a display called “Traditional Food.” Leila wonders which version would deserve that label. Her grandfather says the changes are part of the family’s history, not mistakes. She interviews relatives, checks the dates against old photographs, and records where each ingredient came from. She also asks permission before sharing a family story publicly.

The final display shows three recipe cards connected by a route, rather than claiming that one dish has a single fixed form. Visitors can see how geography, trade, and household needs shape culture. Leila hopes the exhibit invites other families to tell their own food stories without pretending that one family speaks for a whole community.`,
  },
  {
    id: 'round10-ladder-kids-b2-market-memory', title: 'Whose Market History?', cefr: 'B2', ageBand: 'kids',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society', 'cities'],
    flightQuestion: 'Should the town preserve stalls from its old market?',
    text: `A city plans to rebuild its market beside a new bus route. Some officials call the old stalls inconvenient, while long-time sellers describe them as part of the city’s identity. Jae’s class creates a history project to understand the disagreement. They map where the river, bus stop, and food stalls stood in three different decades.

Interviews reveal that families used the market for more than shopping. People exchanged recipes, found seasonal produce, and met relatives after work. Yet the old layout is difficult for some wheelchair users, and sellers need safer storage. The class does not treat every memory as proof that nothing should change. It compares memories with photographs and asks whose stories have been left out.

Jae suggests keeping a few stalls while redesigning the paths and adding a display about the market’s changing food culture. Other students prefer a completely new building. Their report presents both options, the costs they could identify, and questions still unanswered. The town’s decision will affect trade and daily life, so more than one generation deserves a voice.`,
  },
  {
    id: 'round10-ladder-teens-a1-river-route', title: 'Birds beside the River Path', cefr: 'A1', ageBand: 'teens',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography'],
    flightQuestion: 'Should the town keep a quiet path for river birds?',
    text: `Our town has a path by the river. Many people walk there. Birds live in the reeds near the water. A school group wants to learn about the birds. We draw a simple map. We mark the path, the reeds, and a small bridge.

On Monday, we count four birds near the bridge. On Tuesday, we count seven birds near the reeds. We go at the same time each day. Our teacher says one count is not enough. We need to look again before we give advice.

We also see a plastic bag in the water. We ask an adult to help remove it safely. We do not go into the river or touch the birds. The reeds are a home for small animals, so we leave them there. At the end of the week, we show our map to the town. We ask for a bin beside the path and a quiet place near the reeds. People can enjoy the river while animals have space too.`,
  },
  {
    id: 'round10-ladder-teens-a1-school-bees', title: 'Bees near Our School', cefr: 'A1', ageBand: 'teens',
    topicTags: ['science', 'animals', 'biology', 'nature', 'environment', 'geography', 'school'],
    flightQuestion: 'Should the school leave flowers for the bees?',
    text: `There are flowers behind our school. Small bees visit them in the morning. Our class makes a map of the garden. We mark the flowers, a wall, and a road. The road is noisy, but the garden is quiet.

We want to know which flowers bees visit. For ten minutes, we watch from the path. We do not catch a bee. We write the number of bees in our books. We look again the next day. More bees come when the sun is warm. Our teacher says the weather may change our count.

The school wants to cut all the flowers and make a new path. Some students want a path, but they also want to help the bees. We ask if the path can go beside the wall instead. Then the flowers can stay. The school asks the gardener to look at our map. We learn that a small place can be important for animals and people.`,
  },
  {
    id: 'round10-ladder-teens-a1-phone-sleep-diary', title: 'My Phone and My Sleep', cefr: 'A1', ageBand: 'teens',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'school'],
    flightQuestion: 'Should Nara put her phone away before homework ends?',
    text: `Nara reads messages on her phone at night. She goes to bed late and feels tired at school. Her family asks how they can help. Nara says she needs the phone for homework, but she also wants to talk with friends.

For one week, Nara writes a sleep diary. She writes when she puts the phone down and how she feels in the morning. Her teacher says the diary is private. Nara may talk about it with her family, but she does not have to show it to the class.

After three days, Nara tries a new plan. She checks messages before homework, then turns off the sound. At nine, she puts the phone on a table outside her room. She sleeps earlier on most nights. One night is different because the street is loud. Nara learns that a phone is not the only reason for poor sleep. Her family keeps talking and changes the plan when it does not work.`,
  },
  {
    id: 'round10-ladder-teens-a1-care-board', title: 'A Message for the Building', cefr: 'A1', ageBand: 'teens',
    topicTags: ['psychology', 'health', 'education', 'technology', 'society', 'family', 'cities'],
    flightQuestion: 'Should the building share help requests on paper too?',
    text: `Omar and his mother live in a large city building. The people there have a phone group. One day, a neighbor asks for help. She cannot carry food upstairs because her leg hurts. Omar wants to post her name and room number. His mother says they must ask the neighbor first.

The neighbor says yes to help, but no to a public photo. Omar carries one bag. His mother carries another. Later, they learn that some older people in the building do not use the phone group. At a meeting, Omar suggests a paper board near the door.

The neighbors agree. A person can choose to put a note on the paper board, send a phone message, or ask for help in person. Omar’s school class talks about the plan. They say a good tool should help many people and protect private information. Omar feels proud because he listened before he shared. His family now checks both boards each week.`,
  },
  {
    id: 'round10-ladder-teens-a1-city-food-map', title: 'Food on Our City Map', cefr: 'A1', ageBand: 'teens',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society', 'cities'],
    flightQuestion: 'Should a city food map include family stories?',
    text: `Lia’s class makes a map of food in their city. First, they mark a market near the river. Then they mark a new shop by the bus station. Lia asks her grandfather about the old market. He says people came by boat to sell fruit many years ago. Now trucks bring fruit by road.

Lia’s family buys rice and vegetables at the market. Her friend’s family cooks a different meal with the same vegetables. The class learns that one food can be part of many family traditions. They ask before they write anyone’s recipe on the map.

At school, each student adds one place and one short story. The map shows old and new roads, shops, and homes. It does not say that every family in the city eats the same food. Lia puts her grandfather’s boat story beside the river. Her friend adds a recipe note by the bus station. Their map helps people see how places and daily meals change over time.`,
  },
  {
    id: 'round10-ladder-teens-a1-grandma-market', title: 'Grandma’s Market Recipe', cefr: 'A1', ageBand: 'teens',
    topicTags: ['food', 'culture', 'history', 'geography', 'family', 'society'],
    flightQuestion: 'Should Mina change her grandmother’s recipe for local food?',
    text: `Mina helps her grandmother cook on Saturday. They go to the market together. Grandma tells Mina that she made this dish in another town when she was young. On a map, she shows Mina the town and the road she took to move here.

One food in the old recipe is hard to buy in their new town. Grandma now uses a local vegetable. Mina asks, “Is it still the same family dish?” Grandma smiles and says that families can keep a story even when a meal changes.

Mina writes the recipe in a notebook. She writes both the old food and the new one. She asks Grandma if she can share the page at school. Grandma says yes, but she wants Mina to tell the travel story too. At school, friends talk about meals from their homes. Some foods are new to Mina. She learns that every family has its own way of cooking and remembering. The market connects many people and places.`,
  },
  {
    id: 'round10-ladder-teens-a2-family-map', title: 'A Map for the Family Visit', cefr: 'A2', ageBand: 'teens',
    topicTags: ['family', 'geography', 'cities'],
    flightQuestion: 'Should the family choose the longer route past Grandma’s old home?',
    text: `Ella’s family plans to visit her grandmother across the city. The fastest route uses a new road, but Grandma asks to pass through her old neighborhood. Ella opens a map and finds two possible journeys. The old route takes twenty minutes longer and crosses a busy bridge.

Grandma shows Ella where she went to school and where her family lived. Some buildings have disappeared, but the river and a small park are still there. Ella marks the places on the map. Her brother wants to arrive early so they can cook lunch together. The family talks about how much time they have.

They decide to take the old route on the way there and the fast road on the way home. Grandma tells one story at each stop, and Ella records the stories only after asking permission. The trip is not just about reaching a house. The map helps the family connect places with memories, while their plan respects everyone’s time.`,
  },
  {
    id: 'round10-ladder-teens-a2-shared-walk', title: 'A Walk with Three Generations', cefr: 'A2', ageBand: 'teens',
    topicTags: ['family', 'geography', 'cities'],
    flightQuestion: 'Should the family take the shaded route even if it is longer?',
    text: `Three generations of Jo’s family want to walk to the river market in their city. Jo chooses the shortest route on a phone map, but her grandfather points out that it has no shade. Her younger cousin finds a second route through a park. It is longer, yet it has benches and a safe crossing.

The family checks the weather and talks about what everyone needs. Grandfather can walk well if they stop once. The cousin wants to see the pond in the park. Jo marks the market, the park, and both crossings on a simple map. She also checks when the market closes.

They choose the park route and leave a little earlier. On the way, Grandfather tells Jo that the river used to follow a different path before the road was built. Jo adds this story to a family travel note. She learns that a good route is more than a short line between two places. People’s ages, memories, and comfort can change the best choice.`,
  },
  {
    id: 'round10-ladder-teens-b2-coastal-agreement', title: 'A Family Agreement for the Coast', cefr: 'B2', ageBand: 'teens',
    topicTags: ['family', 'nature'],
    flightQuestion: 'Should the family stop visiting the dunes during nesting season?',
    text: `Every summer, Ravi’s extended family visits the same stretch of coast. They picnic near the dunes and remember the afternoons their grandparents spent there. This year, a conservation group asks visitors to avoid part of the beach because birds are nesting among the grass. Some relatives worry that the new signs will end a family tradition.

Ravi walks with a local guide and learns that the birds choose sheltered sand where people rarely pass. A single visit may seem harmless, but repeated footsteps can damage the plants that hold the dunes in place. He also hears that the public path remains open and offers a view of the coast without crossing the nesting area.

At dinner, Ravi shares what he learned. His aunt suggests moving their picnic to the path’s end and taking a group photograph from there. His grandfather wants to keep telling the family stories associated with the old spot. They agree to bring a map and explain the change to younger cousins. The coast remains part of their family life, but the family decides that belonging to a place includes caring for the animals that live there.`,
  },
  {
    id: 'round10-ladder-teens-b2-woodland-inheritance', title: 'The Woodland Garden Decision', cefr: 'B2', ageBand: 'teens',
    topicTags: ['family', 'nature'],
    flightQuestion: 'Should siblings keep the wild corner of their inherited garden?',
    text: `When three siblings inherit their parents’ house, they disagree about the overgrown garden. One wants to clear every corner for a large vegetable plot. Another hopes to leave the old trees and fallen logs because birds, insects, and fungi live there. The third worries that either plan will cost more time than the family can give.

They invite a local gardener to walk through the space. She explains that the shaded corner supports different living things from the sunny beds. She cannot promise that keeping it untouched will solve every problem; some branches need careful trimming, and the family must maintain a safe path. The siblings make a list of work they can do and work that requires help.

Their final plan keeps a small wild area, creates two vegetable beds, and leaves room for family gatherings. They agree to review the plan after one year, when they have seen how the plants respond. The decision is more than a choice between neatness and nature. It is a way to share responsibility for a place filled with family memories and living ecosystems.`,
  },
  {
    id: 'round10-ladder-teens-b2-homework-data', title: 'The Homework Data Trial', cefr: 'B2', ageBand: 'teens',
    topicTags: ['school', 'education', 'technology', 'psychology', 'health', 'society'],
    flightQuestion: 'Should a school collect students’ evening screen-use data?',
    text: `A secondary school wants to understand why many students submit homework after midnight. A technology company offers an app that would track when pupils open school files and how long they spend on a device. The headteacher thinks the data could reveal whether deadlines are unrealistic. Some students worry that the app would turn their private evenings into a school record.

A student committee examines the proposal. The data might show when a file is open, but it cannot explain whether a teenager is studying, caring for a sibling, or leaving the screen while taking a break. The committee also asks who would see the information and how long it would be stored. Families have different devices and internet access, so the results might be uneven.

The students suggest a voluntary, anonymous survey and a review of the timetable instead. Teachers can ask which assignments clash and whether students feel able to rest. The school agrees to test smaller changes before buying any tracking system. The debate shows how education, wellbeing, and technology intersect, and why more data is not automatically better evidence.`,
  },
  {
    id: 'round10-ladder-teens-b2-timetable', title: 'A Fairer School Timetable', cefr: 'B2', ageBand: 'teens',
    topicTags: ['school', 'education', 'health', 'psychology', 'society', 'family'],
    flightQuestion: 'Should the school move its first lesson to a later hour?',
    text: `A school council considers starting classes thirty minutes later. Students describe arriving exhausted after long commutes and late homework. Several teachers support the idea, but others explain that clubs would finish later. Families who share a car or arrange childcare could also be affected.

The council gathers more than opinions. It checks bus times, asks families about work schedules, and compares attendance before and after a short trial. The results show that some students feel more alert, yet the later finish creates a problem for pupils who care for younger relatives. One week of data is too short to prove a lasting health benefit, so the council resists declaring a simple victory.

Instead, it proposes a longer trial with an earlier study room for students who must arrive on the old bus. Teachers agree to spread major deadlines across the week. The council publishes the costs and invites responses from people who rarely attend meetings. A fair timetable should consider learning and mental health, but also the practical lives of families across the community.`,
  },
];

const file = 'src/data/discussion-library.json';
const library = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>[];
if (drafts.length > 40) throw new Error('Round 10 ladder exceeds the 40-item cap');
for (const draft of drafts) {
  const wordCount = draft.text.trim().split(/\s+/).length;
  if (wordCount < 150) throw new Error(`${draft.id} has only ${wordCount} words`);
  if (draft.flightQuestion.trim().split(/\s+/).length > 12) throw new Error(`${draft.id} question exceeds 12 words`);
  const entry = {
    id: draft.id,
    title: draft.title,
    kind: 'text',
    author: 'LessonCaptain',
    url: `https://lessoncaptain.com/#${draft.id}`,
    youtubeId: null,
    durationSecs: null,
    wordCount,
    summary: draft.text,
    description: `An original ${draft.cefr} reading about ${draft.topicTags.slice(0, 3).join(', ')}.`,
    topicTags: draft.topicTags,
    genre: 'expository',
    difficultyLevel: ({ A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper Intermediate' } as Record<string, string>)[draft.cefr],
    cefr: draft.cefr,
    ageBand: draft.ageBand,
    place: null,
    license: 'CC BY 4.0',
    attribution: 'LessonCaptain (original text)',
    needsReview: false,
    flightQuestion: draft.flightQuestion,
  };
  const existingIndex = library.findIndex((item) => item.id === draft.id);
  if (existingIndex >= 0) library[existingIndex] = entry;
  else library.push(entry);
}
const schoolStartItem = library.find((item) => item.id === 'discussion-r2-school-start-time');
if (schoolStartItem && Array.isArray(schoolStartItem.topicTags)
  && !schoolStartItem.topicTags.includes('school')) schoolStartItem.topicTags.push('school');
fs.writeFileSync(file, JSON.stringify(library, null, 2) + '\n');
console.log(`Prepared ${drafts.length} original ladder readings.`);
