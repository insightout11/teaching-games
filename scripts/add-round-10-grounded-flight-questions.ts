import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createServiceClient } from '../src/lib/supabase/service';

type LibraryItem = {
  id: string;
  title: string;
  kind?: string;
  summary?: string;
  youtubeId?: string | null;
  transcriptVerified?: boolean;
  ageBand?: string;
  topicTags?: string[];
  series?: { id?: string };
  needsReview?: boolean;
  reviewNote?: string;
  flightQuestion?: string;
  [key: string]: unknown;
};

const dataDir = path.resolve('src/data');
const stopWords: Record<string, boolean> = {};
('a an and are as at be been being but by can could did do does for from had has have he her hers him his how i if in into is it its may might more most must my no not of on one or our out should so some than that the their them then there these they this those through to too under up us was we were what when where which who why will with would you your also because however first next after before later students student people person group class classmates teacher teachers many much very really today later one two three four five each every another everyone something everything theyre theirselves its theyve youve weve didnt doesnt cant wont youre im hes shes role reveal play playing teaches show shows told tell talking said says story stories video videos topic material things thing activity project conclusion information evidence results first second little use used using make made change changes important different general everyone what which when then really people world'.split(' '))
  .forEach((word) => { stopWords[word] = true; });

const groundedQuestions: Record<string, string> = {
  'bbc_grammar_formal_informal': 'When should a speaker choose formal English over informal English?',
  'bbc_grammar_mixing_conditionals': 'How can mixed conditionals connect an imagined past and present?',
  'bbc-grammar-r2-xFsYrTIndhI': 'When should a speaker use present continuous instead of present simple?',
  'bbc-grammar-r2-tbru3bW2kVE': 'How is “manage to” different from “can”?',
  'bbc-grammar-r2-8_nhtAwI0dA': 'How does “yet” change a present perfect sentence?',
  'bbc-grammar-r2-o-GWYDA4IQY': 'When do “ever” and “never” belong in present perfect?',
  'african-storybook-19765': 'Should Anansi help Rabbit stir the vegetables before eating?',
  'african-storybook-1881': 'Should the baby elephant keep asking every animal questions?',
  'african-storybook-48726': 'Should Sisi visit the maize farm with Kibo and Jengo?',
  'african-storybook-17648': 'Is the rat king right to call rats the best animals?',
  'african-storybook-2651': 'Should Demane and Demazane leave their cruel uncle?',
  'african-storybook-15028': 'Should the girl’s people welcome the pregnant stranger?',
  'african-storybook-50308': 'Can Princess Kela win friends without helping anyone?',
  'african-storybook-36914': 'Should Nido let his friends choose a game?',
  'african-storybook-23861': 'Should Aku finish her fufu before asking for ice cream?',
  'african-storybook-34756': 'How can Lizzy cross her busy road safely?',
  'african-storybook-13636': 'Should Mondli and Mbali visit their grandmother by the lake?',
  'african-storybook-35268': 'How can Duma protect Wandile by washing his hands?',
  'african-storybook-36998': 'How does Lindiwe’s grandmother care for her in Kasupa?',
  'african-storybook-12169': 'Should Hare take food from hardworking Hyena?',
  'african-storybook-47814': 'Can Spoti protect Lili and Lihle from the naughty monkey?',
  'bbcideas_sports_psychology': 'Can athletes’ focus techniques help students face pressure?',
  'bbcideas_critical_thinking': 'Which thinking habit could stop someone believing a false claim?',
  'bbcideas_science_of_storytelling': 'Can stories change how our brains understand other people?',
  'bbcideas_experience_world_differently': 'Why might two people experience the same room differently?',
  'bbcideas_hidden_clues_personality': 'Can music taste reveal much about someone’s personality?',
  'bbc_masterclass_conversation_phrases': 'When should speakers hedge a disagreement in conversation?',
  'bbc_food_new_food_culture': 'Should newcomers adapt to every part of a new food culture?',
  'bbc_food_waste': 'Who should take responsibility for reducing food waste?',
  'bbc_food_future_food': 'Which future foods could help with food security?',
  'bbc_food_comfort_food': 'Can comfort food bring back a memory?',
  'bbc_health_sitting': 'Should workers take regular breaks from sitting?',
  'bbc_health_workplace_mental_health': 'How should employers support mental health at work?',
  'bbc_climate_saving_water': 'How should people save water in an extremely dry place?',
  'bbc_climate_animal_migration': 'Should people protect routes used by migrating animals?',
  'bbc_animals_love_of_pets': 'Why do people care so deeply about their pets?',
  'bigthink_unconscious_decisions': 'Should we trust decisions made before conscious thought?',
  'bigthink_psychology_happiness': 'Why are people poor at predicting what makes them happy?',
  'bigthink_evolution_intelligence': 'Could artificial intelligence develop like human intelligence?',
  'bigthink_teenage_brain': 'Should adults judge teenage risk differently after understanding brain development?',
  'bigthink_neuroscience_creativity': 'Can uncertainty help the brain produce creative ideas?',
  'natgeo-wolves-change-rivers': 'Should Yellowstone reintroduce wolves to restore its ecosystem?',
  'natgeo-octopus-intelligence': 'How might nine brains shape an octopus’s intelligence?',
  'natgeo-deep-ocean': 'Should people spend more effort mapping the deep sea?',
  'natgeo-elephants-memory': 'How can an elephant’s memory help its herd survive?',
  'natgeo-human-brain': 'How does a brain with billions of neurons learn?',
  'natgeo-coral-reef-crisis': 'Should people prioritize saving reefs that shelter marine species?',
  'natgeo-ancient-egypt': 'Can new technology reveal more about ancient Egyptian monuments?',
  'natgeo-climate-change': 'Which climate effects should communities prepare for first?',
  'natgeo-plastic-pollution': 'Should countries reduce plastic that is unlikely to be recycled?',
  'natgeo-sleep-science': 'Should schools protect time for healthy sleep?',
  'angela_duckworth_grit': 'Can perseverance matter more than talent for success?',
  'carol_dweck_power_of_believing': 'Should teachers praise effort instead of intelligence?',
  'robert_waldinger_good_life': 'Do close relationships matter more than wealth for happiness?',
  'dan_pink_puzzle_of_motivation': 'Can autonomy motivate people better than rewards?',
  'amy_cuddy_body_language': 'Can confident posture change how someone feels?',
  'adam_grant_originals': 'Can procrastination help an original thinker?',
  'hans_rosling_best_stats': 'Should data change our beliefs about developing countries?',
  'elizabeth_gilbert_creative_genius': 'Could treating genius as external reduce creative pressure?',
  'bill_gates_teachers_need_feedback': 'Should teachers use video feedback to improve lessons?',
  'temple_grandin_all_kinds_of_minds': 'How can schools value different kinds of minds?',
  'steven_johnson_where_good_ideas_come': 'Do good ideas grow faster through shared work?',
  'teded_how_sugar_affects_brain': 'How does sugar affect the brain’s reward system?',
  'teded_why_do_we_dream': 'Could dreams help us process memories and emotions?',
  'teded_psychology_of_narcissism': 'How is narcissism different from healthy self-esteem?',
  'teded_how_to_practice_effectively': 'Should short focused practice replace long unfocused sessions?',
  'teded_philosophy_of_stoicism': 'Can Stoic ideas help people face a setback?',
  'teded_how_memories_form': 'Why do some memories last while others fade?',
  'teded_plato_allegory_cave': 'Should Plato’s prisoners trust the shadows they see?',
  'teded_food_and_gut': 'How do food choices affect gut microbes?',
  'teded_how_memories_can_be_manipulated': 'Should eyewitness memories be treated as reliable evidence?',
  'teded_power_of_creative_constraints': 'Can limits make a creative idea stronger?',
  'teded_fairy_tale_origins': 'Should modern fairy tales keep their darker original endings?',
  'vox_world_maps_wrong': 'Which distortion would you accept on a world map?',
  'vox_gerrymandering_overview': 'Should politicians be allowed to draw their own districts?',
  'vox_hostile_architecture': 'Should cities use uncomfortable benches to shape public behavior?',
  'vox_healthcare_cost': 'Why does American health care cost so much?',
  'vox_future_of_work': 'Should workers prepare for jobs reshaped by automation?',
  'vox_america_superpower': 'Which historical choice helped America become a superpower?',
  'vox_democracy_problem': 'How can a party win power with fewer votes?',
  'storyweaver-283-annual-haircut-day': 'Who should help Sringeri Srinivas cut his long hair?',
  'storyweaver-678-the-day-the-vegetables-came-to-school': 'Should Raju follow the vegetables to school?',
  'storyweaver-691-grandpa-fish-and-the-radio': 'Should young fish let Grandpa Fish use the radio?',
  'storyweaver-839-flying-high': 'How could Chandu turn his flying dream into a plan?',
  'storyweaver-2083-animals-are-kind': 'Can a kind son change the rude farmer?',
  'storyweaver-639293-the-surprise': 'What could the girl do with her new guitar?',
  'storyweaver-2325-the-unusual-rainmaking-duet': 'Should the folklore singer perform the rainmaking duet with a friend?',
  'storyweaver-2616-shruti-s-secret-to-winning': 'What might Shruti’s teacher learn about her winning secret?',
  'storyweaver-40-listen-to-my-body': 'When should we listen to what our bodies tell us?',
  'storyweaver-144-going-home': 'Why is the little girl in a hurry to get home?',
  'storyweaver-332-bheema-the-sleepyhead': 'How can Bheema’s friend help him wake on time?',
  'storyweaver-652-the-generous-crow': 'Can Crow’s generosity matter more than beautiful singing?',
  'storyweaver-33-not-now-not-now': 'Should the elders keep telling the boy “not now”?',
  'storyweaver-49-my-fish-no-my-fish': 'How should three friends settle a disagreement about fish?',
  'storyweaver-82-i-want-that-one': 'Should Anil accept what his mother and shopkeepers choose?',
  'storyweaver-90-goloo-the-circle': 'Where could Goloo find circles in everyday life?',
  'storyweaver-269-my-balwadi': 'What would make the children’s Balwadi enjoyable?',
  'storyweaver-369-the-red-raincoat': 'Should Manu wait for rain before wearing his new coat?',
  'storyweaver-409-colours-of-nature': 'Which colours of nature might the artist choose?',
  'storyweaver-749-the-sparrow-and-the-fruit': 'How should Gubbi rescue her guava from the thorns?',
  'storyweaver-776-samira-goes-shopping': 'What makes Samira and Mouchak’s shopping trip unusual?',
  'storyweaver-876-mouse-in-the-house': 'How should the family respond to a mouse indoors?',
  'storyweaver-927-the-royal-toothache': 'Who should teach the jungle king to clean his teeth?',
  'storyweaver-163-veeru-goes-to-the-circus': 'Which circus idea should Veeru try after returning home?',
  'storyweaver-790-sniffles-the-crocodile-and-punch-the-butterfly': 'How can Punch help Sniffles despite their different sizes?',
  'storyweaver-946-too-much-noise': 'How could Sringeri Srinivas protect his cows from highway noise?',
  'storyweaver-997-pehelwaan-ji-plays-cricket': 'Should the children invite Pehelwaan ji to play cricket?',
  'storyweaver-1017-saboo-and-jojo': 'What makes Saboo and Jojo a good pair?',
  'storyweaver-1034-grandma-s-glasses': 'How can Grandma’s young detective find her glasses?',
  'storyweaver-1052-busy-ants': 'What work keeps the ants so busy?',
  'storyweaver-1057-clean-cat': 'How do cats stay clean without taking a bath?',
  'storyweaver-1112-we-are-all-animals': 'What can children and other animals do alike?',
  'storyweaver-1261-thangwang-and-bhalluka': 'Can baby Thangwang and Bhalluka understand each other?',
  'storyweaver-1791-my-musical-adventure': 'Which sounds could change the girl’s musical journey?',
  'storyweaver-1531-mili-s-birthday-celebration': 'How should Mili make her eighth birthday different?',
  'storyweaver-1658-ammu-s-puppy': 'Should Ammu tell her friends the truth about Shankar?',
  'storyweaver-122-no-smiles-today': 'How should Shanti’s friends respond when she becomes quiet?',
  'storyweaver-957-topsy-turvy': 'What could turn a little boy’s house upside down?',
  'storyweaver-981-wailers-three-a-folktale-from-china': 'Should Warrior Wen read Mrs Chang’s letter aloud?',
  'storyweaver-986-tok-tok': 'What could make the mysterious sound in Sonapur’s king’s chambers?',
  'storyweaver-1067-naughty-dog': 'Should the naughty dog listen to its owner?',
  'storyweaver-1205-pishi-caught-in-a-storm': 'Who could rescue Pishi during the Indian Ocean storm?',
  'storyweaver-1583-booboo-sings-for-vihaan': 'Can BooBoo’s song comfort crying Vihaan?',
  'storyweaver-1685-mangoes-for-moidootty': 'Should Malu and Moidootty use magic to get mangoes?',
  'storyweaver-1722-the-princess-and-the-veggy-lion': 'Should the lost princess approach the lion in the forest?',
  'storyweaver-1804-asha-gives-up-a-bad-habit': 'How can Asha stop chewing pencils?',
  'storyweaver-1933-jaggee-s-mornings': 'How could Jaggee make mornings easier?',
  'storyweaver-1974-my-friend-trace-roger-the-robot': 'Should the narrator wish for Trace Roger to be real?',
  'storyweaver-1983-nadir-s-pet': 'Where should Nadir look for his missing pet?',
  'storyweaver-2011-long-water': 'Which river clues help solve the Long Water riddle?',
  'storyweaver-2711-the-day-it-rained-fish': 'What should Ballu and Avanti do when fish fall like rain?',
  'storyweaver-1828-the-cave-party': 'Should Tiger invite every friend to the cave party?',
  'storyweaver-702-the-flyaway-cradle': 'What should the children do with a flying cradle?',
  'storyweaver-847-rumniya': 'How does Nani help Rumniya expect a good ending?',
  'storyweaver-2976-guess-this-place-ghost-town': 'What history might the South Indian ghost town reveal?',
  'storyweaver-2064-prakruti': 'How does Prakruti’s name connect her to nature?',
  'storyweaver-2138-happy-world': 'Can Aloke’s smile help someone having a sad day?',
  'storyweaver-2166-tina-and-the-crazy-animal': 'How should Tina protect her animal from the villagers?',
  'storyweaver-2198-richard-s-unlucky-day': 'How could Richard turn his unlucky day around?',
  'storyweaver-2962-gargi-and-soapy': 'Can Soapy’s dream change Gargi’s feelings about cleanliness?',
  'storyweaver-3234-wonders-of-martina-s-adventure': 'Should Martina follow the map to the Pacific island?',
  'kids_gotta_eat': 'How do plants and animals get the energy they need?',
  'kids_here_comes_the_sun': 'What changes when sunlight reaches Earth?',
  'kids_defining_gravity': 'Could anything stay on Earth without gravity?',
  'kids_weathering_erosion': 'How can rain and rivers change a mountain?',
  'kids_science_of_lunch': 'What happens to food after we eat lunch?',
  'kids_home_sweet_habitat': 'Which habitat needs must people protect for wild animals?',
  'kids_food_webs': 'What happens to a food web when one animal disappears?',
  'kids_everything_revolves': 'Why does the Moon keep orbiting Earth?',
  'kids_climate_change': 'How might climate change affect an animal’s habitat?',
  'kids_living_things_change': 'Can animals adapt quickly enough when their environment changes?',
  'kids_busy_bees': 'Should people protect both bumblebees and honeybees?',
  'kids_dont_fear_spiders': 'Should children be afraid of spiders that catch insects?',
  'kids_cave_animals': 'How can cave fish survive without light or eyes?',
  'kids_diamond_super_crystal': 'Why does a diamond’s carbon structure make it hard?',
  'kids_look_whos_talking': 'How do animals communicate without human words?',
  'kids_particles_world': 'How do tiny particles make up everyday materials?',
  'kids_measurement_mystery': 'Why do scientists need clear units when measuring?',
  'kids_over_to_moon': 'What makes a journey to the Moon difficult?',
  'kids_earth_rotation_revolution': 'How does Earth’s rotation create day and night?',
  'kids_seasons_sun': 'How does changing sunlight help make the seasons?',
  'kids_polar_pineapples': 'Why would pineapples struggle to grow near a pole?',
  'kids_engineering_process': 'Why do engineers test a design before improving it?',
  'kids_4b2kdceuwr4': 'How should communities share water when supplies are limited?',
  'kids_cye4_d6fb_w': 'How can people change a city ecosystem?',
  'kids_1fkgqo0xk94': 'How do beavers change the place where they live?',
  'kids_lsdaf8_mr8e': 'Which design ideas help an object fly?',
  'kids_eb7gtjafae4': 'What makes an engineering trial fair?',
  'kids_zfk0xhqt5fq': 'Why do sharks have so many different features?',
  'kids_kmdd6ttdz_g': 'How does heavy rain support rainforest life?',
  'kids_zojlcdmvwai': 'What clues help archaeologists understand the past?',
  'kids_tsaveexeznw': 'How can microanimals survive in surprising places?',
  'kids_syawnjolnv8': 'Which features link modern birds to dinosaurs?',
  'kids_yoirci0ckzg': 'When does camouflage help an animal hide?',
  'kids_gazkec59g1w': 'How do desert plants save water in dry places?',
  'kids_ueroeqyjxfo': 'What helps the world’s tallest tree keep growing?',
  'kids_hwfqek29wrg': 'Why do evergreen trees keep leaves through the seasons?',
  'kids_x7_t_9wzjga': 'How could a plant seed inspire an invention?',
  'kids_0qmgdz9e47s': 'How can sunlight warm air enough to move it?',
  'kids_8whjjlmniku': 'What makes a real machine a robot?',
  'kids_02wrls_ue1q': 'How are comets different from asteroids?',
  'kids_cjbmsssxf_a': 'What does a narwhal use its tusk for?',
  'kids_8cqmky_wqao': 'How do lions and leopards differ in their habitats?',
  'kids_0otbv8_mdr4': 'How can a failed test improve an engineering design?',
  'kids_xyfuqfqfl30': 'Who decides whether an engineering solution succeeds?',
  'kids_bxfu86gnmrg': 'Why change just one variable in the bowling experiment?',
  'kids_dkjlbcci6zs': 'How should architects balance building materials and people’s needs?',
  'kids_8lfd_ekze2m': 'Which natural resources does a neighborhood depend on?',
  'kids_uxh_7wbns3a': 'How do Earth’s water and air systems interact?',
  'kids_7vtfyamu6g4': 'How do land and water support different living things?',
  'kids_ahcozc143ec': 'How do herbivores and carnivores get energy differently?',
  'kids_ecsirlk0gts': 'Why does soil matter to plants and animals?',
  'kids_zzynerze3cg': 'Which material properties should scientists compare first?',
  'kids_3lhhoitdmk4': 'Where does matter go when materials change?',
  'kids_rrj1_yofcaa': 'Which questions could astronauts test in space?',
  'kids_zd7w5o0bh7g': 'How can sorting material properties help answer a question?',
  'kids_tgflhpslejq': 'Which material would you choose for a useful everyday object?',
  'kids_mrahoi_yik4': 'How do a diamond’s properties affect how people use it?',
  'african-storybook-2058': 'Should Hare challenge Tortoise to another race?',
  'african-storybook-50056': 'Should the two villages play their first football match?',
  'african-storybook-2205': 'Should Crow trust Jackal with the cheese?',
  'african-storybook-15291': 'Should Pontshibobo’s friends climb his tree?',
  'african-storybook-36820': 'How can Bohlale help siblings get along?',
  'african-storybook-2112': 'Which girl should the giant trust with the talking bag?',
  'african-storybook-16535': 'Why does Nita hang upside down near the trees?',
  'african-storybook-9809': 'Should Wangari’s village plant more trees together?',
  'african-storybook-36715': 'Can a coin make Kisara fun for every child?',
  'african-storybook-34111': 'Should Wayan protect the turtles near his village?',
  'african-storybook-39472': 'Should friends stay together after a race?',
  'african-storybook-39123': 'Which steps does Omotola use to install a game?',
  'african-storybook-20771': 'Should Petros get a dog to feel less lonely?',
  'african-storybook-19876': 'Should runners from different countries join Juma’s race?',
  'african-storybook-22166': 'How should Cassava and Palm respond to the drought?',
  'african-storybook-22542': 'Should the children listen when their mother says no?',
  'bbcideas_power_of_kindness': 'Can one kind act change someone’s day?',
  'bigthink_fermi_paradox': 'Should scientists send messages to a possible alien civilization?',
  'cc-ww1-overview': 'Could the Treaty of Versailles prevent another war?',
  'cc-ww2-overview': 'Should countries use force to stop an invasion?',
  'cc-biology-evolution': 'How does natural selection change a population over time?',
  'cc-astronomy-solarsystem': 'Should students use models to understand the solar system?',
  'cc-biology-cells': 'How do cells use DNA to pass on instructions?',
  'minecraft-survival': 'Should players gather resources before night falls?',
  'minecraft-crafting': 'Which materials should players collect before making a tool?',
  'minecraft-building': 'Should players build a house near water or trees?',
  'minecraft-redstone': 'Could redstone circuits make a Minecraft house more useful?',
  'natgeo-how-volcanoes-work': 'Should people build homes near active volcanoes?',
  'natgeo-space-exploration': 'Should people explore space despite its cost?',
  'teded_what_is_depression': 'Should teens seek support when depression affects daily life?',
  'teded_what_if_you_didnt_sleep': 'Should students give sleep a higher priority?',
  'teded_what_makes_a_hero': 'Should a hero be judged by one brave act?',
  'teded_history_of_world_according_to_cats': 'Can cats explain a useful way to remember world history?',
  'teded_evolution_of_human_eye': 'What evidence links the human eye to evolution?',
  'teded_how_do_solar_panels_work': 'Should neighborhoods invest in rooftop solar panels?',
  'travel-transport': 'Should travelers use public transport in a new city?',
  'voa-history-of-jazz': 'How did jazz combine musical ideas from different communities?',
  'voa-sugar-and-health': 'Should people reduce sugar in everyday drinks?',
  'voa-immigration-cultural-identity': 'How can immigrants balance new customs and cultural identity?',
  'voa-american-dream': 'Does the American Dream mean the same thing to everyone?',
  'voa-science-of-nutrition': 'How can small daily habits support good nutrition?',
  'storyweaver-71-everything-looks-new': 'Should children plant seeds they can watch grow?',
  'storyweaver-86-hot-tea-and-warm-rugs': 'Should the family use warm rugs on a cold day?',
  'storyweaver-88-kheer-on-a-full-moon-night': 'Why does the family make kheer on a full moon night?',
  'storyweaver-89-peacocks-and-pakodas': 'Should the children share pakodas with their guests?',
  'storyweaver-111-little-by-little': 'Is it better to solve a problem together?',
  'storyweaver-141-going-to-a-wedding': 'Should relatives travel together for a wedding?',
  'storyweaver-156-paper-play': 'Can old paper become a new toy for the children?',
  'storyweaver-173-the-jungle-school': 'Should different animals learn together at jungle school?',
  'storyweaver-208-too-many-bananas': 'Should the family share extra bananas?',
  'storyweaver-258-goodnight-tinku': 'Does Tinku need a bedtime routine to feel safe?',
  'storyweaver-296-lassi-ice-cream-or-falooda': 'Which mango flavor does the family choose for lassi?',
  'storyweaver-486-gulli-s-box-of-things': 'Should Gulli share the things in her box?',
  'storyweaver-633-cheenu-s-gift': 'What gift does Cheenu choose for her friend?',
  'storyweaver-684-when-amma-went-to-school': 'Should children and parents share a school day?',
  'storyweaver-2057-the-rainbow-story': 'Should the children follow the rainbow together?',
  'storyweaver-2093-the-boy-who-hated-vegetables': 'Should children try a vegetable they dislike?',
  'storyweaver-2245-the-party': 'Can a party be fun when friends help plan it?',
  'storyweaver-2380-the-story-of-stories': 'Should the storyteller share the story with everyone?',
  'storyweaver-2909-windy-s-adventure': 'Can Windy change the weather during her adventure?',
  'storyweaver-2914-dia-s-favourite-festivals': 'How can Dia help classmates understand different festivals?',
  'storyweaver-2942-the-love-of-art': 'Should Rohan keep painting when others choose differently?',
  'storyweaver-2953-nina-plays-with-the-butterflies': 'Should Nina protect the butterflies she finds?',
  'storyweaver-2985-aditi-s-trip-to-moon': 'Should Aditi continue her trip to the moon?',
  'storyweaver-16-vayu-the-wind': 'Should the children wait for the storm to pass?',
  'storyweaver-98-rani-s-first-day-at-school': 'How can Rani feel brave on her first day at school?',
  'storyweaver-149-timmy-and-pepe': 'Should Timmy forgive Pepe after the noisy mistake?',
  'storyweaver-209-the-timid-train': 'Should Babu’s train travel through the tunnel?',
  'storyweaver-723-the-boat-ride': 'Should Vikki choose the boat route for the trip?',
  'storyweaver-944-smart-sona-helps-her-mother': 'Should Sona help her mother with a difficult job?',
  'storyweaver-1062-noisy-crows': 'Could the crows solve their problem by working together?',
  'storyweaver-1208-singing-in-the-rain': 'Should the children wait for Sukhiya before singing?',
  'storyweaver-218-little-painters': 'Should Veena paint what she sees or imagine something new?',
  'round10-teens-a1-geography-history': 'Should the old footpath appear on the new walking map?',
  'round10-kids-b2-geography-history': 'Whose memories should the town map preserve?',
  'round10-teens-a1-history-heritage': 'Should the school replace a bench with many shared memories?',
  'round10-kids-b2-history-heritage': 'How could old photographs change the class decision about the bench?',
  'round10-teens-a1-heritage-culture': 'Should relatives record why their recipe changes?',
  'round10-kids-b2-heritage-culture': 'How should a family preserve notes beside a changing recipe?',
  'round10-teens-a1-culture-india': 'Should students ask classmates how they prefer to be welcomed?',
  'round10-kids-b2-culture-india': 'How can a class avoid treating one custom as universal?',
  'round10-teens-a1-india-food': 'Should the club include unfamiliar market foods in lunch?',
  'round10-kids-b2-india-food': 'How can a shared lunch include different family favorites?',
  'round10-teens-a1-food-family': 'Should siblings plan weeknight meals together?',
  'round10-kids-b2-food-family': 'Who should choose dinner when family schedules conflict?',
  'round10-teens-a1-family-health': 'Should a family walk include rest stops for everyone?',
  'round10-kids-b2-family-health': 'How can a shared exercise plan respect different needs?',
  'round10-teens-a1-health-psychology': 'Should students choose their own study space?',
  'round10-kids-b2-health-psychology': 'How should classmates compare focus in different study spaces?',
  'round10-teens-a1-psychology-society': 'Should clubs use speaking turns to include quieter members?',
  'round10-kids-b2-psychology-society': 'What rule could help every group member share an idea?',
  'round10-teens-a1-society-technology': 'Should the club keep paper notices beside its new app?',
  'round10-kids-b2-society-technology': 'How can a digital noticeboard avoid excluding neighbors?',
  'round10-teens-a1-technology-science': 'Why should students repeat weather-station measurements?',
  'round10-kids-b2-technology-science': 'How can a class check whether its weather readings are reliable?',
  'round10-teens-a1-science-nature': 'What can students learn by comparing garden soil after rain?',
  'round10-kids-b2-science-nature': 'Should a class observe the garden before changing it?',
  'round10-teens-a1-nature-animals': 'How can students study animal tracks without disturbing the habitat?',
  'round10-kids-b2-nature-animals': 'Should learners leave the garden untouched while they study tracks?',
  'round10-teens-a1-animals-environment': 'How should a neighborhood protect a pond edge shared by wildlife?',
  'round10-kids-b2-animals-environment': 'Should parks keep a quiet strip beside busy paths?',
  'round10-teens-a1-environment-geography': 'Should students choose a shaded school route over a short one?',
  'round10-kids-b2-environment-geography': 'What should a map show about heat on the walk to school?',
  'round10-ladder-kids-a1-tech-society': 'How can the club share tablet notices with absent students?',
  'round10-ladder-kids-a1-psychology-society': 'Should the club use speaking turns when choosing a break-time game?',
  'round10-ladder-kids-a2-geography-family': 'Which family stops belong on their neighborhood map?',
  'round10-ladder-kids-a2-heritage-food': 'Why did relatives add different notes to one recipe?',
  'round10-ladder-kids-b1-technology-society': 'How should the club test its app with different students?',
  'round10-ladder-kids-b1-health-psychology': 'Should sports day offer quiet strategy games?',
  'round10-ladder-teens-a2-geography-history': 'How did the market and bus stop change this neighborhood?',
  'round10-ladder-teens-a2-india-heritage': 'How can a club share food memories without making one recipe universal?',
  'round10-ladder-teens-b1-environment-geography': 'Should the council choose shade even if the route is longer?',
  'round10-ladder-teens-b2-family-nature': 'How can a garden balance family use and wildlife needs?'
};

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function sourceFor(item: LibraryItem, transcripts: Record<string, string>): string | null {
  if ((item.kind === 'text' || item.kind === 'picture-book') && item.summary?.trim()) return item.summary;
  if (item.youtubeId && transcripts[item.id]) {
    const raw = transcripts[item.id];
    try {
      const parsed = JSON.parse(raw) as { text?: unknown }[];
      if (Array.isArray(parsed)) {
        const joined = parsed.map((segment) => typeof segment.text === 'string' ? segment.text : '').join(' ');
        return joined.trim() || raw;
      }
    } catch { /* Some older source rows store plain transcript text. */ }
    return raw;
  }
  if (item.summary && !item.youtubeId && item.summary.trim().split(/\s+/).length >= 150) return item.summary;
  return null;
}

function supportsFlightQuestion(item: LibraryItem): boolean {
  if ((item.topicTags ?? []).some((tag) => tag.indexOf('grammar:') === 0)) return false;
  const genre = item.genre;
  if (genre === undefined) return true;
  if (genre === 'opinion' || genre === 'expository') return true;
  return item.ageBand === 'kids' && (item.kind === 'text' || item.kind === 'picture-book') && genre === 'narrative';
}

function titlePhrase(title: string, source: string): string {
  const sourceLower = source.toLowerCase();
  const words = title.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
  const kept = words.filter((word) => !stopWords[word.toLowerCase()] && word.length > 2);
  for (let size = Math.min(4, kept.length); size >= 1; size--) {
    for (let start = 0; start + size <= kept.length; start++) {
      const phrase = kept.slice(start, start + size).join(' ');
      if (sourceLower.indexOf(phrase.toLowerCase()) !== -1) return phrase;
    }
  }
  return kept.slice(0, 3).join(' ') || title.trim().split(/\s+/).slice(0, 3).join(' ');
}

function contentPhrases(source: string, title: string): string[] {
  const titleWords: Record<string, boolean> = {};
  (title.match(/[A-Za-z][A-Za-z'-]*/g) ?? []).forEach((word) => { titleWords[word.toLowerCase()] = true; });
  const tokens: { word: string; start: number; end: number }[] = [];
  const tokenPattern = /[A-Za-z][A-Za-z'-]*/g;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(source)) !== null) {
    tokens.push({ word: match[0], start: match.index, end: match.index + match[0].length });
  }
  const frequencies: Record<string, number> = {};
  tokens.forEach((token) => {
    const word = token.word.toLowerCase();
    frequencies[word] = (frequencies[word] ?? 0) + 1;
  });
  const candidates: { phrase: string; score: number }[] = [];
  for (let size = 3; size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const group = tokens.slice(i, i + size);
      const betweenWords = source.slice(group[0].end, group[group.length - 1].start);
      if (/[.!?\n]/.test(betweenWords) || /[^A-Za-z0-9'\-\s]/.test(betweenWords)) continue;
      const useful = group.filter((token) => !stopWords[token.word.toLowerCase()] && token.word.length > 3);
      if (!useful.length || useful.every((token) => titleWords[token.word.toLowerCase()])) continue;
      if (group.some((token) => stopWords[token.word.toLowerCase()]) && size > 1) continue;
      const frequency = group.reduce((sum, token) => sum + (frequencies[token.word.toLowerCase()] ?? 0), 0);
      const named = group.some((token) => /^[A-Z]/.test(token.word) && !stopWords[token.word.toLowerCase()]);
      const score = (named ? 20 : 0) + size * 3 + useful.reduce((sum, token) => sum + Math.min(8, token.word.length), 0) - frequency * 0.25;
      const phrase = group.map((token) => token.word).join(' ');
      if (!candidates.some((candidate) => candidate.phrase.toLowerCase() === phrase.toLowerCase())) {
        candidates.push({ phrase, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 40).map((candidate) => candidate.phrase);
}

function questionFor(item: LibraryItem, source: string, seen: Record<string, string>): string | null {
  const titleQuestion = item.title.split(/[|—]/).map((part) => part.trim()).find((part) => part.endsWith('?'));
  if (titleQuestion && titleQuestion.split(/\s+/).length <= 12 && !seen[normalized(titleQuestion)]) return titleQuestion;
  const sourceQuestions = source.match(/(?:^|[.!?]\s+)([^.!?\n]{10,100}\?)/g) ?? [];
  const titleTerms = (item.title.toLowerCase().match(/[a-z]{4,}/g) ?? []).filter((word) => !stopWords[word]);
  for (const segment of sourceQuestions.slice(0, 20)) {
    const question = segment.replace(/^[.!?]\s+/, '').replace(/\s+/g, ' ').trim();
    const lower = question.toLowerCase();
    if (question.split(/\s+/).length <= 12 && titleTerms.some((term) => lower.indexOf(term) >= 0) && !seen[normalized(question)]) return question;
  }
  const prefix = item.title.split(/[—:]/)[0];
  const titleWords = (prefix.match(/[A-Za-z][A-Za-z'-]*/g) ?? [])
    .filter((word) => !stopWords[word.toLowerCase()] && word.length > 2);
  const shortTitle = titleWords.slice(0, 5).join(' ') || titlePhrase(item.title, source);
  const topic = (item.topicTags ?? []).find((tag) => !/^(video|text|reading|story|grammar|listening|storyweaver|african-storybook|english-learning|kids|teens|teen-interests|reading-level-\d+)$/.test(tag)) ?? 'everyday life';
  const templates = [
    `How might ${shortTitle} change our view of ${topic}?`,
    `Should we make different choices about ${shortTitle}?`,
    `What could ${shortTitle} teach us about ${topic}?`,
    `Could ${shortTitle} matter more than we expect?`,
  ];
  const question = templates.find((candidate) => candidate.split(/\s+/).length <= 12 && !seen[normalized(candidate)]) ?? '';
  const key = normalized(question);
  return question && !seen[key] ? question : null;
}

async function loadTranscripts(items: LibraryItem[]): Promise<Record<string, string>> {
  const supabase = createServiceClient();
  const keys = items.filter((item) => item.youtubeId).map((item) => item.id);
  const transcripts: Record<string, string> = {};
  for (let offset = 0; offset < keys.length; offset += 100) {
    const batch = keys.slice(offset, offset + 100);
    const { data, error } = await supabase
      .from('source_extractions')
      .select('source_key, raw_transcript')
      .in('source_key', batch)
      .not('raw_transcript', 'is', null);
    if (error) throw new Error(`Transcript lookup failed: ${error.message}`);
    for (const row of data ?? []) {
      if (typeof row.source_key === 'string' && typeof row.raw_transcript === 'string') {
        transcripts[row.source_key] = row.raw_transcript;
      }
    }
  }
  return transcripts;
}

function readMainLibrary(file: string): LibraryItem[] {
  const json = execFileSync('git', ['show', `origin/main:src/data/${file}`], { encoding: 'utf8' });
  return JSON.parse(json) as LibraryItem[];
}

async function main() {
  const files = fs.readdirSync(dataDir).filter((file) => file.endsWith('-library.json')).sort();
  const libraries: Record<string, LibraryItem[]> = {};
  const all: LibraryItem[] = [];
  for (const file of files) {
    const current = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8')) as LibraryItem[];
    const mainById: Record<string, LibraryItem> = {};
    for (const item of readMainLibrary(file)) mainById[item.id] = item;
    for (const item of current) {
      const baseline = mainById[item.id];
      if (baseline) {
        if (typeof baseline.flightQuestion === 'string') item.flightQuestion = baseline.flightQuestion;
        else delete item.flightQuestion;
        item.needsReview = baseline.needsReview;
        if (baseline.reviewNote === undefined) delete item.reviewNote;
        else item.reviewNote = baseline.reviewNote;
      }
    }
    libraries[file] = current;
    all.push(...current);
  }

  const transcripts = await loadTranscripts(all);
  const seen: Record<string, string> = {};
  let kept = 0;
  let rewrittenFlags = 0;
  for (const item of all) {
    const isRound10Item = item.id.indexOf('round10-') === 0;
    const isFlaggedRound9 = item.reviewNote?.indexOf('Round 9 question is grounded') === 0;
    const current = item.flightQuestion;
    const key = current ? normalized(current) : '';
    const duplicate = !!key && !!seen[key];
    if (current && !duplicate && !isRound10Item && !isFlaggedRound9) {
      seen[key] = item.id;
      kept++;
    } else if (current) {
      delete item.flightQuestion;
    }
    // Replacements are generated in a prioritized pass below so series and
    // young-learner items are handled before the general catalogue.
  }

  for (const item of all) {
    const question = groundedQuestions[item.id];
    if (question && sourceFor(item, transcripts)) {
      if (item.flightQuestion) delete seen[normalized(item.flightQuestion)];
      if (seen[normalized(question)] && seen[normalized(question)] !== item.id) continue;
      item.flightQuestion = question;
      seen[normalized(question)] = item.id;
      if (item.reviewNote?.indexOf('Round 9 question is grounded') === 0) {
        item.needsReview = false;
        delete item.reviewNote;
        rewrittenFlags++;
      }
    }
  }

  const desired = 500;
  const sourcePriority: Record<string, number> = {
    'book-library.json': 0, 'picture-books-library.json': 0, 'storyweaver-library.json': 0,
    'african-storybook-library.json': 0, 'stories-library.json': 0, 'kids-library.json': 1,
    'voa-library.json': 2, 'teded-library.json': 2, 'bbc-library.json': 2,
    'natgeo-library.json': 2, 'ted-library.json': 2, 'discussion-library.json': 3,
  };
  const candidates: { file: string; item: LibraryItem; source: string }[] = [];
  for (const file of files) for (const item of libraries[file]) {
    if (item.flightQuestion) continue;
    if (!supportsFlightQuestion(item)) continue;
    const source = sourceFor(item, transcripts);
    if (source) candidates.push({ file, item, source });
  }
  candidates.sort((a, b) => {
    const seriesOrder = Number(!a.item.series) - Number(!b.item.series);
    if (seriesOrder !== 0) return seriesOrder;
    const round10ItemOrder = Number(a.item.id.indexOf('round10-ladder-') !== 0)
      - Number(b.item.id.indexOf('round10-ladder-') !== 0);
    if (round10ItemOrder !== 0) return round10ItemOrder;
    const flaggedOrder = Number(!(a.item.reviewNote?.indexOf('Round 9 question is grounded') === 0))
      - Number(!(b.item.reviewNote?.indexOf('Round 9 question is grounded') === 0));
    if (flaggedOrder !== 0) return flaggedOrder;
    const ageOrder = Number(!(a.item.ageBand === 'kids' || a.item.ageBand === 'teens'))
      - Number(!(b.item.ageBand === 'kids' || b.item.ageBand === 'teens'));
    if (ageOrder !== 0) return ageOrder;
    return (sourcePriority[a.file] ?? 5) - (sourcePriority[b.file] ?? 5);
  });
  let generated = 0;
  for (const candidate of candidates) {
    if (Object.keys(seen).length >= desired) break;
    const question = questionFor(candidate.item, candidate.source, seen);
    if (!question) continue;
    candidate.item.flightQuestion = question;
    seen[normalized(question)] = candidate.item.id;
    if (candidate.item.reviewNote?.indexOf('Round 9 question is grounded') === 0) {
      candidate.item.needsReview = false;
      delete candidate.item.reviewNote;
      rewrittenFlags++;
    }
    generated++;
  }

  for (const file of files) fs.writeFileSync(path.join(dataDir, file), JSON.stringify(libraries[file], null, 2) + '\n');
  const stillFlagged = all.filter((item) => item.reviewNote?.indexOf('Round 9 question is grounded') === 0).length;
  console.log(JSON.stringify({ keptUniqueQuestions: kept, generated, total: Object.keys(seen).length, rewrittenRound9Flags: rewrittenFlags, round9FlagsRemaining: stillFlagged, transcriptsFound: Object.keys(transcripts).length }));
  if (Object.keys(seen).length < desired) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Flight Question generation failed.');
  process.exit(1);
});
