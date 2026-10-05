"""Add five caption-timed, level-appropriate key words to each listening pack."""
import json
from pathlib import Path

words = {}


def add(key, *entries):
    assert key not in words and len(entries) == 5, key
    assert len({entry[0].casefold() for entry in entries}) == 5, key
    words[key] = [{'word': word, 'meaning': meaning, 'at': at} for word, meaning, at in entries]


add('bigthink_free_will_physics',
    ('clock', 'a tool that shows time', 0.6), ('fixed', 'already decided', 10.6),
    ('predetermined', 'decided before it happens', 33.2), ('electron', 'a tiny part of an atom', 50.2),
    ('uncertainty', 'not knowing exactly what will happen', 69.3))
add('kids_picky_pineapples',
    ('climates', 'kinds of weather in a place', 22.9), ('resource', 'something people can use', 25.7),
    ('communities', 'groups of people living together', 40.2), ('adapt', 'change to fit a situation', 45.0),
    ('survive', 'stay alive', 61.0))
add('kids_xyfuqfqfl30',
    ('solution', 'an answer to a problem', 60.9), ('engineer', 'a person who designs things', 60.9),
    ('brainstorm', 'think of many ideas', 85.3), ('criteria', 'rules for judging an idea', 110.1),
    ('checklist', 'a list to check', 118.8))
add('kids_8lfd_ekze2m',
    ('resources', 'things people need and use', 36.5), ('communities', 'groups of people living together', 38.8),
    ('deserts', 'very dry places', 50.7), ('thrive', 'grow and do well', 64.5),
    ('transform', 'change into a useful form', 79.8))
add('kids_uxh_7wbns3a',
    ('hydrosphere', 'all the water on Earth', 35.3), ('freshwater', 'water that is not salty', 48.3),
    ('glaciers', 'large masses of ice', 52.8), ('atmosphere', 'the air around Earth', 65.2),
    ('layers', 'levels on top of one another', 92.9))
add('kids_7vtfyamu6g4',
    ('landforms', 'shapes of land', 20.9), ('absorb', 'take in', 20.9),
    ('surface', 'the outside or top part', 51.2), ('sunlight', 'light from the Sun', 57.5),
    ('bounced back', 'sent back', 79.8))
add('listening-r7-english-file-introductions',
    ('born', 'came into the world', 15.3), ('family', 'parents and other close relatives', 19.1),
    ('live', 'have your home', 22.2), ('gardener', 'person who works with plants', 50.4),
    ('pet', 'animal you keep at home', 66.2))
add('listening-r7-english-file-likes-dislikes-1',
    ('beautiful', 'nice to look at', 14.1), ('architecture', 'the design of buildings', 21.2),
    ('favorite', 'liked best', 36.2), ('cooking', 'making food', 42.5),
    ('curries', 'spicy dishes with sauce', 72.1))
add('listening-r7-english-file-names',
    ('myth', 'an old traditional story', 30.6), ('chose', 'picked', 33.0),
    ('heritage', 'culture from your family’s past', 44.2), ('named', 'given a name after someone', 64.6),
    ('middle names', 'names between first and last', 81.1))
add('listening-r7-english-file-travel',
    ('culture', 'arts and ways of life', 31.7), ('ruins', 'old broken buildings', 67.3),
    ('civilization', 'a society from history', 78.4), ('recommend', 'say something is worth trying', 87.4),
    ('appalling', 'very bad', 134.8))
add('listening-r7-english-file-annoyances',
    ('annoy', 'make someone feel bothered', 26.4), ('ignore', 'not pay attention to', 29.0),
    ('browse', 'look around without buying yet', 35.2), ('assistance', 'help', 37.5),
    ('social', 'with other people', 61.3))
add('listening-r7-american-english-file-esl-jenny-s-and-rob-s-story',
    ('accent', 'the way a person sounds when speaking', 52.6), ('work trip', 'journey made for a job', 63.4),
    ('opportunity', 'a chance', 90.9), ('permanent', 'lasting rather than temporary', 99.8),
    ('parents', 'a mother and father', 158.4))
add('listening-r7-american-english-file-esl-meeting-jenny-s-parents',
    ('forgot', 'did not remember', 32.8), ('late', 'after the expected time', 53.5),
    ('introduce', 'help two people meet', 68.4), ('promotion', 'a move to a higher job', 113.3),
    ('boss', 'person in charge at work', 121.9))
add('listening-r7-american-english-file-esl-harry-questions-rob',
    ('ambitious', 'wanting to achieve a lot', 24.1), ('career', 'your working life', 31.3),
    ('management', 'leading work and people', 33.4), ('creative', 'good at making new ideas', 51.8),
    ('photography', 'taking pictures', 69.5))
add('listening-r7-american-english-file-esl-rob-s-interview',
    ('solo', 'alone rather than in a group', 46.7), ('private', 'not for everyone to know', 49.7),
    ('influenced', 'changed by something', 80.2), ('experimental', 'trying new ideas', 108.4),
    ('gigs', 'live music shows', 132.3))
add('listening-r7-american-english-file-esl-lunch-with-kerri',
    ('waiters', 'people who serve food', 29.7), ('friendly', 'kind and welcoming', 36.8),
    ('hectic', 'very busy', 63.0), ('prefer', 'like more', 75.3),
    ('relaxed', 'calm and at ease', 90.0))
add('listening-r7-american-english-file-esl-friendly-new-yorkers',
    ('service', 'help given to customers', 29.0), ('tip', 'extra money for service', 33.4),
    ('homesick', 'sad because you miss home', 65.7), ('regret', 'wish you had not done something', 59.4),
    ('kind', 'helpful and caring', 92.9))
add('listening-r7-american-english-file-esl-coffee-with-monica',
    ('getting married', 'planning to become a married couple', 46.5), ('engaged', 'promised to marry', 54.2),
    ('wedding', 'marriage celebration', 71.9), ('serious', 'important and lasting', 94.3),
    ('persuade', 'talk someone into doing something', 108.6))
add('listening-r7-american-english-file-esl-old-friends',
    ('college photos', 'pictures from university days', 36.8), ('interrupted', 'stopped something for a moment', 58.9),
    ('settling', 'starting a more settled life', 83.8), ('favor', 'something helpful asked of someone', 92.5),
    ('invited', 'asked someone to come', 108.2))
add('listening-r7-american-english-file-esl-playing-pool-with-paul',
    ('practice', 'doing something often to improve', 33.0), ('free time', 'time away from work', 52.2),
    ('uni', 'university', 79.3), ('girlfriend', 'a person someone is dating', 95.2),
    ('businessman', 'a person who works in business', 113.4))
add('listening-r7-american-english-file-esl-reporting-lost-luggage',
    ('suitcase', 'a bag for travel', 27.4), ('details', 'small pieces of information', 36.6),
    ('reference number', 'number used to find a report', 38.3), ('belongings', 'things someone owns', 101.3),
    ('track', 'follow where something is', 151.3))
add('listening-r7-american-english-file-esl-renting-a-car',
    ('compact', 'small', 53.0), ('automatic', 'a car that changes gears itself', 61.0),
    ('insurance', 'protection against certain costs', 76.2), ('parking tickets', 'fines for parking wrongly', 90.9),
    ('one-way rental', 'a hire returned in another place', 101.4))
add('listening-r7-american-english-file-esl-jenny-calls-rob',
    ('attacked', 'hurt by someone', 21.7), ('police', 'people who protect the public', 23.9),
    ('punctual', 'usually on time', 68.6), ('worrying', 'making people concerned', 65.9),
    ('alone', 'without another person', 93.1))
add('listening-r7-american-english-file-esl-a-threatening-message',
    ('security code', 'secret numbers or letters for access', 57.4), ('encrypted', 'locked in a coded form', 72.0),
    ('formula', 'a rule written with numbers or symbols', 87.4), ('documents', 'written files', 118.4),
    ('prove', 'show that something is true', 128.0))
add('listening-r7-american-english-file-esl-roommate-rules',
    ('rules', 'things people must follow', 32.3), ('vegetarian', 'person who does not eat meat', 39.9),
    ('password', 'secret word for access', 61.0), ('detergents', 'soap for washing clothes', 84.0),
    ('saving energy', 'using less power', 92.7))
add('listening-r7-american-english-file-esl-making-a-plan',
    ('flights', 'journeys by plane', 56.2), ('message', 'information sent to someone', 71.1),
    ('study', 'room for reading or working', 87.4), ('sneak in', 'enter quietly without being seen', 144.5),
    ('flashlights', 'small lights carried in the hand', 153.0))
add('listening-r8-aef-rob-checks-in',
    ('journalist', 'person who reports news', 32.7), ('work', 'your job', 51.8),
    ('reservation', 'a booking', 58.9), ('surname', 'family name', 62.4),
    ('room', 'space to sleep in a hotel', 86.7))
add('listening-r8-aef-jenny-buys-lunch',
    ('salad', 'cold dish with vegetables', 33.8), ('mineral water', 'bottled drinking water', 41.0),
    ('lunch', 'meal in the middle of the day', 69.7), ('park', 'green public place', 69.7),
    ('sandwich', 'food between pieces of bread', 75.4))
add('listening-r8-aef-dads-birthday',
    ('date', 'day of the month', 33.2), ('birthday', 'day you were born each year', 58.9),
    ('favorite', 'liked best', 74.4), ('wine', 'drink made from grapes', 74.4),
    ('worry', 'feel troubled', 90.5))
add('listening-r8-aef-looking-for-atm',
    ('cash machine', 'machine for taking out money', 21.4), ('near', 'not far away', 24.4),
    ('turn left', 'change direction to the left', 30.3), ('working', 'able to do its job', 64.0),
    ('another', 'one more', 64.0))
add('listening-r8-top-notch-nice-to-meet-you',
    ('president', 'person in charge of an organization', 26.5), ('receptionist', 'person who welcomes visitors', 28.8),
    ('tour guide', 'person who shows visitors places', 34.2), ('mailman', 'person who brings letters', 66.2),
    ('actor', 'person who plays a role in a show', 69.2))
add('listening-r8-top-notch-whos-that',
    ('writer', 'person who writes books or stories', 31.4), ('neighbor', 'person who lives nearby', 39.0),
    ('doctor', 'person who helps sick people', 41.1), ('artist', 'person who makes art', 48.0),
    ('musician', 'person who makes music', 59.9))
add('listening-r8-top-notch-get-there',
    ('corner', 'place where two streets meet', 35.3), ('blocks', 'short sections of a street', 38.7),
    ('station', 'place to get on a train', 42.5), ('bookstore', 'shop that sells books', 49.9),
    ('pharmacy', 'shop for medicine', 53.2))
add('listening-r8-top-notch-youre-late',
    ('late', 'after the agreed time', 27.5), ('early', 'before the agreed time', 44.1),
    ('birthday', 'day you were born each year', 53.4), ('concert', 'live music show', 73.3),
    ('writer', 'person who writes books', 84.5))
add('listening-r8-top-notch-weekend-plan',
    ('shopping', 'buying things', 26.6), ('laundry', 'clothes that need washing', 40.0),
    ('art class', 'lesson about making art', 47.4), ('exercising', 'moving to stay fit', 55.8),
    ('museum', 'place that shows art or history', 72.8))
add('listening-r8-top-notch-trip',
    ('trip', 'journey', 28.5), ('museums', 'places showing art or history', 33.5),
    ('hotel', 'place to stay when travelling', 53.9), ('business', 'work', 75.1),
    ('speeches', 'talks given to a group', 83.6))
add('listening-r8-top-notch-fever',
    ('sister', 'female sibling', 17.8), ('doctor', 'person who helps sick people', 31.0),
    ('fever', 'high body temperature when sick', 49.4), ('headache', 'pain in the head', 51.1),
    ('toothache', 'pain in a tooth', 75.9))
add('listening-r8-top-notch-whos-this',
    ('family', 'close relatives', 21.7), ('brother', 'male sibling', 29.8),
    ('mother', 'female parent', 51.4), ('architect', 'person who designs buildings', 69.5),
    ('student', 'person who studies', 79.2))
add('listening-r8-top-notch-morning',
    ('get up', 'leave your bed', 32.9), ('breakfast', 'first meal of the day', 42.8),
    ('laundry', 'clothes that need washing', 46.0), ('exercise', 'move to stay fit', 60.0),
    ('weekends', 'Saturday and Sunday', 71.3))
add('listening-r8-school-registration',
    ('signed slips', 'small papers with signatures', 21.1), ('fees', 'money paid for a service', 27.8),
    ('scholarship', 'money to help pay for study', 39.1), ('session', 'scheduled meeting', 56.1),
    ('classroom', 'room where lessons happen', 73.4))
add('listening-r8-weather-intermediate',
    ('clouds', 'white or grey shapes in the sky', 49.6), ('temperatures', 'how hot or cold it is', 13.4),
    ('light winds', 'gentle moving air', 25.2), ('picnic', 'meal eaten outside', 33.5),
    ('umbrella', 'cover held over you in rain', 55.2))
add('listening-r8-one-minute-weather-forecast',
    ('flood warning', 'notice that water may rise dangerously', 2.0), ('drizzle', 'light rain', 9.9),
    ('fog', 'cloud close to the ground', 11.8), ('thunderstorms', 'storms with thunder', 16.0),
    ('cold front', 'moving area of cooler air', 32.0))
add('teded_hmfqqjmf_f0',
    ('cholesterol', 'fat-like substance in the blood', 48.1), ('endorphins', 'body chemicals linked to pleasure', 58.9),
    ('focus', 'attention on one thing', 74.2), ('team', 'group working or playing together', 104.1),
    ('resilience', 'ability to recover after difficulty', 164.9))
add('world-flight-singapore-changi-jewel-video',
    ('lifestyle hub', 'place for shopping and leisure', 20.4), ('layovers', 'waiting periods between flights', 40.5),
    ('rainforest', 'forest with much rain', 38.4), ('recirculated', 'moved through a system again', 86.4),
    ('walking trails', 'paths for walking', 114.2))
add('world-flight-london-tube-engineering-video',
    ('underground', 'below the ground', 18.6), ('network', 'connected lines or routes', 34.5),
    ('tunnels', 'passages through the ground', 40.3), ('operates', 'runs or works', 53.7),
    ('simulator', 'machine that copies a real experience', 68.1))
add('world-flight-cairo-nile-explainer-video',
    ('tributary', 'river flowing into a larger river', 21.0), ('source', 'place where a river begins', 30.6),
    ('climates', 'usual weather patterns of places', 86.5), ('wet season', 'part of the year with much rain', 111.1),
    ('silt', 'fine soil carried by a river', 146.7))
add('world-flight-dubai-airport-history-video',
    ('airlines', 'companies that fly passengers', 54.8), ('gateway', 'place connecting travellers to other places', 54.8),
    ('passengers', 'people travelling', 71.2), ('infrastructure', 'buildings and systems that support travel', 96.2),
    ('expansion', 'growth', 99.0))
add('world-flight-mumbai-dabbawalas-video',
    ('home-cooked meals', 'food prepared at home', 24.7), ('deliver', 'take to the person meant to receive it', 22.7),
    ('bicycles', 'two-wheeled vehicles you pedal', 43.5), ('lunchboxes', 'containers for a midday meal', 53.4),
    ('labeled', 'marked with information', 77.0))
add('world-flight-rio-de-janeiro-favela-history-video',
    ('origin story', 'account of how something began', 9.8), ('soldiers', 'people serving in an army', 36.3),
    ('wages', 'money paid for work', 36.3), ('tenements', 'older crowded housing', 117.4),
    ('inequality', 'large unfair differences', 132.6))
add('world-flight-lagos-mass-transit-video',
    ('boats', 'small water vehicles', 96.0), ('road', 'route for land vehicles', 109.0),
    ('congested', 'too crowded with traffic', 125.4), ('alternatives', 'other choices', 128.5),
    ('multimodal', 'using several kinds of transport', 136.4))
add('world-flight-hong-kong-transport-system-video',
    ('rail', 'train transport', 24.3), ('residential', 'used as homes', 31.9),
    ('infrastructure', 'basic systems a city needs', 62.6), ('profits', 'money left after costs', 80.1),
    ('reinvested', 'put back into a project', 82.0))
add('world-flight-hong-kong-housing-video',
    ('tiny room', 'very small living space', 11.1), ('landlord', 'person who rents out a home', 30.8),
    ('rent', 'money paid to live somewhere', 33.3), ('renovated', 'repaired or improved', 47.5),
    ('affordable', 'not too expensive', 126.4))
add('world-flight-amsterdam-cycling-video',
    ('commutes', 'travels regularly to work', 16.4), ('cycle paths', 'routes for bicycles', 16.4),
    ('traffic', 'vehicles on streets', 53.5), ('road fatalities', 'deaths in road crashes', 102.5),
    ('opposition', 'people or actions against a plan', 89.2))
add('world-flight-miami-little-havana-video',
    ('culture', 'a group’s ways of life', 14.2), ('refugees', 'people forced to leave home', 34.2),
    ('neighborhood', 'part of a city where people live', 55.0), ('gather', 'come together', 82.5),
    ('dominoes', 'game played with marked tiles', 123.4))
add('world-flight-bogota-graffiti-projects-video',
    ('mural', 'large painting on a wall', 29.0), ('talent', 'special skill', 37.4),
    ('decriminalize', 'stop treating as a crime', 51.9), ('vandalize', 'damage property deliberately', 98.2),
    ('scholarships', 'money given to support study or work', 109.1))
add('world-flight-lima-transport-strike-video',
    ('commuters', 'people travelling regularly', 2.5), ('strike', 'workers stopping work in protest', 11.0),
    ('insecurity', 'lack of safety', 30.4), ('extortion', 'getting money through threats', 57.4),
    ('work from home', 'do your job at home', 49.8))
add('world-flight-perth-transperth-video',
    ('demand', 'how much a service is wanted', 40.8), ('innovation', 'use of new ideas', 45.8),
    ('integrated', 'joined into one system', 53.1), ('satisfaction', 'feeling that something is good', 65.4),
    ('rapid transport', 'fast travel service', 76.3))
add('world-flight-madrid-prado-collections-video',
    ('collections', 'groups of objects kept together', 15.2), ('assembled', 'put together', 24.2),
    ('institutions', 'organizations', 37.2), ('acquired', 'got or bought', 66.5),
    ('donations', 'things freely given', 72.4))
add('world-flight-dublin-oscar-wilde-video',
    ('celebrity culture', 'public interest in famous people', 27.2), ('archive', 'collection of historical records', 46.4),
    ('exhibition', 'public display of objects', 57.4), ('memorabilia', 'objects linked to a person or event', 61.7),
    ('advertising trade cards', 'printed cards used to promote goods', 116.1))
add('world-flight-santiago-moai-video',
    ('cultural', 'about people’s traditions and art', 32.6), ('monuments', 'large objects built to remember something', 52.4),
    ('restored', 'repaired or returned to earlier form', 68.3), ('quarried', 'taken from a rock site', 82.0),
    ('diving', 'swimming below the water', 99.8))

assert len(words) == 60, len(words)
count = 0
for path in sorted(Path('src/data').glob('*-library.json')):
    items = json.loads(path.read_text(encoding='utf-8'))
    edited = False
    for item in items:
        if not item.get('listeningPack'):
            continue
        item['listeningPack']['words'] = words[item['id']]
        count += 1
        edited = True
    if edited:
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert count == 60, count
print(f'Added {count * 5} timed words to {count} packs.')
