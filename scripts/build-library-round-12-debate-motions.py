"""Build the hand-authored Round 12 debate bank from compact reviewed records."""
import json
from pathlib import Path

# Each claim was checked against the named primary source. Direct links are in
# docs/library-round-12-evidence-sources.md.
E = {
    'hw_help': ('In PISA 2022, up to two hours of daily homework was positively associated with mathematics performance on average.', 'OECD, PISA 2022 Results Volume II'),
    'hw_load': ('In PISA 2022, more than two hours of daily homework was negatively associated with mathematics performance on average.', 'OECD, PISA 2022 Results Volume II'),
    'hw_space': ('PISA 2018 found that access to a school homework room was associated with higher reading scores, even after accounting for socioeconomic factors.', 'OECD, PISA 2018 Results Volume V'),
    'recess_focus': ('CDC reports that recess can improve attention, concentration and time on task in class.', 'CDC and SHAPE America, Strategies for Recess in Schools'),
    'recess_pe': ('CDC says recess should not replace physical education classes.', 'CDC, Comprehensive School Physical Activity Programs guide'),
    'activity_daily': ('WHO recommends an average of at least 60 minutes of moderate to vigorous activity daily for ages 5–17.', 'WHO, Guidelines on Physical Activity and Sedentary Behaviour'),
    'activity_variety': ('WHO counts play, games, sports, walking, cycling and chores as forms of physical activity for children.', 'WHO, Guidelines on Physical Activity and Sedentary Behaviour'),
    'activity_school': ('CDC says school activity programmes can combine PE, recess, classroom movement and family engagement.', 'CDC, Strategies for School and Youth Programs'),
    'food_variety': ('WHO says a healthy diet includes varied whole grains, vegetables, fruit and pulses.', 'WHO, Healthy Diet fact sheet'),
    'food_sugar': ('WHO recommends that free sugars stay below 10% of total daily energy intake for children and adults.', 'WHO, Healthy Diet fact sheet'),
    'food_school': ('WHO says school food rules should increase access to healthy choices and reduce foods high in sugar, salt and unhealthy fats.', 'WHO, Policies and Interventions to Create Healthy School Food Environments'),
    'food_nudge': ('WHO lists nudges and better food provision alongside nutrition standards as ways to improve school food.', 'WHO, Policies and Interventions to Create Healthy School Food Environments'),
    'waste_house': ('UNEP documents substantial food waste from households as well as food service and retail.', 'UNEP, Food Waste Index Report 2024'),
    'compost_good': ('EPA says composting diverts food scraps from disposal and creates a useful soil amendment.', 'US EPA, Benefits of Using Compost'),
    'compost_care': ('EPA says different compost feedstocks have different benefits and challenges; nutrient transport must be considered.', 'US EPA, Benefits of Using Compost'),
    'reuse_best': ('EPA ranks source reduction and reuse above recycling in its waste-management hierarchy.', 'US EPA, Sustainable Materials Management Hierarchy'),
    'plastic_cheap': ('UNEP says plastic is cheap, light and easy to manufacture.', 'UNEP, Single-Use Plastics: A Roadmap for Sustainability'),
    'plastic_waste': ('UNEP reports that current systems struggle to cope with the plastic waste people generate.', 'UNEP, Single-Use Plastics: A Roadmap for Sustainability'),
    'green_health': ('WHO reports that urban green spaces can support physical activity, social ties and mental health.', 'WHO Europe, Urban Green Spaces and Health'),
    'green_equity': ('WHO finds that better urban green space can bring health, social and environmental benefits, especially for lower-income groups.', 'WHO Europe, Urban Green Space Interventions and Health'),
    'green_planning': ('WHO says community engagement and cross-sector planning are important for successful green-space projects.', 'WHO Europe, Urban Green Space Interventions and Health'),
    'space_access': ('WHO, UNICEF and UN-Habitat report that only 44% of urban residents live near an open public space.', 'WHO, Guide to Creating Urban Public Spaces for Children'),
    'zoo_breed': ('Smithsonian scientists use conservation breeding to help preserve cheetah genetic diversity.', 'Smithsonian National Zoo, Cheetah Breeding Program'),
    'zoo_welfare': ('UK modern zoo standards cover animal welfare as well as conservation, public safety and education.', 'UK Department for Environment, Standards of Modern Zoo Practice'),
    'zoo_recovery': ('Smithsonian reports that captive breeding and reintroduction helped the scimitar-horned oryx recover in the wild.', 'Smithsonian National Zoo, Oryx Recovery'),
    'habitat_loss': ('UNEP identifies habitat loss among the pressures driving global biodiversity decline.', 'UNEP, Global Biodiversity Loss policy brief'),
    'phone_focus': ('UNESCO reports that even a nearby phone can distract students from learning.', 'UNESCO, 2023 Global Education Monitoring Report'),
    'digital_skill': ('UNICEF Innocenti reports that keeping children offline can undermine their digital skills development.', 'UNICEF Innocenti, Childhood in a Digital World'),
    'digital_risk': ('UNICEF says digital learning brings opportunities but can also introduce risks that schools must manage.', 'UNICEF, Child Protection in Digital Education'),
    'tech_gap': ('UNESCO reports that many schools still lack internet access, especially at primary level.', 'UNESCO, 2023 Global Education Monitoring Report'),
    'tech_help': ('UNESCO says digital technology can help disadvantaged learners when it supports human-centred teaching.', 'UNESCO, 2023 Global Education Monitoring Report'),
    'play_learning': ('UNICEF reports that play supports young children’s language, social, physical and thinking skills.', 'UNICEF Data, The Power of Play'),
    'play_simple': ('UNICEF says books, drawing materials, natural items and simple household objects can support play and learning.', 'UNICEF Data, The Power of Play'),
    'play_gap': ('UNICEF reports that many young children lack playful interactions or playthings at home.', 'UNICEF Data, The Power of Play'),
    'sleep_need': ('CDC says teenagers aged 13–18 need 8–10 hours of sleep per day.', 'CDC, Sleep and Health'),
    'sleep_start': ('CDC says later school start times can help adolescents get enough sleep.', 'CDC, Sleep and Health'),
    'sleep_education': ('CDC also lists sleep education as an action schools can take to support student sleep.', 'CDC, Sleep and Health'),
    'ai_skills': ('UNESCO’s student AI framework sets out twelve competencies including critical judgement and responsible use.', 'UNESCO, AI Competency Framework for Students'),
    'ai_risk': ('UNESCO guidance asks education systems to assess both the opportunities and risks of AI in learning.', 'UNESCO, AI and Education: Guidance for Policy-makers'),
    'online_social': ('UNICEF Innocenti says online play can provide social connection for some children.', 'UNICEF Innocenti, Debunking Four Myths About Children’s Safety Online'),
    'online_safe': ('UNICEF says online spaces can support learning and socialising but can also expose children to bullying and harmful content.', 'UNICEF Innocenti, Childhood in a Digital World'),
    'languages_literacy': ('UNESCO reports that learning in a familiar home language improves literacy and confidence.', 'UNESCO, Language Matters: The Role and Power of Multilingualism'),
    'languages_access': ('UNESCO estimates that about 40% of people worldwide cannot access education in the language they speak at home.', 'UNESCO, Language Matters: The Role and Power of Multilingualism'),
    'languages_complex': ('UNESCO notes that many governments see multilingual education as complex or expensive.', 'UNESCO, Language Matters: The Role and Power of Multilingualism'),
    'arts_learning': ('UNESCO’s 2024 India education report describes arts education as supporting creativity and inclusive learning.', 'UNESCO, State of the Education Report for India 2024'),
    'arts_tradeoff': ('OECD reports that schools offering more creative extracurricular activities tended to have higher reading performance, though this is an association.', 'OECD, PISA 2018 Results Volume V'),
}

rows = []


def add(motion, topic, age, level, pros, cons, evidence_for, evidence_against):
    for side in (pros, cons):
        assert len(side) == 3, (motion, side)
    rows.append({
        'id': f'debate-r12-{len(rows)+1:02d}', 'motion': motion,
        'topics': [topic], 'ageBand': age, 'cefr': level,
        'forPoints': pros, 'againstPoints': cons,
        'evidence': [
            {'fact': E[evidence_for][0], 'side': 'for', 'source': E[evidence_for][1]},
            {'fact': E[evidence_against][0], 'side': 'against', 'source': E[evidence_against][1]},
        ],
        'pulse': 'Do you think ' + motion[0].lower() + motion[1:].rstrip('.') + '?',
    })


# Kids: short, concrete school, food, animals, play and home choices.
add('Homework should be optional', 'school', 'kids', 'A2',
    ['Children need time to play.', 'Families have different evening schedules.', 'A choice can make practice feel fairer.'],
    ['Some practice helps ideas stick.', 'Teachers need to see who needs help.', 'A short task can build a routine.'], 'hw_load', 'hw_help')
add('Schools should give less homework', 'school', 'kids', 'A2',
    ['Long tasks can take away rest.', 'Short tasks are easier to finish well.', 'More free time helps family life.'],
    ['Practice can help with maths.', 'Some pupils need extra time.', 'A little homework teaches planning.'], 'hw_load', 'hw_help')
add('Schools should open homework rooms after class', 'school', 'kids', 'B1',
    ['A quiet place helps children focus.', 'Teachers can answer questions.', 'Home space is not equal for everyone.'],
    ['Some children need to go home early.', 'Staff and rooms cost money.', 'Homework could still take too much time.'], 'hw_space', 'hw_load')
add('Schools should have two play breaks each day', 'school', 'kids', 'A2',
    ['Play helps children focus again.', 'Friends can talk and move.', 'Two short breaks split up sitting.'],
    ['Lessons still need enough time.', 'Extra breaks need adult supervision.', 'PE also needs its own time.'], 'recess_focus', 'recess_pe')
add('Play break should never be taken away', 'school', 'kids', 'A2',
    ['Children need movement even after mistakes.', 'A break can help a child calm down.', 'Everyone deserves time with friends.'],
    ['Schools need other fair consequences.', 'Some safety problems need a pause.', 'Teachers need a clear rule.'], 'recess_focus', 'recess_pe')
add('Classrooms should have a movement break', 'school', 'kids', 'A2',
    ['Moving can help attention.', 'It breaks up long sitting.', 'Everyone can join simple stretches.'],
    ['A break can interrupt a task.', 'Some rooms are very small.', 'PE and outdoor play matter too.'], 'activity_school', 'recess_pe')
add('Every child should try a school sport', 'sports', 'kids', 'B1',
    ['Sport can help children move daily.', 'A team can build friendships.', 'Trying teaches new skills.'],
    ['Not every child likes competition.', 'Games and walking count as movement too.', 'Teams need space and equipment.'], 'activity_daily', 'activity_variety')
add('Walking games are better than sitting games at school', 'games', 'kids', 'A2',
    ['They help children move.', 'They can use the playground.', 'They offer a fun change from desks.'],
    ['Quiet games help children rest.', 'Some pupils cannot run easily.', 'Children should have choices.'], 'activity_daily', 'play_learning')
add('Schools should offer more than one kind of PE', 'sports', 'kids', 'B1',
    ['More children may find a game they enjoy.', 'Dance and walking count too.', 'Variety teaches different skills.'],
    ['Equipment and teachers cost money.', 'A small school may lack space.', 'One sport can teach teamwork well.'], 'activity_variety', 'activity_school')
add('Schools should serve fruit every day', 'food', 'kids', 'A2',
    ['Fruit gives children a healthy choice.', 'Everyone can try different kinds.', 'It can replace a very sweet snack.'],
    ['Some children prefer other healthy foods.', 'Fresh food can spoil.', 'Schools must keep meals varied.'], 'food_variety', 'waste_house')
add('Schools should stop selling sugary drinks', 'food', 'kids', 'A2',
    ['Water is an easy choice.', 'Less sugar helps teeth.', 'The school shop can support healthy habits.'],
    ['Older pupils may want a choice.', 'A rule alone cannot change every habit.', 'Schools should also offer good alternatives.'], 'food_sugar', 'food_nudge')
add('Children should help choose school lunches', 'food', 'kids', 'B1',
    ['They can suggest food they will eat.', 'A vote gives pupils a voice.', 'Better choices may mean less waste.'],
    ['Meals still need to be healthy.', 'The kitchen has a budget.', 'Not everyone likes the same food.'], 'waste_house', 'food_school')
add('Schools should weigh their lunch waste', 'food', 'kids', 'B1',
    ['Measuring shows what is thrown away.', 'Classes can test ways to waste less.', 'Children see why portions matter.'],
    ['Weighing takes time.', 'A number may embarrass pupils.', 'The school needs a clear use for the results.'], 'waste_house', 'food_school')
add('Every school should compost food scraps', 'environment', 'kids', 'B1',
    ['Scraps can help make soil.', 'It teaches a useful habit.', 'Less food goes in the rubbish bin.'],
    ['Compost needs care and space.', 'Some scraps cause problems.', 'Preventing waste first may help more.'], 'compost_good', 'compost_care')
add('Schools should give smaller lunch portions first', 'food', 'kids', 'A2',
    ['Pupils can ask for more.', 'Less food may be thrown away.', 'Small children get a suitable start.'],
    ['A hungry child needs enough food.', 'Serving twice may slow lunch.', 'The same portion will not suit everyone.'], 'waste_house', 'food_variety')
add('Schools should lend reusable water bottles', 'environment', 'kids', 'A2',
    ['Fewer throwaway bottles are needed.', 'Children can refill water.', 'Borrowing helps anyone who forgot one.'],
    ['Bottles need washing.', 'They may get lost.', 'Safe drinking water must be available.'], 'reuse_best', 'plastic_cheap')
add('Class parties should avoid throwaway plates', 'environment', 'kids', 'A2',
    ['Reusable plates make less rubbish.', 'A class can share a set.', 'Children see reuse in action.'],
    ['Washing takes time and water.', 'A large party needs many plates.', 'Cheap light plates are easy to carry.'], 'plastic_waste', 'plastic_cheap')
add('Schools should repair toys before buying new ones', 'environment', 'kids', 'B1',
    ['Repairing can save materials.', 'Children can learn how things work.', 'The toy gets a longer life.'],
    ['A broken toy may be unsafe.', 'A repair may cost more than a new toy.', 'Some toys cannot be fixed.'], 'reuse_best', 'plastic_cheap')
add('Every school should have a small garden', 'nature', 'kids', 'A2',
    ['Children can learn about plants.', 'A garden gives outdoor time.', 'Food scraps could become compost.'],
    ['Plants need care in holidays.', 'Some schools lack space.', 'Compost needs careful use.'], 'green_health', 'compost_care')
add('Cities should build more playgrounds', 'nature', 'kids', 'A2',
    ['Children need safe places to play.', 'Families can meet there.', 'Play helps health and learning.'],
    ['Playgrounds need land and repairs.', 'Other public spaces also matter.', 'A poor design may not feel safe.'], 'space_access', 'green_planning')
add('Schoolyards should have more trees', 'nature', 'kids', 'A2',
    ['Trees make a pleasant place to play.', 'Children can learn about nature.', 'Green space supports health.'],
    ['Trees need water and care.', 'Roots can affect play areas.', 'The yard must still have open space.'], 'green_health', 'green_planning')
add('Zoos should close', 'animals', 'kids', 'B1',
    ['Wild animals need careful welfare protection.', 'People can learn through films and nature visits.', 'Habitat protection matters in the wild.'],
    ['Some zoos help endangered animals breed.', 'Good zoos teach visitors.', 'Careful research can help conservation.'], 'zoo_welfare', 'zoo_breed')
add('Zoos should focus only on endangered animals', 'animals', 'kids', 'B1',
    ['Space could help animals that need it most.', 'A clear goal helps conservation.', 'Visitors can learn about species at risk.'],
    ['All animals need good care.', 'Children learn from common animals too.', 'A mixed collection may support zoo work.'], 'zoo_recovery', 'zoo_welfare')
add('Children should visit zoos to learn about animals', 'animals', 'kids', 'A2',
    ['They can see animals closely.', 'Keepers can explain conservation.', 'A visit may inspire care for wildlife.'],
    ['Animal welfare must come first.', 'Films and local parks can teach too.', 'Not every family can afford a trip.'], 'zoo_breed', 'zoo_welfare')
add('Phones should stay in school bags', 'technology', 'kids', 'B1',
    ['Lessons can have fewer distractions.', 'Friends may talk face to face.', 'A simple rule is easy to remember.'],
    ['Phones can help with learning.', 'Children need digital skills.', 'Teachers can set careful times for use.'], 'phone_focus', 'digital_skill')
add('Children should have some screen-free play time', 'games', 'kids', 'A2',
    ['They can move and make things.', 'Outdoor play can bring friends together.', 'A break gives eyes and minds a rest.'],
    ['Online games can connect friends.', 'Some children play creatively online.', 'A strict ban may be unfair.'], 'play_learning', 'online_social')
add('Schools should teach safe internet habits early', 'technology', 'kids', 'B1',
    ['Children can learn how to ask for help.', 'Safety lessons help them use useful tools.', 'Pupils can practise kind online talk.'],
    ['Lessons need trained adults.', 'One lesson cannot remove online risks.', 'Platforms also have responsibilities.'], 'digital_risk', 'online_safe')
add('Children should choose some classroom games', 'games', 'kids', 'A2',
    ['Children know what they enjoy.', 'Choice can make play more exciting.', 'They can practise taking turns.'],
    ['The teacher must keep games safe.', 'Popular games may leave someone out.', 'Some games do not fit the lesson.'], 'play_learning', 'activity_school')
add('Schools should keep a box of simple play materials', 'games', 'kids', 'A2',
    ['A box can help creative play.', 'Simple things cost little.', 'Children can share and invent games.'],
    ['Things need storage and care.', 'Some materials break quickly.', 'Outdoor space matters too.'], 'play_simple', 'green_health')
add('Families should make time to play together', 'home', 'kids', 'A2',
    ['Playing helps children learn words.', 'Families can enjoy time together.', 'Games help children practise sharing.'],
    ['Families have different schedules.', 'Children also need independent play.', 'Simple materials still need space and time.'], 'play_learning', 'play_gap')

# Teens: school policy, digital life, health, environment and public space.
add('High schools should start later', 'school', 'teens', 'B1',
    ['Teenagers need enough sleep.', 'Rest can improve morning attention.', 'A later start fits adolescent sleep patterns.'],
    ['Families may have earlier work hours.', 'Transport timetables would change.', 'A later finish could squeeze activities.'], 'sleep_start', 'sleep_education')
add('Schools should cap homework at one hour', 'school', 'teens', 'B1',
    ['A cap protects rest and hobbies.', 'Focused work may beat long tasks.', 'Pupils can plan evenings more easily.'],
    ['Some subjects need more practice.', 'Different pupils work at different speeds.', 'A single cap ignores busy weeks.'], 'hw_load', 'hw_help')
add('Homework clubs should replace most home assignments', 'school', 'teens', 'B2',
    ['A shared quiet space can reduce inequality.', 'Staff can help when pupils get stuck.', 'Work can finish before home time.'],
    ['Some pupils need flexible hours.', 'Clubs need staff and rooms.', 'Independent practice at home can be useful.'], 'hw_space', 'hw_help')
add('Schools should allow AI for homework planning', 'technology', 'teens', 'B1',
    ['A tool can break a task into steps.', 'Students should learn responsible AI use.', 'Planning help can support independent work.'],
    ['AI can give wrong advice.', 'Access differs between pupils.', 'Teachers need clear boundaries.'], 'ai_skills', 'ai_risk')
add('Students should disclose AI help on assignments', 'technology', 'teens', 'B2',
    ['Disclosure makes assessment fairer.', 'Teachers can see a pupil’s own work.', 'It builds critical AI habits.'],
    ['A rule may be hard to define.', 'Checking every use takes time.', 'Some pupils use AI as an accessibility aid.'], 'ai_skills', 'ai_risk')
add('AI literacy should be a required subject', 'technology', 'teens', 'B2',
    ['Young people need to judge AI outputs.', 'Schools can teach responsible use.', 'All pupils deserve basic AI skills.'],
    ['Timetables are already crowded.', 'The technology changes quickly.', 'AI could be taught inside existing subjects.'], 'ai_skills', 'ai_risk')
add('Schools should ban phones during lessons', 'technology', 'teens', 'B1',
    ['Notifications distract attention.', 'A clear rule supports teachers.', 'Classmates can focus together.'],
    ['Phones can support useful research.', 'Some pupils need a device for access.', 'Careful use teaches digital judgement.'], 'phone_focus', 'tech_help')
add('All school textbooks should be digital', 'technology', 'teens', 'B2',
    ['Digital copies can travel easily.', 'Text can be updated quickly.', 'Useful tools can make reading accessible.'],
    ['Many schools lack reliable internet.', 'Screens can distract readers.', 'Devices need charging and repair.'], 'tech_help', 'tech_gap')
add('Schools should teach with fewer screens', 'technology', 'teens', 'B1',
    ['Human discussion deserves more time.', 'Phones can break concentration.', 'Pupils can practise reading on paper.'],
    ['Digital tools can widen access.', 'Skills for online life matter.', 'Some lessons work better with media.'], 'phone_focus', 'tech_help')
add('Social media should have a teen time limit', 'technology', 'teens', 'B1',
    ['A limit can protect time for sleep.', 'It may encourage offline friendships.', 'It can reduce endless scrolling.'],
    ['Online spaces also connect friends.', 'A fixed limit ignores different uses.', 'Safer design matters beyond time.'], 'sleep_need', 'online_social')
add('Platforms should explain recommendation algorithms to teens', 'technology', 'teens', 'B2',
    ['Teens can better judge what they see.', 'Transparency may improve safety.', 'It supports informed digital choices.'],
    ['Technical explanations can be confusing.', 'Algorithms change often.', 'Transparency alone will not stop harm.'], 'online_safe', 'digital_risk')
add('Online safety lessons should begin before secondary school', 'technology', 'teens', 'B1',
    ['Younger pupils already meet online risks.', 'They can practise asking for help.', 'Early habits may carry forward.'],
    ['Teaching requires trained adults.', 'Poor lessons may frighten children.', 'Platforms must also make spaces safer.'], 'digital_risk', 'online_safe')
add('School meals should offer a plant-based choice daily', 'food', 'teens', 'B1',
    ['More pupils can find a meal they like.', 'Pulses are part of a healthy diet.', 'Choice can support different food needs.'],
    ['Meals must still be balanced.', 'Kitchens may need new recipes.', 'Food that pupils reject becomes waste.'], 'food_variety', 'waste_house')
add('Schools should remove sugary drinks from vending machines', 'food', 'teens', 'B1',
    ['Less sugar supports health.', 'Schools can offer water instead.', 'The vending machine shapes daily choices.'],
    ['Pupils may buy drinks elsewhere.', 'A ban does not teach moderation.', 'Schools need appealing alternatives.'], 'food_sugar', 'food_nudge')
add('Students should help design cafeteria menus', 'food', 'teens', 'B2',
    ['Student input can reduce uneaten food.', 'It gives young people a voice.', 'Menus may include more varied dishes.'],
    ['Health standards must stay in place.', 'Cost limits the menu.', 'One group cannot represent every taste.'], 'waste_house', 'food_school')
add('Schools should publish food waste totals', 'environment', 'teens', 'B1',
    ['Visible data can prompt better choices.', 'It makes a problem concrete.', 'Classes can track improvement.'],
    ['Numbers without context can mislead.', 'Measuring costs staff time.', 'Prevention matters more than reports.'], 'waste_house', 'reuse_best')
add('Cafeterias should compost leftover food', 'environment', 'teens', 'B1',
    ['Compost keeps scraps out of disposal.', 'It can support school gardens.', 'Students learn a practical process.'],
    ['Compost needs suitable space.', 'Wrong materials can cause problems.', 'Schools should prevent waste first.'], 'compost_good', 'compost_care')
add('Schools should prevent food waste before composting', 'environment', 'teens', 'B2',
    ['Uneaten food uses resources needlessly.', 'Smaller portions can be adjusted.', 'Prevention comes before recycling.'],
    ['Some food scraps cannot be avoided.', 'Composting still has value.', 'Predicting what everyone eats is hard.'], 'reuse_best', 'compost_good')
add('School events should use reusable cups', 'environment', 'teens', 'B1',
    ['Reuse cuts throwaway waste.', 'One set can serve many events.', 'Schools can model a simple change.'],
    ['Cups need washing and storage.', 'Large events need enough stock.', 'Disposable plastic is light and cheap.'], 'reuse_best', 'plastic_cheap')
add('School shops should avoid single-use plastic packaging', 'environment', 'teens', 'B2',
    ['Less packaging means less waste.', 'Shops can try refill options.', 'Pupils can practise low-waste buying.'],
    ['Packaging can protect food.', 'Alternatives may cost more.', 'Plastic is light and easy to make.'], 'plastic_waste', 'plastic_cheap')
add('Schools should run a repair club', 'environment', 'teens', 'B1',
    ['Repair can extend product life.', 'Pupils learn practical skills.', 'The school may buy fewer replacements.'],
    ['Electrical repairs need expert safety.', 'Some items are beyond repair.', 'Tools and supervision cost money.'], 'reuse_best', 'plastic_cheap')
add('Cities should replace some parking with parks', 'nature', 'teens', 'B2',
    ['Green space supports health.', 'More families need places to meet.', 'A park can cool a street.'],
    ['Some visitors need car access.', 'New parks need maintenance.', 'A space should suit local residents.'], 'green_health', 'green_planning')
add('Every neighbourhood should have a public play space', 'nature', 'teens', 'B1',
    ['Children need places near home.', 'Shared spaces can build community.', 'Outdoor play supports activity.'],
    ['Land is scarce in some areas.', 'Safety and maintenance matter.', 'Different ages want different spaces.'], 'space_access', 'green_planning')
add('Students should help plan local parks', 'nature', 'teens', 'B2',
    ['Young users know what is missing.', 'Participation can build ownership.', 'Plans may better serve different ages.'],
    ['Planners need technical knowledge.', 'A few students cannot speak for everyone.', 'Decisions must fit the budget.'], 'green_equity', 'green_planning')
add('Zoos should fund more habitat protection', 'animals', 'teens', 'B1',
    ['Wild homes are central to conservation.', 'Funding can help animals beyond zoos.', 'Visitors can learn how to help.'],
    ['Captive breeding also matters.', 'Some species need urgent care.', 'Zoos have limited funds.'], 'habitat_loss', 'zoo_recovery')
add('Conservation breeding should be a zoo priority', 'animals', 'teens', 'B2',
    ['It can protect genetic diversity.', 'It may support reintroduction.', 'Specialist keepers can study animals.'],
    ['Animal welfare needs close attention.', 'Breeding alone cannot protect habitats.', 'Not every species breeds well in captivity.'], 'zoo_breed', 'zoo_welfare')
add('Wildlife lessons should happen outside zoos when possible', 'animals', 'teens', 'B2',
    ['Local nature makes learning real.', 'No captive animal is needed.', 'Pupils can see habitats directly.'],
    ['Zoos can show hard-to-see species.', 'Expert keepers can explain conservation.', 'Outdoor trips depend on local access.'], 'zoo_welfare', 'zoo_breed')
add('Schools should teach in students’ home languages when possible', 'language', 'teens', 'B1',
    ['Familiar words can support understanding.', 'It respects pupils’ identities.', 'Confidence helps class participation.'],
    ['Schools may serve many languages.', 'Teachers need suitable materials.', 'Pupils also need the shared school language.'], 'languages_literacy', 'languages_complex')
add('Students should be allowed to study more languages', 'language', 'teens', 'B1',
    ['More languages help people connect.', 'Choice can value family languages.', 'Learning can build confidence.'],
    ['Schools need specialist teachers.', 'Time for core subjects is limited.', 'Some pupils need deeper support in one language.'], 'languages_literacy', 'languages_complex')
add('Arts should receive as much class time as science', 'school', 'teens', 'B2',
    ['Art supports creativity.', 'More pupils can show their strengths.', 'Both subjects can enrich learning.'],
    ['Science needs hands-on class time.', 'A timetable has limited hours.', 'Arts clubs can add opportunities outside class.'], 'arts_learning', 'arts_tradeoff')

assert len(rows) == 60, len(rows)
assert len({r['motion'].lower() for r in rows}) == 60
assert all(len(r['motion'].split()) <= 12 for r in rows)
Path('src/data/debate-motions.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('Wrote 60 sourced debate motions (30 kids, 30 teens).')
