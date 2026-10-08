# Turns raw sticker PNGs into the small WebP files the app serves (public/stickers/<id>.webp, 256x256).
# Trims the white margin, pads it back evenly to a square, then resizes. White background is kept: stickers
# are shown on white tiles.
# Run: python scripts/stickers/process.py <rawDir>
import glob
import os
import sys

from PIL import Image, ImageChops

SIZE = 256
PAD = 0.06
raw_dir = sys.argv[1]
out_dir = os.path.join('public', 'stickers')
os.makedirs(out_dir, exist_ok=True)

count = 0
for f in sorted(glob.glob(os.path.join(raw_dir, '*.png'))):
    im = Image.open(f).convert('RGB')
    # Anything noticeably darker than white (including the soft shadow) counts as content.
    diff = ImageChops.difference(im, Image.new('RGB', im.size, 'white')).convert('L').point(lambda v: 255 if v > 12 else 0)
    box = diff.getbbox() or (0, 0, im.width, im.height)
    w, h = box[2] - box[0], box[3] - box[1]
    side = int(max(w, h) * (1 + 2 * PAD))
    canvas = Image.new('RGB', (side, side), 'white')
    canvas.paste(im.crop(box), ((side - w) // 2, (side - h) // 2))
    out = os.path.join(out_dir, os.path.basename(f)[:-4] + '.webp')
    canvas.resize((SIZE, SIZE), Image.LANCZOS).save(out, 'WEBP', quality=80, method=6)
    count += 1
print(count, 'stickers written to', out_dir)

# The ids that have a picture, for src/lib/stickers.ts (a word without a file gets no picture).
import json
ids = sorted(os.path.basename(p)[:-5] for p in glob.glob(os.path.join(out_dir, '*.webp')))
with open(os.path.join('src', 'data', 'sticker-ids.json'), 'w', encoding='utf-8') as fh:
    json.dump(ids, fh)
    fh.write('\n')
