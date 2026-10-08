import { parseWritingBlocks } from './library-round-19-overrides';

export const playWriting = parseWritingBlocks(`
Soccer
L=A soccer field has two goals.|Players need space to pass safely.|A game can end with no goals.
H=Teams spread across the field to create passing choices.|Players without the ball still shape the game by moving.|A fair match depends on rules both teams understand.
V=pass~To send the ball to a teammate~I would pass to my friend.|dribble~To move the ball while running~I would dribble around a cone.|goalkeeper~The player guarding a goal|pitch~The field where soccer is played~Our pitch could be muddy.|kickoff~The start or restart of play~I would wait for kickoff.|defender~A player who protects their team's goal~I could play as a defender.|corner kick~A restart from a field corner~I would take a corner kick.
S=I would pass to a friend.|A muddy field sounds fun.|I want to try goalkeeper.|My team could cheer together.|I might miss the goal.|I would help a new player.
T=If I played midfield, I would look for an open teammate first.|I would rather make a good pass than score alone.|A close match can be exciting without many goals.|I wonder how teams choose where each player stands.|I would practice a corner kick until I felt confident.|A fair game matters more than a lucky win.

Basketball
L=A basketball court has lines and two hoops.|Players can pass above or below their shoulders.|A close game can change quickly.
H=Good spacing creates room for a teammate to move.|A bounce pass can get beneath a defender's hands.|Players must decide quickly whether to pass, shoot, or drive.
V=dribble~To bounce a ball while moving~I would dribble slowly first.|hoop~A raised ring used for scoring|bounce pass~A pass that hits the floor first~I would try a bounce pass.|rebound~A ball caught after a missed shot~I might catch the rebound.|defender~A player trying to stop a score~I could play as a defender.|free throw~A shot taken from a marked line~I would practice a free throw.|court~The marked space for basketball~Our court could be outdoors.
S=I would try one easy shot.|A bounce pass could reach my friend.|I like a fast game.|My team might need a break.|I would cheer after a good pass.|I want to practice dribbling.
T=If I missed a shot, I would move for the rebound instead of stopping.|I would rather set up a teammate than take every shot.|A quick pass can change the whole shape of a play.|I wonder when a player should slow a game down.|I would invite a beginner into a simple passing drill.|The best team might be the one that notices everyone.

Swimming
L=Water holds part of a swimmer's weight.|Floating can feel easier with calm breathing.|A pool has a shallow and deep end.
H=Different swimming strokes use different timing for arms and breath.|A streamlined body moves with less resistance through water.|Learning water safety matters before trying to swim faster.
V=float~To stay on the water's surface~I would try to float calmly.|kick~To move a leg through water~I would practice a gentle kick.|stroke~A repeated way of moving through water|goggles~Glasses that protect eyes in water~I would wear goggles.|shallow end~The part of a pool with less depth~I would start in the shallow end.|lifeguard~A trained person watching swimmers~I would listen to the lifeguard.|breath~Air taken into the body~I would take a slow breath.
S=I would start in shallow water.|A pool might feel cold.|I like floating on my back.|I would wear my goggles.|A teacher could help me kick.|I would rest when tired.
T=If I taught a friend to swim, I would begin with confidence in water.|I would rather float well than race badly.|A quiet breath can make a difficult stroke easier.|I wonder why some swimmers prefer different strokes.|I would ask the lifeguard before trying a new pool.|Feeling safe matters more than reaching the other side first.

Cycling
L=A bicycle moves when pedals turn the wheels.|A bell can warn someone nearby.|A rider checks the path ahead.
H=Gears help riders handle hills and flat roads differently.|Braking early gives more time to respond to a turn.|A shared path works best when everyone predicts one another's movements.
V=pedal~A part pushed by a foot|handlebars~The bar used to steer a bicycle~I would hold the handlebars.|brake~A part used to slow a bike~I would check the brake.|helmet~Protective headwear for a rider|gear~A setting that changes pedaling effort~I would choose an easy gear.|cycle lane~A marked space for bicycles~I would use a cycle lane.|bell~A small device making a warning sound~I would ring my bike bell gently.
S=I would wear a helmet.|A gentle hill sounds fun.|I would ring my bell politely.|My bike could have blue wheels.|I would stop for people walking.|I want to ride with a friend.
T=If I cycled to school, I would choose a calm route over a fast one.|I would rather practice braking than race downhill.|A clear signal could help walkers know my plan.|I wonder which gear would make a steep hill easier.|I would check my tires before a long ride.|Sharing a path takes more thought than riding alone.

Running
L=Running makes your heart beat faster.|A slow start can feel easier.|Shoes help protect feet on rough ground.
H=Runners can change pace to match a distance or goal.|Warm muscles usually move more comfortably than cold ones.|Personal progress can matter more than finishing first.
V=sprint~To run a short distance very fast~I would sprint to the line.|jog~To run at an easy steady pace~I would jog beside a friend.|pace~The speed kept while moving~My pace could change.|warm-up~Gentle movement before exercise~I would do a warm-up.|finish line~The place a race ends~I would smile at the finish line.|stride~One long running step~My stride might grow longer.|breathing~Taking air in and out of the body~Slow breathing could help me run.
S=I would run with a friend.|A short sprint sounds exciting.|I might start too fast.|My shoes could get muddy.|I would rest after running.|I like crossing the finish line.
T=If I trained for a longer run, I would begin at a pace I could keep.|I would rather improve my own time than beat a friend.|A good warm-up could make the first minute feel easier.|I wonder how runners decide when to speed up.|I would cheer for the last person crossing the line.|Rest would be part of my plan, not a failure.

Dancing
L=Dancers can move with or without music.|A small step can start a pattern.|Faces and hands can tell part of a story.
H=Dance styles often grow from communities and shared celebrations.|Changing speed can make the same movement express another feeling.|Group dancers watch one another to stay together.
V=beat~A regular pulse in music~I would step to the beat.|step~One movement of a foot~I could learn one new step.|spin~To turn around quickly~I would try a slow spin.|rhythm~A pattern of beats~A drum rhythm could guide us.|choreography~Planned movements for a dance~I would help make choreography.|partner~A person dancing with another~I would ask a partner to join.|gesture~A movement expressing an idea~One gesture could show surprise.
S=I would dance with my friend.|A slow song feels calm.|I might forget a step.|My hands could tell a story.|I like turning in a circle.|I would make up a new move.
T=If I choreographed a dance, I would leave space for everyone to contribute.|I would rather express a feeling than copy every step perfectly.|One gesture can change how a whole dance feels.|I wonder how a group keeps time without counting aloud.|I would ask where a dance style comes from before borrowing it.|Moving together could make a class feel connected.

Board Games
L=A board game can use cards, dice, or pieces.|Players wait for their turns.|A clever move may change the whole game.
H=Some games reward planning, while others include more chance.|The rules create choices that players learn over time.|Playing again can reveal a strategy missed on the first try.
V=dice~Small cubes with numbered sides|token~A piece representing a player~I would move my token.|turn~A chance for one player to act~I would wait for my turn.|rulebook~Written instructions for a game~I would read the rulebook.|strategy~A plan for reaching a goal~My strategy might change.|chance card~A card that changes what happens~I would draw a chance card.|scoreboard~A display of players' scores~The scoreboard could be simple.
S=I would roll the dice.|My token could be a tiny boat.|I like games with surprises.|A long wait can be hard.|I would teach a new player.|I might lose and play again.
T=If I invented a board game, I would make the first turn easy to understand.|I would rather lose a fair game than win through a confusing rule.|A chance card can keep a careful player from feeling too safe.|I wonder when a game has too many choices.|I would test my rules with someone who has never played.|Playing again might change my whole strategy.

Puzzles
L=A puzzle can hide a picture or a pattern.|A corner piece can be easy to find.|Two friends may notice different clues.
H=Solving a puzzle often means breaking one hard problem into smaller ones.|Sorting pieces by color can reduce the search.|A surprising solution can make an earlier clue seem obvious.
V=clue~A detail helping someone find an answer~I would look for one clue.|jigsaw~A picture puzzle made of fitting pieces~I would finish a jigsaw.|corner piece~A puzzle piece fitting at a corner~I would find a corner piece.|pattern~A repeated arrangement|riddle~A question with a hidden answer~I would tell a riddle.|solution~The answer to a problem~My solution might surprise me.|trial and error~Trying options and learning from mistakes~I might use trial and error.
S=I would start with the corners.|A missing piece could annoy me.|I like finding a color pattern.|My friend might spot a clue.|I would try again after a break.|A riddle could make us laugh.
T=If a puzzle seemed impossible, I would sort what I already know.|I would rather solve one hard riddle together than ten easy ones alone.|A wrong guess might still reveal a useful pattern.|I wonder why the final piece feels so satisfying.|I would ask a friend to explain their different approach.|A good puzzle makes the answer clear after you find it.

Building Blocks
L=Blocks can stand tall on a wide base.|Small pieces can fill gaps.|A tower falls when its balance changes.
H=Builders test a structure by changing one part at a time.|Triangles and arches can make different shapes stable.|A design may improve after it falls and gets rebuilt.
V=tower~A tall structure rising upward~I would build a tower.|base~The bottom supporting part|bridge~A structure built across a gap~I would make a block bridge.|arch~A curved structure spanning a space~My arch might fall.|stack~To put things one above another~I would stack the blocks.|balance~The ability to stay steady~My block tower needs balance.|blueprint~A drawing showing a building plan~I would draw a blueprint.
S=I would build a tall tower.|A wide base could help.|My bridge might fall down.|I like red and blue blocks.|I would share the small pieces.|I could try a new shape.
T=If my tower fell, I would change the base before adding height.|I would rather design a bridge than copy one from a picture.|A tiny arch could make a block street look real.|I wonder which shape holds the most weight.|Two builders might find different solutions with the same blocks.|I would keep a drawing of each version we tried.

Kites
L=A kite needs moving air to lift.|Its string helps you guide it.|A tail can stop it spinning too much.
H=Air moving over and under a kite creates lifting forces.|The frame holds its shape against the wind.|Small changes to the tail can affect how steadily it flies.
V=string~Thin cord used to hold a kite|bridle~The cords connecting a kite to its flying line~I would check the bridle before launch.|frame~The supporting structure inside a kite~I would make a light frame.|gust~A short strong burst of wind~A gust might pull my kite.|launch~To send something upward~I would launch my kite.|reel~A wheel for winding string~I would turn the reel slowly.|diamond kite~A kite with four pointed corners~I would paint a diamond kite.
S=I would fly a red kite.|The string might pull my hand.|A long tail looks pretty.|I need an open field.|A gust could lift it high.|I would share the reel.
T=If my kite spun wildly, I would adjust its tail before giving up.|I would rather build a simple frame that flies than a beautiful heavy one.|A sudden gust could turn a calm flight into a challenge.|I wonder which shape stays steady in light wind.|I would give a beginner plenty of open space.|The moment a handmade kite rises would feel like a reward.

Playgrounds
L=A playground can have quiet and active spaces.|Some children like climbing; others like swinging.|A bench gives people a place to rest.
H=Good playground design offers several kinds of movement and play.|Paths and equipment should let different children join.|Taking turns can work better than making everyone wait in one line.
V=slide~A smooth slope for moving down|swing~A hanging seat moving back and forth|climbing frame~A structure children climb~I would try the climbing frame.|seesaw~A board that rocks up and down~I would share the seesaw.|sandbox~A place for playing with sand~My sandbox could have tiny roads.|bench~A seat for several people~A bench could give parents a rest.|ramp~A sloping path between levels~A ramp could help more children join.
S=I would try the slide first.|My friend might choose the swings.|A sandbox could become a city.|I like a shady bench.|I would wait for my turn.|A small ramp could help everyone.
T=If I designed a playground, I would include a quiet corner as well as climbing.|I would rather share one excellent slide than crowd in many poor ones.|A ramp could make more parts of the space welcoming.|I wonder which activities help children play together.|I would ask younger children what feels fun and safe.|A good playground should invite imagination, not only movement.

Superheroes
L=A superhero can help without flying.|A costume may hide a secret name.|A hero sometimes needs a friend.
H=Superhero stories turn ordinary choices into larger adventures.|A power creates problems as well as possible solutions.|The most interesting heroes often have limits they must accept.
V=superpower~An unusual ability in a story~My superpower would be tiny flights.|cape~A loose cloth worn behind the shoulders~I would wear a blue cape.|secret identity~A hidden name or life~My secret identity could be a baker.|sidekick~A friend who helps a hero~I would choose a funny sidekick.|villain~A character opposing the hero~My villain might steal colors.|rescue~To bring someone to safety~I would plan a rescue.|costume~Special clothing for a character~I would make a colorful costume.
S=I would choose a flying power.|My cape could be green.|A sidekick might be a talking dog.|I would help lost animals.|A villain could steal all the socks.|My hero needs a secret name.
T=If I invented a superhero, their greatest power would have a difficult limit.|I would rather see a clever rescue than a giant fight.|A funny sidekick could make the story less serious.|I wonder whether a hero should tell friends their secret identity.|The villain might believe they are solving a real problem.|A hero who asks for help could feel more believable.

Robots
L=A robot can repeat the same action many times.|Some robots roll instead of walking.|A person decides what task it should try.
H=Sensors let a robot respond to changes around it.|Programs turn human goals into instructions the machine can follow.|A useful robot may be simple rather than shaped like a person.
V=sensor~A part that notices nearby changes|motor~A part that makes a machine move|program~Instructions telling a computer what to do~I would write a robot program.|wheel~A round part that rolls~My robot could have one big wheel.|gripper~A tool that holds objects~A robot gripper could pick up blocks.|battery~A device storing electrical energy~I would check the robot battery.|remote control~A device used to guide a machine from afar~I would use a remote control.
S=I would build a robot helper.|It might roll on wheels.|My robot could sort pencils.|I would draw its face.|A battery might run out.|I want it to dance too.
T=If I designed a robot, I would give it one clear job first.|I would rather make a useful machine than a human-shaped toy.|A sensor might stop it from bumping into chairs.|I wonder how the program handles an unexpected object.|My robot could help tidy blocks without deciding what to throw away.|I would test it with classmates before trusting it.

Trains
L=Train doors open at marked stops.|Many carriages can travel together.|A window shows towns passing by.
H=Rail tracks guide heavy vehicles along a fixed route.|Stations organize boarding so travelers can find the right service.|Trains can carry goods as well as passengers over long distances.
V=carriage~A connected part of a passenger train|platform~A raised area where passengers wait~I would stand on the platform.|timetable~A plan showing departure times~I would check the timetable.|locomotive~A powered vehicle pulling train cars~I would draw a locomotive.|railway track~Two rails guiding train wheels~A railway track crosses the bridge.|conductor~A worker helping travelers on a train~I would ask the conductor.|ticket~Proof that a traveler may ride~I would keep my ticket safe.
S=I would sit by the window.|A train might pass farms.|I would check the platform number.|My ticket stays in my bag.|I like the sound of tracks.|I would help carry a small bag.
T=If I planned a train journey, I would leave time to find the platform.|I would rather watch the landscape than stare at my phone.|A night train could make a long trip feel shorter.|I wonder how stations guide people who speak different languages.|I would choose a carriage with room for everyone.|The route on a map might look simpler than the real journey.

Airplanes
L=An airplane climbs after leaving the runway.|Clouds may look flat from above.|A pilot checks many controls before flight.
H=Air flowing around the wings helps create lift.|Weather reports influence the route and altitude chosen by the crew.|Takeoff and landing demand especially careful coordination.
V=wing~A part helping an aircraft stay aloft|runway~A long strip used for takeoff and landing~I would watch a runway from a window.|cockpit~The place where pilots control a plane~I would look toward the cockpit.|altitude~Height above the ground~The plane's altitude might change.|turbulence~Bumpy movement caused by shifting air~Turbulence could shake my cup.|seat belt~A strap keeping a passenger secure~I would fasten my seat belt.|boarding pass~A document showing a traveler's flight~I would keep my boarding pass handy.
S=I would choose a window seat.|The plane might climb through clouds.|I would keep my seat belt on.|A runway looks very long.|I want to see tiny roads below.|I would listen to the crew.
T=If I flew for the first time, I would ask how the wings work.|I would rather watch the changing clouds than the screen.|A bumpy moment might feel easier if the crew explains it.|I wonder how pilots decide when to change altitude.|I would plan enough time to find the right gate.|Seeing my city from above could change how I picture it.

Boats
L=A small boat can rock with waves.|A paddle moves water behind it.|Some boats carry many people.
H=The shape of a hull affects stability and speed.|Sailors adjust sails as the wind changes.|Safe boating depends on weather, equipment, and clear plans.
V=hull~The main body of a boat|paddle~A tool pushed through water|oar~A long tool used to row~I would hold one oar.|sail~Cloth catching wind to move a boat|anchor~A heavy object holding a boat in place~I would lower the anchor.|deck~The upper surface of a boat~I would stand on the deck.|life jacket~Clothing designed to help someone float~I would wear a life jacket.
S=I would paddle a small boat.|The waves might rock it.|I would wear a life jacket.|A sail could catch the wind.|I like watching water from the deck.|I would stay close to shore.
T=If I sailed, I would learn to read the wind before choosing a route.|I would rather paddle on a quiet river than race on open water.|The hull's shape could change how steady the boat feels.|I would choose a sailboat when the wind felt gentle and steady.|A life jacket would be the first thing I packed.|I would ask a guide where it is safe to stop.

Musical Instruments
L=Different instruments can play the same song.|A drum makes sound when struck.|A string can make a high or low note.
H=Sound begins with vibration, whether in a string, drumhead, or air column.|Instrument makers choose materials that shape tone.|A small ensemble succeeds when players listen to one another.
V=drumhead~The stretched surface of a drum~I would tap the drumhead.|string~A thin part that vibrates to make sound|keyboard~Rows of keys on some instruments~I would try the keyboard.|flute~A wind instrument held near the mouth~I could play one flute note.|melody~A sequence of musical notes~I would invent a melody.|vibration~A quick back-and-forth movement~A vibration makes sound.|ensemble~A group of musicians playing together~I would join a small ensemble.
S=I would try a small drum.|A flute note sounds light.|I like playing with friends.|My fingers might miss the keys.|I would practice one tune.|A loud drum could surprise me.
T=If I built an instrument, I would test how different materials sound.|I would rather play one melody well than ten pieces badly.|A group performance depends on listening as much as playing.|I wonder why a drum and a string sound so different.|I would invite a beginner to join a simple rhythm.|The quiet pause before a note can feel important too.

Drawing
L=A pencil can make thin or thick lines.|A drawing can begin with one circle.|An artist may erase and try again.
H=Sketching simple shapes helps artists plan more complex pictures.|Dark and light marks can create a sense of depth.|Observation and imagination can both guide a drawing.
V=sketch~A quick drawing made to explore an idea~I would make a sketch.|outline~A line around the edge of a form~I would draw an outline first.|shading~Using dark and light marks to show depth~I would add shading.|eraser~A tool that removes pencil marks~My eraser could fix a line.|pencil tip~The point used to make marks~A sharp pencil tip makes thin lines.|perspective~A way to show depth on a flat page~I would practice perspective.|doodle~A small casual drawing~I might make a doodle.
S=I would draw a funny tree.|My first circle might look odd.|I like dark pencil lines.|An eraser could help me.|I would draw my pet.|A quick sketch sounds fun.
T=If I drew a street, I would use perspective to show distance.|I would rather sketch many ideas than perfect one line immediately.|A small change in shading could make an object look round.|I wonder how artists decide what to leave out.|I would keep my first doodle to see how the final drawing grew.|A simple pencil can make a very rich image.

Painting
L=Paint can be thick or watery.|A brush makes different marks as it turns.|Two colors can make a new shade.
H=Painters choose colors to create contrast or harmony.|Layers of paint can hide or reveal earlier choices.|The same scene can feel cheerful or quiet depending on color.
V=paintbrush~A tool used to spread paint~I would wash my paintbrush.|palette~A board holding mixed colors~My palette could have blue paint.|canvas~A surface prepared for painting~I would paint on a small canvas.|wash~A thin layer of watery paint~I would try a pale wash.|stroke~One movement of a brush~A wide stroke could make the sky.|shade~A version of a color~I would mix a darker shade.|layer~One covering of paint over another~My second layer might change the picture.
S=I would paint a blue river.|My brush could make dots.|I like mixing yellow and red.|A wet page might wrinkle.|I would wash my brush first.|I want to paint a happy scene.
T=If I painted the same view twice, I would choose different colors each time.|I would rather make a bold brushstroke than copy every detail.|A thin wash could make the sky feel far away.|I wonder how a painter decides when to stop.|I would leave one earlier layer visible on purpose.|The colors could tell a story before anyone notices the objects.

The Five Senses
L=Our ears hear soft and loud sounds.|Our skin feels warm and cold things.|Smells can remind us of places.
H=The brain combines signals from several senses into one experience.|Smell and taste work closely when we enjoy food.|Losing one sense can make people attend more carefully to others.
V=sight~The ability to see~My sight helps me read.|hearing~The ability to notice sound~My hearing helps me enjoy music.|touch~The feeling made by contact|smell~The sense that notices odors|taste~The sense noticing flavors|brain~The body organ interpreting sense signals~My brain connects sights and sounds.|texture~How a surface feels~I would feel the texture of bark.
S=I would smell a fresh orange.|A drum sounds loud to me.|Soft cloth feels nice.|I like the taste of mango.|I can see bright colors.|A flower might smell sweet.
T=If I closed my eyes, I would notice more sounds in the room.|I would rather describe a fruit's texture than only its color.|A familiar smell can bring back an old memory.|I wonder how taste changes when someone has a cold.|I would make a game using one sense at a time.|Our senses work together even when we notice only one.
`);
