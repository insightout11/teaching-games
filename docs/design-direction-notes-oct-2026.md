# LessonCaptain — Design Direction Notes

## 1. Core product idea: LessonCaptain as a cockpit

LessonCaptain is strongest when thought of as a **cockpit containing many teaching tools**, rather than as one prescribed lesson format.

The current strength is that there are already many tools available, but the weakness is that exposing everything at once can become confusing. Different teachers and different classes need different combinations of those tools.

The broader principle is:

> Every class is different, so every class should be able to shape its own version of LessonCaptain.

The product should therefore help people narrow down the cockpit into the tools, activities, interaction patterns, and visual experience that work best for that specific teacher and class.

---

## 2. Personal teaching experience as part of the product story

A possible marketing/product narrative comes directly from Matt’s teaching background.

He has taught in many different environments:

- large classrooms
- China and other countries
- students having their first foreign teacher
- private institutions
- business schools
- children
- teens
- adults
- online classes
- conversation classes
- more structured classes

The lesson from that experience is that there is no universal “best” classroom.

Different groups respond to very different teaching styles, activities, structures, levels of technology, and types of interaction.

That insight could form part of LessonCaptain’s positioning:

**The system should adapt to the class instead of forcing the class to adapt to the system.**

---

## 3. Onboarding is a major part of the product

Onboarding should be considered one of the key design problems for LessonCaptain.

There should be **two separate onboarding channels**:

### Teacher onboarding

The system should learn things such as:

- teaching style
- strengths
- weaknesses
- preferred lesson formats
- comfort with technology
- types of students taught
- class size
- class goals
- preferred level of structure
- preferred interaction styles
- preferred tools

The goal would be to help a teacher discover what kind of class design works best for them.

Rather than teaching the teacher every LessonCaptain feature, the system could recommend the subset most relevant to that teacher.

### Student onboarding

Students should also help determine what their ideal class looks like.

Possible dimensions include:

- games vs discussion
- roleplay vs non-roleplay
- quizzes
- teams
- competition
- collaborative activities
- preferred topics
- preferred end-of-class activities
- device usage
- video-based lessons
- different types of classroom mechanics

The student side should not necessarily feel like a conventional onboarding questionnaire.

It could instead be an **interactive LessonCaptain activity where students design their own class**.

---

## 4. “Design your class” as the onboarding activity

One of the strongest ideas is to make student onboarding itself a lesson.

Instead of asking students abstract questions like:

> “Do you prefer competitive activities?”

LessonCaptain could visually present actual possible class formats and let students react to them.

For example:

- “Would you like a class where two teams compete for control of the next YouTube video?”
- “Would you like an Imposter-style game?”
- “Would you like more roleplay?”
- “Would you like quiz battles?”
- “What should the ultimate end-of-class game look like?”
- “Would you like to use your phones/tablets a lot, a little, or not at all?”

Students could:

- choose an option
- reject it
- combine ideas
- modify ideas
- suggest something else entirely

The goal is for students to feel **ownership of the class design**.

---

## 5. This could be done separately for every existing class

Instead of designing one universal LessonCaptain experience and testing it on every class, each current class could become its own design exercise.

Matt already knows the personalities and preferences of the different classes, so he could pre-build a small set of likely options for each group.

Examples:

- a class that loves games could design its ideal game system
- a class that loves quizzes could help design a “better Kahoot”
- a free-conversation class could choose among different conversation/game structures
- a class that enjoys roleplay could help expand Scene Igniter-type activities
- another class might prefer almost no game mechanics

This would create real-world prototypes of different LessonCaptain configurations.

---

## 6. Classes may have multiple preferred modes rather than one fixed design

A class does not necessarily need one permanent template.

It may have several preferred ways of operating.

For example, the same class might sometimes use:

- conversation mode
- quiz mode
- team battle mode
- video mode
- roleplay mode
- relaxed discussion mode

The system could learn the preferred modes of each class instead of assigning one rigid class profile.

---

## 7. Accessibility and device use must be designed intentionally

Device availability is a major design variable.

LessonCaptain should support a spectrum rather than assuming every student always has a device.

Possible modes include:

### Classroom-only mode
The teacher controls everything from the main screen.

Students participate verbally or physically without individual devices.

This could be particularly useful for conversation classes.

### Light device mode
Devices are only used occasionally.

For example:

- true/false responses
- quick voting
- submitting an answer
- choosing between options

### Full device mode
Students use devices heavily throughout the lesson.

This works particularly well for certain games such as Imposter and could enable much deeper interaction.

---

## 8. Mixed-device classrooms should work too

A class may contain some students with devices and others without them.

The design should account for this instead of treating it as an edge case.

One idea is that the teacher can manually enter students who do not have devices.

They would still:

- have a seat on the plane
- exist in the class roster
- receive suitable questions
- participate in activities
- score points
- contribute to teams

Students without devices should not be punished by the scoring system.

The interface may need different mechanics for students with devices and students without devices, but participation should remain fair.

---

## 9. Device preference should be part of onboarding

The appropriate level of device use could be something that both the teacher and students help determine.

For example:

> “How much should devices be part of this class?”

Possible answers might eventually resemble:

- not at all
- occasionally
- frequently
- fully interactive

This could become one of the important variables used when generating the class configuration.

---

## 10. Onboarding could introduce UX/design thinking to students

One possible way to frame the “design your class” activity would be to briefly explain the idea of design and user experience.

Matt could mention how he became interested in UX design and introduce a simplified idea of the design process.

Students then become the users helping design the product they are going to use.

This is only an idea at this stage; it is unclear whether students would find the UX framing itself interesting.

The important part is that their feedback comes from actually seeing and interacting with possible designs rather than answering generic survey questions.

---

## 11. The visual flight experience needs another design pass

The current LessonCaptain visual system was intentionally designed to be relatively peaceful and atmospheric.

For example:

- clouds
- weather
- scenery
- time of day

The intention was originally that this would act mostly as a pleasant, non-distracting background.

However, student reactions suggest that they sometimes expect **something to happen** during the flight.

The visual environment may therefore need more intentional design.

---

## 12. Keep a peaceful / atmospheric flight mode

The atmospheric concept should not necessarily be removed.

There may be value in having a mode where the flight remains:

- calm
- scenic
- realistic
- non-distracting
- based on real geography

This could be improved rather than replaced.

It might still use the real map and follow or approximate a real route.

The system could choose visually interesting areas near that route rather than simply rendering everything equally.

There may need to be some maximum allowable deviation from the route — perhaps a certain number of kilometers — but the correct distance has not been determined.

---

## 13. A second mode could be more authored and eventful

There could also be another flight mode that is intentionally more engaging.

Instead of trying to support completely open-world travel, LessonCaptain could focus on a limited number of **carefully designed routes**.

Rather than:

> “Fly anywhere.”

The product could offer selected routes that are each worth experiencing.

---

## 14. Limit the number of routes rather than generate everything

If there are many cities, allowing arbitrary city-to-city combinations creates an enormous number of routes.

Instead, LessonCaptain could deliberately offer a limited route network.

Those routes could be selected because they contain:

- famous landmarks
- interesting cities
- distinctive landscapes
- mountain ranges
- coastlines
- unusual weather
- culturally interesting locations
- visually dramatic sections

That makes it possible to put more design effort into each route.

---

## 15. Routes could be handcrafted while conditions remain dynamic

The underlying route experience could be intentionally designed, while live data still changes the experience.

Possible handcrafted elements:

- route path
- major visual moments
- city scenes
- landmark scenes
- mountain ranges
- coastline sections
- distinctive terrain
- pacing of the journey

Possible dynamic elements:

- real weather
- cloud cover
- storms
- current local time
- sunrise / sunset
- sun position
- moon position
- potentially moon phase
- potentially seasons
- potentially live aircraft

This would preserve the sense that the flight is happening in a living world.

---

## 16. Real-world events could become part of the experience

Weather could become more than a background texture.

For example, if there is a large storm along the route, LessonCaptain could make that a more significant visual moment.

Other dynamic events could potentially be incorporated later.

The idea is to look for real-world data that can make the trip feel more alive.

One possible future data source is aircraft traffic.

It may be possible to use aviation APIs to show or represent other planes nearby.

That needs technical investigation.

---

## 17. Real geography matters, but full realism is not necessarily the goal

The flight should still have a recognizable relationship to the real world.

For example:

If the route passes the Himalayas, the mountains should feel meaningfully like the Himalayas rather than generic mountains.

However, LessonCaptain should not necessarily try to compete with:

- Google Earth
- Google Maps
- commercial flight simulators

The environment can remain stylized.

The unresolved design question is how realistic versus stylized it should be.

---

## 18. LessonCaptain needs its own visual identity

There should ultimately be a recognizable LessonCaptain visual style.

The world could be based on real geography but interpreted through that style.

The exact aesthetic has not been decided.

This could potentially become another opportunity for student input:

> “What should LessonCaptain’s world look like?”

---

## 19. Three.js or similar technology may make richer route design possible

If routes are limited and intentionally designed, richer 3D experiences may become technically realistic.

Three.js is one possible direction.

Instead of building a completely open world, development effort could be concentrated on making a smaller number of routes visually strong.

The correct technical stack has not been decided.

---

## 20. Routes themselves could become more game-like

A limited route system could create additional game mechanics.

For example, routes might become something students:

- choose
- unlock
- revisit
- recognize
- associate with particular landmarks or experiences

The city and route selection itself could become part of the classroom experience rather than merely a background setting.

---

## 21. Design the entire funnel, not only the classroom

Another major thought is to stop thinking only about the product after someone has already decided to use LessonCaptain.

The whole system could be designed from the very beginning of the funnel.

LessonCaptain may not need to be sold initially as:

> “A complete teaching platform.”

That is a large commitment.

Instead, the first interaction could be a much smaller, useful tool.

---

## 22. A teacher-style discovery tool could be the top of the funnel

One possible free tool:

> “What is your ideal teaching style?”

A teacher could complete an interactive assessment and receive useful information without having to sign up for LessonCaptain as their classroom platform.

This could be promoted independently as a feature/tool for teachers.

The output could identify things such as:

- preferred teaching style
- suitable class formats
- useful tools
- ideal student types
- preferred levels of structure
- interaction preferences

The tool itself could therefore be valuable even if the teacher never becomes a LessonCaptain user.

---

## 23. Students could have a separate discovery funnel

There could be an equivalent student-facing channel.

Students might identify:

- interests
- preferred activities
- preferred class styles
- preferred level of competition
- learning preferences
- scheduling availability
- topics they like
- preferred device usage

Again, this could exist independently of committing to LessonCaptain.

---

## 24. Matching teachers and students could potentially become a product

Once LessonCaptain understands both sides, it could potentially match:

- teachers with students
- students with similar students
- students into compatible groups
- teachers with classes that fit their teaching style

Matching could include factors such as:

- interests
- teaching/learning preferences
- availability
- class format
- age
- goals
- scheduling

This could potentially become useful even if the resulting class does not initially run inside LessonCaptain.

---

## 25. LessonCaptain could form classes before selling the cockpit

A possible funnel could therefore be:

**Teacher discovery**
→ teaching style identified

**Student discovery**
→ learning/class preferences identified

**Matching**
→ compatible teacher + students / compatible student group

**Scheduling**
→ find times that work

**Class formation**
→ group exists

**LessonCaptain**
→ natural tool for operating the newly formed class

In this model, LessonCaptain becomes the upsell after the system has already created value.

---

## 26. Scheduling may be part of the matching system

Availability could be one of the variables collected from both teachers and students.

The system might identify people who:

- want similar classes
- have compatible interests
- have compatible styles
- are available at the same times

Scheduling could therefore be integrated into class formation rather than handled separately afterward.

This is still an early idea.

---

## 27. The broader product becomes a system for finding the right class

This produces a much broader possible interpretation of LessonCaptain.

It is not only:

> tools for teaching a class

It could eventually help answer:

> What kind of teacher are you?

> What kind of class do you want?

> What kind of learner are you?

> Which students work well together?

> Which teacher fits this group?

> When can everyone meet?

> Which tools should this class use?

> How should this particular class operate?

The cockpit then becomes the execution layer for those decisions.

---

## 28. The system should collect useful design information through actual use

The current classes provide an opportunity to begin gathering this information immediately.

Rather than guessing what students want, Matt can construct lessons specifically to let students make design decisions.

Each class could help reveal:

- preferred activity types
- preferred game mechanics
- preferred amount of device interaction
- preferred team structure
- preferred visual environment
- preferred lesson pacing
- preferred kinds of content

Those decisions could become the first real examples of how class-specific configurations might work.

---

## 29. Example: redesigning existing activity categories with students

Rather than simply asking whether students like quizzes, Matt could present the challenge:

> “Design a better Kahoot.”

Students could choose among possible improvements and invent their own.

Likewise:

> “Design your perfect end-of-class game.”

Or:

> “How should Scene Igniter work?”

Or:

> “How much should phones/tablets control the class?”

This makes product research itself part of the lesson.

---

## 30. Example: a completely different class format built around YouTube

One possible class design could revolve heavily around video.

Example concept:

- two teams
- they compete for control
- winning team chooses or controls the next YouTube video
- LessonCaptain transcribes/understands content from the video library
- subsequent questions and battles are generated from the previous video
- the class becomes a continuous chain of content and competition

This is only one example of how radically different LessonCaptain class modes could become.

The important point is that the system should support **multiple coherent class designs**, not simply a collection of disconnected activities.

---

## 31. The eventual configuration system may need multiple layers

Without deciding the final architecture yet, the ideas imply several kinds of customization:

### Teacher-level
What suits this teacher?

### Student-level
What does this student enjoy or need?

### Class-level
What does this specific group prefer?

### Session-level
What kind of class are we doing today?

### Device-level
How much individual-device interaction is available?

### Visual/world-level
What kind of flight/world experience should accompany the lesson?

These do not necessarily need to become literal software settings, but they are distinct dimensions emerging from the ideas.

---

## 32. Important unresolved questions

These ideas intentionally leave several things unresolved.

They include:

- Exactly what teacher onboarding asks.
- Exactly what student onboarding asks.
- How much should be questionnaire vs interactive activity.
- Whether students should hear about UX/design explicitly.
- Whether each class has one configuration or several modes.
- How class preferences evolve over time.
- How teachers override student preferences.
- How scoring works in mixed-device classrooms.
- What device users get that non-device users do not.
- How to ensure devices add value rather than simply creating an advantage.
- How atmospheric flight mode should choose scenery.
- Whether atmospheric mode follows a literal flight path or an approximation.
- How far scenery can deviate from a real route.
- How many curated routes should exist.
- Which cities/routes should be chosen first.
- How realistic the route visuals should be.
- What LessonCaptain’s art style should be.
- Which dynamic APIs are worth integrating.
- Whether live aircraft data is practical or useful.
- Whether Three.js is the correct rendering technology.
- Whether route choice should have game progression/unlocks.
- How far LessonCaptain should move into student/teacher matching.
- Whether scheduling becomes part of the product.
- Whether classes formed through matching must use LessonCaptain.
- What the free top-of-funnel tools should actually produce.
- Where monetization begins.
- How much of this should be built now versus treated as a longer-term system.

---

## Central idea tying everything together

The different ideas appear to revolve around one common concept:

**LessonCaptain should not assume that there is one ideal classroom.**

Instead, the system could progressively learn:

- who the teacher is
- who the students are
- how they like to learn together
- what technology they have
- what activities they enjoy
- what teaching format works
- what visual experience fits
- when they are available
- potentially even who they should learn with

…and then assemble an appropriate class experience from the tools LessonCaptain already provides.

That is the current direction **before evaluating whether it is the right direction or deciding how much of it should actually be built.**
