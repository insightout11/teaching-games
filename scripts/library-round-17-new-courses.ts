export type NewStory = {
  id: string;
  title: string;
  seriesId: string;
  seriesTitle: string;
  order: number;
  sourceTitle: string;
  sourceUrl: string;
  question: string;
  shortSummary: string;
  tags: string[];
  a1: string[];
  a2: string[];
  focus: string[];
  words: string[];
  cast: Array<{ name: string; who: string }>;
  talk: string;
};

export const newStories: NewStory[] = [
  {
    id: 'book-potter-1', title: 'The Tale of Peter Rabbit', seriesId: 'book-course-potter', seriesTitle: 'Beatrix Potter stories', order: 1,
    sourceTitle: 'The Tale of Peter Rabbit (Project Gutenberg ebook 14838)', sourceUrl: 'https://www.gutenberg.org/ebooks/14838',
    question: 'Should Peter have gone into the garden?', shortSummary: 'Peter enters a forbidden garden and has to find his way home.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'Peter Rabbit lived with his mother and three sisters. Their home was under a very big tree. Mother told them to stay away from Mr McGregor’s garden.',
      'The garden belonged to Mr McGregor, a farmer. Peter’s sisters went down the lane to pick berries. Peter went under the garden gate instead.',
      'He ate many green plants until his tummy hurt. Then Mr McGregor saw him by the vegetables. Peter ran fast and lost both his shoes.',
      'His new blue coat caught in a net. Small birds called to him to run away. Peter left his coat and hid in a shed.',
      'A large can in the shed held cold water. Peter got wet and began to sneeze. Mr McGregor came near, so Peter ran again.',
      'Peter saw the open gate and ran under it. He went home tired and without his coat. Mother gave him tea and put him to bed.'
    ],
    a2: [
      'Peter Rabbit lived with his mother and three sisters beneath the roots of a tree. One morning, Mother Rabbit warned them to stay away from Mr McGregor’s garden. Peter’s father had met with trouble there. While Mother went shopping, the sisters picked berries along the lane. Peter squeezed under the garden gate instead.',
      'Inside, Peter ate lettuces, beans, and radishes until he felt ill. He went looking for parsley, but Mr McGregor spotted him among the vegetables. The man chased Peter with a rake. Peter ran in every direction because he had forgotten the way back to the gate. He lost both shoes as he fled.',
      'A net caught the buttons on Peter’s new blue coat. He cried, but some sparrows called for him to keep trying. He pulled free just before Mr McGregor reached him, leaving the coat behind. Peter hid in a watering can inside the shed. Water in the can made him wet, and his sneeze gave away his hiding place.',
      'Peter escaped through a small window and rested. He asked a mouse where to find the gate, but she had a pea in her mouth and could not answer. He passed a pond and a white cat. At last he climbed onto a wheelbarrow and saw Mr McGregor working near the gate. Peter ran behind the bushes and slipped underneath it.',
      'Back at home, Peter was too tired to tell his mother what had happened. She wondered where his jacket and shoes had gone. She put him to bed with a little tea. His sisters enjoyed bread, milk, and berries for supper. Mr McGregor hung Peter’s lost clothes on a scarecrow in the garden.'
    ],
    focus: ['Mother warns Peter', 'Peter enters garden', 'Mr McGregor chases', 'Peter loses coat', 'A wet hiding place', 'Peter runs home'],
    words: ['tree', 'garden', 'gate', 'shoes', 'coat'],
    cast: [{ name: 'Peter', who: 'the young rabbit who enters the garden' }, { name: 'Mother', who: 'the rabbit who warns her children' }, { name: 'Mr McGregor', who: 'the man who owns the garden' }],
    talk: 'Would you enter the garden with Peter?'
  },
  {
    id: 'book-potter-2', title: 'The Tale of Benjamin Bunny', seriesId: 'book-course-potter', seriesTitle: 'Beatrix Potter stories', order: 2,
    sourceTitle: 'The Tale of Benjamin Bunny (Project Gutenberg ebook 14407)', sourceUrl: 'https://www.gutenberg.org/ebooks/14407',
    question: 'Should Benjamin have taken Peter back to the garden?', shortSummary: 'Benjamin helps Peter retrieve his clothes, but a cat traps them.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'Benjamin Bunny saw Mr McGregor leave his garden by cart. He went to see his cousin Peter. Peter felt ill after his last visit there.',
      'Peter had left his little blue coat and both shoes there. Benjamin said the garden was empty for the whole day now. The two rabbits went over the high wall.',
      'They found Peter’s clothes on a garden scarecrow. Benjamin filled a cloth with onions too. Peter heard strange noises and wanted to leave.',
      'A big garden cat came around the corner. The rabbits hid under a big basket. The cat sat on top for a long time.',
      'Benjamin’s father came looking for his young son. He jumped down and chased the cat away. He locked it inside the garden greenhouse.',
      'Father Bunny took the two rabbits and onions home. Peter got his lost coat and shoes back. His mother was happy to see him safe.'
    ],
    a2: [
      'Benjamin Bunny saw Mr and Mrs McGregor drive away from their garden one morning. He hurried to visit his cousin Peter, who was still unwell after escaping from that garden. Peter had lost his blue coat and shoes there. Benjamin believed they could collect the clothes safely while the owners were away.',
      'The two rabbits climbed over the wall and dropped into the lettuce beds. Peter’s coat and shoes hung on a scarecrow. They took them down, though rain had made the shoes wet and the coat smaller. Benjamin also wanted to bring onions home for his aunt. He filled Peter’s cloth with them, while Peter listened nervously for danger.',
      'They walked through the garden with their heavy bundle. Peter kept dropping the onions. Then a cat appeared near the flower pots. Benjamin quickly pulled Peter and the onions beneath a large basket. The cat sniffed the basket and sat on it. For hours the rabbits waited in the dark, unable to push their way out.',
      'Father Bunny came along the wall looking for his son. He jumped onto the cat and chased it into a greenhouse, then shut the door. He lifted the basket and brought both young rabbits out. He was cross with Benjamin for going into the garden, but he led the cousins safely home with their bundle of onions.',
      'When Mr McGregor returned, he saw tiny marks in his garden and could not understand how his cat had become locked in the greenhouse. Peter’s mother was glad that her son had returned with his coat and shoes. She hung the onions in the kitchen. Peter and Benjamin were back with their family after a frightening afternoon.'
    ],
    focus: ['Benjamin visits Peter', 'Into the garden', 'Clothes and onions', 'Cat on basket', 'Father saves rabbits', 'Safe at home'],
    words: ['garden', 'coat', 'shoes', 'basket', 'cat'],
    cast: [{ name: 'Benjamin', who: 'the young rabbit who helps Peter' }, { name: 'Peter', who: 'the rabbit who lost his clothes' }, { name: 'Father Bunny', who: 'the rabbit who drives the cat away' }],
    talk: 'Would you go back for Peter’s coat?'
  },
  {
    id: 'book-potter-3', title: 'The Tale of Jemima Puddle-Duck', seriesId: 'book-course-potter', seriesTitle: 'Beatrix Potter stories', order: 3,
    sourceTitle: 'The Tale of Jemima Puddle-Duck (Project Gutenberg ebook 14814)', sourceUrl: 'https://www.gutenberg.org/ebooks/14814',
    question: 'Should Jemima trust the fox with her eggs?', shortSummary: 'Jemima finds a nest away from the farm, then a dog uncovers the fox’s plan.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'Jemima was a duck on a small farm. She wanted to sit on her own eggs. The farmer’s wife took them away each time.',
      'Jemima flew over a hill to a quiet wood. A fox in fine clothes met her there. He showed her a soft place for a nest.',
      'Jemima laid nine large white eggs in the shed. The fox said he would watch them for her. Then he asked her to bring herbs and onions.',
      'Kep the farm dog saw Jemima carrying onions. She told him about the kind fox in the wood. Kep knew the fox was not kind.',
      'Kep brought two young dogs to the wood. They chased the fox away from Jemima. But they ate all nine of her eggs.',
      'Jemima went home and cried for her nine lost eggs. Later she laid more eggs on the farm. This time she kept them with her.'
    ],
    a2: [
      'Jemima Puddle-Duck lived on a farm and wanted to hatch her own eggs. The farmer’s wife took the eggs away whenever Jemima hid them. Jemima decided to make a nest far from the farm. She flew over a hill to a quiet wood, where she met a well-dressed animal with a bushy tail.',
      'The animal was a fox. He spoke politely and offered Jemima a soft shed where she could build a nest. Feathers covered the floor. Jemima came back each afternoon and laid nine eggs there. The fox counted them when she was away. Jemima trusted him to watch the nest while she went home at night.',
      'When Jemima was ready to sit on her eggs, the fox invited her to dinner. He asked her to bring herbs and onions from the farm. Jemima did not see why that request was strange. As she carried the onions, Kep the farm dog stopped her. She told him about the fox and showed him where the shed stood.',
      'Kep understood the danger and found two young dogs to help. Jemima returned to the shed, and the fox told her to come inside quickly. Soon she heard the dogs outside. They chased the fox away, and Kep opened the shed door for her. Jemima was safe, but the young dogs ate every egg before Kep could stop them.',
      'Jemima returned to the farm in tears. Her first nest was gone, though Kep had saved her from the fox. Later in the year she laid more eggs. This time she was allowed to keep them and sit on them herself. Four ducklings hatched, and Jemima cared for them at the farm.'
    ],
    focus: ['Jemima wants eggs', 'A fox offers nest', 'Nine eggs', 'Kep hears truth', 'Dogs chase fox', 'More eggs at home'],
    words: ['duck', 'farm', 'eggs', 'fox', 'dog'],
    cast: [{ name: 'Jemima', who: 'the duck who wants her own nest' }, { name: 'Kep', who: 'the dog who saves Jemima' }],
    talk: 'Would you trust the fox with your eggs?'
  },
  {
    id: 'book-potter-4', title: 'The Tale of Squirrel Nutkin', seriesId: 'book-course-potter', seriesTitle: 'Beatrix Potter stories', order: 4,
    sourceTitle: 'The Tale of Squirrel Nutkin (Project Gutenberg ebook 14872)', sourceUrl: 'https://www.gutenberg.org/ebooks/14872',
    question: 'Should Nutkin stop teasing Old Brown?', shortSummary: 'Nutkin teases an owl on a nut island and escapes with a shorter tail.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'Nutkin was a little red squirrel with a long tail. His family lived near a wide lake. They wanted nuts from an island in the lake.',
      'An old owl called Old Brown lived there. The other squirrels brought him small gifts. They asked him if they could take nuts.',
      'Nutkin did not bring any gift at all. He sang funny riddles and danced near the owl. Old Brown said nothing and went to sleep.',
      'The squirrels came back across the wide lake for many days. They worked and filled their little bags with nuts. Nutkin kept singing and teasing Old Brown.',
      'On the last day Nutkin jumped on the owl. Old Brown caught him and took him inside his tree. Nutkin pulled hard on his tail.',
      'Part of his tail stayed in Old Brown’s claws. Nutkin ran out through a high tree window. After that he had a short tail.'
    ],
    a2: [
      'Nutkin was a young red squirrel who lived with his brother and many cousins beside a lake. In the middle of the water stood an island full of nut bushes. Old Brown the owl lived in a hollow tree there. When autumn came, the squirrels made little rafts and crossed the lake to gather food.',
      'Each day the squirrels brought Old Brown a gift and politely asked if they could gather nuts. Their sacks slowly filled. Nutkin behaved differently. He brought no gift, danced near the owl, and sang riddles instead of helping his family. Old Brown closed his eyes and did not answer him.',
      'The family returned to the island again and again. They carried nuts back across the water while Nutkin played games and teased the owl. One day he tickled Old Brown with a plant. Another day he sang at the owl’s door. Old Brown grew less patient, but Nutkin still would not stop.',
      'On their last visit, the other squirrels placed one more gift by the owl’s tree. Nutkin jumped and sang louder than before. Then he leaped onto Old Brown’s head. The owl caught him and carried him inside the hollow tree. Nutkin was frightened at last. He pulled so hard against the owl’s grip that part of his tail came away.',
      'Nutkin escaped up the tree and out through a high window. The other squirrels saw him again with a much shorter tail. He could still climb and run, but he no longer enjoyed being asked to sing his riddles. He ran home with his family and climbed into a tree beside the lake.'
    ],
    focus: ['Nutkin and family', 'Gifts for owl', 'Nutkin sings riddles', 'Squirrels gather nuts', 'Old Brown catches', 'A shorter tail'],
    words: ['squirrel', 'lake', 'owl', 'nuts', 'tail'],
    cast: [{ name: 'Nutkin', who: 'the young squirrel who teases Old Brown' }, { name: 'Old Brown', who: 'the owl who lives on the island' }],
    talk: 'Would you ask Nutkin to stop singing?'
  },
  {
    id: 'book-fairy-1', title: 'The Little Red Hen', seriesId: 'book-course-first-fairy', seriesTitle: 'First fairy tales', order: 1,
    sourceTitle: 'Stories to Tell to Children: The Little Red Hen (Project Gutenberg ebook 473)', sourceUrl: 'https://www.gutenberg.org/ebooks/473',
    question: 'Should the hen share bread with the animals?', shortSummary: 'A hen grows wheat and makes bread while her neighbours decline to help.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'A little Red Hen lived with her small chicks. One day she found a grain of wheat outside. She asked a Goose and Duck to help.',
      'The Hen wanted to plant the tiny grain. The Goose said no, and the Duck said no. So the Hen planted it herself in the ground.',
      'The wheat grew tall in the field. The Hen asked who would cut it down. Again the Goose and Duck did not help.',
      'The Hen took the cut wheat to a nearby mill. The mill made soft white flour from the wheat. The Hen carried the heavy flour back home by herself.',
      'She asked who would make some bread. Both animals said no again. The Hen made the bread herself and baked it.',
      'The warm fresh bread smelled good when it was ready. Now the Goose and Duck wanted some. The Hen ate it with her hungry chicks.'
    ],
    a2: [
      'A little Red Hen lived in a farmyard with her chicks. One day she found a grain of wheat. She knew it could grow into more wheat if she planted it. She asked the Goose and the Duck to help with that work, but both said no. The Hen planted the grain by herself.',
      'After some time, the wheat grew tall and was ready to cut. The Hen asked her two neighbours to help again. The Goose and the Duck still did not want to work. The Hen cut the wheat alone. She took it to the mill, where it was made into flour, and carried the flour back to the farmyard.',
      'Now there was enough flour to bake bread. The Hen asked the Goose and Duck if they would help her make it. Once more they refused. The Hen mixed and worked with the flour until the bread was ready for the oven. Then she baked it and waited while the warm smell filled the yard.',
      'When the bread came out, the Goose and Duck hurried over. They both said they would gladly help eat it. The Hen remembered how they had answered when she needed help planting, cutting, and baking. She did not give them the bread they had refused to help make.',
      'Instead, the Hen called her chicks. They sat with her and shared the fresh bread. The Goose and the Duck had no piece to eat. The Hen had done each part of the work, from one small grain to a warm loaf, while her neighbours had watched.'
    ],
    focus: ['Hen finds wheat', 'Hen plants grain', 'Wheat grows tall', 'Flour from mill', 'Hen makes bread', 'Chicks eat bread'],
    words: ['Hen', 'grain', 'wheat', 'flour', 'bread'],
    cast: [{ name: 'Hen', who: 'the bird who grows and bakes' }, { name: 'Goose', who: 'the bird who refuses to help' }, { name: 'Duck', who: 'another bird who refuses to help' }],
    talk: 'Should the Hen share her bread?'
  },
  {
    id: 'book-fairy-2', title: 'The Gingerbread Man', seriesId: 'book-course-first-fairy', seriesTitle: 'First fairy tales', order: 2,
    sourceTitle: 'Stories to Tell to Children: The Gingerbread Man (Project Gutenberg ebook 473)', sourceUrl: 'https://www.gutenberg.org/ebooks/473',
    question: 'Should the Gingerbread Man trust the fox?', shortSummary: 'A little gingerbread boy outruns many people and animals before meeting a fox.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'An old woman made a small boy from gingerbread. She gave him a sweet little coat and eyes. Then she put him in the hot oven.',
      'When she opened the oven, he jumped out. He ran past her and the old man. They called to him, but he ran on quickly.',
      'A cow saw the Gingerbread Man run by. The cow tried to catch him on the road. He laughed and ran faster than the cow.',
      'A horse and some workers ran after him too. The little boy ran across the wide green fields. Nobody could catch him there.',
      'Then the Gingerbread Man came to a wide river. He could not swim to the other side. A fox said he could carry him across.',
      'The boy climbed onto the fox in the river water. The fox moved him closer to his mouth. On the far bank, the fox ate him.'
    ],
    a2: [
      'An old woman and an old man lived together without children. One day the woman made a little boy from gingerbread. She gave him sweet eyes, a coat, and small shoes before putting him in the oven. When she opened the door, the Gingerbread Man jumped out. He ran through the house and away down the road.',
      'The old woman and old man chased him. He laughed because they could not run as fast as he could. A cow saw him beside the road and joined the chase. The Gingerbread Man called back that none of them could catch him, then ran on into the fields. Soon he had left the cow behind too.',
      'A horse, some workers by a barn, and more people tried to stop the little runner. Each time he called out that he had escaped the others and would escape them as well. He grew proud of his speed. By the time he reached a river, he believed no one could catch him.',
      'The Gingerbread Man could not swim across the river. A fox came by and said he did not want to catch him. The fox offered to carry him to the far bank. The little boy jumped onto the fox’s tail. As they moved through the water, the fox said the tail was too low and asked him to climb onto his back.',
      'The fox moved the Gingerbread Man from his back to his shoulder and then to his nose. The little boy wanted to stay dry, so he did as the fox said. When they reached the other bank, the fox tossed him up and ate him. The fox had caught the runner whom the others could not reach.'
    ],
    focus: ['Woman bakes boy', 'Gingerbread Man runs', 'Cow gives chase', 'Horse and workers', 'Fox at river', 'Fox eats him'],
    words: ['woman', 'boy', 'oven', 'cow', 'fox'],
    cast: [{ name: 'Gingerbread Man', who: 'the little runner made from bread' }, { name: 'fox', who: 'the animal who offers a ride' }],
    talk: 'Would you ride on the fox?'
  },
  {
    id: 'book-fairy-3', title: 'Goldilocks and the Three Bears', seriesId: 'book-course-first-fairy', seriesTitle: 'First fairy tales', order: 3,
    sourceTitle: 'Goldilocks and the Three Bears in Mother’s Nursery Tales (Project Gutenberg ebook 49001)', sourceUrl: 'https://www.gutenberg.org/ebooks/49001',
    question: 'Should Goldilocks enter the bears’ empty house?', shortSummary: 'Goldilocks enters a bears’ home, tries their food and furniture, then runs away.',
    tags: ['classic-literature', 'animals', 'reading-course'],
    a1: [
      'Three Bears lived in a little house in the woods. Their hot porridge was ready for supper. They went for a long walk while it cooled.',
      'A girl called Goldilocks found their quiet house. She knocked, but nobody came to the door. She went inside without asking the Bears.',
      'Goldilocks tried three different chairs in the room. The small chair felt just right to her. But it broke when she sat on it.',
      'She saw three bowls of warm porridge on the table. The big bowl was too hot for her. The small bowl tasted good, so she ate it all.',
      'Goldilocks went upstairs and found three beds. The little bed felt just right to her. She lay down and soon fell fast asleep.',
      'The Bears came home and found Goldilocks. The small Bear saw her sleeping in his bed. She woke and ran away through an open upstairs window.'
    ],
    a2: [
      'Three Bears lived together in a house in the woods. One evening they made porridge for supper, but it was too hot to eat. They left three bowls on the table and went outside for a walk while the food cooled. Their house stood quiet among the trees.',
      'A girl named Goldilocks came through the woods looking for flowers. She found the house and knocked at the door. No one answered, so she knocked again. Then she pushed the door open and went inside. The Bears were still walking in the woods, and Goldilocks did not know whose house she had entered.',
      'Three chairs stood in the room. Goldilocks sat in the large one, but it felt too soft. The middle chair felt too hard. The smallest chair suited her, but it broke beneath her. Then she saw the three bowls of porridge. The first was too hot and the second was too cold. She liked the small bowl and ate it all.',
      'Goldilocks grew sleepy and went upstairs. She tried the large bed and then the middle bed, but neither was comfortable. The small bed felt right, and she fell asleep there. Meanwhile, the Bears came home. They saw that someone had moved their chairs and tasted their porridge. The small Bear found his bowl empty and his chair broken.',
      'The Bears went upstairs and looked at their beds. The small Bear found Goldilocks sleeping in his. Their voices woke her. She opened her eyes and saw all three Bears standing nearby. Goldilocks jumped from the bed, ran to an open window, and climbed out. She hurried home through the woods and did not return.'
    ],
    focus: ['Bears go walking', 'Goldilocks enters', 'A broken chair', 'Three bowls', 'A small bed', 'Goldilocks runs away'],
    words: ['Bears', 'house', 'bowls', 'chair', 'bed'],
    cast: [{ name: 'Goldilocks', who: 'the girl who enters the house' }, { name: 'Bear', who: 'one of the family in the house' }],
    talk: 'Should Goldilocks go inside the house?'
  },
  {
    id: 'book-fairy-4', title: 'The Elves and the Shoemaker', seriesId: 'book-course-first-fairy', seriesTitle: 'First fairy tales', order: 4,
    sourceTitle: 'Stories to Tell to Children: The Elves and the Shoemaker (Project Gutenberg ebook 473)', sourceUrl: 'https://www.gutenberg.org/ebooks/473',
    question: 'How should the shoemaker thank the elves?', shortSummary: 'Two elves secretly make shoes for a poor couple, who leave them a gift.',
    tags: ['classic-literature', 'kindness', 'reading-course'],
    a1: [
      'A poor Shoemaker lived with his wife. They had very little money for food. One night he cut his last leather for shoes.',
      'He left the cut leather on his work table. In the morning, new shoes stood there. A customer bought them at once for good money.',
      'The Shoemaker bought more leather with that money. He cut it and went to bed. In the morning, two pairs of shoes were ready.',
      'Each day he sold the new shoes in his shop. At night he and his wife hid behind a curtain nearby. They saw two little Elves making the shoes.',
      'The Elves had no coats or shoes. The wife made small bright clothes for them. The Shoemaker made two tiny pairs of shoes.',
      'They left the little gifts on the work table. The Elves put them on and danced happily. They went away, and the shoe shop stayed busy.'
    ],
    a2: [
      'A Shoemaker and his wife worked hard but had very little money. At last they had enough leather for just one pair of shoes. The Shoemaker cut the pieces and left them on his work table, planning to stitch them in the morning. Then he and his wife went to bed.',
      'When he came to the bench, a beautiful pair of shoes was already there. A customer bought it for a good price. The Shoemaker could now buy leather for two pairs. He cut the new pieces before bed. In the morning, two finished pairs waited on the bench. Both pairs sold, and he bought even more leather.',
      'The same thing happened for many nights. The couple wanted to know who was helping them. One evening they left the cut leather on the bench and hid behind a curtain. At midnight, two tiny Elves came in. They worked quickly with their little tools, made the shoes, and danced around them before leaving.',
      'The Shoemaker and his wife were grateful. They noticed that the Elves had no clothes or shoes of their own. The wife made two small coats and other bright clothes. The Shoemaker made two tiny pairs of shoes. When the gifts were ready, they left them on the bench instead of the leather.',
      'The Elves returned at night and found the gifts. They put on the clothes and shoes, danced with joy, and went out through the window. They did not come back to make more shoes. The Shoemaker and his wife kept working, and their shop did well. They remembered the helpers they had seen behind the curtain.'
    ],
    focus: ['Shoemaker has little', 'A new pair', 'More shoes appear', 'Two Elves work', 'Small clothes and shoes', 'Elves dance away'],
    words: ['money', 'leather', 'shoes', 'table', 'Elves'],
    cast: [{ name: 'Shoemaker', who: 'the man who makes and sells shoes' }, { name: 'wife', who: 'the woman who makes little clothes' }, { name: 'Elves', who: 'the two small helpers who work' }],
    talk: 'What gift would you make for the Elves?'
  }
];
