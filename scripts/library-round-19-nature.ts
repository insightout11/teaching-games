import { parseWritingBlocks } from './library-round-19-overrides';

export const natureWriting = parseWritingBlocks(`
Deserts
L=Some deserts have rocky ground instead of sand.|Small animals hide below the surface.|Rain may come only after long waits.
H=Desert plants often grow far apart because water is scarce.|Animals may become active at dusk when the ground cools.|A desert can look empty while holding many hidden lives.
V=dune~A hill of sand shaped by wind~I would climb a small dune.|cactus~A plant that stores water in thick stems~A cactus might grow near my path.|oasis~A wet spot in a dry region~I would rest beside an oasis.|burrow~A hole made by an animal underground~A lizard might hide in a burrow.|dusk~The time just after sunset~I would walk at dusk with a guide.|dry season~A long period with little rain~The dry season can last many weeks.|rocky ground~Land covered with stones~Rocky ground would hurt bare feet.
S=I would carry plenty of water.|A small lizard might hide nearby.|I would look for a shady rock.|The sand could feel very hot.|I want to see a desert flower.|A tiny oasis would surprise me.
T=If I crossed a desert, I would travel with an experienced guide.|I would rather explore a rocky valley than climb a high dune.|A plant growing after rare rain would be worth waiting for.|I wonder which animals come out after sunset.|The quiet might make every small sound noticeable.|A desert scene could show life without showing many trees.

Forests
L=A forest floor can smell earthy after rain.|Tree roots spread under our feet.|Mushrooms may grow on old wood.
H=Fungi help break down fallen material in the forest.|Tree canopies create shade and cooler places below.|A forest changes as young trees replace older ones.
V=canopy~A roof made by the tops of trees~I would look up at the canopy.|mushroom~The visible part of some fungi~I might spot a mushroom by a log.|sapling~A young tree~I would protect a small sapling.|leaf litter~Fallen leaves covering the ground~Leaf litter can hide insects.|bark~The outer covering of a tree~I would touch rough bark gently.|root~A plant part taking water from soil~A root might cross the path.|fungus~An organism that grows on material and breaks some down~A fungus could grow on old wood.
S=I would listen for forest birds.|A mushroom might grow near me.|I like the smell after rain.|I would stay on the path.|A tall tree could give shade.|I want to draw a tiny sapling.
T=If I explored a forest, I would notice fallen logs as well as tall trees.|A young sapling might become the biggest tree here someday.|I would rather follow a quiet trail than make a new one.|The forest floor seems like a busy place when you look closely.|I wonder how fungi change dead wood over time.|I would ask a guide which trees belong in this forest.

Seasons
L=Long summer days give more hours of light.|Some animals grow thicker coats before winter.|People change clothes as the weather shifts.
H=Day length is a useful signal for many plants and animals.|Seasonal patterns differ greatly near the equator and near the poles.|A familiar place can look new as leaves, light, and rain change.
V=spring~The season when many plants begin growing~I would look for spring flowers.|summer~The warm season with long days in many places~I like summer evenings.|autumn~The season when many trees lose leaves~I would collect fallen autumn leaves.|winter~The cold season in many places~I would wear a coat in winter.|daylight~Light during the day~Long daylight gives me more playtime.|wet season~A part of the year with much rain~I would take boots in the wet season.|migration~Animals' regular journey between regions~I would watch birds begin migration.
S=I like long summer evenings.|I would jump in autumn leaves.|A winter coat keeps me warm.|I want flowers in spring.|Rainy months could fill the river.|My favorite season might change.
T=If I lived near the equator, I might describe seasons by rain.|I would rather watch leaves change than see snow fall.|A bird's seasonal journey would make a good map.|Longer daylight could change how I spend my afternoons.|I wonder how plants know when to begin growing.|The same street can feel different in every season.

Rain
L=Rain can tap softly or pound loudly.|Puddles show where water gathers.|A coat can keep us dry outside.
H=Rain begins when cloud drops grow large enough to fall.|A short shower can leave streets wet without filling a river.|The smell after rain often comes from substances released by soil.
V=raindrop~One small drop of falling water~A raindrop landed on my hand.|puddle~A small pool of water on the ground~I would jump around a puddle.|shower~A short period of rain~A shower might end quickly.|downpour~Very heavy rain~I would wait indoors during a downpour.|raincoat~A coat made to keep out rain~My raincoat has a hood.|umbrella~A cover held above the head~I would share an umbrella.|soil scent~An earthy smell after rain~The soil scent made the garden feel fresh.
S=I would wear my yellow raincoat.|A puddle could splash my shoes.|I like soft rain on windows.|A downpour might change our game.|I would share my umbrella.|The garden smells different afterward.
T=If rain stopped our match, I would look for an indoor game.|A quiet shower sounds more relaxing than a loud storm.|I would photograph the street's reflections after dark.|The first drops can make everyone look up at once.|I wonder why some places receive rain while others stay dry.|A raincoat seems more useful than an umbrella in wind.

Snow
L=Fresh snow can make a street quiet.|A snowflake may melt on your hand.|Animals leave clear tracks in soft snow.
H=Snow acts like a blanket that can slow heat loss from the ground.|Its crystals scatter light, making a snowy field look bright.|Different snow conditions change how easily people can build with it.
V=snowflake~A small piece of falling snow~A snowflake melted on my glove.|snowdrift~A pile of snow made by wind~I would step around a snowdrift.|tracks~Marks left by moving feet~I would follow rabbit tracks.|frost~A thin covering of ice~Frost might shine on the window.|slush~Wet partly melted snow~My boots could splash in slush.|snowball~A ball made of packed snow~I would make one snowball.|crystal~A solid with an orderly shape~I would draw a snow crystal.
S=I would catch a snowflake.|My boots might sink deep.|I like the quiet after snow.|A rabbit could leave little tracks.|I would build a small snow house.|My hands need warm gloves.
T=If I woke to deep snow, I would listen before looking outside.|I would rather follow animal tracks than throw snowballs.|A field of crystals could look bright even on a cloudy day.|I wonder why some snow packs firmly and other snow falls apart.|I would bring dry gloves for a long walk.|A snowdrift can make a familiar path look strange.

Wind
L=Wind can make tree leaves turn over.|A strong gust may lift loose paper.|We can feel moving air on our faces.
H=Air moves as warm and cool regions develop different pressures.|Trees can bend without breaking when gusts pass through.|A sailor studies wind direction before setting a sail.
V=breeze~A gentle wind~A breeze cooled my face.|gust~A short strong burst of wind~A gust lifted my hat.|kite~A light object flown on a string~I would fly a kite.|sail~Cloth that catches wind to move a boat~The sail pulled our boat.|wind direction~The way the wind is moving~I would check wind direction first.|weather vane~A tool showing wind direction~A weather vane could spin today.|seed dispersal~The spread of seeds away from plants~Wind can help seed dispersal.
S=I would hold my hat tightly.|A breeze could cool my face.|My kite might fly high.|I like leaves dancing in wind.|A gust could move my paper.|I would watch flags to see direction.
T=If I planned a kite day, I would choose a wide open field.|A strong gust can turn a calm walk into a challenge.|I would rather sail with a light breeze than a fierce wind.|The moving leaves can show wind direction without a tool.|I wonder how far a seed can travel on one gust.|A weather vane would make a useful classroom project.

Clouds
L=Clouds can look thin, thick, or fluffy.|They move at different speeds.|A cloud's shadow can cross a field.
H=Clouds form when rising air cools and water gathers into tiny drops.|High thin clouds can differ from low heavy ones.|Watching the sky can reveal a change before rain begins.
V=cumulus~A puffy cloud with a flat base~I would draw a cumulus cloud.|cirrus~A high thin wispy cloud~Cirrus clouds look like feathers.|shadow~A dark patch where light is blocked~A cloud shadow crossed the field.|mist~Tiny water drops hanging near the ground~Mist could hide the hill.|cloud layer~A broad sheet of clouds~A cloud layer might cover the Sun.|droplet~A very small drop of liquid~A cloud droplet is tiny.|skywatching~Careful observation of the sky~Skywatching could be our class game.
S=I would draw a cloud dragon.|That fluffy cloud looks soft.|A dark cloud might bring rain.|I like cloud shadows on grass.|The clouds could hide the Sun.|I want to watch them move.
T=If I spent ten minutes skywatching, I might notice several kinds of cloud.|A cloud shadow moving across a field would make a lovely film.|I would rather name shapes than memorize every cloud type.|Thin high clouds could make me wonder about coming weather.|I wonder how a tiny droplet stays above us.|A changing sky makes the same landscape look new.

Rainbows
L=A rainbow can appear in spray near a waterfall.|You see its colors in a curved band.|Moving your feet changes what you see.
H=Each person receives light from different water drops when viewing a rainbow.|The color order follows how light bends inside droplets.|Sometimes a second, fainter arc appears beyond the first.
V=arc~A curved line or band~I would draw a rainbow arc.|sunlight~Light from the Sun|droplet~A tiny drop of water~A droplet can bend light.|spectrum~The range of colors made by separated light~I would paint a color spectrum.|mist~Fine water drops in air~I might see a rainbow in mist.|double rainbow~Two rainbow arcs visible together~A double rainbow would surprise me.|reflection~Light sent back from a surface~A reflection can brighten wet ground.
S=I would stop to watch a rainbow.|My favorite color might be near the top.|A rainbow could follow a short shower.|I would draw a big color arc.|Mist might make one appear.|I would call a friend to look.
T=If I saw a double rainbow, I would check which arc looked fainter.|A waterfall's spray might create color even on a clear day.|I would rather study the light than search for an imaginary end.|Moving a little could change my view of the same rainbow.|I wonder why no one can walk right up to it.|A rainbow is a good example of science that feels magical.

Water Cycle
L=A drop can leave a puddle as vapor.|It can join a cloud later.|The same water keeps moving in new ways.
H=Evaporation moves liquid water into the air without visible boiling.|Cooling air allows that vapor to form droplets again.|A drop may travel through soil before reaching a river.
V=evaporation~Liquid water changing into vapor~I would draw evaporation above a puddle.|vapor~Water in gas form|condensation~Vapor changing into liquid drops~Condensation can fog a window.|precipitation~Water falling from clouds~Rain is one kind of precipitation.|puddle~A small pool on the ground~My puddle might dry up.|groundwater~Water stored below Earth's surface~Groundwater can feed a spring.|runoff~Water flowing across land after rain~Runoff might reach the river.
S=I would follow one water drop.|A puddle could vanish in sunlight.|The drop might join a cloud.|I would draw arrows on a map.|Rain could start its trip again.|I like the idea of traveling water.
T=If I traced one drop, I might lose it underground.|A disappearing puddle would make me think about invisible vapor.|I would rather model clouds than memorize a diagram.|The same water can connect a street, a river, and a sea.|I wonder how long a drop stays in one place.|A small glass experiment could make condensation easier to see.

Plant Growth
L=A seed holds a tiny new plant.|The first leaves may look different later.|A young stem bends toward the light.
H=Stored food inside a seed helps its first growth.|As leaves develop, the plant can make more of its own food.|Roots and shoots respond differently to light and gravity.
V=seedling~A young plant just beginning to grow~I would care for a seedling.|sprout~A new shoot coming from a seed~A sprout might appear tomorrow.|root~The plant part taking water from soil|shoot~A young stem growing upward~The shoot could bend toward light.|seed coat~A covering around a seed~I would look at the seed coat.|germination~The start of growth from a seed~Germination could begin in wet soil.|stem~The plant part holding leaves upward
S=I would plant one small seed.|A sprout might appear soon.|I would keep the soil damp.|My plant could lean toward light.|I like watching new leaves open.|I would draw it each week.
T=If I grew two seedlings, I would give them different light and compare.|A seed coat breaking open would be worth watching closely.|I would rather plant a bean than buy a finished flower.|The first leaves might not match the later ones.|I wonder how roots know which way to grow.|A weekly drawing could show changes I might miss.
`);
