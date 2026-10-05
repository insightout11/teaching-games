"""Hand-authored Round 11 Speak check bank. Run locally to regenerate its JSON."""
import json
from pathlib import Path

rows = []


def add(id, topics, age, cefr, situation, can_do, before, before_natural, after, after_natural):
    if before_natural == after_natural:
        after = after[1:] + after[:1]
        after_natural = (after_natural - 1) % len(after)
    rows.append({"id": id, "topics": topics.split(","), "ageBand": age, "cefr": cefr,
                 "situation": situation, "canDo": can_do,
                 "before": {"replies": before, "natural": before_natural},
                 "after": {"replies": after, "natural": after_natural}})


# Kids: concrete situations, short natural lines, and common learner slips.
add('speak-kids-cafe-order', 'food,café', 'kids', 'A1',
    'At a café, the server asks what drink you would like.', 'Order a drink politely in English',
    ['Give juice.', 'Could I have an orange juice, please?', 'I am wanting juice one.', 'The beverage I desire is juice.'], 1,
    ['One orange juice to me.', 'Juice. Now.', 'May I have a glass of orange juice, please?', 'I have orange juice wanting.'], 2)
add('speak-kids-restaurant-allergy', 'food,restaurant', 'kids', 'A2',
    'At a restaurant, you need to tell the server that you cannot eat nuts.', 'Explain a food allergy politely',
    ['I cannot eat nuts. Does this have any?', 'Nuts bad.', 'My eating nuts is not possible for me.', 'I no can eat nuts, yes?'], 0,
    ['I do not eat of the nuts.', 'Could you check whether this contains nuts?', 'Food nuts no.', 'It is with a nut by me?'], 1)
add('speak-kids-shop-size', 'shopping,clothes', 'kids', 'A1',
    'In a clothes shop, a shirt is too small and the assistant offers help.', 'Ask for a larger shirt',
    ['This small. Give.', 'I am desirous of a garment larger.', 'Do you have this in a bigger size?', 'It is needing big.'], 2,
    ['Could I try a larger size, please?', 'Big one now.', 'I want that you make big.', 'Might you provide an incremented garment?'], 0)
add('speak-kids-school-pencil', 'school', 'kids', 'A1',
    'In class, you have forgotten your pencil and a classmate has a spare.', 'Borrow a pencil politely',
    ['Pencil to me.', 'Could I borrow your spare pencil, please?', 'I am pencil forgetting.', 'I require the temporary use of your pencil.'], 1,
    ['Give me your pencil.', 'I can borrowing pencil?', 'May I use your extra pencil for a moment?', 'My pencil is not here with me existence.'], 2)
add('speak-kids-friend-plan', 'friends,plans', 'kids', 'A2',
    'A friend asks whether you can play after school, but you have homework.', 'Suggest another time to a friend',
    ['No.', 'The proposed play arrangement is unfeasible.', 'I no can because homework.', 'I have homework today. Could we play tomorrow?'], 3,
    ['I must do homework, but are you free on Friday?', 'You play without me forever.', 'I have to making homework.', 'I regret that my academic obligations preclude play.'], 0)
add('speak-kids-hobby-drawing', 'hobbies,art', 'kids', 'A1',
    'A new classmate asks what you like doing after school.', 'Describe a hobby and give a reason',
    ['I like drawing animals because it is fun.', 'Yes.', 'I am liking to drawing.', 'My preferred extracurricular pursuit is illustration.'], 0,
    ['Drawing is what I do with the enjoyment.', 'My hobby is fun stuff.', 'I enjoy painting pictures at home.', 'I like paint pictures because they is fun.'], 2)
add('speak-kids-sport-team', 'sport,friends', 'kids', 'A2',
    'Your team needs one more player and a new student is watching.', 'Invite someone to join a game',
    ['You, play.', 'Would your participation in our athletic undertaking be possible?', 'Would you like to join our game?', 'You want join us game?'], 2,
    ['Come here and play now.', 'Do you want to play with us?', 'You are wanting play together?', 'Your inclusion would be advantageous to our team.'], 1)
add('speak-kids-travel-directions', 'travel,directions', 'kids', 'A2',
    'At a station, you cannot find the bus stop and a staff member approaches.', 'Ask for directions to a bus stop',
    ['Bus where?', 'Could you tell me where the bus stop is?', 'Where is being the bus?', 'I seek the designated bus boarding location.'], 1,
    ['Excuse me, how do I get to the bus stop?', 'Tell bus place.', 'Where I can find bus station stop?', 'I would appreciate navigational guidance concerning transit.'], 0)
add('speak-kids-weather-plan', 'weather,plans', 'kids', 'A1',
    'Your friend wants to play outside, but dark clouds are coming.', 'Suggest an indoor plan because of weather',
    ['Outside no.', 'I am observing meteorological deterioration.', 'It rain. We inside go.', 'It might rain. Shall we play inside?'], 3,
    ['Let us stay inside and play a board game.', 'Rain is happening perhaps so no.', 'I request indoor recreational relocation.', 'We going play inside because raining.'], 0)
add('speak-kids-family-introduce', 'family', 'kids', 'A1',
    'A visitor asks who the person beside you is; she is your sister.', 'Introduce a family member',
    ['This is my sister, Maya.', 'Sister.', 'She my sister Maya.', 'Allow me to present my female sibling.'], 0,
    ['Here sister is mine.', 'I present my familial relation.', 'Meet Maya. She is my sister.', 'Maya she my sister be.'], 2)
add('speak-kids-tech-help', 'technology,school', 'kids', 'A2',
    'Your tablet will not open the class activity; the teacher offers help.', 'Explain a simple technology problem',
    ['Tablet broken.', 'The device is experiencing operational failure.', 'My tablet will not open the activity. Could you help?', 'It not opening by me.'], 2,
    ['The activity will not load on my tablet.', 'Technology bad.', 'My tablet no open it can.', 'The platform presents an unresolved access impediment.'], 0)
add('speak-kids-doctor-headache', 'health,doctor', 'kids', 'A2',
    'At a clinic, the doctor asks what is wrong and your head hurts.', 'Describe a symptom to a doctor',
    ['I have a headache, and it started this morning.', 'Head bad.', 'I am having head pain in this present circumstance.', 'My head is hurted today.'], 0,
    ['Pain in head.', 'My head has been hurting since breakfast.', 'I have headache from morning time was.', 'I wish to report cranial discomfort.'], 1)
add('speak-kids-lost-pet', 'animals,pets', 'kids', 'A2',
    'Your dog is missing and a neighbor asks how they can help.', 'Describe a missing pet',
    ['Dog gone.', 'My dog is small and brown. Have you seen him?', 'The canine is currently unaccounted for.', 'My dog he are brown and missing.'], 1,
    ['He is a little brown dog with a red collar.', 'Brown dog. Find.', 'I am experiencing the loss of a canine.', 'My dog has brown and is little.'], 0)
add('speak-kids-music-choice', 'music,school', 'kids', 'A1',
    'The class is choosing a song and the teacher asks your preference.', 'State a music preference politely',
    ['That song. Now.', 'I am preferential toward this composition.', 'I like the fast song because we can dance.', 'I liking fast song because dance.'], 2,
    ['The quick musical selection is my preference.', 'Could we choose the song with the strong beat?', 'Fast song is best, obviously.', 'I like the song fast because we dances.'], 1)
add('speak-kids-festival-invite', 'holidays,festivals', 'kids', 'A2',
    'Your friend has never been to your family festival and asks about it.', 'Invite a friend to a celebration',
    ['Would you like to come to our festival on Saturday?', 'Festival come.', 'I extend a ceremonial attendance invitation.', 'You coming festival Saturday yes?'], 0,
    ['You must attend my event.', 'We invite that you are coming.', 'Could you join us for the celebration?', 'Your participation in the festivities is solicited.'], 2)
add('speak-kids-recycle', 'environment,school', 'kids', 'A2',
    'A classmate is about to throw a clean bottle into the wrong bin.', 'Suggest recycling without sounding rude',
    ['Wrong bin, silly.', 'Perhaps the bottle belongs in the recycling bin?', 'You must implement correct waste segregation.', 'It should putting in recycle bin.'], 1,
    ['That bottle can go in the recycling bin.', 'Stop being bad at bins.', 'I advise appropriate disposal categorization.', 'Can you putting bottle there instead?'], 0)
add('speak-kids-weekend-activity', 'weekend,plans', 'kids', 'A1',
    'On Monday, a friend asks what you did at the weekend.', 'Tell someone about one weekend activity',
    ['I went swimming with my family.', 'Weekend good.', 'I go swimming yesterday with family.', 'My weekend comprised an aquatic excursion.'], 0,
    ['It was nice.', 'My weekend involved family-based water recreation.', 'We visited the park on Sunday.', 'I am go to park in Sunday.'], 2)
add('speak-kids-cafe-price', 'food,café,shopping', 'kids', 'A2',
    'At a café, you want a sandwich but cannot see its price.', 'Ask the price before ordering',
    ['How much is the cheese sandwich, please?', 'Price?', 'I require knowledge of the sandwich expenditure.', 'How many money cost this sandwich?'], 0,
    ['Tell me money now.', 'What is the monetary value of that item?', 'Could you tell me the price of that sandwich?', 'How much it costing?'], 2)
add('speak-kids-animal-care', 'animals,pets', 'kids', 'A2',
    'Your friend asks to feed your rabbit sweets.', 'Explain a pet care rule kindly',
    ['No, bad friend.', 'My rabbit should eat its usual food, not sweets.', 'The proposed confectionery is contraindicated.', 'Rabbit no can eating sweet.'], 1,
    ['Please give her some fresh vegetables instead.', 'Sweets are prohibited under dietary regulation.', 'You can no give candy, yes?', 'Never touch my rabbit food.'], 0)
add('speak-kids-school-question', 'school,learning', 'kids', 'A1',
    'In class, you do not understand an instruction and the teacher pauses.', 'Ask a teacher to repeat an instruction',
    ['What?', 'Would you be amenable to reiteration?', 'Could you say that again, please?', 'You can saying again?'], 2,
    ['Excuse me, could you repeat the last step?', 'Say it again.', 'Please undertaking a repetition.', 'I not understood what doing.'], 0)

# Teens: authentic social and practical requests with increasing complexity.
add('speak-teens-cafe-order-change', 'food,café', 'teens', 'A2',
    'At a café, the server brings the wrong drink and asks if everything is fine.', 'Correct an order politely',
    ['This is wrong. Fix it.', 'I believe an ordering discrepancy has occurred.', 'I ordered tea, but this is coffee. Could you change it?', 'I ordered tea but you giving coffee.'], 2,
    ['Sorry, I asked for tea. Could I have that instead?', 'Your service is incompetent.', 'It appears that beverage fulfillment was erroneous.', 'I ask tea and this coffee is.'], 0)
add('speak-teens-restaurant-split-bill', 'food,restaurant', 'teens', 'B1',
    'After dinner with friends, the server brings one bill and you each paid for different meals.', 'Ask to pay separately',
    ['Could we pay separately for what we ordered?', 'Split now.', 'The financial settlement should be individually apportioned.', 'Can we paying separate for foods?'], 0,
    ['Money each own.', 'Could you make separate bills for us, please?', 'Separate billing would be optimally appropriate.', 'We want to pay each different meal was.'], 1)
add('speak-teens-shop-return', 'shopping,clothes', 'teens', 'B1',
    'A jacket you bought yesterday has a broken zip; the shop assistant asks what happened.', 'Request an exchange with a reason',
    ['The zip is broken. Could I exchange the jacket?', 'Bad jacket. Money.', 'I am desirous of redress for this defective apparel.', 'The zip breaked so you exchange.'], 0,
    ['Please replace this unacceptable thing immediately.', 'A garment defect necessitates transactional reversal.', 'I bought this yesterday, and the zip will not close. Could I swap it?', 'I did bought it yesterday and zip no works.'], 2)
add('speak-teens-school-deadline', 'school,learning', 'teens', 'B1',
    'You were ill and missed a project deadline; the teacher asks about your work.', 'Ask for extra time and explain why',
    ['I was ill this week. Could I hand it in on Monday?', 'I did nothing. Deal with it.', 'I seek a deferment of the deliverable completion date.', 'I sick was so can I handing Monday?'], 0,
    ['My illness adversely impacted task delivery.', 'I could not finish while I was ill. May I have two more days?', 'Deadline no.', 'I was illness and need two days more for hand in.'], 1)
add('speak-teens-friend-cancel', 'friends,plans', 'teens', 'B1',
    'You agreed to meet a friend tonight but a family obligation has come up.', 'Cancel plans and offer another time',
    ['I cannot. Bye.', 'I regret the nonviability of our scheduled engagement.', 'I need to help my family tonight. Could we meet tomorrow?', 'I must helping family so we meet tomorrow maybe.'], 2,
    ['Sorry, something came up at home. Are you free on Saturday?', 'You should have planned another friend.', 'This social arrangement requires temporal relocation.', 'I have something comes and we meet other time.'], 0)
add('speak-teens-hobby-invite', 'hobbies,friends', 'teens', 'A2',
    'A classmate says they have never tried your photography club.', 'Invite a classmate to try a hobby',
    ['Join club.', 'Participation in the photographic association is encouraged.', 'You could come with me next week and try it.', 'You can coming with me next week.'], 2,
    ['Why do you not already know it?', 'Our extracurricular photographic endeavor welcomes novices.', 'Would you like to visit the club with me on Tuesday?', 'You would like visit club in Tuesday?'], 2)
add('speak-teens-sport-injury', 'sport,health', 'teens', 'B1',
    'Before a match, your coach asks why you are not warming up; your ankle hurts.', 'Explain an injury and request a break',
    ['My ankle hurts, so I need to sit out today.', 'I am broken. No game.', 'I must suspend athletic participation owing to discomfort.', 'My ankle is hurting so I cannot plays.'], 0,
    ['It hurts. Whatever.', 'I am requesting exemption from scheduled competition.', 'I twisted my ankle yesterday. Could I rest this match?', 'My ankle twisted yesterday and I need resting.'], 2)
add('speak-teens-travel-delay', 'travel,transport', 'teens', 'B1',
    'At the station, your train is delayed and you may miss a connection.', 'Ask staff about an alternative route',
    ['Train late. Fix.', 'The delay may disrupt my onward itinerary.', 'I might miss my connection. Is there another route?', 'I missing connection because train late.'], 2,
    ['Could you help me find another way to get there?', 'Your trains are useless.', 'Please advise on intermodal alternatives.', 'Which other route I can to take?'], 0)
add('speak-teens-weather-event', 'weather,plans', 'teens', 'A2',
    'Heavy rain is forecast for your outdoor club meeting; a friend asks if the plan is still on.', 'Suggest a weather backup plan',
    ['Maybe we should meet in the library if it rains.', 'Rain. No.', 'A contingency venue would be advisable.', 'If rains we meeting library.'], 0,
    ['The current meteorological forecast warrants relocation.', 'Could we move the meeting indoors?', 'Rain means you should stay home alone.', 'If rain will happen, we meet inside maybe.'], 1)
add('speak-teens-family-rule', 'family,plans', 'teens', 'B1',
    'A friend asks why you cannot stay out late; your family has agreed on a curfew.', 'Explain a family rule without blaming anyone',
    ['My family and I agreed that I should be home by nine.', 'Parents bad.', 'Our domestic policy stipulates evening arrival.', 'My family make me home by nine agreed.'], 0,
    ['My parents are so unfair, obviously.', 'Our household imposes temporal restrictions.', 'I need to be home by nine, but we can meet earlier.', 'I needing home before nine because family rule was.'], 2)
add('speak-teens-tech-privacy', 'technology,privacy', 'teens', 'B2',
    'A friend wants to post a group photo that includes you; you are uncomfortable with it.', 'Ask someone not to share your image',
    ['Please do not post that photo of me. I would rather keep it private.', 'Delete it, idiot.', 'I hereby withhold authorization for image dissemination.', 'I prefer you not posting because privacy.'], 0,
    ['My visual likeness is subject to personal data controls.', 'Could you leave me out of the post? I am not comfortable sharing it.', 'You never understand anything.', 'I not agree that you post me in internet.'], 1)
add('speak-teens-doctor-symptom', 'health,doctor', 'teens', 'B1',
    'At a clinic, the doctor asks how long you have had a sore throat.', 'Describe a symptom and its duration',
    ['Throat bad for time.', 'My throat has been sore for three days, especially at night.', 'I have experienced pharyngeal discomfort for 72 hours.', 'My throat is sore since three days.'], 1,
    ['It has hurt since Monday, and swallowing is difficult.', 'My throat is not being good.', 'The symptoms are temporally persistent and nocturnally exacerbated.', 'It hurted from Monday and swallow hard.'], 0)
add('speak-teens-pet-rescue', 'animals,pets', 'teens', 'B1',
    'A neighbor found a stray dog and asks whether your family could care for it tonight.', 'Accept or decline a request with a reason',
    ['We can keep the dog safe tonight, but we should call the shelter tomorrow.', 'Dog here, fine.', 'Temporary canine custody is within our capacity.', 'We can taking dog but call shelter after.'], 0,
    ['We cannot take the dog tonight, but I can help call a rescue group.', 'No. Your problem.', 'Animal accommodation is presently infeasible.', 'I cannot to take it but I help calling.'], 0)
add('speak-teens-music-feedback', 'music,school', 'teens', 'B1',
    'A friend plays a new song and asks for your honest opinion.', 'Give supportive but honest feedback',
    ['The chorus is catchy; perhaps the verse could be a little shorter.', 'It is terrible.', 'My evaluative assessment finds the refrain satisfactory.', 'Chorus good but verse too much long.'], 0,
    ['Your composition exhibits promise despite structural limitations.', 'I like the melody, though the ending feels a bit sudden.', 'Whatever, I have heard better.', 'Melody I like but end it suddenly feels.'], 1)
add('speak-teens-festival-custom', 'holidays,festivals,culture', 'teens', 'A2',
    'A visitor asks why your family shares food at a holiday celebration.', 'Explain a holiday custom simply',
    ['Food is there.', 'The communal meal symbolizes intergenerational cohesion.', 'We share food to welcome everyone and spend time together.', 'We share foods because everyone coming.'], 2,
    ['It helps us make guests feel welcome.', 'It is just a thing. Do not ask.', 'This culinary tradition enacts communal solidarity.', 'We sharing food for all feels welcome.'], 0)
add('speak-teens-environment-project', 'environment,school', 'teens', 'B2',
    'The student council asks for one practical way to reduce waste at school.', 'Propose an environmental change and justify it',
    ['We could install refill stations so fewer students buy plastic bottles.', 'Just stop waste.', 'I propose the implementation of a comprehensive sustainability paradigm.', 'We install stations because bottles less will bought.'], 0,
    ['Nothing can help anyway.', 'A schoolwide circularity intervention is indicated.', 'Let us collect unused paper and use the blank sides for drafts.', 'We should collecting paper because use again it.'], 2)
add('speak-teens-weekend-conflict', 'weekend,plans', 'teens', 'B1',
    'Two friends invite you to different events on Saturday at the same time.', 'Explain a scheduling conflict tactfully',
    ['I already promised to go to Sam’s event, but could we meet later?', 'Yours sounds boring.', 'The overlap in social commitments is regrettable.', 'I promised Sam and cannot going yours.'], 0,
    ['I am unavailable due to a prior engagement.', 'Your event loses.', 'I would love to come, but I have another plan. Is Sunday possible?', 'I have another plan so Sunday we meeting?'], 2)
add('speak-teens-shop-budget', 'shopping,money', 'teens', 'A2',
    'A friend points out expensive headphones, but you are saving money.', 'Decline a purchase and explain your budget',
    ['I am saving for a bike, so I will choose the cheaper ones.', 'Too much. No.', 'Their price exceeds my current expenditure ceiling.', 'I save for bike so cheaper I take.'], 0,
    ['I would rather wait because I need the money for something else.', 'Your suggestion is stupid.', 'This acquisition is fiscally inadvisable.', 'I am saving money, so I not buying these.'], 0)
add('speak-teens-school-group', 'school,friends', 'teens', 'B2',
    'In a group project, one person has not had a chance to speak.', 'Invite a quieter group member to contribute',
    ['We have not heard your view yet. What do you think?', 'Speak now.', 'Your contribution to the deliberation is hereby requested.', 'We not heard you; what you thinks?'], 0,
    ['We could pause and hear your idea before deciding.', 'You are too quiet again.', 'Your input would facilitate equitable participation.', 'Tell us idea because we not hear yet.'], 0)
add('speak-teens-travel-host', 'travel,culture', 'teens', 'B2',
    'Your host family offers you a local dish you have never tried.', 'Respond respectfully to unfamiliar food',
    ['Thank you for making this. What is it called?', 'That looks strange.', 'I appreciate this gastronomic introduction.', 'Thanks, I never tasted this before what is?'], 0,
    ['I would love to try it. Could you tell me what is in it?', 'I refuse weird food.', 'Your culinary hospitality is gratefully acknowledged.', 'I would try, but what it contains?'], 0)

assert len(rows) == 40
Path('src/data/speak-situations.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote {len(rows)} Speak situations')
