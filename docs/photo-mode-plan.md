# Photo mode and the Landmark Album: build plan

Written 20 October 2026 by Claude. This plan covers steps 3 and 4 of `docs/landmark-quest-concept-oct-2026.md` (the
approved concept). For the owner to approve before building.

## Step 3: photo mode (no database change)

1. **When:** a drawn landmark is in good view (close, inside the windscreen, not behind cloud). A **Take photo** button
   glows on the teacher's bar with the landmark's name, for example "Take photo: Mount Fuji". It is quiet otherwise.
2. **The camera moment** on the shared screen:
   - a viewfinder frame for half a second;
   - a soft shutter sound (muted with the room's sound setting) and a white flash, gentle and not full-bright;
   - the photo then appears as a print: white border, a slight tilt, and a caption with the landmark, the date, the time
     of day and the weather (for example "Mount Fuji · 20 Oct 2026 · dusk · clear").
3. **Then:** the print stays on screen until the teacher closes it, with the usual next steps:
   - **Talk about it:** describe it, guess the country, the weather.
   - **Everyone answers:** "What can you see in our photo?" on every phone, answers on the Class Board.
   - **Close.**
4. **How the picture is made:** in the browser, from what is on the windscreen: the sky colours, the scenery canvas
   (ground, mountains, the landmark, clouds) and the weather, put together into one image. There is no outside service
   and no cost.
5. **Until step 4 exists:** the photo is kept in this lesson's cargo, so it can be shown again or used for an activity.
   It is not kept after the lesson.

## Step 4: the album (needs one migration, run by the owner)

- **Table `landmark_photos`:** class, landmark id, taken at, time of day, weather, route (from and to city), an image
  path, and a "rare" flag. No student names or student work.
- **Storage:** a Supabase storage bucket `landmark-album` (private; the teacher's class can read its own photos).
- **The album page:**
  - one page per landmark the class has seen, newest photo first;
  - empty frames with gentle hints for landmarks on the class's usual routes ("Seen from Bangkok to Tokyo, at dusk");
  - rare photos with a small badge.
- **Where it shows:**
  - the class page, as an album strip next to the logbook;
  - the lobby, as a small strip;
  - the end-of-lesson card ("New in our album: Mount Fuji at dusk").
- **Phones:** students can see the album afterwards, like the logbook.

## Decisions for the owner

1. **Where the button sits:** in the teacher's top bar (recommended: always findable), or floating near the landmark
   on the windscreen (more magical, but in the class's view).
2. **Sound:** a soft shutter (recommended) or silent.
3. **Step 3 first, then step 4,** so you can try the camera moment in a real class before the database change?
   (Recommended: yes.)
4. **Step 4's SQL:** you run the migration in the Supabase editor, as usual. I write it, plus a check query.

## Later (already in the concept)

- Window selfies on phones.
- Rare conditions (Northern Lights, snow, a sunset).
- A shareable postcard image for families (privacy first: scenery only).
