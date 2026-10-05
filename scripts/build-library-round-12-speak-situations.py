"""Append 40 hand-authored Speak checks and balance answer positions."""
import json
from pathlib import Path

path = Path('src/data/speak-situations.json')
rows = json.loads(path.read_text(encoding='utf-8'))[:40]


def add(id, topics, age, cefr, situation, can_do, before, before_natural, after, after_natural):
    rows.append({"id": id, "topics": topics.split(','), "ageBand": age, "cefr": cefr,
                 "situation": situation, "canDo": can_do,
                 "before": {"replies": before, "natural": before_natural},
                 "after": {"replies": after, "natural": after_natural}})


# Twenty kids A1–A2: short everyday exchanges with one natural reply per set.
add('speak-r12-kids-directions-library', 'directions,school', 'kids', 'A1',
    'A new student asks where the school library is.', 'Give simple directions to a room',
    ['Go past the office and turn left.', 'Library there somewhere.', 'You are go left after office.', 'The information repository is adjacent to administration.'], 0,
    ['It can perhaps found.', 'Walk along this hall; the library is on your right.', 'Walked right then library is.', 'The library facility is situated proximally.'], 1)
add('speak-r12-kids-directions-park', 'directions,travel', 'kids', 'A2',
    'A visitor asks how to walk from the bus stop to the park.', 'Explain a short walking route',
    ['Park over there.', 'Proceed in a northerly direction until convergence.', 'Cross at the lights, then go straight to the park.', 'You cross lights and go to park straightly.'], 2,
    ['Go straight for one block; the park is beside the bakery.', 'You go straight then the park it beside bakery.', 'Follow the designated pedestrian route to recreation.', 'Find it yourself.'], 0)
add('speak-r12-kids-phone-answer', 'phone-calls,family', 'kids', 'A1',
    'Your aunt calls your house and asks to speak to your mother.', 'Answer a phone call politely',
    ['Mother not here. Bye.', 'I facilitate the requested connection presently.', 'I give phone to she.', 'One moment, please. I will get her.'], 3,
    ['Please wait a second. I will tell her you called.', 'Wait there, woman.', 'Your communication request shall be conveyed.', 'I tell she you call.'], 0)
add('speak-r12-kids-phone-message', 'phone-calls,school', 'kids', 'A2',
    'A classmate calls while your brother is out and asks for him.', 'Take a simple phone message',
    ['He absent.', 'Can I take a message for him?', 'May I formally record your communication?', 'I can take message for he?'], 1,
    ['Tell me a thing and I tell.', 'Your message may be documented for subsequent delivery.', 'Would you like me to tell him you called?', 'I will say him you phone.'], 2)
add('speak-r12-kids-invite-party', 'invitations,friends', 'kids', 'A1',
    'You are having a small birthday party and want to invite a friend.', 'Invite a friend to a party',
    ['You come party.', 'Would you like to come to my party on Sunday?', 'Attendance at my birthday function is requested.', 'You want coming Sunday?'], 1,
    ['Could you come to my birthday party this weekend?', 'I am extending an invitation to festivities.', 'Come. Bring gift.', 'You can come in my party?'], 0)
add('speak-r12-kids-invite-game', 'invitations,video-games', 'kids', 'A2',
    'A friend has never tried your favorite cooperative game.', 'Invite someone to play together',
    ['Do you want to play this game with me?', 'Play now or leave.', 'I propose a joint digital recreation session.', 'You want play game with I?'], 0,
    ['Our gameplay collaboration would be optimal.', 'Would you like to try a round together?', 'You should know this already.', 'We playing together you want?'], 1)
add('speak-r12-kids-apology-bump', 'apologies,school', 'kids', 'A1',
    'You accidentally bump into a classmate and drop their books.', 'Apologize and offer help',
    ['Move.', 'I regret this unfortunate collision event.', 'Sorry! Let me help you pick those up.', 'I sorry and help picked books.'], 2,
    ['I did not mean to bump you. Can I help?', 'Books fell. Not me.', 'Please accept my sincere collision apology.', 'I not mean hit you, I help?'], 0)
add('speak-r12-kids-apology-late', 'apologies,plans', 'kids', 'A2',
    'You promised to meet a friend after class but arrived late.', 'Apologize for being late',
    ['I regret the temporal delay in my arrival.', 'Sorry I am late. I missed the bus.', 'You waited. Fine.', 'I am late because bus was missing me.'], 1,
    ['Sorry you had to wait. The bus came late.', 'There was a delay in my transportation schedule.', 'I am late; do not complain.', 'I made you waiting because bus late.'], 0)
add('speak-r12-kids-compliment-drawing', 'compliments,art', 'kids', 'A1',
    'A classmate shows you a drawing of their pet.', 'Give a specific compliment',
    ['Nice.', 'Your artistic representation is aesthetically pleasing.', 'I like how you drew its bright eyes.', 'Your draw is good eyes.'], 2,
    ['The colors you chose make the dog look lively.', 'It is not terrible.', 'Your artwork demonstrates chromatic excellence.', 'Color you chose are nice dog.'], 0)
add('speak-r12-kids-compliment-effort', 'compliments,school', 'kids', 'A2',
    'Your partner worked hard on a class poster.', 'Praise someone’s effort',
    ['You put a lot of work into this poster. It looks great.', 'It is okay, I guess.', 'Your labor investment is commendable.', 'You worked hard and it look good.'], 0,
    ['I can tell you spent time making it clear.', 'It appears to reflect substantial effort expenditure.', 'You should try harder next time.', 'I see you spend much time for clear.'], 0)
add('speak-r12-kids-borrow-ruler', 'borrowing-things,school', 'kids', 'A1',
    'You forgot your ruler and a classmate has an extra one.', 'Ask to borrow a ruler',
    ['Give ruler.', 'Can I borrow your spare ruler, please?', 'I request temporary access to measuring equipment.', 'I borrow your ruler yes?'], 1,
    ['May I use your extra ruler for this exercise?', 'I will take that now.', 'Might I procure temporary use of your ruler?', 'Can I borrowing ruler from you?'], 0)
add('speak-r12-kids-borrow-ball', 'borrowing-things,sport', 'kids', 'A2',
    'At the park, you want to use a friend’s ball for one game.', 'Borrow sports equipment politely',
    ['Ball please now.', 'Your sporting apparatus is required.', 'Could we use your ball for one game?', 'Can us use your ball one game?'], 2,
    ['Would it be okay if we borrowed your ball?', 'I will take your ball.', 'Temporary possession of your ball is sought.', 'Would you let we use ball?'], 0)
add('speak-r12-kids-project-role', 'school-projects,school', 'kids', 'A2',
    'Your group is dividing the jobs for a science poster.', 'Volunteer for a project task',
    ['I can draw the diagram if you write the labels.', 'I do all because you cannot.', 'I offer my services for the illustrative component.', 'I can drawing diagram and you labels.'], 0,
    ['Let me make the pictures while you collect facts.', 'The visualization responsibility may be assigned to me.', 'That is your job, not mine.', 'I make pictures if you collecting facts.'], 0)
add('speak-r12-kids-team-substitute', 'sports-teams,sport', 'kids', 'A2',
    'Your teammate is tired during a game and you can take their place.', 'Offer to substitute in a game',
    ['Sit down. You are bad.', 'I am available to assume your athletic role.', 'I can take your turn if you need a break.', 'I can taking your turn when you tired.'], 2,
    ['Would you like me to play while you rest?', 'Get off, I play.', 'My substitution is presently feasible.', 'I play you place if rest.'], 0)
add('speak-r12-kids-game-tip', 'video-games,hobbies', 'kids', 'A2',
    'A friend keeps losing in a game and asks for a tip.', 'Give a helpful game tip kindly',
    ['You are bad at this.', 'A strategic adjustment is recommended.', 'Try jumping after the red light flashes.', 'You jump after red light flashs.'], 2,
    ['Wait for the green door before you move.', 'Just win.', 'Timing your movement may improve performance.', 'You must wait before door is greened.'], 0)
add('speak-r12-kids-feelings-nervous', 'feelings,school', 'kids', 'A1',
    'A friend asks how you feel before your first class presentation.', 'Name a feeling and give a reason',
    ['Feeling.', 'I am a little nervous because I have to speak first.', 'My emotional condition is anticipatory anxiety.', 'I nervous because speak first.'], 1,
    ['I feel excited, but I am also a bit scared.', 'Good maybe.', 'I am experiencing mixed affective responses.', 'I am exciting and scare too.'], 0)
add('speak-r12-kids-feelings-cheer-up', 'feelings,friends', 'kids', 'A2',
    'Your friend is sad because their team lost a match.', 'Comfort a disappointed friend',
    ['It is only a game. Stop it.', 'I acknowledge your unfavorable emotional state.', 'I know you are upset. You played really well.', 'You sad but played goodly.'], 2,
    ['Losing hurts, but I enjoyed playing with you.', 'You lost because you were slow.', 'Your disappointment is an understandable affect.', 'You lose but I enjoy play with you.'], 0)
add('speak-r12-kids-cinema-choice', 'cinema,tv', 'kids', 'A2',
    'Your family is choosing between an animal film and a space film.', 'Suggest a film and explain why',
    ['Let us watch the space film because we all like adventures.', 'Space film. No argument.', 'My cinematic preference concerns outer space.', 'We watch space because it is excitingly.'], 0,
    ['Could we try the animal movie? My sister would love it.', 'The zoological film satisfies familial preferences.', 'I choose; you do not.', 'Can we watching animal movie for sister?'], 0)
add('speak-r12-kids-home-lights', 'environment-at-home,chores', 'kids', 'A1',
    'Your brother leaves the bedroom lights on when no one is there.', 'Ask someone to save electricity',
    ['Turn it off, stupid.', 'Please turn off the light when you leave.', 'Energy conservation should be implemented.', 'You turn off light when leaving please do.'], 1,
    ['Could you switch off the light? The room is empty.', 'Stop wasting everything.', 'Kindly enact illumination reduction.', 'Can you switching light off?'], 0)
add('speak-r12-kids-home-water', 'environment-at-home,chores', 'kids', 'A2',
    'The tap is running while a family member brushes their teeth.', 'Suggest an easy way to save water',
    ['You waste water again.', 'Your domestic water consumption is excessive.', 'Could you turn off the tap while brushing?', 'You could turning tap off while brush.'], 2,
    ['Let us fill a cup and switch the tap off.', 'Water use must undergo household optimization.', 'You are doing it wrong.', 'We should fill cup and tap close.'], 0)

# Twenty teens: ten B1 and ten B2 situations, with authentic social choices.
add('speak-r12-teens-directions-transfer', 'directions,travel', 'teens', 'B1',
    'A visitor at the station needs to change from the bus to a train.', 'Explain how to make a transfer',
    ['It is somewhere.', 'Follow the signs to platform two, then take the stairs.', 'Proceed according to multimodal transit signage.', 'You go to platform two and taking stairs.'], 1,
    ['Walk through the hall; the train platforms are on your left.', 'Platform there. Find it.', 'Navigate the concourse toward the rail interface.', 'You walking hall and trains are left.'], 0)
add('speak-r12-teens-phone-appointment', 'phone-calls,health', 'teens', 'B1',
    'You call a clinic to move your appointment to a different day.', 'Request a new appointment by phone',
    ['Change my day.', 'I seek a revision of the scheduled consultation.', 'Could I move my appointment from Tuesday to Thursday?', 'Can I changing my appointment to Thursday?'], 2,
    ['Is there another appointment available later this week?', 'You booked wrong day.', 'An alternate temporal slot would be appreciated.', 'You have appointment in another day?'], 0)
add('speak-r12-teens-invite-new-student', 'invitations,friends', 'teens', 'B1',
    'A new student is alone at lunch and your group has an empty seat.', 'Invite someone to join a group',
    ['Do you want to sit with us?', 'You look lonely.', 'Your inclusion in our lunch cohort is invited.', 'You like sitting with we?'], 0,
    ['There is a seat here if you would like to join us.', 'Come here. Now.', 'Our dining group could accommodate you.', 'There is a sit for you if join.'], 0)
add('speak-r12-teens-apology-message', 'apologies,social-media', 'teens', 'B2',
    'You shared a friend’s private message in a group chat without asking.', 'Apologize and take responsibility online',
    ['I was wrong to share that. I deleted it and will ask first next time.', 'You should not send secrets.', 'I regret the unauthorized redistribution of private correspondence.', 'I sorry but everyone would see it anyway.'], 0,
    ['I should have respected your privacy. How can I make this right?', 'It was just a joke, relax.', 'My communication conduct fell below acceptable standards.', 'I have deleted, so why you still upset?'], 0)
add('speak-r12-teens-compliment-work', 'compliments,school-projects', 'teens', 'B1',
    'A partner presents a clear graph for your project.', 'Praise a useful part of someone’s work',
    ['Your graph makes the results much easier to understand.', 'Fine graph.', 'Your visualization is a commendable evidentiary artifact.', 'Your graph make results easy.'], 0,
    ['I like how you labeled the axes; I can read it quickly.', 'At least you did something.', 'The graphical clarity is duly acknowledged.', 'You labeled axes goodly.'], 0)
add('speak-r12-teens-borrow-notes', 'borrowing-things,school', 'teens', 'B1',
    'You missed a lesson and a classmate has notes you could use.', 'Ask to borrow notes and offer to return them',
    ['Give notes.', 'Could I borrow your notes until tomorrow? I will return them.', 'Temporary access to instructional documentation is requested.', 'Can I borrowing your notes and return tomorrow?'], 1,
    ['Would you mind lending me your notes for tonight?', 'I will just photograph them without asking.', 'Your recorded lesson material would be most advantageous.', 'Could you lend me notes which I return it?'], 0)
add('speak-r12-teens-project-deadline', 'school-projects,school', 'teens', 'B2',
    'Your project group is behind schedule and one member proposes skipping the research.', 'Negotiate a realistic project plan',
    ['Let us keep the research but shorten the presentation instead.', 'Research is boring. Skip it.', 'We must recalibrate deliverables without compromising rigor.', 'We keeping research and shorter the slides.'], 0,
    ['Could we split the sources tonight and cut the extra slides?', 'Do all the work yourself.', 'A redistribution of investigative responsibilities is advisable.', 'We divide research and cutting slides tomorrow.'], 0)
add('speak-r12-teens-team-bench', 'sports-teams,sport', 'teens', 'B1',
    'Your coach asks whether you are willing to start the match on the bench.', 'Respond constructively to a team decision',
    ['That is unfair; I quit.', 'I acknowledge the strategic roster adjustment.', 'I can support the team and be ready when you need me.', 'I can supporting the team from bench.'], 2,
    ['I would like to play later, but I understand the plan.', 'You never let me play.', 'I accept the current deployment decision.', 'I like play later but understand.'], 0)
add('speak-r12-teens-game-spending', 'video-games,money', 'teens', 'B1',
    'A friend encourages you to buy an expensive game add-on you do not need.', 'Decline a purchase without judging a friend',
    ['I will skip it; I am saving for something else.', 'That is a stupid waste of money.', 'This digital acquisition exceeds my discretionary budget.', 'I save money so I not buying.'], 0,
    ['It looks fun, but I would rather keep my money for now.', 'Only silly people buy that.', 'My expenditure priorities preclude this purchase.', 'I prefer saving than buy it.'], 0)
add('speak-r12-teens-social-photo', 'social-media,privacy', 'teens', 'B2',
    'A classmate tags you in a video before asking permission.', 'Request a change to a social media post',
    ['Could you remove the tag? I would prefer not to appear publicly.', 'Delete it or else.', 'I request immediate withdrawal of identification metadata.', 'I do not want that you tag me online.'], 0,
    ['Please untag me, and ask me before posting next time.', 'You always ruin everything.', 'Kindly reverse this involuntary digital attribution.', 'I want you not tagging me again.'], 0)
add('speak-r12-teens-money-split', 'money,friends', 'teens', 'B1',
    'Three friends bought shared snacks, but one person paid for everything.', 'Suggest a fair way to split a cost',
    ['You paid, so you can deal with it.', 'The expenditure should be allocated proportionally.', 'Could we each pay a third of the snack cost?', 'Can everyone pays a third?'], 2,
    ['Let us divide the total equally and pay you back today.', 'No one asked you to pay.', 'An equal fiscal apportionment is indicated.', 'We can divided total and return money.'], 0)
add('speak-r12-teens-chores-trade', 'chores,family', 'teens', 'B1',
    'You need to study tonight and your sibling asks you to wash the dishes.', 'Negotiate a fair exchange of chores',
    ['You always make me do it.', 'The household labor distribution requires revision.', 'Could you wash tonight if I do it tomorrow?', 'You wash today and I washing tomorrow?'], 2,
    ['I can clean the kitchen tomorrow if you help tonight.', 'Not my problem.', 'A reciprocal chore arrangement would be beneficial.', 'I will cleaning kitchen if you help.'], 0)
add('speak-r12-teens-feelings-exam', 'feelings,school', 'teens', 'B2',
    'A friend notices you are quiet after an exam that went badly.', 'Express disappointment without blaming others',
    ['I am disappointed because I prepared, but I still struggled.', 'The exam was stupid and everyone failed me.', 'My affective response reflects unmet performance expectations.', 'I disappointed though I studied and was hard.'], 0,
    ['I feel frustrated with my result. I might ask the teacher for feedback.', 'I am never taking another exam.', 'My outcome has produced adverse affect.', 'I am frustrate because I did not good.'], 0)
add('speak-r12-teens-cinema-disagree', 'cinema,tv', 'teens', 'B1',
    'Your friends want to watch a horror film, but you would prefer a comedy.', 'Disagree about a film choice politely',
    ['Horror is bad. My choice wins.', 'My cinematic preference is of an alternate genre.', 'I am not in the mood for horror. Could we choose a comedy?', 'I prefer comedy rather horror so change.'], 2,
    ['I would enjoy a comedy more. What does everyone think?', 'You all have terrible taste.', 'A humorous production may better suit the group.', 'I am wanting comedy, do you agree it?'], 0)
add('speak-r12-teens-home-energy', 'environment-at-home,chores', 'teens', 'B2',
    'Your family wants to lower its electricity use but nobody agrees where to start.', 'Propose a practical energy-saving habit',
    ['Could we switch off devices overnight and compare the next bill?', 'Everyone must stop using electricity.', 'A household efficiency intervention merits implementation.', 'We should switch devices at nights for less bill.'], 0,
    ['Let us try shorter air-conditioning hours for two weeks.', 'Your habits are the problem.', 'A reduction in cooling-system runtime is advisable.', 'We can trying less air-condition hours.'], 0)
add('speak-r12-teens-job-interview', 'part-time-jobs,work', 'teens', 'B2',
    'At a shop interview, the manager asks why you want a weekend job.', 'Explain motivation for a part-time job',
    ['I want to earn money and learn how to help customers.', 'I need cash. That is all.', 'This employment opportunity aligns with my professional trajectory.', 'I want earning money and learn customers.'], 0,
    ['I enjoy working with people and can help on Saturdays.', 'Any job is better than school.', 'The role facilitates development of interpersonal competencies.', 'I enjoying people and can helps Saturdays.'], 0)
add('speak-r12-teens-job-shift', 'part-time-jobs,work', 'teens', 'B2',
    'Your supervisor asks you to cover a shift that clashes with an exam.', 'Decline a shift and offer an alternative',
    ['I have an exam that day, but I can cover Sunday instead.', 'School is more important than this place.', 'A scheduling conflict prevents acceptance of that allocation.', 'I having exam so maybe Sunday I can.'], 0,
    ['I cannot work Friday because of my exam. Is Saturday useful?', 'Find somebody else.', 'My academic commitment supersedes this shift requirement.', 'I cannot Friday but Saturday I could works.'], 0)
add('speak-r12-teens-apology-group', 'apologies,school-projects', 'teens', 'B2',
    'You forgot to upload your section of a group presentation before rehearsal.', 'Apologize to a group and repair the problem',
    ['I forgot my part. I will upload it now and check the slides with you.', 'It is fine; you can wait.', 'I regret the omission of my assigned deliverable.', 'I forgot and now you must fixing it.'], 0,
    ['I am sorry I held everyone up. I can stay and help rehearse.', 'It was not my fault you planned early.', 'My contribution delay is hereby acknowledged.', 'Sorry I held you but I upload later maybe.'], 0)
add('speak-r12-teens-compliment-idea', 'compliments,school-projects', 'teens', 'B2',
    'A teammate suggests a better way to present your survey results.', 'Acknowledge an idea and build on it',
    ['That makes the results clearer. Could we add one example?', 'I already thought of that.', 'Your proposal substantially improves communicative clarity.', 'Your idea make results clear; we add example?'], 0,
    ['I like your chart idea; perhaps we could label the main trend.', 'It is acceptable, I suppose.', 'The conceptual refinement is duly recognized.', 'I like it and maybe we labels trend.'], 0)
add('speak-r12-teens-phone-complaint', 'phone-calls,shopping', 'teens', 'B2',
    'You call a shop because an online order arrived damaged.', 'Describe a problem and request a remedy by phone',
    ['The headphones arrived broken. Could you explain the replacement process?', 'You sent rubbish. Fix it.', 'The delivered merchandise exhibits functional impairment.', 'My headphones broken arrived; replace how?'], 0,
    ['My order was damaged in delivery. May I arrange an exchange?', 'This shop is terrible.', 'I seek redress for compromised goods.', 'The order damaged and I wanting new.'], 0)


def move_natural(reply_set, target):
    replies = reply_set['replies']
    natural = reply_set['natural']
    shift = (natural - target) % len(replies)
    reply_set['replies'] = replies[shift:] + replies[:shift]
    reply_set['natural'] = target


assert len(rows) == 80, len(rows)
for index, row in enumerate(rows):
    move_natural(row['before'], index % 4)
    move_natural(row['after'], (index + 1) % 4)
path.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Wrote 80 Speak situations with 20 natural answers in each position for before and after')
