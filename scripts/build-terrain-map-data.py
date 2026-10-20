"""Build static browser data, never called by the app. Python standard library only.

Vectors: Natural Earth v5.1.2, 1:50m rivers/lakes and 1:10m land, public domain
(naturalearthdata.com/about/terms-of-use/).
Elevation: NOAA ETOPO1 ice surface, public domain, via NOAA's ArcGIS ImageServer.
Run: python scripts/build-terrain-map-data.py [rivers|lakes|coast|elevation|all] [--cache DIR]
Source downloads occur only here; cached originals and SHA-256 provenance stay outside the repo.
"""
import argparse
import base64
import hashlib
import gzip
import json
import math
from pathlib import Path
import struct
import urllib.parse
import urllib.request
import zlib

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('item', choices=['rivers', 'lakes', 'coast', 'elevation', 'all'], nargs='?', default='all')
parser.add_argument('--cache', type=Path, default=Path.home() / 'Documents/Codex/_outputs/terrain-map-source-cache')
NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_'
SOURCE_HASHES = {
    'rivers_lake_centerlines.geojson': 'f286e0ce978fde999ca2d7a78c764be08542e19b63cded52b05c12d5173ccc51',
    'lakes.geojson': 'd350b75978b26fe839b797c2c529b2fb8f47fb3983c03f4964e36d5df9378a52',
    'land.geojson': 'e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b',
    'land-10m.geojson': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416',
}
ETOPO = 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/ETOPO1_ice_surface/ImageServer/exportImage?'
ETOPO += urllib.parse.urlencode(dict(bbox='-180,-90,180,90', bboxSR='4326', imageSR='4326', size='720,360', format='tiff', pixelType='S16', interpolation='RSP_BilinearInterpolation', renderingRule=json.dumps({'rasterFunction': 'None'}, separators=(',', ':')), compression='LZ77', f='image'))


def source(cache, file, url):
    cache.mkdir(parents=True, exist_ok=True)
    target = cache / file
    if not target.exists():
        request = urllib.request.Request(url, headers={'User-Agent': 'LessonCaptain terrain data build'})
        with urllib.request.urlopen(request, timeout=120) as response:
            target.write_bytes(response.read())
    data = target.read_bytes()
    provenance = dict(url=url, sha256=hashlib.sha256(data).hexdigest(), bytes=len(data))
    if file in SOURCE_HASHES and provenance['sha256'] != SOURCE_HASHES[file]:
        raise ValueError('Source hash mismatch: ' + str(target))
    (cache / (file + '.provenance.json')).write_text(json.dumps(provenance, indent=2) + '\n', encoding='utf-8')
    return data, provenance


def unwrap(points):
    result = []
    for x, y, *_ in points:
        if result:
            x += 360 * round((result[-1][0] - x) / 360)
        result.append((x, y))
    return result


def simplify(points, tolerance=0.02):
    """Iterative Douglas-Peucker in degrees on continuous, unwrapped longitude."""
    if len(points) <= 2:
        return points
    keep, stack = {0, len(points) - 1}, [(0, len(points) - 1)]
    while stack:
        start, end = stack.pop()
        ax, ay = points[start]
        dx, dy = points[end][0] - ax, points[end][1] - ay
        length = dx * dx + dy * dy
        best, index = tolerance * tolerance, None
        for i in range(start + 1, end):
            px, py = points[i][0] - ax, points[i][1] - ay
            t = max(0, min(1, (px * dx + py * dy) / length)) if length else 0
            distance = (px - t * dx) ** 2 + (py - t * dy) ** 2
            if distance > best:
                best, index = distance, i
        if index is not None:
            keep.add(index)
            stack.extend([(start, index), (index, end)])
    return [points[i] for i in sorted(keep)]


def rounded_line(points, closed=False):
    original = unwrap(points)
    simple = simplify(original)
    rounded = []
    for x, y in simple:
        point = (round(x * 100), round(y * 100))
        if not rounded or point != rounded[-1]:
            rounded.append(point)
    # Preserve small islands that Douglas-Peucker would flatten. Do not invent geometry.
    if closed and len(set(rounded)) < 3:
        rounded = list(dict.fromkeys((round(x * 100), round(y * 100)) for x, y in original))
    if closed and rounded and rounded[-1] != rounded[0]:
        # A polar/global ring may wind once around the globe. Retain its source seam;
        # do not connect its endpoints with an artificial cross-world edge.
        end = rounded[0][0] + 36000 * round((rounded[-1][0] - rounded[0][0]) / 36000)
        rounded.append((end, rounded[0][1]))
    return rounded


def b36(n):
    sign, n = ('-' if n < 0 else ''), abs(n)
    digits = ''
    while n:
        n, remainder = divmod(n, 36)
        digits = '0123456789abcdefghijklmnopqrstuvwxyz'[remainder] + digits
    return sign + (digits or '0')


def encode(points):
    result, x, y = [], 0, 0
    for nx, ny in points:
        result.extend([b36(nx - x), b36(ny - y)])
        x, y = nx, ny
    return '.'.join(result)


def polygons(feature):
    geometry = feature['geometry']
    return [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']


def write(name, metadata, data):
    output = ROOT / 'src/data/world' / (name + '.json')
    metadata = dict(generator='scripts/build-terrain-map-data.py', **metadata)
    text = json.dumps(dict(metadata=metadata, data=data), ensure_ascii=False, separators=(',', ':')) + '\n'
    blob = text.encode('utf-8')
    compressed = gzip.compress(blob, compresslevel=9, mtime=0)
    if len(blob) >= 250_000 or len(compressed) >= 100_000:
        raise ValueError(f'{name} exceeds browser budget: {len(blob)} / {len(compressed)}')
    output.write_bytes(blob)
    print(name, len(blob), 'bytes;', len(compressed), 'gzip bytes;', len(data), 'payload characters' if isinstance(data, str) else 'records')


def vectors(item, cache):
    source_name = {'rivers': 'rivers_lake_centerlines', 'lakes': 'lakes', 'coast': 'land'}[item]
    source_file = 'land-10m.geojson' if item == 'coast' else source_name + '.geojson'
    source_url = NE.replace('ne_50m_', 'ne_10m_') + 'land.geojson' if item == 'coast' else NE + source_name + '.geojson'
    raw, provenance = source(cache, source_file, source_url)
    features = json.loads(raw)['features']
    metadata = dict(source='Natural Earth v5.1.2 ' + ('1:10m ' if item == 'coast' else '1:50m ') + source_name, licence='Public domain', provenance=provenance,
                    toleranceDegrees=0.02, decimals=2, encoding='signed base36 deltas, hundredths of a degree; longitude unwrapped', sourceFeatures=len(features))
    records, before, after = [], 0, 0
    for feature in features:
        props, geometry = feature['properties'], feature['geometry']
        # The lake's primary label retains familiar names such as Lake Victoria;
        # name_en calls that lake Nyanza. River English names retain Yangtze/Congo.
        name = (props.get('name') or props.get('name_en')) if item == 'lakes' else (props.get('name_en') or props.get('name'))
        if item == 'lakes' and not name:
            continue
        if item == 'rivers':
            rank = props['scalerank']
            if rank > 6 or not name:
                continue
            lines = [geometry['coordinates']] if geometry['type'] == 'LineString' else geometry['coordinates']
            kept = []
            for line in lines:
                points = rounded_line(line)
                before += len(line)
                if len(points) >= 2:
                    kept.append(encode(points))
                    after += len(points)
            if kept:
                records.append([name, 1 if rank <= 2 else 2 if rank <= 4 else 3, kept])
        else:
            kept = []
            for polygon in polygons(feature):
                if item == 'coast':
                    outer = unwrap(polygon[0])
                    width = (max(p[0] for p in outer) - min(p[0] for p in outer)) * 111.195 * math.cos(math.radians(sum(p[1] for p in outer) / len(outer)))
                    height = (max(p[1] for p in outer) - min(p[1] for p in outer)) * 111.195
                    if max(width, height) < 5 or props.get('featurecla') == 'Null island':
                        continue
                rings = []
                for ring in polygon:
                    points = rounded_line(ring, True)
                    before += len(ring)
                    if len(set(points)) >= 3:
                        rings.append(encode(points))
                        after += len(points)
                if rings:
                    kept.append(rings)
            if item == 'lakes' and name and kept:
                records.append([name, kept])
            elif item == 'coast':
                records.extend(kept)
    if item == 'lakes':
        # Natural Earth treats the Caspian as inland sea: its outline is a LAND hole,
        # not an entry in lakes. Preserve that actual source ring as a named lake.
        land_raw, land_provenance = source(cache, 'land.geojson', NE + 'land.geojson')
        caspian = []
        for feature in json.loads(land_raw)['features']:
            for polygon in polygons(feature):
                for ring in polygon[1:]:
                    if min(p[0] for p in ring) > 45 and max(p[0] for p in ring) < 56 and min(p[1] for p in ring) > 35 and max(p[1] for p in ring) < 49:
                        points = rounded_line(ring, True)
                        caspian.append([encode(points)])
                        before += len(ring)
                        after += len(points)
        if not caspian:
            raise ValueError('Caspian source hole not found')
        records.append(['Caspian Sea', caspian])
        metadata['caspianProvenance'] = land_provenance
    metadata.update(sourcePoints=before, outputPoints=after)
    if item == 'coast':
        # Balance three lazy chunks by encoded size; no polygon is cut at a tile boundary.
        buckets, sizes = [[], [], []], [0, 0, 0]
        for record in sorted(records, key=lambda record: len(json.dumps(record)), reverse=True):
            bucket = min(range(len(sizes)), key=lambda i: sizes[i])
            buckets[bucket].append(record)
            sizes[bucket] += len(json.dumps(record))
        metadata.update(minimumIslandSpanKm=5, polygonCount=len(records), chunks=3)
        for i, bucket in enumerate(buckets):
            write('coastlines' if i == 0 else f'coastlines-{i + 1}', dict(metadata, chunk=i + 1), bucket)
        return
    write({'rivers': 'rivers', 'lakes': 'lakes', 'coast': 'coastlines'}[item], metadata, records)


def tiff_lzw(data):
    """TIFF 6.0 MSB-first LZW with early code-width change."""
    bit, width, next_code, previous = 0, 9, 258, None
    table = {i: bytes([i]) for i in range(256)}
    output = bytearray()
    while bit + width <= len(data) * 8:
        code = 0
        for _ in range(width):
            code = (code << 1) | ((data[bit // 8] >> (7 - bit % 8)) & 1)
            bit += 1
        if code == 256:
            table = {i: bytes([i]) for i in range(256)}
            width, next_code, previous = 9, 258, None
            continue
        if code == 257:
            return bytes(output)
        entry = table.get(code)
        if entry is None:
            if code != next_code or previous is None:
                raise ValueError('Invalid TIFF LZW code')
            entry = previous + previous[:1]
        output.extend(entry)
        if previous is not None and next_code < 4096:
            table[next_code] = previous + entry[:1]
            next_code += 1
            if next_code == (1 << width) - 1 and width < 12:
                width += 1
        previous = entry
    raise ValueError('Truncated TIFF LZW')


def read_tiff(data):
    """NOAA S16 TIFF export, raw/LZW/Deflate strips or tiles. No colour decoding."""
    endian = '<' if data[:2] == b'II' else '>'
    if data[:2] not in (b'II', b'MM') or struct.unpack_from(endian + 'H', data, 2)[0] != 42:
        raise ValueError('Expected classic TIFF; received a service error?')
    offset = struct.unpack_from(endian + 'I', data, 4)[0]
    tags = {}
    for i in range(struct.unpack_from(endian + 'H', data, offset)[0]):
        pos = offset + 2 + i * 12
        tag, kind, count = struct.unpack_from(endian + 'HHI', data, pos)
        if kind not in (3, 4, 12):
            continue
        size, code = {3: (2, 'H'), 4: (4, 'I'), 12: (8, 'd')}[kind]
        start = pos + 8 if size * count <= 4 else struct.unpack_from(endian + 'I', data, pos + 8)[0]
        tags[tag] = struct.unpack_from(endian + str(count) + code, data, start)
    if tags[256] != (720,) or tags[257] != (360,) or tags[258] != (16,) or tags.get(339) != (2,) or tags.get(277, (1,)) != (1,):
        raise ValueError('Unexpected TIFF dimensions/type')
    if tags.get(274, (1,)) != (1,) or tags.get(33550) != (0.5, 0.5, 0.0) or tags.get(33922) != (0.0, 0.0, 0.0, -180.0, 90.0, 0.0):
        raise ValueError('Unexpected elevation orientation or georeferencing')
    keys = tags.get(34735, ())
    if (2048, 0, 1, 4326) not in tuple(keys[i:i + 4] for i in range(4, len(keys), 4)):
        raise ValueError('Expected EPSG:4326 elevation grid')
    if tags.get(317, (1,)) != (1,):
        raise ValueError('TIFF predictor is unsupported')
    compression = tags.get(259, (1,))[0]
    chunks = []
    offsets, lengths = (tags[324], tags[325]) if 324 in tags else (tags[273], tags[279])
    for start, length in zip(offsets, lengths):
        chunk = data[start:start + length]
        chunks.append(zlib.decompress(chunk) if compression in (8, 32946) else tiff_lzw(chunk) if compression == 5 else chunk)
    if compression not in (1, 5, 8, 32946):
        raise ValueError('Unsupported TIFF compression')
    if 324 in tags:
        tile_width, tile_height = tags[322][0], tags[323][0]
        packed = bytearray(720 * 360 * 2)
        columns = math.ceil(720 / tile_width)
        for i, tile in enumerate(chunks):
            x, y = (i % columns) * tile_width, (i // columns) * tile_height
            if len(tile) != tile_width * tile_height * 2:
                raise ValueError('Unexpected tile sample count')
            for row in range(min(tile_height, 360 - y)):
                width = min(tile_width, 720 - x) * 2
                start = ((y + row) * 720 + x) * 2
                packed[start:start + width] = tile[row * tile_width * 2:row * tile_width * 2 + width]
    else:
        packed = b''.join(chunks)
    if len(packed) != 720 * 360 * 2:
        raise ValueError('Unexpected TIFF sample count')
    return struct.unpack(endian + str(720 * 360) + 'h', packed)


def elevation(cache):
    raw, provenance = source(cache, 'elevation.tiff', ETOPO)
    values = read_tiff(raw)
    sample_hash = hashlib.sha256(struct.pack('<' + str(len(values)) + 'h', *values)).hexdigest()
    if sample_hash != 'b5156325372e7abee763e075068ab674ae6b07395d31e441ea565b63662b09bf':
        raise ValueError('ETOPO numeric grid changed; review before updating the sample hash')
    if min(values) < -12000 or max(values) > 9000:
        raise ValueError('No-data or unexpected elevation range')
    # Ocean/depressions clamp to 0 as permitted. Square-root scale preserves lowlands.
    codes = [round(math.sqrt(max(0, value) / 9000) * 255) for value in values]
    packed, i = bytearray(), 0
    while i < len(codes):
        if codes[i]:
            packed.append(codes[i])
            i += 1
        else:
            end = i + 1
            while end < len(codes) and not codes[end] and end - i < 65535:
                end += 1
            count = end - i
            packed.extend([0, count >> 8, count & 255])
            i = end
    metadata = dict(source='NOAA ETOPO1 ice surface, ArcGIS numeric S16 export', licence='Public domain', provenance=provenance,
                    width=720, height=360, resolution=0.5, west=-179.75, north=89.75,
                    resampling='NOAA bilinear sample at each 0.5-degree cell centre, not cell maxima/means',
                    encoding='base64 bytes: nonzero sqrt(m/9000)*255; zero followed by uint16 BE run length',
                    minSourceMetres=min(values), maxSourceMetres=max(values), seaMetres=0, sampleSha256=sample_hash)
    write('elevation', metadata, base64.b64encode(packed).decode('ascii'))


if __name__ == '__main__':
    args = parser.parse_args()
    for name in ['rivers', 'lakes', 'coast', 'elevation'] if args.item == 'all' else [args.item]:
        elevation(args.cache) if name == 'elevation' else vectors(name, args.cache)
