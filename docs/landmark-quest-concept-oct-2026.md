# Landmark Quest: concept

Written 20 October 2026 by Claude, after the owner's direction. **Concept only: no code until the owner approves.**

## The idea

Every flight passes real landmarks at their real places, in the light and weather of that moment. The class sees them
in the scenery (not as a picture in a box) and the teacher takes a photo. Photos go into the class's **Landmark Album**.
You only see what is on your route, so choosing where to fly becomes a real decision, and the same landmark in a
different light or weather is a different photo. This becomes a core part of LessonCaptain, beside the souvenirs.

## Decisions (owner, 20 Oct 2026)

- **Souvenirs stay** as they are (cities). The album is the journey; souvenirs are the destinations.
- **The teacher takes the photo.** Students do not press anything for it.
- **One album per class**, like the Class Logbook. A shared class achievement: no names, no individual work, nothing
  ranked (safe for Junior classes).
- **Rare conditions without points:** some photos only happen in certain light or weather. Special, never scored.
- **Drawing comes first.** The quest only works if the landmarks look good in the scenery.

## How a flight goes

1. **Coming up.** A few minutes before a landmark comes into view, the teacher sees a small note on their own controls:
   "Coming up: the Pyramids of Giza, on the right." (Never anything private on the shared screen; this is just a
   heads-up the class may see.)
2. **In view.** The landmark appears on the horizon about 150 km ahead and grows as the plane approaches, in the
   scenery itself: same light, same haze, same weather.
3. **Photo opportunity.** When it is close and well framed, a **Take photo** button glows on the teacher's bar. The
   teacher taps it whenever suits the lesson (or ignores it; it fades once the landmark has passed).
4. **The photo.** The shared screen shows a camera frame for a moment: a shutter, then the photo fades into a print
   with the landmark's name, the date, the time of day and the weather ("The Pyramids of Giza, at dusk, clear skies").
5. **Talk about it** (optional, the teacher's choice): a short speaking moment built on the photo. Describe it, guess
   the country, say what the weather is doing, compare with an earlier photo of the same place. One student at a time,
   the class listening; never pair work.
6. **Into the album.** The photo is saved to the class's album. If it is a first, the album page fills in; if the class
   already has this landmark, the new photo joins it (a second light, a second weather).

At most three landmark moments per flight (as "Look outside" today), spread through the cruise.

## The Landmark Album

- One page per landmark the class has seen, with its photos (newest first): date, time of day, weather, and the route
  ("Cairo to Dubai").
- **Empty frames** for landmarks not yet seen, each with a hint of where to fly ("Somewhere between Cairo and Dubai"),
  so classes want to go and find them. The hint names a route, never a quiz answer.
- **Rare photos** are marked with a small badge (Lucide icon, no emoji): the Northern Lights over the Norwegian fjords,
  snow on the Great Wall, the Pyramids at sunrise, lightning over the Grand Canyon. They come from the real weather and
  time on the flight; they cannot be forced.
- Where it lives: the class page (with the logbook), and a strip in the room's lobby ("12 landmarks seen, 3 new this
  month").
- Students can see the album photos afterwards (the same way they see the logbook), and a photo can be sent to phones
  as a postcard at the end of the lesson.

## What is drawn

The quest needs good landmarks in the scenery. About 80 landmarks can come up on routes (30 famous sights, 15
mountains, 40 volcanoes and canyons, with some overlap). Two kinds of drawing:

- **Hand-made (about 25):** the most famous, each with its own shape, drawn in 3D like the Pyramids and Mount Fuji so
  they turn as the plane passes. First: the Pyramids, Fuji (both done in the gallery), Everest, the Matterhorn,
  Kilimanjaro, the Great Wall, Niagara Falls, Stonehenge, the Taj Mahal, Machu Picchu, Uluru, Petra, Angkor Wat,
  Victoria Falls, Table Mountain, the Grand Canyon, Iguazu Falls, Ha Long Bay, Mount Rushmore, Cappadocia, the Giant's
  Causeway, the Salar de Uyuni, the Great Barrier Reef, the Palm Islands, Banff.
- **Shared shapes for the rest:** one volcano (height, snow, crater and slope set per mountain: Etna, Vesuvius, Teide,
  Mount St. Helens, Krakatau and the rest), one canyon, one waterfall, one lone peak. That way most routes pass
  something real.

Every landmark: day, dusk and night, and the weather of the moment (rain, snow, mist, storm) passing over it. Each
goes into the gallery as stills for the owner's approval before it reaches the room.

## What it needs underneath

- **Landmarks in the room:** the cockpit already places a landmark at its real distance (gallery only today); it needs
  connecting to the route's landmark moments so the one you pass stands where it really is.
- **Taking the photo:** a copy of the cockpit view at that moment (sky, scenery, weather), with the frame and caption.
  No camera, no student images: it is a picture of the scenery only.
- **Saving it:** image storage plus one small table for the album (class, landmark, time, light, weather, route,
  image). The owner runs the migration in the Supabase editor, as usual. No names stored.
- **Cost:** none per photo beyond storage (the picture is made in the browser).

## Order of work

1. **Drawing, part 1 (gallery):** finish the hand-made style on four more (Everest, the Matterhorn, Kilimanjaro,
   Niagara Falls) and the shared volcano. Owner approves stills and a fly-past.
2. **Landmarks in the room:** the route's landmarks stand in the scenery (no photo yet). Owner tries a real flight.
3. **Photo mode:** the Take photo button, the camera moment and the print on the shared screen.
4. **The album:** the migration, saving photos, the album page, empty frames with hints, the lobby strip.
5. **Rare conditions:** the badges and the conditions that make them.
6. **Drawing, part 2:** the remaining hand-made landmarks and shared shapes, in batches, each approved in the gallery.
7. **Talk about it:** the optional speaking moment on a photo.

Steps 1 and 2 are useful on their own (the flight looks better); the quest itself starts at step 3.

## Open questions for later

- Should an album photo ever go beyond the class (a shareable postcard image for families)? Privacy first: scenery
  only, never names.
- A "pick a route to find a landmark" helper in Where next? (it already suggests places; it could say what you would
  pass).
