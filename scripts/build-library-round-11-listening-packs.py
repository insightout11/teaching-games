"""Hand-authored timed listening questions, checked against stored captions separately."""
import json
from pathlib import Path

packs = {}


def add(id, *segments):
    number = len(packs)
    built = []
    for index, s in enumerate(segments):
        shift = (number + index) % len(s[3])
        options = s[3][shift:] + s[3][:shift]
        built.append(dict(start=s[0], end=s[1], question=s[2],
                          options=options, correctIndex=(s[4] - shift) % len(options), keyLine=s[5]))
    packs[id] = {"segments": built}


# Kids A1–A2: five everyday dialogues and five English-captioned science clips.
add('listening-r8-aef-rob-checks-in',
    (25, 39, 'Which city is Rob from?', ['London', 'Poland', 'New York'], 0, "hello I'm Rob I'm from London"),
    (51, 64, 'What does Rob say he has?', ['A ticket', 'A reservation', 'A letter'], 1, 'reservation'),
    (84, 97, 'Which room is Rob given?', ['321', '312', '231'], 0, "you okay Mr Walker you're in room 3 2 1"))
add('listening-r8-aef-jenny-buys-lunch',
    (30, 41, 'How much is the tuna salad?', ['7.20', '9.70', '5.20'], 0, "this tuna salad it's 7 20. okay fine"),
    (41, 54, 'What drink does Jenny request?', ['Mineral water', 'Orange juice', 'Tea'], 0, 'and a mineral water please'),
    (62, 76, 'Where do they plan to eat lunch?', ['In the park', 'At school', 'At the café'], 0, 'can have lunch together in the park sure'))
add('listening-r8-aef-dads-birthday',
    (33, 49, 'What date do they think it is?', ['The second of June', 'The second of July', 'The first of May'], 0, '2nd of June are you sure isn\'t it the'),
    (69, 82, 'What does Rob bring as a gift?', ['Wine', 'Flowers', 'Chocolate'], 0, "me it's my favorite wine thanks Rob but"),
    (79, 91, 'When is Dad’s birthday really?', ['The second of July', 'The second of June', 'The first of July'], 0, 'my birthday is on the 2nd of July today'))
add('listening-r8-top-notch-nice-to-meet-you',
    (22, 33, 'Who is president of Top Notch Travel?', ['James Evans', 'Paul', 'Bob'], 0, "pleasure to meet you i'm james evans"),
    (31, 42, 'What is Paul’s job?', ['Tour guide', 'Chef', 'Doctor'], 0, "tour guide glad to meet you hi i'm"),
    (63, 73, 'What job does Bob say he does?', ['Mailman', 'Architect', 'Singer'], 0, "i'm the mailman"))
add('listening-r8-top-notch-get-there',
    (33, 43, 'Which way do they turn at the corner?', ['Left', 'Right', 'Straight ahead'], 0, 'go to the corner and turn left left'),
    (47, 60, 'What is across the street?', ['A bookstore', 'A park', 'A hotel'], 0, 'across the street to the bookstore'),
    (67, 80, 'What should they avoid taking?', ['The train', 'The bus', 'A taxi'], 0, "around the corner don't take the train"))
add('kids_picky_pineapples',
    (17, 30, 'What climate do pineapples need?', ['Warm and tropical', 'Cold and snowy', 'Dry and windy'], 0, 'in warm, lush tropical climates.'),
    (35, 51, 'What can people do if pineapples do not grow nearby?', ['Get them from other communities', 'Grow them under snow', 'Stop eating all fruit'], 0, 'from communities that do grow them, even if\nthose places were very far away.'),
    (105, 120, 'What stores water near Las Vegas?', ['A reservoir', 'A glacier', 'A rainforest'], 0, 'Because they live close to a reservoir.'))
add('kids_xyfuqfqfl30',
    (59, 75, 'What does an engineer design to solve a problem?', ['A solution', 'A question', 'A prize'], 0, 'A solution is something an engineer designs\nor builds to solve a problem he or she has.'),
    (118, 133, 'What must the canyon plan do first?', ['Get the person across alive', 'Look colorful', 'Win a prize'], 0, 'and let me be more specific, it should\nget me to the other side alive.'),
    (150, 168, 'What does the speaker propose making from a tent?', ['A hang glider', 'A boat', 'A ladder'], 0, 'I could make a hang glider out of my tent!'))
add('kids_8lfd_ekze2m',
    (29, 41, 'Which resource can people drink?', ['Fresh water', 'Wood', 'Stone'], 0, 'There’s fresh water to drink, fruit on trees,\nand wood to build our houses.'),
    (49, 65, 'Why are big cities uncommon in deserts?', ['There is little water', 'There is too much rain', 'There are too many trees'], 0, 'no water -- or at the tops of freezing mountains\n--where there’s no food.'),
    (111, 126, 'Which ingredient is mentioned for the cake?', ['Flour', 'Pepper', 'Rice'], 0, 'Flour, eggs, sugar and milk.'))
add('kids_uxh_7wbns3a',
    (37, 54, 'What does “hydro” mean?', ['Water', 'Air', 'Land'], 0, '"Hydro" comes from the \nGreek word for "water,"'),
    (94, 107, 'Which atmospheric layer is lowest?', ['Troposphere', 'Mesosphere', 'Exosphere'], 0, 'The troposphere is the lowest layer.'),
    (168, 182, 'What sphere do clouds belong to?', ['Atmosphere', 'Geosphere', 'Biosphere'], 0, 'the clouds it came from are \nactually part of the atmosphere.'))
add('kids_7vtfyamu6g4',
    (13, 27, 'What does the Sun give Earth?', ['Warmth', 'Rain', 'Soil'], 0, 'You remember that the Sun provides\nthe Earth with energy, or warmth.'),
    (68, 82, 'Where does Earth’s warming energy come from?', ['The Sun', 'The Moon', 'The ocean'], 0, 'Essentially, 100% of the energy that\nwarms the Earth comes from the Sun.'),
    (127, 144, 'What happens when sunlight hits sand?', ['The sand gets warm', 'The sand gets wet', 'The sand disappears'], 0, 'making the sand warm or even hot to the touch.'))

# Teens B1: ten short conversations, one TED-Ed explainer and one VOA report.
add('listening-r7-english-file-travel',
    (20, 37, 'Which city does the speaker call most beautiful?', ['Rome', 'Paris', 'London'], 0, "been to is Rome in Italy."),
    (55, 72, 'Which ancient site did the speaker visit?', ['Pompeii', 'Stonehenge', 'The Colosseum'], 0, 'uh Pompei. Um I walked up Mount Vuvius'),
    (131, 151, 'What spoiled the family holiday?', ['Rain every day', 'A missed flight', 'A lost bag'], 0, 'rained every day. It was freezing cold.'))
add('listening-r7-english-file-annoyances',
    (24, 40, 'What do some shop assistants do that annoys the speaker?', ['Ignore customers while talking', 'Close early', 'Hide the prices'], 0, 'tend to talk and ignore you'),
    (48, 65, 'What habit involving phones bothers the speaker?', ['Keeping phones out all the time', 'Leaving phones at home', 'Calling before dinner'], 0, 'have to have their phones out with them'),
    (64, 81, 'Where does the speaker see people using phones socially?', ['At someone’s house for dinner', 'In a classroom exam', 'At a train station'], 0, "or at someone's house for dinner and"))
add('listening-r7-american-english-file-esl-meeting-jenny-s-parents',
    (29, 45, 'Where did Rob leave the chocolates?', ['On his desk', 'On the train', 'At a shop'], 0, "desk you're kidding you know what my"),
    (57, 73, 'What are Jenny’s parents called?', ['Harry and Sally', 'Rob and Sally', 'Harry and Kerri'], 0, 'and dad harry and sally and this of'),
    (101, 117, 'Where does Jenny now work as an editor?', ['A magazine', 'A school', 'A restaurant'], 0, 'editor of the magazine so you\'ve got a'))
add('listening-r7-american-english-file-esl-rob-s-interview',
    (49, 65, 'Why does Kerri prefer playing solo?', ['She has more freedom', 'She dislikes music', 'Her parents asked her'], 0, 'freedom this way i can play and say what'),
    (73, 88, 'What does Kerri’s mother do?', ['Play classical piano', 'Sing punk songs', 'Write magazines'], 0, "your mum's a classical pianist"),
    (127, 143, 'Where will Kerri play some clubs?', ['New York', 'London', 'Oxford'], 0, "new york then i'm doing some small gigs"))
add('listening-r7-american-english-file-esl-lunch-with-kerri',
    (29, 47, 'What does Kerri dislike about New York waiters?', ['They interrupt too often', 'They never smile', 'They bring cold food'], 0, 'new york waiters never leave you alone i'),
    (68, 84, 'Which city does one speaker call the greatest?', ['New York', 'London', 'Rome'], 0, "no it's definitely the greatest city in"),
    (88, 104, 'Which London activity does Rob mention?', ['Cycling', 'Skiing', 'Surfing'], 0, 'and and you can cycle everywhere'))
add('listening-r7-american-english-file-esl-friendly-new-yorkers',
    (28, 40, 'What may explain the friendly service?', ['A large tip', 'Free dessert', 'A famous guest'], 0, 'but i think she saw the big tip you left'),
    (65, 79, 'Which activity does Rob miss from London?', ['Cycling', 'Swimming', 'Dancing'], 0, 'for the parks cycling'),
    (80, 96, 'What did the taxi driver return?', ['A cell phone', 'A wallet', 'A coat'], 0, 'cell phone you left it in my cab what'))
add('listening-r7-american-english-file-esl-coffee-with-monica',
    (43, 58, 'What news does Monica share?', ['She is getting married', 'She is moving house', 'She has a new job'], 0, "we're getting married you're what oh"),
    (73, 88, 'Who else wants to organize Monica’s wedding?', ['Scott’s mother', 'Her coworkers', 'Her neighbors'], 0, "scott's mom want to organize the whole"),
    (99, 114, 'Where did Rob move from?', ['London', 'Paris', 'New York'], 0, 'few months ago from london what he\'s'))
add('listening-r7-american-english-file-esl-old-friends',
    (23, 38, 'What drink does Monica order?', ['A large latte', 'A green tea', 'A small lemonade'], 0, 'could i have a large latte please of'),
    (71, 88, 'Why is Monica especially happy?', ['She is getting married', 'She won a prize', 'She finished exams'], 0, "married that's fantastic news yeah it is"),
    (100, 116, 'How long will Paul stay?', ['A week', 'A day', 'A month'], 0, 'the week cool it\'ll be fun to meet one'))
add('listening-r7-american-english-file-esl-playing-pool-with-paul',
    (35, 49, 'Where did the friends play pool before?', ['At university', 'At school', 'At a hotel'], 0, 'university'),
    (113, 129, 'Who gave Rob his shirt?', ['Jenny', 'Paul', 'Kerri'], 0, 'present from jenny'),
    (147, 161, 'Why must Rob leave the game?', ['Jenny is waiting', 'The club is closing', 'He has a train'], 0, "the game another time jenny's waiting"))
add('listening-r7-american-english-file-esl-jenny-s-and-rob-s-story',
    (47, 62, 'What is Rob’s job at the magazine?', ['Writer', 'Photographer', 'Accountant'], 0, "i'm a writer on new york 24 7. you can"),
    (83, 99, 'Why did Rob first come to New York?', ['Because of Jenny', 'Because of family', 'Because of a holiday'], 0, 'because of jenny of course tomorrow i\'m'),
    (148, 164, 'Who will Rob meet for the first time?', ['Jenny’s parents', 'His new boss', 'A school friend'], 0, 'i\'m taking rob to meet my parents for'))
add('teded_hmfqqjmf_f0',
    (40, 56, 'Which part of the body can exercise strengthen?', ['Bones', 'Teeth', 'Hair'], 0, 'like strengthening our bones,'),
    (101, 117, 'What does playing on a team teach?', ['Trusting other people', 'Avoiding all help', 'Winning alone'], 0, 'for instance, learning to trust\nand depend on others,'),
    (157, 175, 'What can learning through defeat build?', ['Resilience', 'Perfect scores', 'Faster running'], 0, 'The experience of coming to terms\nwith defeat can build the resilience'))
add('world-flight-miami-little-havana-video',
    (8, 25, 'Which US city has Little Havana?', ['Miami', 'Chicago', 'Boston'], 0, "Miami's Little Havana Cuban uh culture"),
    (30, 49, 'When did many Cuban refugees begin arriving?', ['1959', '1971', '2008'], 0, 'Cubans and then in 1959 this a very'),
    (112, 130, 'What game do people play in the park?', ['Dominoes', 'Chess', 'Cards'], 0, 'play dominoes as they discuss politics'))

# Teens B2: four dialogue stories and four documentary reports.
add('listening-r7-american-english-file-esl-reporting-lost-luggage',
    (26, 41, 'Which flight was Jenny on?', ['RT163', 'RT136', 'RT613'], 0, 'which flight were you on flight rt163'),
    (50, 65, 'How long will Jenny stay in the UK?', ['Ten days', 'Two weeks', 'One month'], 0, 'how long are you staying for 10 days'),
    (143, 160, 'How can Jenny track her suitcase?', ['Online', 'At the gate', 'Through a newspaper'], 0, 'online or just give us a call but we'))
add('listening-r7-american-english-file-esl-renting-a-car',
    (47, 60, 'What size car does the customer need?', ['A compact car', 'A large van', 'A seven-seat car'], 0, 'so a compact three-door yeah that\'ll be'),
    (60, 75, 'Which transmission does the customer choose?', ['Automatic', 'Manual', 'Electric'], 0, 'an automatic please'),
    (95, 110, 'What is the extra airport return charge?', ['50 pounds', '15 pounds', '65 pounds'], 0, 'charge of 50 pounds okay'))
add('listening-r7-american-english-file-esl-jenny-calls-rob',
    (27, 42, 'What is Andrew Page’s profession?', ['Scientist', 'Journalist', 'Doctor'], 0, "andrew page and he's a scientist and you"),
    (51, 65, 'Who has not come home for dinner?', ['Rob’s dad', 'Luke', 'Jenny’s mother'], 0, "your dad hasn't come home"),
    (101, 117, 'Who does Rob suggest Jenny call?', ['Luke', 'The taxi driver', 'Andrew'], 0, "why don't you ring luke"))
add('listening-r7-american-english-file-esl-roommate-rules',
    (35, 49, 'What food may not be cooked in the house?', ['Meat', 'Rice', 'Soup'], 0, "can't cook meat or leave meat products"),
    (74, 89, 'What kind of washing detergent does Simon prefer?', ['Eco-friendly', 'Scented', 'Powder only'], 0, 'eco-friendly detergents there\'s some in'),
    (89, 104, 'Why should they avoid hot water washes?', ['To save energy', 'To save soap', 'To protect the machine'], 0, "he's very keen on saving energy"))
add('world-flight-cairo-nile-explainer-video',
    (29, 47, 'Which lake was long considered the Nile’s source?', ['Lake Victoria', 'Lake Nasser', 'Lake Mead'], 0, 'For the longest time, Lake Victoria was considered\nthe source of the Nile.'),
    (88, 104, 'How often does the White Nile flow?', ['Year-round', 'Only in summer', 'Only after storms'], 0, 'of water year-round.'),
    (146, 164, 'What material makes flooded farmland fertile?', ['Silt', 'Salt', 'Gravel'], 0, 'hundreds of thousands of tons of fertile silt,\nwhich has been the backbone of Egyptian agriculture'))
add('world-flight-hong-kong-housing-video',
    (17, 33, 'What minimum floor area does the proposed law require?', ['Eight square meters', 'Five square meters', 'Twenty square meters'], 0, 'ensuring spaces like this are at least 8'),
    (49, 65, 'What do tenants fear renovations could raise?', ['Rent', 'Wages', 'Transport fares'], 0, 'of rents making the lives of people'),
    (121, 139, 'How many public housing units are planned?', ['50,000', '5,000', '500,000'], 0, 'accommodation with 50,000 units to come'))
add('world-flight-bogota-graffiti-projects-video',
    (23, 39, 'How many large mural spaces were set aside?', ['Five', 'Three', 'Ten'], 0, 'the mayor of bogota have set aside five'),
    (57, 73, 'How long can a graffiti painter be detained?', ['24 hours', 'One week', 'Six months'], 0, 'for 24 hours so it\'s you know that that'),
    (108, 123, 'What do scholarships help artists buy?', ['Supplies', 'Tickets', 'Uniforms'], 0, 'for delivery fees and supplies the'))
add('world-flight-madrid-prado-collections-video',
    (19, 34, 'Whose collection formed the museum’s original holdings?', ['Spanish kings', 'French artists', 'Local schools'], 0, 'of the kings of Spain a collection'),
    (39, 56, 'Which former museum added works to the collection?', ['Museum of the Trinity', 'Museum of Science', 'Maritime Museum'], 0, 'the Museum of the Trinity which brought'),
    (63, 78, 'How did the museum receive some later works?', ['Donations', 'Excavations', 'Competitions'], 0, 'donations and all of this is what forms'))

assert len(packs) == 30, len(packs)
count = 0
for path in sorted(Path('src/data').glob('*-library.json')):
    content = path.read_text(encoding='utf-8')
    items = json.loads(content)
    changed = False
    for item in items:
        if item.get('id') not in packs:
            continue
        item['listeningPack'] = packs[item['id']]
        item['transcriptVerified'] = True
        count += 1
        changed = True
    if changed:
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert count == 30, count
print(f'Wrote {count} listening packs with {count * 3} segments')
