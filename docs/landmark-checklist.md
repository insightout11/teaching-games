# Landmark checklist

Every landmark drawn into the cockpit scenery is checked against this list before the owner sees it. It comes from
the owner's feedback (October 2026); add to it whenever the owner points out something new.

**How to check:** run `scripts/dev/render-landmarks.sh <out-dir> [kind...]` with the dev server on :3100. It saves a
picture of each landmark at day, dusk and night, from far (70 km) and near (28 km). Look at all six before showing
anyone. The gallery is `/dev/landmarks-world` (`?one=<kind>&tod=dusk&near=1` for a slow close pass).

## Must pass

1. **Recognisable at a glance.** Its one signature reads first: Fuji's snow fingers and flat top, the Matterhorn's
   hooked horn with a snow-white sunlit face, Everest towering with a snow plume, Kilimanjaro's flat snowy summit and
   collar of cloud, Niagara's column of mist, the Pyramids' three shapes and shadows.
2. **Real shape in the world, not a picture.** It turns as the plane passes (a flat picture looks "1D").
3. **Bigger than its neighbours** when it is famous for its size (Everest towers over the Himalaya). Still below the
   plane (cruise height 3200): never looks like the plane will hit it.
4. **The scene's light.** Gold at dusk, blue in moonlight, hazier with distance, like everything around it.
5. **Solid.** No see-through slopes; only the very foot softens into the ground.
6. **No blocky patches.** No checkerboards, stair-steps or squares in snow, rock or ice. Snow lines are smooth.
7. **Soft air.** Steam, mist, plumes and cloud are soft puffs, never hard-edged shapes or boxes.
8. **Personality.** Strong light and shade, a bold palette (deep blue-grey rock, crisp snow), crags where the real
   mountain is craggy. Plain grey cones fail.
9. **Belongs to the place.** Snow only where the real place has it (no snow on tropical mountains); forest, savanna or
   farmland round the foot as in reality.
10. **Runs smoothly.** The gallery's flights stay at 60 frames a second.

## Owner's reference pictures

- Mountains: flat-shaded, deep navy rock, lit faces lighter blue, white snow in ribbons along the ridges.
- Matterhorn: the sunlit face nearly all snow, the shaded face deep blue rock with snow on the ledges, hooked summit.
