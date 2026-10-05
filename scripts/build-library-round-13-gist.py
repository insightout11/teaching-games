"""Add reviewed, window-grounded gist and inference questions to all listening packs."""
import json
from pathlib import Path

questions = {}


def q(text, right, wrong_a, wrong_b):
    return (text, [right, wrong_a, wrong_b])


def add(key, topic, purpose, whole, harder):
    assert key not in questions, key
    questions[key] = [topic, purpose, whole, harder]


# The first five are explainers; their 90-second kids windows may stop before
# the original clip does. All answerable claims below occur before that cap.
add('bigthink_free_will_physics',
    q('What question drives this explanation?', 'Can physics leave room for free will?', 'Can clocks measure time perfectly?', 'Can people live on other planets?'),
    q('How does the speaker develop the idea?', 'He contrasts fixed laws with uncertainty.', 'He tells a story about a physicist’s childhood.', 'He gives instructions for an experiment.'),
    q('Which view does the speaker end up favouring?', 'The future cannot be fully predicted from the past.', 'Every future act is already certain.', 'Electron movement has no bearing on the debate.'),
    q('Why does the speaker reject a fully fixed future?', 'Uncertainty remains even when earlier events are known.', 'Newton did not believe the universe had laws.', 'People can see every electron at once.'))
add('kids_picky_pineapples',
    q('What is this explanation mostly about?', 'Getting resources a place does not have', 'Growing the biggest pineapple', 'Playing football with fruit'),
    q('Why does the speaker use pineapples?', 'To show that resources grow in some places only', 'To teach a recipe', 'To compare different sports'),
    q('What problem do people face in the example?', 'They need things that are not nearby.', 'They have too many pineapples.', 'They cannot choose where to live.'),
    q('Why is water a more serious example than pineapple?', 'People need water to survive.', 'Water grows in warm places.', 'Pineapples are always free.'))
add('kids_xyfuqfqfl30',
    q('What is the speaker mostly explaining?', 'How to judge a possible solution', 'How to build a refrigerator', 'How to visit a canyon'),
    q('Why does the speaker imagine a canyon?', 'To test what a good solution must do', 'To describe a real holiday', 'To teach river names'),
    q('How should the engineer choose between possible ideas?', 'Check them against what a good solution needs to do', 'Pick the funniest idea first', 'Choose the most expensive tool'),
    q('Why does the engineer make a checklist?', 'To compare ideas with the needs of the problem', 'To count people in the canyon', 'To remember a shopping trip'))
add('kids_8lfd_ekze2m',
    q('What are the speakers mainly talking about?', 'Resources people need from Earth', 'Different kinds of cake', 'The coldest mountain'),
    q('Why do people often live near water and food?', 'It is easier to get what they need.', 'They never need to travel.', 'The weather is always warm.'),
    q('What do people sometimes do with natural resources?', 'Change them before using them', 'Leave all of them untouched', 'Find them only in deserts'),
    q('Why must water be cleaned before people drink it?', 'A natural resource may not be ready to use.', 'Rivers are always too cold.', 'Cake needs no water.'))
add('kids_uxh_7wbns3a',
    q('What are the two big parts of Earth in this clip?', 'Water and air', 'Rocks and animals', 'Cities and roads'),
    q('What does the speaker want us to understand?', 'Water and air are found in many forms and places.', 'All water is in oceans.', 'The air has no layers.'),
    q('How does the speaker describe the atmosphere?', 'A blanket of gases around Earth', 'A lake under the ground', 'A kind of frozen river'),
    q('Why does the speaker mention rain and clouds?', 'To connect water with the air above us', 'To show that oceans are dry', 'To explain how to build a house'))
add('kids_7vtfyamu6g4',
    q('What is the clip mostly about?', 'The Sun warming land and water', 'How to travel to the Sun', 'Why clouds are made of sand'),
    q('What is the speaker trying to compare?', 'How land and water take in heat', 'How many planets have water', 'How quickly people can run'),
    q('What happens to the Sun’s energy on its way to land and water?', 'Some is absorbed or reflected before the rest reaches the surface.', 'All of it reaches the ground unchanged.', 'The Moon turns it into rain.'),
    q('Why does some sunlight not warm Earth’s surface?', 'The atmosphere and clouds absorb or reflect some.', 'The Sun stops shining at noon.', 'Land sends all light to the Moon.'))

# Short interviews and conversations from the English File collections.
add('listening-r7-english-file-introductions',
    q('What is this conversation mainly about?', 'Getting to know someone', 'Buying a house', 'Planning a trip'),
    q('What do the questions help the listener learn?', 'The speaker’s life and family', 'The weather tomorrow', 'The price of food'),
    q('How does the speaker answer?', 'By sharing simple personal details', 'By giving directions', 'By refusing every question'),
    q('Why is this a first conversation?', 'The interviewer asks basic questions about the person.', 'They are arguing about an old problem.', 'They already know every detail.'))
add('listening-r7-english-file-likes-dislikes-1',
    q('What do the interviews mostly ask about?', 'Things the speaker likes', 'A lost passport', 'A school rule'),
    q('How does the speaker describe favourite things?', 'By giving reasons and examples', 'By reading a timetable', 'By giving only yes or no answers'),
    q('Which feeling fits the answers?', 'Interest and enjoyment', 'Fear of travelling', 'Anger about cooking'),
    q('Why does the speaker talk about the kitchen and food?', 'Cooking is something they enjoy.', 'They are opening a restaurant today.', 'They have no place to cook.'))
add('listening-r7-english-file-names',
    q('What is the recording mainly about?', 'Stories behind people’s names', 'Choosing a school subject', 'Ordering at a café'),
    q('Why do the speakers explain their names?', 'The names connect to family and heritage.', 'The names are secret passwords.', 'The names are places they visited.'),
    q('What do both name stories have in common?', 'Family members helped choose the names.', 'Both speakers changed names yesterday.', 'Neither knows where the name came from.'),
    q('Why did the first speaker’s mother choose an Irish name?', 'To keep a link with Irish heritage', 'To match a famous singer', 'To make school work easier'))
add('listening-r7-english-file-travel',
    q('What kinds of trips does the speaker describe?', 'A loved place, a historic visit, and a bad holiday', 'Three work meetings', 'Only a beach holiday'),
    q('How does the speaker feel about the ancient site?', 'Interested and willing to recommend it', 'Bored and unwilling to return', 'Unable to remember it'),
    q('What makes the holiday stories different?', 'One is interesting while another is spoiled by weather.', 'Every trip has perfect weather.', 'All trips happen in the same city.'),
    q('Why does the speaker remember the rainy family trip so clearly?', 'Bad weather kept everyone inside and arguing.', 'They won a prize there.', 'They climbed a sunny mountain.'))
add('listening-r7-english-file-annoyances',
    q('What is the interview mainly about?', 'Everyday behaviour that irritates someone', 'Buying a new phone', 'Learning a new language'),
    q('What does the speaker prefer in public places?', 'People giving space and attention when needed', 'People asking questions all the time', 'Everyone using a phone at dinner'),
    q('How does the speaker feel about constant phone use?', 'Annoyed in social situations', 'Pleased by it', 'Unaware of it'),
    q('Why does the speaker mention a pub and dinner?', 'They expect people to focus on those around them.', 'They are reviewing two restaurants.', 'They lost a phone there.'))
add('listening-r7-american-english-file-esl-jenny-s-and-rob-s-story',
    q('What story are Jenny and Rob telling?', 'How work and a relationship brought Rob to New York', 'How to start a new magazine', 'How to book a holiday in London'),
    q('How do the speakers feel about their life together?', 'Mostly happy, with some worry about change', 'Angry about the magazine', 'Certain they will move tomorrow'),
    q('What is changing for them now?', 'Jobs and family relationships', 'The weather and train routes', 'The name of their magazine'),
    q('Why might meeting Jenny’s parents feel important?', 'Their relationship is becoming more serious.', 'Rob is applying to university.', 'Jenny’s parents own the magazine.'))
add('listening-r7-american-english-file-esl-meeting-jenny-s-parents',
    q('What is this scene mainly about?', 'A first family meeting with a small mishap', 'A medical appointment', 'A train journey'),
    q('How do Jenny’s parents react overall?', 'They welcome Rob and celebrate good news.', 'They refuse to let him in.', 'They ask him to leave New York.'),
    q('How does the mood change?', 'Worry about a forgotten gift gives way to warm news.', 'Everyone becomes angry and leaves.', 'A quiet dinner turns into an emergency.'),
    q('Why is forgetting the gift not a disaster?', 'The parents say not to worry and invite them in.', 'The gift was never meant for them.', 'The shop is still open.'))
add('listening-r7-american-english-file-esl-harry-questions-rob',
    q('What are Harry and Rob mostly discussing?', 'Rob’s career and interests', 'A missing suitcase', 'A sports match'),
    q('What does Harry seem to care about?', 'Whether creative work can pay the bills', 'Whether Rob can drive', 'Whether Jenny likes jazz'),
    q('How does Rob present himself?', 'As a writer who values creative work', 'As a manager who dislikes writing', 'As a professional photographer'),
    q('Why might Rob feel tested by Harry?', 'Harry asks about his future and the money in creative work.', 'Harry asks him to cook dinner.', 'Harry cannot remember his name.'))
add('listening-r7-american-english-file-esl-rob-s-interview',
    q('Who is Rob interviewing?', 'A musician with a new solo career', 'An airport employee', 'A school principal'),
    q('What is Kerri willing to talk about?', 'Her music and future performances', 'Every detail of her private life', 'Only her favourite food'),
    q('What mood does Kerri show toward Rob’s private questions?', 'Guarded and firm', 'Delighted and talkative', 'Confused about music'),
    q('Why does Kerri refuse to explain the band breakup?', 'She wants to keep private matters private.', 'She has forgotten the band.', 'She cannot hear the question.'))
add('listening-r7-american-english-file-esl-lunch-with-kerri',
    q('What do the diners mainly debate?', 'London and New York', 'Which band is best', 'What to order for lunch'),
    q('How do their opinions compare?', 'They disagree about which city they prefer.', 'They all prefer London.', 'They all dislike both cities.'),
    q('What do they use to defend their views?', 'Everyday experiences in each city', 'Sports scores', 'A weather chart only'),
    q('Why does Rob hesitate when asked to choose?', 'He has ties to both cities.', 'He has never visited either.', 'He is choosing a meal instead.'))
add('listening-r7-american-english-file-esl-friendly-new-yorkers',
    q('What are Jenny and Rob talking about?', 'Missing London while settling into New York', 'Finding a new job in London', 'Planning a long holiday'),
    q('How does Rob feel about moving?', 'He misses some things but does not regret it.', 'He wants to leave immediately.', 'He has forgotten London.'),
    q('What overall view is tested and then supported?', 'New Yorkers can be friendly even while Rob misses London.', 'Rob dislikes London and loves every part of New York.', 'Jenny decides the city is unsafe.'),
    q('Why does Jenny mention the driver at the end?', 'His helpful act supports her view that people are friendly.', 'She wants to buy his taxi.', 'He knows where Rob lived in London.'))
add('listening-r7-american-english-file-esl-coffee-with-monica',
    q('What personal news do the friends share?', 'A wedding plan and a new relationship', 'Two new jobs', 'A cancelled journey'),
    q('How does Monica seem to feel?', 'Excited about getting married', 'Unhappy about leaving school', 'Angry with Jenny'),
    q('What does their talk show about Jenny and Rob?', 'The relationship is new and Jenny is hopeful.', 'They have already set a wedding date.', 'They have decided to move to London.'),
    q('Why does Monica ask whether Rob will stay?', 'He recently moved from London and their future is uncertain.', 'He has booked a flight tonight.', 'He dislikes the wedding plans.'))
add('listening-r7-american-english-file-esl-old-friends',
    q('What is this scene mainly about?', 'Friends meeting and changing plans', 'Buying a new flat', 'A sports competition'),
    q('How do the speakers react to meeting and news?', 'Warmly and with interest', 'With fear and suspicion', 'Without talking'),
    q('How does the scene link past and present friendships?', 'An old friend’s visit changes the couple’s plans.', 'The friends decide never to meet again.', 'College photos start an argument.'),
    q('Why does Rob want to change the week’s plans?', 'A university friend is coming to visit.', 'His job has ended.', 'He has lost his passport.'))
add('listening-r7-american-english-file-esl-playing-pool-with-paul',
    q('What are Rob and Paul mostly doing?', 'Playing pool and comparing past with present', 'Looking for a missing suitcase', 'Planning a concert'),
    q('How does Paul view Rob’s new life?', 'As more settled than their university days', 'As exactly like their student days', 'As a life without any work'),
    q('How does Rob respond to Paul’s teasing?', 'He defends Jenny and his choices.', 'He promises to leave Jenny.', 'He says he has no job.'),
    q('Why does Paul mention Rob’s shirt and job?', 'He thinks Rob has become more conventional.', 'He wants to borrow the shirt.', 'He is interviewing Rob for work.'))
add('listening-r7-american-english-file-esl-reporting-lost-luggage',
    q('What problem is the conversation about?', 'A suitcase that did not arrive', 'A cancelled hotel room', 'A missed flight home'),
    q('What does the airport worker mainly do?', 'Collect details and explain the next steps', 'Sell a new suitcase', 'Arrange a sightseeing trip'),
    q('How does the conversation end?', 'With a way to track the missing bag', 'With the suitcase found immediately', 'With Jenny buying another ticket'),
    q('Why does the worker ask for a description and contact details?', 'To identify the bag and return it to Jenny', 'To book Jenny a later flight', 'To check what Jenny bought abroad'))
add('listening-r7-american-english-file-esl-renting-a-car',
    q('What are the speakers arranging?', 'A short car rental', 'A permanent car purchase', 'A train season ticket'),
    q('What does the employee explain?', 'The car choice, costs, and return rules', 'How to repair an engine', 'How to pass a driving test'),
    q('How does the customer seem?', 'Ready to rent after checking the terms', 'Uninterested in any car', 'Angry that cars are unavailable'),
    q('Why would returning the car at the airport cost more?', 'It is a one-way rental.', 'The car has no fuel.', 'The customer chose a manual car.'))
add('listening-r7-american-english-file-esl-jenny-calls-rob',
    q('Why does Jenny phone Rob?', 'She is worried about a missing person and an attack.', 'She needs a dinner recipe.', 'She has a new job offer.'),
    q('How does the conversation feel?', 'Tense and uncertain', 'Relaxed and funny', 'Cheerful about a holiday'),
    q('What do they decide Jenny should do?', 'Seek help and avoid staying alone', 'Wait alone without telling anyone', 'Go straight to the airport'),
    q('Why does Rob suggest Jenny stay with Luke?', 'She feels unsafe alone while they contact the police.', 'Luke has a better dinner plan.', 'Rob wants her to miss work.'))
add('listening-r7-american-english-file-esl-a-threatening-message',
    q('What mystery are Jenny and Luke trying to solve?', 'Strange files and a message about Henry', 'A lost holiday booking', 'A broken musical instrument'),
    q('How does the mood change when they open the computer?', 'A success turns into new worry.', 'Fear turns into a celebration.', 'Nothing important changes.'),
    q('What does the message suggest?', 'Henry is under pressure and needs them to leave documents.', 'Henry has gone on holiday.', 'The computer belongs to Rob.'),
    q('Why does cracking the code not solve the problem?', 'The files remain unclear and the message reveals a threat.', 'The screen has no files.', 'They already have Henry safely at home.'))
add('listening-r7-american-english-file-esl-roommate-rules',
    q('What is the conversation mainly about?', 'Rules for staying in someone’s home', 'Opening a restaurant', 'Planning a road trip'),
    q('What kind of home does Simon want?', 'One that avoids meat and saves energy', 'One that serves meat every day', 'One with no rules at all'),
    q('How does the guest respond to the rules?', 'Mostly accepts them and asks practical questions', 'Refuses to stay immediately', 'Changes every rule'),
    q('Why does the host explain the washing rules?', 'Simon wants the household to use energy more carefully.', 'The machine is broken.', 'The guest has no clothes.'))
add('listening-r7-american-english-file-esl-making-a-plan',
    q('What are the speakers trying to do?', 'Find Henry while Rob is stuck away', 'Choose a new school', 'Book a beach holiday'),
    q('How do they respond to the obstacle?', 'They plan a careful visit to Henry’s house.', 'They give up looking.', 'They wait for the snow to stop before talking.'),
    q('What is the mood of the plan?', 'Worried but determined', 'Carefree and playful', 'Bored and uninterested'),
    q('Why do Jenny and Luke choose darkness and a back path?', 'They think someone may be watching the house.', 'They want to surprise Henry for his birthday.', 'The front door is painted red.'))
add('listening-r8-aef-rob-checks-in',
    q('What is Rob doing?', 'Checking in at a hotel', 'Buying lunch', 'Meeting a doctor'),
    q('What kind of visit do we hear about?', 'A work trip with a hotel check-in', 'A holiday with lunch in a park', 'A family visit with a birthday gift'),
    q('What happens in the conversation?', 'Rob gives his name and gets a room.', 'Rob loses his bag.', 'Rob orders a meal.'),
    q('Why does the receptionist ask Rob to spell his name?', 'To find the correct reservation', 'To teach him English', 'To call a taxi'))
add('listening-r8-aef-jenny-buys-lunch',
    q('What are the speakers doing?', 'Buying food and making a lunch plan', 'Booking a hotel room', 'Choosing a film'),
    q('Where does the talk move?', 'From a shop to a plan with a friend', 'From a classroom to a test', 'From a bus to a train'),
    q('How do the friends feel about lunch together?', 'Happy to do it', 'Too busy to meet', 'Angry with each other'),
    q('Why does the friend order more food?', 'She wants to join Jenny for lunch.', 'She is taking food home for dinner.', 'She dislikes the park.'))
add('listening-r8-aef-dads-birthday',
    q('What is the scene about?', 'A birthday mix-up', 'A lost wine bottle', 'A late train'),
    q('What does Rob think is happening?', 'He is visiting Dad on his birthday.', 'He is attending a work meeting.', 'He is planning a holiday.'),
    q('How does Dad react to the mistake?', 'Kindly invites Rob in', 'Gets very angry', 'Leaves without speaking'),
    q('Why is Rob embarrassed?', 'He has confused June with July.', 'He has forgotten his own name.', 'He brought no gift.'))
add('listening-r8-aef-looking-for-atm',
    q('What problem does the visitor have?', 'Finding a working cash machine', 'Finding a hospital', 'Finding a new hotel'),
    q('What do the helpers do?', 'Give directions to cash machines', 'Sell a train ticket', 'Explain a school rule'),
    q('Why does the visitor ask again?', 'The first machine does not work.', 'The first helper is absent.', 'The visitor wants a café.'),
    q('What is the visitor likely to do next?', 'Follow the new directions to another machine', 'Return to the broken machine', 'Go home without trying again'))
add('listening-r8-top-notch-nice-to-meet-you',
    q('What are the people doing?', 'Meeting people at a workplace', 'Choosing a holiday', 'Ordering dinner'),
    q('What do most people tell the visitor?', 'Their names and jobs', 'Their birthdays', 'Their favourite sports'),
    q('How is Bob’s introduction different?', 'People guess his job before he speaks.', 'He refuses to say his name.', 'He has just arrived from abroad.'),
    q('Why is the visitor confused about Bob?', 'Several people guess different jobs for him.', 'Bob speaks a different language.', 'The office is closing.'))
add('listening-r8-top-notch-whos-that',
    q('What are the speakers trying to do?', 'Identify people they see', 'Find a missing suitcase', 'Choose a restaurant'),
    q('How does the conversation go?', 'They make and correct several guesses.', 'They agree on every name at once.', 'They only talk about the weather.'),
    q('What is funny about their guesses?', 'They keep naming the wrong person.', 'Everyone has the same job.', 'Nobody can see the people.'),
    q('Why might a listener doubt the final identification?', 'Earlier confident guesses were repeatedly wrong.', 'The final person is not visible.', 'The speakers have never met.'))
add('listening-r8-top-notch-get-there',
    q('What is the conversation for?', 'Finding the way to a café', 'Buying a train ticket', 'Choosing a book'),
    q('What does the helper give?', 'A route past streets and shops', 'A menu and a price', 'A list of school classes'),
    q('What does the visitor do with the route?', 'Repeats it to check understanding', 'Ignores it and leaves', 'Calls a taxi immediately'),
    q('Why does the helper repeat the directions?', 'The route has several turns and landmarks.', 'The café has closed.', 'The visitor cannot walk.'))
add('listening-r8-top-notch-youre-late',
    q('What are the speakers talking about?', 'Time and plans for a birthday', 'A missed flight', 'A school timetable'),
    q('What makes their planning difficult?', 'They disagree about time and have many event choices.', 'No events happen on Saturday.', 'They are in different countries.'),
    q('What pattern appears in their talk?', 'They have different ideas about timing and Saturday plans.', 'They agree immediately on every time and event.', 'They decide to leave town for the weekend.'),
    q('Why might they need to choose one Saturday event?', 'Several events are offered for the same evening.', 'All the tickets are free.', 'The birthday is next month.'))
add('listening-r8-top-notch-weekend-plan',
    q('What are the friends trying to plan?', 'A time to meet at the weekend', 'A birthday gift', 'A school trip'),
    q('What makes it hard to meet?', 'One friend has many plans already.', 'The shops are closed.', 'They live far apart.'),
    q('How does the conversation end?', 'They find a later time that works.', 'They stop speaking.', 'They cancel the weekend.'),
    q('Why do they suggest late Sunday afternoon?', 'Earlier times are filled with other plans.', 'The art class begins then.', 'The game finishes next week.'))
add('listening-r8-top-notch-trip',
    q('What are the speakers discussing?', 'A doctor’s trip to London', 'A new hospital', 'A family birthday'),
    q('Why does one speaker expect a different trip story?', 'They think London meant sightseeing and fun.', 'They know the doctor dislikes travel.', 'They were on the trip too.'),
    q('What misunderstanding drives the conversation?', 'One person expects sightseeing, but the doctor was working.', 'The doctor cannot remember where he went.', 'They disagree about the name of the city.'),
    q('Why did the doctor see so little of London?', 'Meetings and speeches kept him at the hotel.', 'The city was closed.', 'He lost his map.'))
add('listening-r8-top-notch-fever',
    q('What is the scene mostly about?', 'An excuse for missing lunch grows into a problem.', 'A real hospital visit', 'A plan to buy lunch'),
    q('How does Marie react when the boss offers help?', 'She goes along with the invented illness.', 'She says she is perfectly healthy.', 'She leaves for the airport.'),
    q('Why is the story funny?', 'Each person adds another illness to the excuse.', 'The doctor forgets the appointment.', 'Nobody remembers lunch.'),
    q('Why does the boss call a doctor?', 'He believes Marie has many symptoms.', 'He knows she wanted to meet her sister.', 'He needs a doctor for himself.'))
add('listening-r8-top-notch-whos-this',
    q('What are the speakers looking at?', 'Photos of a family', 'A new house', 'A school book'),
    q('What does one speaker keep asking?', 'Who each person is', 'How to get to a shop', 'What time a film starts'),
    q('How do the descriptions sound?', 'Curious, with some awkward comments', 'Angry and silent', 'Like a news report'),
    q('Why does the family member correct the word old?', 'They think the comment about their mother is unkind.', 'Their mother is a child.', 'The photo shows a stranger.'))
add('listening-r8-top-notch-morning',
    q('What are the two people comparing?', 'Their morning routines', 'Their holiday trips', 'Their dinner plans'),
    q('How are their mornings different?', 'One starts late; the other does many things early.', 'Both sleep until noon.', 'Neither goes to work.'),
    q('How does Paul react to the other routine?', 'Surprised by how much gets done', 'Angry about the newspaper', 'Uninterested in it'),
    q('Why does the early riser sleep until six at weekends?', 'Six is later than their usual five o’clock start.', 'They work all night.', 'They never sleep before then.'))
add('listening-r8-school-registration',
    q('What is this announcement mainly for?', 'Giving students school deadlines and meeting information', 'Advertising a concert', 'Explaining a weather forecast'),
    q('What should students do after hearing it?', 'Act on the notice that applies to them', 'Leave school immediately', 'Buy a train ticket'),
    q('How is the information organized?', 'Several separate school notices are read aloud.', 'One student tells a personal story.', 'A teacher asks for votes.'),
    q('Why should an interested student listen carefully?', 'Different notices have different times and places.', 'Every notice is about the same room.', 'Nothing needs to be done today.'))
add('listening-r8-weather-intermediate',
    q('What kind of report is this?', 'A weather forecast for today and tomorrow', 'A report about a sports game', 'A travel guide for spring'),
    q('How does the forecast change?', 'Sunny weather gives way to some possible rain.', 'Rain ends and snow begins.', 'The sky stays stormy every day.'),
    q('What does the speaker encourage today?', 'Enjoying the sunshine outdoors', 'Staying indoors all day', 'Preparing for heavy snow'),
    q('Why does the speaker mention an umbrella?', 'Tomorrow may bring afternoon rain.', 'Today has a flood warning.', 'It is needed for stargazing.'))
add('listening-r8-one-minute-weather-forecast',
    q('What is the forecast mainly about?', 'Changeable wet weather over several days', 'A long period of clear skies', 'A heatwave with no rain'),
    q('What warning does the speaker give?', 'Be careful of fog, storms and possible flooding.', 'Stay inside because of snow.', 'Avoid the beach because of heat.'),
    q('How does the week seem overall?', 'Rainy despite one warning ending', 'Dry and steadily warmer', 'Calm with no travel concerns'),
    q('Why should people keep watching the forecast?', 'Storms and a cold front could change conditions.', 'All weather warnings are permanently over.', 'Only one hour of weather matters.'))
add('teded_hmfqqjmf_f0',
    q('What is the explanation mostly about?', 'Physical and social benefits of playing sports', 'How to win every match', 'Rules of one particular sport'),
    q('How does the speaker compare exercise and team sport?', 'Team sport can add benefits beyond exercise alone.', 'Team sport removes all need for exercise.', 'Exercise has no effect on the mind.'),
    q('What attitude does the speaker take to losing?', 'It can teach useful resilience.', 'It means sport was a waste of time.', 'It should never happen.'),
    q('Why might a team help someone keep exercising?', 'Enjoyment and commitment can build a regular habit.', 'A team guarantees victory.', 'Team members never feel tired.'))
add('world-flight-singapore-changi-jewel-video',
    q('What is this airport building trying to be?', 'A place to enjoy during a stopover', 'Only a place to park planes', 'A replacement for all Singapore parks'),
    q('How does the report describe Jewel?', 'A mix of shopping, gardens and attractions', 'A small outdoor market', 'A hotel without public spaces'),
    q('What impression does the speaker give?', 'The design is large and striking.', 'The building is empty and dull.', 'The gardens are closed to visitors.'),
    q('Why might a traveller allow extra time there?', 'There are trails and attractions, and they may be crowded.', 'The trains never run.', 'The airport has no shops.'))
add('world-flight-london-tube-engineering-video',
    q('What is this report mainly exploring?', 'The Underground’s history and how it operates', 'London’s airports', 'A new road through the city'),
    q('What makes the Tube surprising?', 'Much of it is above ground despite its name.', 'It has only one train.', 'Nobody uses it now.'),
    q('How does the report move from past to present?', 'It describes early growth then driver training.', 'It starts with a crash then ends at a museum.', 'It only gives directions to one stop.'),
    q('Why is the presenter put in a simulator?', 'It offers a safer way to try a driver’s controls.', 'The real trains have stopped forever.', 'The presenter is already a trained driver.'))
add('world-flight-cairo-nile-explainer-video',
    q('What is the explanation mainly about?', 'The Nile’s sources, flows and role in farming', 'Only the animals beside the Nile', 'A modern train across Egypt'),
    q('Why is naming one source difficult?', 'Several connected headwaters compete for the title.', 'The river has no tributaries.', 'No one has seen the river.'),
    q('How do the two Nile branches differ?', 'One flows steadily; the other changes greatly with rain.', 'Both dry out for the whole year.', 'Neither reaches Sudan.'),
    q('Why did seasonal floods matter to farming?', 'They left fertile material on the land.', 'They removed all water from fields.', 'They stopped any crops growing.'))
add('world-flight-dubai-airport-history-video',
    q('What story does the speaker tell?', 'An airport growing with its city', 'A city closing its airport', 'A new kind of aircraft engine'),
    q('How does the speaker talk about the future?', 'With confidence in more growth', 'With regret about all air travel', 'With no plans at all'),
    q('What connects the airport and Dubai?', 'Their development is closely linked.', 'They compete for land.', 'The airport serves only one airline.'),
    q('Why does the speaker mention more infrastructure?', 'The airport expects more airlines and passengers.', 'The first airstrip will become a museum.', 'The city has stopped growing.'))
add('world-flight-mumbai-dabbawalas-video',
    q('What service is being explained?', 'Delivering homemade lunches across Mumbai', 'Selling food inside a supermarket', 'Shipping fruit abroad'),
    q('How do the workers keep the service organized?', 'They use a routine and coded labels.', 'They rely only on smartphones.', 'They send every lunch by car.'),
    q('What is striking about the system?', 'It moves many lunches without modern technology.', 'It operates only once a year.', 'Nobody needs to sort the boxes.'),
    q('Why are symbols useful on the boxes?', 'They help workers route lunches even if reading is difficult.', 'They show which food tastes best.', 'They replace the need for trains.'))
add('world-flight-rio-de-janeiro-favela-history-video',
    q('What is the speaker mainly examining?', 'Different explanations for Rio’s favelas', 'The best beaches in Rio', 'How to build a new house'),
    q('How does the speaker treat a single origin story?', 'As one account among several ways to understand them', 'As the only possible explanation', 'As a story with no connection to history'),
    q('What broader issue runs through the explanation?', 'Housing, power and inequality in the city', 'A shortage of football players', 'The design of modern hotels'),
    q('Why does the speaker offer several lenses?', 'No one story fully explains how favelas developed.', 'He has forgotten the first story.', 'Each lens describes a different country.'))
add('world-flight-lagos-mass-transit-video',
    q('What challenge is the clip about?', 'Moving people through heavy city traffic', 'Finding a new airline', 'Repairing a beach hotel'),
    q('How is the boat presented?', 'As a quicker commute than the road', 'As slower than every car', 'As only a tourist activity'),
    q('What solution does the official discuss?', 'Linking water transport with road and rail', 'Closing all rail lines', 'Using boats without any other service'),
    q('Why does the official call for several transport modes?', 'Congestion needs alternatives that work together.', 'No one in Lagos travels by road.', 'The city has no waterways.'))
add('world-flight-hong-kong-transport-system-video',
    q('What transport model is the report about?', 'Rail stations linked with property development', 'Buses replacing all trains', 'A city without public transport'),
    q('How does the MTR use its buildings?', 'To support and expand the rail network', 'To stop residents using trains', 'To keep all shops outside stations'),
    q('Why might this model fit Hong Kong?', 'Space is limited and many people live vertically.', 'Land is plentiful and homes are far apart.', 'The city has no shopping malls.'),
    q('How can low fares coexist with network investment?', 'Property income helps maintain and expand the system.', 'The railway gives every ride away for free.', 'No one pays to use the buildings.'))
add('world-flight-hong-kong-housing-video',
    q('What problem does the report explore?', 'Tiny homes and the shortage of affordable housing', 'Empty luxury hotels', 'Too many new public parks'),
    q('Why is the proposed law complicated?', 'Better standards may also raise rents or displace tenants.', 'Everyone can easily afford a larger flat.', 'The city has no housing shortage.'),
    q('How do residents and officials differ?', 'Officials seek minimum standards while tenants fear losing cheap homes.', 'Both say the flats are already spacious.', 'Residents want no windows and officials agree.'),
    q('Why might removing very small flats hurt some residents?', 'They may have no affordable place to move.', 'They prefer to live in hotels.', 'The new flats will be free.'))
add('world-flight-amsterdam-cycling-video',
    q('What change in Amsterdam is the clip about?', 'Making streets more friendly to bicycles', 'Replacing canals with airports', 'Building the world’s largest car park'),
    q('Why did people challenge car-focused plans?', 'Cars crowded streets and safety became a concern.', 'Bicycles had never existed there.', 'There was no traffic in the city.'),
    q('How does the speaker present today’s cycling?', 'As the result of choices and public pressure', 'As something that happened without planning', 'As a new sport with no transport role'),
    q('Why did the oil crisis help bikes gain ground?', 'Fuel prices rose and one day a week cars were banned.', 'Bicycles became free for everyone.', 'Oil made bike tyres stronger.'))
add('world-flight-miami-little-havana-video',
    q('What place is the report exploring?', 'A Cuban cultural neighbourhood in Miami', 'A city in Cuba', 'A new theme park in Florida'),
    q('How did the neighbourhood take shape?', 'Cuban newcomers settled near work and transport.', 'It was built for tourists alone.', 'It began as an airport terminal.'),
    q('What role do cafés and the park play?', 'They are places for community conversation.', 'They are closed to local residents.', 'They only sell souvenirs.'),
    q('Why is the restaurant described as a community centre?', 'People meet, share news and connect there.', 'It offers free housing.', 'It replaced every other street.'))
add('world-flight-bogota-graffiti-projects-video',
    q('What debate surrounds graffiti in the clip?', 'Whether street painting is art or lawbreaking', 'Whether paint can dry in rain', 'Whether all walls should be new'),
    q('What is the city trying to do?', 'Make legal space and support for artists', 'Ban every mural', 'Turn the city into a museum'),
    q('How do artists hope views will change?', 'People will see skill and opportunity in some graffiti.', 'People will stop visiting the city.', 'Every painter will work secretly.'),
    q('Why might legal mural spaces matter?', 'They give artists a place to work without the same legal risk.', 'They remove all need for paint.', 'They keep art away from the public.'))
add('world-flight-lima-transport-strike-video',
    q('What crisis is the report about?', 'A bus strike linked to fear of crime', 'A city festival without buses', 'A plan for a new airport'),
    q('How does the strike affect daily life?', 'Commuting, schools and businesses are disrupted.', 'Only bus drivers notice it.', 'Every road becomes empty for tourists.'),
    q('What are the workers asking for?', 'Protection and action against crime', 'Longer school holidays', 'Cheaper cinema tickets'),
    q('Why can a bus strike shut schools and shops?', 'Many people depend on buses to travel to work and class.', 'The schools own all the buses.', 'The weather has closed every building.'))
add('world-flight-perth-transperth-video',
    q('What is the clip mainly describing?', 'A public transport network preparing for growth', 'A city without buses', 'A new airport shopping centre'),
    q('What is distinctive about the system?', 'It joins several transport types and uses smart cards.', 'It runs only ferries.', 'It has no plans to improve.'),
    q('How does the operator respond to positive surveys?', 'It still explores future improvements.', 'It closes older routes.', 'It refuses new passengers.'),
    q('Why are new bus and rail projects being explored?', 'The city expects growing demand for travel.', 'Passengers are all leaving Perth.', 'The smart card no longer works.'))
add('world-flight-madrid-prado-collections-video',
    q('What is the explanation mainly about?', 'How a museum collection grew from several sources', 'How to paint one famous picture', 'How a museum sells tickets'),
    q('What does the speaker do with the collection’s history?', 'Traces additions from royal, institutional and private sources', 'Describes a single new purchase only', 'Explains why all paintings were destroyed'),
    q('How has the collection changed since the museum opened?', 'It has grown through transfers, purchases and gifts.', 'It has stayed exactly the same.', 'It now contains only modern art.'),
    q('Why is it wrong to call the collection only royal?', 'Later institutions and donors added many works.', 'No kings ever collected art.', 'The museum opened before Spain had kings.'))
add('world-flight-dublin-oscar-wilde-video',
    q('What is the report mainly about?', 'Oscar Wilde’s fame and an archive of his life', 'The design of a modern college', 'A lesson on Greek grammar'),
    q('How does the archive tell his story?', 'Objects show his rise, reputation and later difficulties.', 'It contains only his exam marks.', 'It shows only his childhood toys.'),
    q('Why does the speaker call Wilde an early celebrity?', 'His image and name circulated widely in public culture.', 'He acted in every film of his age.', 'He owned a modern social network.'),
    q('Why are trade cards useful evidence of Wilde’s fame?', 'His face appeared on adverts for many products.', 'They record every book he read.', 'They show he never toured abroad.'))
add('world-flight-santiago-moai-video',
    q('What is the report mainly about?', 'The moai and the island’s cultural landscape', 'A new train line in Chile', 'A modern shopping centre'),
    q('What remains uncertain?', 'Why the islanders made and moved the statues', 'Whether any statues still exist', 'Whether the island has beaches'),
    q('How is the island presented to visitors?', 'A place of history and outdoor activities', 'Only a city of office towers', 'A place with no protected land'),
    q('Why do the restored statues still leave a mystery?', 'Restoring them does not reveal the builders’ original purpose.', 'The stones were all made yesterday.', 'No one knows where the island is.'))

assert len(questions) == 60, len(questions)
changed = 0
for path in sorted(Path('src/data').glob('*-library.json')):
    items = json.loads(path.read_text(encoding='utf-8'))
    edited = False
    for item in items:
        if not item.get('listeningPack'):
            continue
        given = questions[item['id']]
        detail_questions = {segment['question'].casefold() for segment in item['listeningPack']['segments']}
        assert all(entry[0].casefold() not in detail_questions for entry in given[:3]), item['id']
        built = []
        for index, (prompt, options) in enumerate(given):
            # Rotate the correct answer throughout the bank, including harder.
            shift = (changed + index) % len(options)
            rotated = options[shift:] + options[:shift]
            built.append({'q': prompt, 'options': rotated, 'correctIndex': rotated.index(options[0])})
        item['listeningPack']['gist'] = built[:3]
        item['listeningPack']['harder'] = built[3]
        edited = True
        changed += 1
    if edited:
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
assert changed == 60, changed
print(f'Added {changed * 3} gist and {changed} harder questions.')
