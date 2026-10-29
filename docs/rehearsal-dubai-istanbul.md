# Rehearsal: Dubai to Istanbul (for Friday 6 Nov 2026)

Run on the deployed site when Sol is idle (no rendering load on the machine). Muted (lc-audio-prefs off). A real second
device or a second browser profile as the student. Class length 60 min; descent shifts let us jump ahead.

## Run 1: as the class will see it (postcard look OFF, current default)
| # | Step | Check | Pass? | Notes |
|---|---|---|---|---|
| 1 | Open room `?liveroom=on`, pick Dubai → Istanbul | Room loads on the right city, no flash of LC International | | |
| 2 | Student joins by phone | Boarding pass, crew walk-up, seat shown | | |
| 3 | Take-off | Runway view → departure cinematic → climb, no jump or blank frame | | |
| 4 | Cruise over the Gulf | Sea, coast, "Coming up" line correct (Gulf, Iran/Iraq, Turkey) | | |
| 5 | Landmarks / moments | Any landmark on route appears and is right; photo chance works | | |
| 6 | Activity open/close | Launch one activity and one fact card; view returns cleanly | | |
| 7 | Turbulence beat | Plays, ends, nothing stuck | | |
| 8 | Descent (5 min before end) | Announcement, seatbelt, altitude drops smoothly | | |
| 9 | City stop (last 10 min) | Offered for Istanbul if it has 2+ stops | | |
| 10 | Landing | Cloud dive → reveal → touchdown → arrival scene of Istanbul | | |
| 11 | Arrival | Welcome card, stamp, souvenir, postcard; phone shows its landing card | | |
| 12 | Logbook / passport | Leg recorded, souvenir on shelf | | |
| 13 | Console | No errors in the room or phone | | |

## Run 2: postcard look ON (`?arrival=new`)
Repeat steps 10 to 11: branch slides in during taxi, Welcome card waits 4 s and is dealt in clear of the lettering, phone
shows the postcard. If both runs pass, flip `POSTCARD_LOOK_DEFAULT` in `src/lib/world-flight/arrival-look.ts`.

## Also check
- Zoom: share the window at 1080p; text readable, no flicker.
- Night/day: the real time on Friday decides the sky; test once at that local time if possible.
- Short class: a 30-min run lands on time.
