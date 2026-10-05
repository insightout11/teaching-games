"""Hand-author 30 further caption-grounded listening packs for Round 12."""
import json
from pathlib import Path

packs = {}


def add(id, *segments):
    number = len(packs)
    built = []
    for index, (start, end, question, options, correct, key_line) in enumerate(segments):
        shift = (number + index) % len(options)
        built.append(dict(start=start, end=end, question=question,
                          options=options[shift:] + options[:shift],
                          correctIndex=(correct - shift) % len(options), keyLine=key_line))
    packs[id] = {"segments": built}


# Twelve young learners: eight A1 dialogues, three A2 interviews, one school announcement.
add('listening-r8-aef-looking-for-atm',
    (20, 34, 'What is the visitor looking for?', ['A cash machine', 'A post office', 'A café'], 0, 'excuse me uh is there a cash machine'),
    (27, 40, 'Which way should the visitor first turn?', ['Left', 'Right', 'Back'], 0, 'back sorry where is that turn left and'),
    (61, 77, 'Where is another cash machine?', ['HSBC', 'The library', 'The train station'], 0, "yeah there's one in HSBC go straight on"))
add('listening-r8-top-notch-whos-that',
    (28, 44, 'Where is the writer David said to be from?', ['France', 'Mexico', 'England'], 0, "duquesne he's a writer from france"),
    (41, 55, 'What job does Jeff Davis have?', ['Artist', 'Doctor', 'Lawyer'], 0, "he's an artist"),
    (57, 73, 'Where is Clark Thomas from?', ['England', 'France', 'Mexico'], 0, "from england he's a musician"))
add('listening-r8-top-notch-youre-late',
    (27, 42, 'What time is it when someone is called late?', ['Two minutes after six', 'Five to six', 'Half past seven'], 0, "two minutes after six i'm not late two"),
    (52, 69, 'What is showing at the Avalon?', ['A French movie', 'A play', 'A baseball game'], 0, 'great french movie at the avalon'),
    (72, 89, 'Which composer has a concert on Saturday?', ['Mozart', 'Beethoven', 'Bach'], 0, "oh look there's a mozart concert on"))
add('listening-r8-top-notch-weekend-plan',
    (23, 40, 'When is breakfast planned for friends?', ['Saturday morning', 'Saturday evening', 'Sunday afternoon'], 0, 'how about saturday morning'),
    (45, 60, 'What class is planned for Saturday afternoon?', ['Art', 'Music', 'Sport'], 0, "i'm taking an art class from one to"),
    (76, 92, 'What game is planned for Sunday?', ['Baseball', 'Basketball', 'Tennis'], 0, "i'm going to a baseball game with bob at"))
add('listening-r8-top-notch-trip',
    (25, 40, 'Which city did the doctor visit?', ['London', 'Paris', 'Rome'], 0, 'london it was fine thank you did you'),
    (36, 50, 'Did the doctor visit any museums?', ['No', 'Yes, many', 'Just one'], 0, "no i didn't visit any"),
    (73, 88, 'Why did the doctor travel?', ['For business', 'For a holiday', 'For a concert'], 0, 'i went to london for business not for'))
add('listening-r8-top-notch-fever',
    (17, 33, 'Who was Marie planning to meet for lunch?', ['Her sister', 'Her teacher', 'Her doctor'], 0, "i'm meeting my sister for lunch"),
    (39, 55, 'What illness does Marie supposedly have?', ['A fever', 'A cough', 'A broken arm'], 0, 'she has a fever'),
    (78, 94, 'What does Mr Evans decide to do?', ['Call the doctor', 'Go to lunch', 'Take a bus'], 0, "here i'm calling the doctor yes thank"))
add('listening-r8-top-notch-whos-this',
    (27, 44, 'How old is the brother?', ['34', '24', '44'], 0, "he's so handsome how old is he he's 34."),
    (63, 76, 'What job does the sister’s husband do?', ['Architect', 'Doctor', 'Lawyer'], 0, "he's an architect"),
    (75, 89, 'What does the sister’s son do?', ['Study at university', 'Work as a chef', 'Drive a taxi'], 0, "he's a university student"))
add('listening-r8-top-notch-morning',
    (25, 40, 'When does Paul say he gets up?', ['8:45', '5:00', '6:00'], 0, 'up before 8 45 8 45 that\'s late what'),
    (39, 52, 'Which chore is mentioned after breakfast?', ['Taking out the garbage', 'Washing the car', 'Cooking dinner'], 0, 'breakfast take out the garbage'),
    (56, 71, 'On which days does she exercise?', ['Monday, Wednesday and Friday', 'Saturday and Sunday', 'Every Tuesday'], 0, 'on monday wednesday and friday i'))
add('listening-r7-english-file-introductions',
    (15, 30, 'Where was the speaker born?', ['Cairo', 'New York', 'London'], 0, '>> I was born in Cairo, Egypt.'),
    (38, 56, 'What does the speaker do for work?', ['Gardening', 'Teaching', 'Cooking'], 0, ">> I'm a gardener."),
    (60, 72, 'What pet does the speaker have?', ['A cat', 'A dog', 'A bird'], 0, '>> I do. I have a cat.'))
add('listening-r7-english-file-likes-dislikes-1',
    (16, 32, 'Which city does the speaker find most beautiful?', ['Barcelona', 'Rome', 'Prague'], 0, 'Barcelona.'),
    (36, 53, 'Which room does the speaker like most?', ['The kitchen', 'The bedroom', 'The garden'], 0, 'kitchen cuz I really like cooking.'),
    (63, 78, 'What food is the speaker’s specialty?', ['Indian food', 'Italian food', 'Thai food'], 0, '>> My specialtity is Indian food. I like'))
add('listening-r7-english-file-names',
    (23, 38, 'What country does the first name come from?', ['Ireland', 'England', 'Scotland'], 0, ">> Uh, it's an Irish name. Um, and it comes"),
    (34, 49, 'Who chose the first speaker’s name?', ['His mother', 'His father', 'His teacher'], 0, '>> My mother chose my name.'),
    (63, 78, 'Whose name inspired the second speaker’s name?', ['Her dad’s', 'Her aunt’s', 'Her brother’s'], 0, "for my dad. My dad's name is Edward. And"))
add('listening-r8-school-registration',
    (20, 35, 'What must students hand in before noon?', ['Signed slips', 'Library books', 'Sports shoes'], 0, 'please hand in your class signed slips'),
    (35, 50, 'Where should scholarship applicants sign up?', ['The registrar section', 'The library', 'The sports hall'], 0, 'please sign up at the registrar section'),
    (63, 79, 'What kind of room should interested students meet in?', ['A classroom', 'A library', 'A cafeteria'], 0, 'classroom'))

# Ten B1 clips: one conversation, two weather announcements and seven explainers.
add('listening-r7-american-english-file-esl-harry-questions-rob',
    (17, 29, 'Where did Jenny study?', ['Harvard', 'Oxford', 'Cambridge'], 0, "study at harvard she's a very capable"),
    (29, 46, 'What work does Rob prefer?', ['Writing', 'Management', 'Photography'], 0, "uh no not really i'm more of a a writer"),
    (60, 76, 'What hobby does Jenny’s dad enjoy?', ['Photography', 'Gardening', 'Cooking'], 0, "my dad's a very keen photographer he"))
add('listening-r8-weather-intermediate',
    (15, 29, 'What high temperature is expected today?', ['27°C', '22°C', '15°C'], 0, 'And we can expect a high of 27° later'),
    (37, 52, 'What will the sky be like tonight?', ['Clear', 'Cloudy', 'Stormy'], 0, 'Skies will remain clear, making it a'),
    (49, 63, 'What may happen tomorrow afternoon?', ['Light rain', 'Snow', 'Strong winds'], 0, 'rain in the afternoon.'))
add('listening-r8-one-minute-weather-forecast',
    (0, 14, 'What warning has ended?', ['A flood warning', 'A heat warning', 'A snow warning'], 0, 'says that the flood warning is over for'),
    (13, 28, 'What high is forecast for tomorrow?', ['75 degrees', '63 degrees', '50 degrees'], 0, 'see a high of 75 scattered thunderstorms'),
    (31, 47, 'What weather system arrives by Sunday?', ['A cold front', 'A heatwave', 'A hurricane'], 0, 'cold front moving in that we will expect'))
add('world-flight-singapore-changi-jewel-video',
    (16, 32, 'In what year did Jewel open?', ['2019', '2009', '2022'], 0, 'in april 2019 changi opened up jewel a'),
    (70, 87, 'What is the Rain Vortex?', ['An indoor waterfall', 'A train platform', 'A roof garden'], 0, 'indoor waterfall in the world'),
    (104, 119, 'About how many trees are in the gardens?', ['More than 900', 'About 90', 'About 9,000'], 0, 'more than 900 trees and 60 thousand'))
add('world-flight-london-tube-engineering-video',
    (16, 31, 'When did the Underground first open?', ['1863', '1880', '1963'], 0, '1863 it was the first underground system'),
    (31, 48, 'How much of today’s network is above ground?', ['55%', '20%', '90%'], 0, "The Underground 55% of today's network"),
    (64, 80, 'What is the simulator usually used for?', ['Training drivers', 'Selling tickets', 'Planning routes'], 0, "used to train London underground's"))
add('world-flight-dubai-airport-history-video',
    (46, 62, 'What did Dubai International begin as?', ['A small airstrip', 'A seaport', 'A train station'], 0, 'from a small airirstrip serving a few'),
    (54, 70, 'How many airlines does the gateway serve?', ['130', '30', '230'], 0, 'airlines to a global gateway for 130'),
    (94, 112, 'Which airlines does the speaker name?', ['Emirates and Fly Dubai', 'Qantas and Jetstar', 'Air France and KLM'], 0, 'expansion of Emirates and Fly Dubai.'))
add('world-flight-mumbai-dabbawalas-video',
    (19, 34, 'What do dabbawalas bring to workplaces?', ['Home-cooked meals', 'Newspapers', 'School books'], 0, 'home-cooked meals to people at work'),
    (41, 56, 'When do they collect homemade lunches?', ['Around 9 a.m.', 'At noon', 'After sunset'], 0, 'around 9am and pick up homemade lunches'),
    (73, 87, 'What marks the lunchbox lids?', ['Letters', 'Photographs', 'Prices'], 0, 'so the lids are labeled with letters'))
add('world-flight-amsterdam-cycling-video',
    (12, 28, 'How long is the dedicated cycle-path network mentioned?', ['Over 500 km', 'About 50 km', 'Over 5,000 km'], 0, 'commutes daily on over 500 km of dedicated\ncycle paths.'),
    (56, 70, 'What happened to car numbers from 1960 to 1970?', ['They quadrupled', 'They halved', 'They stayed level'], 0, 'Between 1960 and 1970 the number of cars in\nthe country quadrupled,'),
    (113, 125, 'What was banned for one day each week?', ['Motor vehicles', 'Bicycles', 'Public buses'], 0, 'to ban motor vehicles for one day a week.'))
add('world-flight-perth-transperth-video',
    (43, 56, 'What technology did Transperth adopt first in Australia?', ['Smart cards', 'Driverless trains', 'Digital maps'], 0, "to use smart card technology it's also"),
    (51, 66, 'Which service joins buses and trains?', ['Ferries', 'Trams', 'Planes'], 0, 'ferry services'),
    (62, 77, 'What satisfaction level do surveys report?', ['90%', '50%', '30%'], 0, 'to be consistently at 90 percent'))
add('world-flight-hong-kong-transport-system-video',
    (24, 39, 'What does the MTR create around stations?', ['Malls', 'Farms', 'Factories'], 0, 'creates malls which include residential'),
    (77, 91, 'Where are some profits reinvested?', ['Expanding the network', 'Airport food', 'School uniforms'], 0, 'is then reinvested to expand and'),
    (85, 101, 'What fare is mentioned?', ['Less than one dollar', 'About ten dollars', 'Over fifty dollars'], 0, 'fairs being less than $1 which is low'))

# Eight B2 clips: two dramatic dialogues and six clear documentary segments.
add('listening-r7-american-english-file-esl-a-threatening-message',
    (53, 67, 'What does Luke say he has cracked?', ['A security code', 'A window', 'A phone screen'], 0, "i've cracked the security code on your"),
    (68, 84, 'What protects the files?', ['Encryption', 'A paper lock', 'A password note'], 0, 'and all the files are encrypted a page'),
    (113, 129, 'What do the people in the message want?', ['Documents', 'Jewelry', 'Tickets'], 0, 'want some documents'))
add('listening-r7-american-english-file-esl-making-a-plan',
    (51, 66, 'What weather is disrupting flights?', ['Heavy snow', 'Thick fog', 'Strong wind'], 0, "hi jenny any news it's snowing really"),
    (88, 103, 'What might the “old man” clue refer to?', ['A book', 'A bus', 'A restaurant'], 0, "about an old man it's the name of a book"),
    (139, 155, 'Which route might let them enter unseen?', ['A back footpath', 'The main gate', 'The roof'], 0, "footpath ah good idea"))
add('world-flight-rio-de-janeiro-favela-history-video',
    (8, 25, 'Which conflict appears in a favela origin story?', ['The Canudos War', 'The Cold War', 'The Crimean War'], 0, 'Perhaps the most common origin story goes\nback to the Canudos War of the 1890s.'),
    (35, 52, 'What payment problem affected the soldiers?', ['Unpaid wages', 'High rent', 'Lost taxes'], 0, "the government wasn't entirely ready\nto pay the wages of those soldiers."),
    (131, 147, 'What is the fourth way to view favelas?', ['Inequality', 'Tourism', 'Technology'], 0, 'The fourth lens through which\nwe view favelas is inequality.'))
add('world-flight-lagos-mass-transit-video',
    (94, 109, 'What transport does a commuter take daily?', ['A boat', 'A train', 'A bicycle'], 0, 'so I normally take boats every day in'),
    (103, 119, 'How long does the boat journey take?', ['20 to 35 minutes', 'Five minutes', 'Two hours'], 0, 'boat takes an average of 20 to 35'),
    (134, 149, 'Which land mode is named alongside roads?', ['Rail', 'Air', 'Cycling'], 0, 'transport and also the rail transport'))
add('world-flight-lima-transport-strike-video',
    (8, 23, 'Who called for a strike?', ['Transport unions', 'School principals', 'Shop owners'], 0, 'transport unions have called for a'),
    (38, 53, 'How do about half of Lima’s workers commute?', ['By bus', 'By ferry', 'By bicycle'], 0, 'by bus in response to the strike public'),
    (42, 57, 'What public service closes during the strike?', ['Schools', 'Hospitals', 'Libraries'], 0, 'schools are shut and the government has'))
add('world-flight-dublin-oscar-wilde-video',
    (14, 30, 'Which college did Oscar Wilde attend?', ['Trinity College Dublin', 'Oxford College', 'Harvard College'], 0, 'illustrious graduates at Trinity College'),
    (42, 57, 'When was the Wilde collection acquired?', ['2011', '1895', '1975'], 0, 'was acquired in 2011 from Julia'),
    (109, 125, 'What kind of cards showed Wilde’s face?', ['Advertising trade cards', 'Playing cards', 'Travel tickets'], 0, 'advertising trade cards he was so'))
add('world-flight-santiago-moai-video',
    (21, 38, 'What protected area covers part of the island?', ['A national park', 'A marine reserve', 'A city garden'], 0, 'National Park a world heritage property'),
    (42, 57, 'What large objects dot the landscape?', ['Moai statues', 'Glass towers', 'Wooden ships'], 0, 'artistic culture moai the enormous heads'),
    (94, 109, 'Which water activity is mentioned?', ['Surfing', 'Kayaking', 'Sailing'], 0, 'surfing and enticing beaches'))
add('bigthink_free_will_physics',
    (0, 16, 'What object does Newtonian determinism compare the universe to?', ['A clock', 'A river', 'A book'], 0, 'Newtonian Determinism says that the universe\nis a clock, a gigantic clock that’s wound'),
    (42, 58, 'Which scientific principle introduces uncertainty?', ['Heisenberg Uncertainty Principle', 'Theory of Relativity', 'Natural Selection'], 0, 'Heisenberg then comes along and proposes the\nHeisenberg Uncertainty Principle and says:'),
    (72, 88, 'What does the speaker say uncertainty allows?', ['Some free will', 'Perfect prediction', 'No choices'], 0, 'It means in some sense we do have some kind\nof free will.'))

assert len(packs) == 30, len(packs)
count = 0
for path in sorted(Path('src/data').glob('*-library.json')):
    items = json.loads(path.read_text(encoding='utf-8'))
    changed = False
    for item in items:
        if item.get('id') not in packs:
            continue
        if item['id'] == 'listening-r7-english-file-introductions':
            # The final stored caption ends at 71.2s; round the duration up.
            item['durationSecs'] = 72
        item['listeningPack'] = packs[item['id']]
        item['transcriptVerified'] = True
        changed = True
        count += 1
    if changed:
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert count == 30, count
print('Wrote 30 additional packs and 90 timed segments')
