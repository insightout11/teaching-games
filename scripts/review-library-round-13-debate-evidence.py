"""Apply the individually reviewed round-13 evidence replacements.

Each tuple is (motion number, side, source-backed paraphrase, source label).
The source links and reasons are in docs/library-round-13-evidence-review.md.
"""

import json
from pathlib import Path

PATH = Path("src/data/debate-motions.json")

REPLACEMENTS = [
    (3, "against", "OECD says keeping a homework room open after school depends on available space, while staff help also requires money and people.", "OECD, PISA 2018 Results Volume V"),
    (4, "against", "CDC recess guidance calls for trained adult supervisors and plans for equipment, space and safety, which a second daily break would also need.", "CDC and SHAPE America, Strategies for Recess in Schools"),
    (5, "against", "CDC says recess needs active supervision and procedures for bullying and safety; a temporary restriction may sometimes protect other children.", "CDC and SHAPE America, Strategies for Recess in Schools"),
    (6, "against", "CDC says classroom activity breaks need teacher planning and must be adapted for students with different abilities.", "CDC, Classroom Physical Activity Breaks"),
    (8, "against", "UNICEF includes books and drawing materials among simple play resources that support learning, even though these games are usually played sitting down.", "UNICEF Data, The Power of Play"),
    (9, "against", "CDC says physical education should use a planned, sequential curriculum; more choices should not replace time spent building key movement skills.", "CDC, Strategies for School and Youth Programs"),
    (10, "against", "USDA research identifies fruit among school meal foods that students often leave uneaten, so daily servings can increase waste if pupils do not want them.", "USDA, Plate Waste in School Nutrition Programs"),
    (12, "for", "USDA says student advisory groups can help schools make menus pupils accept and may reduce plate waste.", "USDA, Plate Waste in School Nutrition Programs"),
    (13, "for", "EPA's student food-waste audit guide uses measured leftovers to show what and how much food pupils discard, helping a school choose changes.", "US EPA, Student Food Waste Audit Guide"),
    (13, "against", "EPA's food-waste audit guide calls for staff or volunteers, sorting containers, weighing equipment and a plan to handle collected food.", "US EPA, Student Food Waste Audit Guide"),
    (14, "against", "EPA says compost piles need space and regular attention to air, moisture and food types to avoid odors and pests; some schools may lack capacity.", "US EPA, Composting at Home"),
    (15, "against", "USDA school meal rules require minimum amounts of meal components; starting with a smaller portion must still leave enough food available to meet those needs.", "USDA, School Meal Patterns"),
    (16, "against", "CDC notes that shared objects can spread infections in schools and that frequently touched items need routine cleaning; loaned bottles need a cleaning system.", "CDC, Everyday Actions for Schools to Prevent Infections"),
    (18, "against", "CDC says school toys and other hands-on items need regular cleaning; repaired toys must also be safe and clean before children reuse them.", "CDC, Everyday Actions for Schools to Prevent Infections"),
    (19, "against", "EPA school environmental guidance says landscaping needs upkeep and water planning; a garden would add work for schools without those resources.", "US EPA, School Environmental Health Guidelines"),
    (20, "against", "WHO says scarce urban land has competing uses and that green-space plans must weigh land and financial costs, including upkeep.", "WHO Europe, Valuing Urban Green and Blue Spaces"),
    (21, "against", "EPA guidance recommends low-water landscaping and watering only when needed; extra schoolyard trees require suitable space and ongoing care.", "US EPA, School Environmental Health Guidelines"),
    (22, "for", "A Smithsonian study found some zoo gorillas rested less during a late-night visitor event; the zoo later closed animal buildings for future events.", "Smithsonian, Zoo Visitor Effects on Gorillas"),
    (23, "against", "UK zoo standards require zoos to provide conservation and education, not just endangered-species breeding; other animals can serve that education role.", "UK Department for Environment, Standards of Modern Zoo Practice"),
    (24, "for", "A Smithsonian zoo exhibition study found some visitors reported learning new information about animals after seeing the exhibition.", "Smithsonian, Zoo Exhibition Visitor Study"),
    (24, "against", "A Smithsonian study observed reduced rest in some zoo gorillas during a late-night visitor event, showing that visitor experiences can create welfare costs.", "Smithsonian, Zoo Visitor Effects on Gorillas"),
    (25, "against", "UNESCO's education technology report says appropriate digital tools can support learning, so an all-lesson bag rule removes some useful phone activities.", "UNESCO, 2023 Global Education Monitoring Report"),
    (27, "against", "UNICEF reports that evidence for scalable, effective online-safety lessons is still limited; schools should check what early lessons actually achieve.", "UNICEF Innocenti, Childhood in a Digital World"),
    (28, "for", "UNICEF research on play says children gain agency when they can make choices in play, supporting some student choice of classroom games.", "UNICEF Innocenti, RITEC Digital Play Report"),
    (28, "against", "CDC recess guidance says adults should prevent exclusion and unsafe play; leaving every game choice to children can make participation less fair.", "CDC and SHAPE America, Strategies for Recess in Schools"),
    (29, "against", "UNICEF says children can play and learn with ordinary household objects and natural items, so schools need not always buy a separate box of materials.", "UNICEF Data, The Power of Play"),
    (30, "against", "UNICEF reports that long working hours can limit caregivers' time and energy with children, making a fixed family play routine hard for some homes.", "UNICEF Innocenti, Worlds of Influence Report Card"),
    (31, "against", "CDC lists higher transport costs, bus scheduling and conflicts with after-school sports as common barriers to later school start times.", "CDC, School Start Times MMWR"),
    (32, "for", "OECD PISA 2022 found pupils with one to two homework hours scored only two mathematics points above those with half an hour to one hour, after socioeconomic adjustment.", "OECD, PISA 2022 Results Volume II"),
    (33, "against", "OECD says staffed after-school homework help needs human and financial resources; replacing most home assignments with clubs would depend on those resources.", "OECD, PISA 2018 Results Volume V"),
    (34, "for", "UNESCO's generative-AI guidance describes possible uses in planning teaching and learning, alongside age-appropriate safeguards.", "UNESCO, Guidance for Generative AI in Education"),
    (34, "against", "UNESCO warns that generative-AI tools can produce inaccurate information and expose users' data, risks that also apply to homework planning.", "UNESCO, Guidance for Generative AI in Education"),
    (35, "for", "UNESCO's generative-AI guidance asks schools to set clear rules for responsible use and assessment, making disclosure of AI help a way to clarify authorship.", "UNESCO, Guidance for Generative AI in Education"),
    (35, "against", "UNESCO warns that learners' private data need protection when using generative AI; disclosure rules must not require students to reveal sensitive prompts or personal information.", "UNESCO, Guidance for Generative AI in Education"),
    (36, "against", "UNESCO's AI competency framework allows AI learning to be taught within existing subjects, an alternative to a separate required subject.", "UNESCO, AI Competency Framework for Students"),
    (40, "for", "UNICEF advises families to keep social media from interfering with teenagers' sleep, supporting a limit when use displaces rest.", "UNICEF, Teen Mental Health and Social Media"),
    (40, "against", "UNICEF says moderate social-media use can help teens keep in touch with friends and relatives; content and activity can matter more than total minutes.", "UNICEF, Is Social Media Bad for Teens?"),
    (41, "for", "UNICEF guidance calls for child-appropriate explanations of AI systems so young users can understand their purpose and effects.", "UNICEF, Guidance on AI and Children 3.0"),
    (41, "against", "UNICEF says some machine-learning models are difficult even for developers to interpret, so a simple teen-facing explanation can misrepresent how recommendations work.", "UNICEF Innocenti, Predictive Analytics for Children"),
    (42, "against", "UNICEF reports limited evidence that existing online-safety education programmes work at scale, so earlier lessons need careful design and evaluation.", "UNICEF Innocenti, Childhood in a Digital World"),
    (43, "against", "USDA school meal rules require enough meat or meat alternate and other meal components; a daily plant-based option must be nutritionally planned, not just offered.", "USDA, School Meal Patterns"),
    (45, "for", "USDA says student advisory groups can help design acceptable school menus and may reduce the food pupils leave uneaten.", "USDA, Plate Waste in School Nutrition Programs"),
    (46, "for", "EPA recommends student waste audits so schools can track discarded food and share results before choosing ways to prevent it.", "US EPA, Student Food Waste Audit Guide"),
    (46, "against", "EPA's audit guide describes staff, volunteers, containers and scales needed to measure leftovers; publishing frequent totals may divert limited cafeteria time.", "US EPA, Student Food Waste Audit Guide"),
    (47, "against", "EPA says compost piles need space, the right mix of materials and regular upkeep to prevent pests and odors; not every cafeteria can manage that.", "US EPA, Composting at Home"),
    (51, "against", "EPA warns that lithium-ion batteries can cause fires when damaged or mishandled; a repair club would need to exclude or carefully supervise risky devices.", "US EPA, Lithium-Ion Battery Recycling FAQ"),
    (52, "against", "WHO says urban land has competing uses and scarce space; removing parking should account for people who rely on vehicle access.", "WHO Europe, Valuing Urban Green and Blue Spaces"),
    (53, "against", "WHO says scarce land and limited budgets create trade-offs when allocating urban green space; a play space in every neighbourhood may be hard to fund and maintain.", "WHO Europe, Valuing Urban Green and Blue Spaces"),
    (54, "for", "UNICEF and UN-Habitat guidance says children's voices should be heard in urban decisions, including the public spaces where they play.", "UNICEF, Child-Responsive Urban Policies Guidance"),
    (54, "against", "UNICEF says child consultations require time, accessible methods and support for marginalized children; a token group of students could exclude others.", "UNICEF, Guidance on Consultations with Young People"),
    (56, "against", "UK zoo standards require conservation, education, research and animal welfare; making breeding the top priority could crowd out other duties.", "UK Department for Environment, Standards of Modern Zoo Practice"),
    (57, "for", "EPA has outdoor ecosystem lessons in which pupils explore local watersheds and habitats, showing wildlife topics can be taught beyond a zoo.", "US EPA, EnviroAtlas Educational Materials"),
    (57, "against", "A Smithsonian zoo exhibition study found visitors reported learning new facts about animals, a benefit outdoor lessons may not always provide.", "Smithsonian, Zoo Exhibition Visitor Study"),
    (59, "for", "UNESCO says multilingual education can support inclusion and learning; allowing more languages gives students access to those benefits.", "UNESCO, Language Matters: The Role and Power of Multilingualism"),
]

motions = json.loads(PATH.read_text(encoding="utf-8"))
assert len(motions) == 60
changed = 0
for number, side, fact, source in REPLACEMENTS:
    entry = motions[number - 1]["evidence"][0 if side == "for" else 1]
    assert entry["side"] == side, (number, side)
    if entry["fact"] != fact or entry["source"] != source:
        entry["fact"] = fact
        entry["source"] = source
        changed += 1
PATH.write_text(json.dumps(motions, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Reviewed 120 debate evidence entries; {len(REPLACEMENTS)} entries are on the replacement list ({changed} written this run).")
