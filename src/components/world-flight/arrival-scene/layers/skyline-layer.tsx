import { motion } from 'framer-motion';
import { BLEED_X, CONTENT_W, LAYOUT, VIEWBOX, type SceneLayerProps } from '../types';
import { normalizeSkyline } from '../scene-registry';
import { randInt, randRange } from '../seed';
import { LC_L_MARK } from '../lc-brand';

// City skyline behind the airfield. Four families (low / dense / highrise /
// historic). Buildings stand on a baseline just below the field top, so the
// later-drawn grass field occludes their bases and they read as "behind town".
// A `scene.skylineVariant` can opt a city into a bespoke skyline instead.
export function SkylineLayer(props: SceneLayerProps) {
  if (props.scene.skylineVariant === 'tokyo') return <TokyoSkyline {...props} />;
  if (props.scene.skylineVariant === 'paris') return <ParisSkyline {...props} />;
  if (props.scene.skylineVariant === 'rio') return <RioSkyline {...props} />;
  if (props.scene.skylineVariant === 'nyc') return <NycSkyline {...props} />;
  if (props.scene.skylineVariant === 'london') return <LondonSkyline {...props} />;
  if (props.scene.skylineVariant === 'dubai') return <DubaiSkyline {...props} />;
  if (props.scene.skylineVariant === 'singapore') return <SingaporeSkyline {...props} />;
  if (props.scene.skylineVariant === 'sydney') return <SydneySkyline {...props} />;
  if (props.scene.skylineVariant === 'hongkong') return <HongKongSkyline {...props} />;
  if (props.scene.skylineVariant === 'moscow') return <MoscowSkyline {...props} />;
  if (props.scene.skylineVariant === 'istanbul') return <IstanbulSkyline {...props} />;
  if (props.scene.skylineVariant === 'berlin') return <BerlinSkyline {...props} />;
  if (props.scene.skylineVariant === 'seoul') return <SeoulSkyline {...props} />;
  if (props.scene.skylineVariant === 'bangkok') return <BangkokSkyline {...props} />;
  if (props.scene.skylineVariant === 'beijing') return <BeijingSkyline {...props} />;
  if (props.scene.skylineVariant === 'shanghai') return <ShanghaiSkyline {...props} />;
  if (props.scene.skylineVariant === 'rome') return <RomeSkyline {...props} />;
  if (props.scene.skylineVariant === 'amsterdam') return <AmsterdamSkyline {...props} />;
  if (props.scene.skylineVariant === 'capetown') return <CapeTownSkyline {...props} />;
  if (props.scene.skylineVariant === 'toronto') return <TorontoSkyline {...props} />;
  if (props.scene.skylineVariant === 'cairo') return <CairoSkyline {...props} />;
  if (props.scene.skylineVariant === 'la') return <LaSkyline {...props} />;
  if (props.scene.skylineVariant === 'mumbai') return <MumbaiSkyline {...props} />;
  if (props.scene.skylineVariant === 'madrid') return <MadridSkyline {...props} />;
  if (props.scene.skylineVariant === 'mexicocity') return <MexicoCitySkyline {...props} />;
  if (props.scene.skylineVariant === 'buenosaires') return <BuenosAiresSkyline {...props} />;
  if (props.scene.skylineVariant === 'vancouver') return <VancouverSkyline {...props} />;
  if (props.scene.skylineVariant === 'miami') return <MiamiSkyline {...props} />;
  if (props.scene.skylineVariant === 'honolulu') return <HonoluluSkyline {...props} />;
  if (props.scene.skylineVariant === 'delhi') return <DelhiSkyline {...props} />;
  if (props.scene.skylineVariant === 'jakarta') return <JakartaSkyline {...props} />;
  if (props.scene.skylineVariant === 'lagos') return <LagosSkyline {...props} />;
  if (props.scene.skylineVariant === 'lisbon') return <LisbonSkyline {...props} />;
  if (props.scene.skylineVariant === 'dublin') return <DublinSkyline {...props} />;
  if (props.scene.skylineVariant === 'reykjavik') return <ReykjavikSkyline {...props} />;
  if (props.scene.skylineVariant === 'panamacity') return <PanamaCitySkyline {...props} />;
  if (props.scene.skylineVariant === 'hcmc') return <HcmcSkyline {...props} />;
  if (props.scene.skylineVariant === 'almaty') return <AlmatySkyline {...props} />;
  if (props.scene.skylineVariant === 'nairobi') return <NairobiSkyline {...props} />;
  if (props.scene.skylineVariant === 'lima') return <LimaSkyline {...props} />;
  if (props.scene.skylineVariant === 'bogota') return <BogotaSkyline {...props} />;
  if (props.scene.skylineVariant === 'perth') return <PerthSkyline {...props} />;
  if (props.scene.skylineVariant === 'auckland') return <AucklandSkyline {...props} />;
  if (props.scene.skylineVariant === 'suva') return <SuvaSkyline {...props} />;
  if (props.scene.skylineVariant === 'ulaanbaatar') return <UlaanbaatarSkyline {...props} />;
  if (props.scene.skylineVariant === 'dakar') return <DakarSkyline {...props} />;
  if (props.scene.skylineVariant === 'manila') return <ManilaSkyline {...props} />;
  if (props.scene.skylineVariant === 'santiago') return <SantiagoSkyline {...props} />;
  if (props.scene.skylineVariant === 'recife') return <RecifeSkyline {...props} />;
  if (props.scene.skylineVariant === 'addisababa') return <AddisAbabaSkyline {...props} />;
  if (props.scene.skylineVariant === 'homebase') return <HomeBaseSkyline {...props} />;
  const { scene, palette, rand, idPrefix } = props;
  const family = normalizeSkyline(scene.skyline);
  const base = LAYOUT.apronY + 12;
  const isMoon = palette.light === 'moon';

  const ranges: Record<string, { wMin: number; wMax: number; hMin: number; hMax: number; gap: number }> = {
    low: { wMin: 70, wMax: 130, hMin: 36, hMax: 84, gap: 10 },
    dense: { wMin: 34, wMax: 62, hMin: 70, hMax: 190, gap: 4 },
    highrise: { wMin: 54, wMax: 92, hMin: 150, hMax: 330, gap: 16 },
    historic: { wMin: 78, wMax: 140, hMin: 70, hMax: 150, gap: 8 },
  };
  const r = ranges[family];

  // window emitter
  const windows = (x: number, w: number, h: number, top: number) => {
    const cols = Math.max(1, Math.floor(w / 16));
    const rows = Math.max(1, Math.floor(h / 22));
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < cols; c += 1) {
      for (let rw = 0; rw < rows; rw += 1) {
        if (rand() > (isMoon ? 0.45 : 0.7)) continue;
        cells.push(
          <rect
            key={`${c}-${rw}`}
            x={x + 6 + c * (w / cols)}
            y={top + 8 + rw * (h / rows)}
            width={Math.max(3, w / cols - 6)}
            height={Math.max(3, h / rows - 8)}
            fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
            opacity={isMoon ? 0.85 : 0.4}
          />,
        );
      }
    }
    return cells;
  };

  const buildings: React.ReactNode[] = [];
  let x = -50;
  let key = 0;
  while (x < CONTENT_W + 50) {
    const w = randRange(rand, r.wMin, r.wMax);
    const h = randRange(rand, r.hMin, r.hMax);
    const top = base - h;
    buildings.push(
      <g key={key}>
        <rect x={x} y={top} width={w} height={h} fill={palette.buildingSilhouette} />
        {/* family-specific rooflines */}
        {family === 'highrise' && rand() > 0.6 && (
          <rect x={x + w / 2 - 2} y={top - randInt(rand, 10, 34)} width={4} height={34} fill={palette.buildingSilhouette} />
        )}
        {family === 'historic' && (rand() > 0.5
          ? <polygon points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 16, 34)}, ${x + w} ${top}`} fill={palette.buildingSilhouette} />
          : <ellipse cx={x + w / 2} cy={top} rx={w / 2.4} ry={randRange(rand, 14, 28)} fill={palette.buildingSilhouette} />)}
        {windows(x, w, h, top)}
      </g>,
    );
    x += w + r.gap;
    key += 1;
  }

  return (
    <g aria-hidden data-skyline={family} data-id={idPrefix}>
      {buildings}
    </g>
  );
}

// ── Tokyo — bespoke night skyline ────────────────────────────────────────────
// A dense, high-contrast wall of towers with rooftop antennas / water tanks /
// lit billboards and vertical neon signage, anchored by a lattice Tokyo Tower on
// the left (away from the plane). Palette-aware: neon and lit windows are bright
// at night and muted by day. Kept procedural + seeded so it stays compact and
// renders identically every time.
function TokyoSkyline({ scene, palette, rand, idPrefix }: SceneLayerProps) {
  void scene;
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const na = isNight ? 0.85 : 0.4;
  // Restrained Tokyo neon: pink / cyan / amber.
  const neon = [`rgba(255,86,150,${na})`, `rgba(86,206,255,${na})`, `rgba(255,180,74,${na})`];

  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 46, 98);
    const h = randRange(rand, 150, 336);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];

    // rooftop detail
    const roll = rand();
    if (roll > 0.72) {
      parts.push(<rect key="mast" x={x + w / 2 - 1.5} y={top - 46} width={3} height={46} fill={f} />);
      parts.push(<circle key="beacon" cx={x + w / 2} cy={top - 46} r={2.5} fill={neon[2]} />);
    } else if (roll > 0.5) {
      const bw = w * 0.42;
      parts.push(<rect key="tank" x={x + (w - bw) / 2} y={top - 16} width={bw} height={16} fill={f} />);
    } else if (roll > 0.34) {
      const bw = Math.min(w - 8, 42);
      parts.push(<rect key="bill" x={x + (w - bw) / 2} y={top - 26} width={bw} height={22} fill={neon[k % 3]} opacity={isNight ? 0.72 : 0.4} />);
    }

    // windows (denser + brighter at night)
    const cols = Math.max(2, Math.floor(w / 14));
    const rows = Math.max(3, Math.floor(h / 20));
    for (let c = 0; c < cols; c += 1) {
      for (let rw = 0; rw < rows; rw += 1) {
        if (rand() > (isNight ? 0.5 : 0.78)) continue;
        parts.push(
          <rect
            key={`w${c}-${rw}`}
            x={x + 5 + c * (w / cols)}
            y={top + 8 + rw * (h / rows)}
            width={Math.max(3, w / cols - 6)}
            height={Math.max(3, h / rows - 8)}
            fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
            opacity={isNight ? 0.85 : 0.4}
          />,
        );
      }
    }

    // occasional vertical neon sign down a building edge
    if (rand() > 0.7) {
      const sx = rand() > 0.5 ? x + 4 : x + w - 8;
      const sh = randRange(rand, h * 0.3, h * 0.58);
      parts.push(<rect key="sign" x={sx} y={top + 14} width={4} height={sh} fill={neon[k % 3]} />);
      for (let t = 0; t < sh; t += 16) {
        parts.push(<rect key={`tick${t}`} x={sx - 1.5} y={top + 16 + t} width={7} height={3} fill={neon[(k + 1) % 3]} />);
      }
    }

    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 16);
    k += 1;
  }

  // Tokyo Tower (lattice) anchor — left of centre, rising above the towers.
  // Filled in international orange with white bands so it CONTRASTS against the
  // dark towers rather than blending into the silhouette.
  const tx = CONTENT_W * 0.26;
  const tTop = base - 372;
  const deckLo = tTop + 150;
  const orange = 'rgb(216,98,56)';
  const band = 'rgba(247,238,224,0.94)';
  const tower = (
    <g key="tokyo-tower">
      {/* splayed legs */}
      <path d={`M ${tx - 48} ${base} L ${tx - 13} ${deckLo} L ${tx - 6} ${deckLo} L ${tx - 28} ${base} Z`} fill={orange} />
      <path d={`M ${tx + 48} ${base} L ${tx + 13} ${deckLo} L ${tx + 6} ${deckLo} L ${tx + 28} ${base} Z`} fill={orange} />
      {/* base arch + lattice cross-braces */}
      <path d={`M ${tx - 40} ${base} Q ${tx} ${base - 78} ${tx + 40} ${base}`} fill="none" stroke={orange} strokeWidth={6} />
      <path d={`M ${tx - 34} ${base - 10} L ${tx + 16} ${deckLo} M ${tx + 34} ${base - 10} L ${tx - 16} ${deckLo}`} stroke={orange} strokeWidth={2.5} fill="none" opacity={0.7} />
      {/* white banding (the tower's painted stripes) */}
      {[0.2, 0.46, 0.72].map((t, i) => {
        const y = base - (base - deckLo) * t;
        const hw = 46 - 31 * t;
        return <rect key={`band${i}`} x={tx - hw} y={y - 3} width={hw * 2} height={6} fill={band} />;
      })}
      {/* main observation deck */}
      <rect x={tx - 28} y={deckLo} width={56} height={18} fill={orange} />
      <rect x={tx - 26} y={deckLo + 4} width={52} height={4} fill={band} />
      {/* upper shaft + special observatory */}
      <polygon points={`${tx - 12} ${deckLo}, ${tx - 7} ${tTop + 60}, ${tx + 7} ${tTop + 60}, ${tx + 12} ${deckLo}`} fill={orange} />
      <rect x={tx - 12} y={tTop + 60} width={24} height={12} fill={orange} />
      {/* antenna mast + beacon */}
      <polygon points={`${tx - 6} ${tTop + 60}, ${tx - 2} ${tTop}, ${tx + 2} ${tTop}, ${tx + 6} ${tTop + 60}`} fill={orange} />
      <rect x={tx - 1.5} y={tTop - 42} width={3} height={42} fill={orange} />
      <circle cx={tx} cy={tTop - 44} r={4} fill={isNight ? 'rgba(255,80,80,0.95)' : neon[0]} />
    </g>
  );

  return (
    <g aria-hidden data-skyline="tokyo" data-id={idPrefix}>
      {items}
      {tower}
    </g>
  );
}

// ── Paris — bespoke Haussmann skyline ────────────────────────────────────────
// A continuous street-wall of uniform, low limestone blocks under steep grey
// zinc MANSARD roofs, crowded with chimney pots and punctuated by dormer windows
// and a wrought-iron balcony line. The uniform massing + mansard rooflines read
// "Paris" even in silhouette. Procedural + seeded; palette-aware lit windows.
function ParisSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const zinc = 'rgba(86,90,104,0.96)'; // grey zinc mansard, a touch lighter than facade
  const iron = 'rgba(0,0,0,0.28)'; // wrought-iron balcony rail
  const winOpacity = isNight ? 0.85 : 0.5;
  const limestone = 'rgba(214,204,184,0.98)'; // pale Louvre stone
  const limestoneShade = 'rgba(0,0,0,0.16)';
  const slate = 'rgba(72,76,90,0.97)'; // steep mansard slate

  // The Louvre sits centre, between the Eiffel (foreground, left) and Montmartre
  // (right). Reserve a clear slot so no Haussmann block overlaps the palace.
  const lx = CONTENT_W * 0.44;
  const louvreL = lx - 104;
  const louvreR = lx + 104;

  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 98, 152); // wide Haussmann blocks
    const h = randRange(rand, 120, 178); // uniform-ish, low (no highrise)
    if (x + w > louvreL && x < louvreR) {
      x = louvreR + 4;
      continue;
    }
    const top = base - h; // eaves line
    const roofH = randRange(rand, 26, 38);
    const roofTop = top - roofH;
    const inset = w * 0.12;
    const parts: React.ReactNode[] = [];

    // facade + steep mansard roof
    parts.push(<rect key="f" x={x} y={top} width={w} height={h} fill={f} />);
    parts.push(
      <path key="m" d={`M ${x} ${top} L ${x + inset} ${roofTop} L ${x + w - inset} ${roofTop} L ${x + w} ${top} Z`} fill={zinc} />,
    );

    // chimney pots clustered along the ridge
    const potN = randInt(rand, 2, 5);
    const rw = w - 2 * inset;
    for (let p = 0; p < potN; p += 1) {
      const px = x + inset + ((p + 0.5) * rw) / potN - 2.5;
      parts.push(<rect key={`pot${p}`} x={px} y={roofTop - randRange(rand, 8, 13)} width={5} height={14} fill={f} />);
    }

    // a dormer window on the mansard
    if (rand() > 0.4) {
      const dx = x + w / 2 - 7;
      parts.push(<rect key="dorm" x={dx} y={roofTop + 6} width={14} height={roofH - 4} fill={f} />);
      parts.push(<rect key="dormlit" x={dx + 3} y={roofTop + 9} width={8} height={roofH - 12} fill={palette.windowWarm} opacity={winOpacity} />);
    }

    // tall regular window grid + balcony rail at the 2nd floor
    const cols = Math.max(3, Math.floor(w / 28));
    const rows = Math.max(3, Math.floor(h / 30));
    for (let c = 0; c < cols; c += 1) {
      for (let rw2 = 0; rw2 < rows; rw2 += 1) {
        if (rand() > (isNight ? 0.55 : 0.72)) continue;
        const cw = w / cols;
        parts.push(
          <rect
            key={`w${c}-${rw2}`}
            x={x + cw * c + cw * 0.32}
            y={top + 10 + rw2 * (h / rows)}
            width={Math.max(3, cw * 0.36)}
            height={Math.max(6, h / rows - 12)}
            fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
            opacity={winOpacity}
          />,
        );
      }
    }
    parts.push(<rect key="bal" x={x + 2} y={top + h * 0.26} width={w - 4} height={2.5} fill={iron} />);

    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 2, 7); // tight — a continuous street wall
    k += 1;
  }

  // Sacré-Cœur on Montmartre — the white basilica atop the highest hill in Paris,
  // rising ABOVE the boulevard rooftops (crest above the tallest blocks). Two
  // tones (lit white + a shaded side) plus arched portico + cross so it isn't a
  // flat blob. Drawn FIRST so the street wall occludes the hill's lower slopes.
  const hx = CONTENT_W * 0.72;
  const hilltop = base - 238; // crest sits clear above the rooftops (~base-178)
  const white = 'rgba(244,240,230,0.98)';
  const shade = 'rgba(196,190,176,0.92)';
  const arch = isNight ? 'rgba(255,212,144,0.4)' : 'rgba(52,46,38,0.4)';
  // Montmartre village houses climbing the slopes below the basilica.
  const houseWall = 'rgba(212,204,188,0.97)';
  const houseRoof = 'rgba(78,80,92,0.96)';
  const hillHouse = (cx: number, gy: number, w: number, h: number, key: string) => (
    <g key={key}>
      <rect x={cx - w / 2} y={gy - h} width={w} height={h} fill={houseWall} />
      <rect x={cx} y={gy - h} width={w / 2} height={h} fill="rgba(0,0,0,0.16)" />
      <polygon points={`${cx - w / 2 - 2} ${gy - h}, ${cx} ${gy - h - 11}, ${cx + w / 2 + 2} ${gy - h}`} fill={houseRoof} />
      <rect x={cx - 3} y={gy - h + 7} width={6} height={8} fill={palette.windowWarm} opacity={winOpacity} />
    </g>
  );
  const houses = [
    hillHouse(hx - 210, base - 52, 30, 28, 'mh1'),
    hillHouse(hx - 178, base - 86, 34, 34, 'mh2'),
    hillHouse(hx - 132, base - 128, 28, 30, 'mh3'),
    hillHouse(hx - 96, base - 172, 24, 26, 'mh4'),
    hillHouse(hx + 116, base - 108, 28, 30, 'mh5'),
    hillHouse(hx + 170, base - 64, 32, 30, 'mh6'),
    hillHouse(hx + 226, base - 30, 26, 24, 'mh7'),
  ];
  const montmartre = (
    <g key="montmartre">
      {/* hill — bigger, with a broad crest so the basilica's whole base sits on it */}
      <path d={`M ${hx - 312} ${base} Q ${hx - 196} ${hilltop + 14} ${hx - 80} ${hilltop + 2} Q ${hx} ${hilltop - 6} ${hx + 80} ${hilltop + 2} Q ${hx + 196} ${hilltop + 14} ${hx + 312} ${base} Z`} fill={palette.foliage} />
      {/* shaded right slope */}
      <path d={`M ${hx} ${hilltop - 6} Q ${hx + 80} ${hilltop + 2} ${hx + 196} ${hilltop + 14} Q ${hx + 260} ${hilltop + 60} ${hx + 312} ${base} L ${hx + 150} ${base} Q ${hx + 70} ${hilltop + 18} ${hx} ${hilltop - 6} Z`} fill="rgba(0,0,0,0.14)" />
      {/* village houses on the slopes (drawn before the basilica so it crowns them) */}
      {houses}
      {/* basilica base + arched portico */}
      <rect x={hx - 47} y={hilltop - 24} width={94} height={28} fill={white} />
      {[-30, -10, 10, 30].map((dx, i) => (
        <path key={i} d={`M ${hx + dx - 5} ${hilltop + 4} L ${hx + dx - 5} ${hilltop - 12} Q ${hx + dx} ${hilltop - 20} ${hx + dx + 5} ${hilltop - 12} L ${hx + dx + 5} ${hilltop + 4} Z`} fill={arch} />
      ))}
      {/* flanking domes (shaded right halves) */}
      {[-33, 33].map((dx, i) => (
        <g key={i}>
          <rect x={hx + dx - 8} y={hilltop - 46} width={16} height={22} fill={white} />
          <path d={`M ${hx + dx - 8} ${hilltop - 46} C ${hx + dx - 8} ${hilltop - 61} ${hx + dx + 8} ${hilltop - 61} ${hx + dx + 8} ${hilltop - 46} Z`} fill={white} />
          <path d={`M ${hx + dx} ${hilltop - 61} C ${hx + dx + 8} ${hilltop - 61} ${hx + dx + 8} ${hilltop - 46} ${hx + dx} ${hilltop - 46} Z`} fill={shade} />
        </g>
      ))}
      {/* central drum + tall ovoid dome (shaded right) + lantern + cross */}
      <rect x={hx - 21} y={hilltop - 64} width={42} height={24} fill={white} />
      <path d={`M ${hx - 21} ${hilltop - 64} C ${hx - 23} ${hilltop - 114} ${hx + 23} ${hilltop - 114} ${hx + 21} ${hilltop - 64} Z`} fill={white} />
      <path d={`M ${hx} ${hilltop - 114} C ${hx + 19} ${hilltop - 112} ${hx + 23} ${hilltop - 84} ${hx + 21} ${hilltop - 64} L ${hx} ${hilltop - 64} Z`} fill={shade} />
      <rect x={hx - 4} y={hilltop - 126} width={8} height={14} fill={white} />
      <rect x={hx - 1.5} y={hilltop - 138} width={3} height={12} fill={white} />
      <rect x={hx - 4} y={hilltop - 134} width={9} height={3} fill={white} />
      {/* campanile (shaded right) */}
      <rect x={hx + 42} y={hilltop - 80} width={18} height={80} fill={white} />
      <rect x={hx + 51} y={hilltop - 80} width={9} height={80} fill={shade} />
      <polygon points={`${hx + 42} ${hilltop - 80}, ${hx + 51} ${hilltop - 96}, ${hx + 60} ${hilltop - 80}`} fill={white} />
    </g>
  );

  // ── The Louvre — classical limestone palace + the glass Pyramid ──
  const louvreEave = base - 116;
  const archWin = (wy: number, h: number, n: number, key: string) => {
    const x0 = lx - 86;
    const span = 172;
    return Array.from({ length: n }, (_, i) => {
      const wxx = x0 + ((i + 0.5) * span) / n - 4;
      return (
        <g key={`${key}-${i}`}>
          <rect x={wxx} y={wy} width={8} height={h} fill={palette.windowWarm} opacity={winOpacity} />
          <path d={`M ${wxx} ${wy} Q ${wxx + 4} ${wy - 6} ${wxx + 8} ${wy} Z`} fill={palette.windowWarm} opacity={winOpacity} />
        </g>
      );
    });
  };
  const pavilion = (px: number, pw: number, roofTopY: number, key: string) => {
    const eve = louvreEave - 18;
    return (
      <g key={key}>
        <rect x={px - pw / 2} y={eve} width={pw} height={18} fill={limestone} />
        <rect x={px} y={eve} width={pw / 2} height={18} fill={limestoneShade} />
        <path d={`M ${px - pw / 2 - 3} ${eve} L ${px - pw * 0.3} ${roofTopY} Q ${px} ${roofTopY - 12} ${px + pw * 0.3} ${roofTopY} L ${px + pw / 2 + 3} ${eve} Z`} fill={slate} />
        <path d={`M ${px} ${roofTopY - 12} Q ${px} ${roofTopY - 12} ${px + pw * 0.3} ${roofTopY} L ${px + pw / 2 + 3} ${eve} L ${px} ${eve} Z`} fill="rgba(0,0,0,0.2)" />
        <rect x={px - 1.5} y={roofTopY - 22} width={3} height={14} fill={limestone} />
      </g>
    );
  };
  const louvre = (
    <g key="louvre">
      {/* facade + ground arcade + cornice */}
      <rect x={lx - 94} y={louvreEave} width={188} height={116} fill={limestone} />
      <rect x={lx} y={louvreEave} width={94} height={116} fill={limestoneShade} />
      <rect x={lx - 94} y={base - 22} width={188} height={22} fill="rgba(0,0,0,0.12)" />
      <rect x={lx - 100} y={louvreEave - 7} width={200} height={8} fill={limestone} />
      <rect x={lx} y={louvreEave - 7} width={100} height={8} fill={limestoneShade} />
      {/* arched window rows */}
      {archWin(louvreEave + 22, 30, 9, 'wr1')}
      {archWin(louvreEave + 70, 26, 9, 'wr2')}
      {/* pavilions with steep slate mansard roofs */}
      {pavilion(lx - 74, 40, base - 150, 'pL')}
      {pavilion(lx + 74, 40, base - 150, 'pR')}
      {pavilion(lx, 58, base - 172, 'pC')}
      {/* glass Pyramid in the courtyard (lit faces + lattice + outline) */}
      {isNight && <polygon points={`${lx} ${base - 84}, ${lx - 62} ${base}, ${lx + 62} ${base}`} fill="rgba(255,214,140,0.18)" />}
      <polygon points={`${lx} ${base - 82}, ${lx - 60} ${base}, ${lx} ${base}`} fill="rgba(198,224,244,0.42)" />
      <polygon points={`${lx} ${base - 82}, ${lx + 60} ${base}, ${lx} ${base}`} fill="rgba(120,150,182,0.36)" />
      {[-40, -20, 0, 20, 40].map((bx, i) => (
        <line key={`m${i}`} x1={lx + bx} y1={base} x2={lx} y2={base - 82} stroke="rgba(212,234,252,0.34)" strokeWidth={1} />
      ))}
      {[16, 36, 56].map((yy, i) => {
        const half = 60 * (1 - yy / 82);
        return <line key={`c${i}`} x1={lx - half} y1={base - yy} x2={lx + half} y2={base - yy} stroke="rgba(212,234,252,0.3)" strokeWidth={1} />;
      })}
      <polyline points={`${lx - 60} ${base}, ${lx} ${base - 82}, ${lx + 60} ${base}`} fill="none" stroke="rgba(224,240,255,0.72)" strokeWidth={1.5} strokeLinejoin="round" />
      {/* small flanking pyramids */}
      {[-82, 84].map((dx, i) => (
        <g key={`sp${i}`}>
          <polygon points={`${lx + dx} ${base - 24}, ${lx + dx - 15} ${base}, ${lx + dx + 15} ${base}`} fill="rgba(176,206,232,0.34)" />
          <polyline points={`${lx + dx - 15} ${base}, ${lx + dx} ${base - 24}, ${lx + dx + 15} ${base}`} fill="none" stroke="rgba(224,240,255,0.6)" strokeWidth={1} />
        </g>
      ))}
    </g>
  );

  return (
    <g aria-hidden data-skyline="paris" data-id={idPrefix}>
      {montmartre}
      {items}
      {louvre}
    </g>
  );
}

// ── Rio de Janeiro — bespoke coastal skyline ─────────────────────────────────
// Steep green granite morros rising behind a beachfront tower line, with the
// iconic Sugarloaf monolith + cable car on the left. Pairs with Christ the
// Redeemer (the background landmark). Procedural + seeded; palette-aware windows.
function RioSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const granite = 'rgba(44,60,50,0.96)'; // forested green granite
  const shade = 'rgba(0,0,0,0.16)';

  // A steep rounded morro (peak) with a shaded right flank.
  const morro = (cx: number, h: number, w: number, k: string) => (
    <g key={k}>
      <path d={`M ${cx - w} ${base} Q ${cx - w * 0.5} ${base - h} ${cx} ${base - h} Q ${cx + w * 0.5} ${base - h} ${cx + w} ${base} Z`} fill={granite} />
      <path d={`M ${cx} ${base - h} Q ${cx + w * 0.5} ${base - h} ${cx + w} ${base} L ${cx + w * 0.5} ${base} Q ${cx + w * 0.28} ${base - h * 0.6} ${cx} ${base - h} Z`} fill={shade} />
    </g>
  );

  // Sugarloaf (Pão de Açúcar) + Morro da Urca + cable car, on the left.
  const sx = CONTENT_W * 0.2;
  const sH = 296;
  const urcaX = sx - 150;
  const urcaH = 150;
  const carMidX = (urcaX + (sx - 44)) / 2;
  const carMidY = (base - urcaH + 6 + (base - sH + 44)) / 2;
  const sugarloaf = (
    <g>
      {/* Morro da Urca */}
      <path d={`M ${urcaX - 92} ${base} Q ${urcaX - 30} ${base - urcaH} ${urcaX} ${base - urcaH} Q ${urcaX + 52} ${base - urcaH} ${urcaX + 80} ${base} Z`} fill={granite} />
      <path d={`M ${urcaX} ${base - urcaH} Q ${urcaX + 52} ${base - urcaH} ${urcaX + 80} ${base} L ${urcaX + 30} ${base} Z`} fill={shade} />
      {/* cable car line + cabin */}
      <line x1={urcaX} y1={base - urcaH + 6} x2={sx - 44} y2={base - sH + 44} stroke="rgba(0,0,0,0.45)" strokeWidth={1.5} />
      <rect x={carMidX - 6} y={carMidY - 4} width={12} height={8} rx={1} fill={f} />
      {/* Sugarloaf monolith */}
      <path d={`M ${sx - 66} ${base} C ${sx - 70} ${base - sH * 0.45} ${sx - 46} ${base - sH} ${sx} ${base - sH} C ${sx + 46} ${base - sH} ${sx + 70} ${base - sH * 0.45} ${sx + 66} ${base} Z`} fill={granite} />
      <path d={`M ${sx} ${base - sH} C ${sx + 46} ${base - sH} ${sx + 70} ${base - sH * 0.45} ${sx + 66} ${base} L ${sx + 30} ${base} C ${sx + 34} ${base - sH * 0.55} ${sx + 18} ${base - sH * 0.9} ${sx} ${base - sH} Z`} fill={shade} />
      {/* summit station */}
      <rect x={sx - 12} y={base - sH - 6} width={24} height={8} fill={f} />
    </g>
  );

  // beachfront tower line (the city), right of Sugarloaf.
  const towers: React.ReactNode[] = [];
  let x = CONTENT_W * 0.27;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 58);
    const h = randRange(rand, 96, 232);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    const cols = Math.max(2, Math.floor(w / 12));
    const rows = Math.max(3, Math.floor(h / 20));
    for (let c = 0; c < cols; c += 1) {
      for (let rw = 0; rw < rows; rw += 1) {
        if (rand() > (isNight ? 0.5 : 0.74)) continue;
        parts.push(
          <rect
            key={`w${c}-${rw}`}
            x={x + 4 + c * (w / cols)}
            y={top + 8 + rw * (h / rows)}
            width={Math.max(2.5, w / cols - 5)}
            height={Math.max(3, h / rows - 8)}
            fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
            opacity={isNight ? 0.85 : 0.4}
          />,
        );
      }
    }
    towers.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 10);
    k += 1;
  }

  return (
    <g aria-hidden data-skyline="rio" data-id={idPrefix}>
      {morro(CONTENT_W * 0.52, 262, 150, 'm1')}
      {morro(CONTENT_W * 0.84, 214, 120, 'm2')}
      {towers}
      {sugarloaf}
    </g>
  );
}

// Shared lit-window emitter for the bespoke variants (denser/brighter at night).
function litWindows(
  x: number,
  w: number,
  h: number,
  top: number,
  palette: SceneLayerProps['palette'],
  rand: () => number,
  isNight: boolean,
): React.ReactNode[] {
  const cols = Math.max(2, Math.floor(w / 12));
  const rows = Math.max(3, Math.floor(h / 20));
  const cells: React.ReactNode[] = [];
  for (let c = 0; c < cols; c += 1) {
    for (let rw = 0; rw < rows; rw += 1) {
      if (rand() > (isNight ? 0.5 : 0.74)) continue;
      cells.push(
        <rect
          key={`${c}-${rw}`}
          x={x + 4 + c * (w / cols)}
          y={top + 8 + rw * (h / rows)}
          width={Math.max(2.5, w / cols - 5)}
          height={Math.max(3, h / rows - 8)}
          fill={rand() > 0.5 ? palette.windowWarm : palette.windowCool}
          opacity={isNight ? 0.85 : 0.4}
        />,
      );
    }
  }
  return cells;
}

// ── LC International — distant mountain BACKDROP (far parallax layer) ─────────
// The snow-capped ranges + breathing aurora + sky glow that sit FAR behind the
// home-base city. Split out of HomeBaseSkyline into its own layer so the composer
// can render it at a DEEPER parallax depth than the city/towers — that depth gap
// is what gives LC International the background-layer parallax on takeoff/landing
// that the real cities get from their distant background landmark (home base has
// none). The hero massif + glowing waterfall stay in HomeBaseSkyline because the
// sky-tram anchors to them — exactly as Rio keeps its morros at skyline depth and
// only Christ the Redeemer sits in the far background. Its <defs> ids use a
// distinct `-hbbg-` prefix so they never collide with the city layer's defs.
export function HomeBaseBackdrop({ palette, idPrefix, ambient }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const isNight = palette.light === 'moon';
  // Mountain depth tiers (aerial perspective): near peaks are darkest + most
  // saturated; each range back gets lighter + hazier toward the sky.
  const rock = isNight ? 'rgb(20,30,52)' : 'rgb(66,86,116)';       // near (darkest)
  const rockMid = isNight ? 'rgb(28,40,64)' : 'rgb(98,120,150)';   // mid distance
  const rockFar = isNight ? 'rgb(36,50,78)' : 'rgb(130,152,182)';  // far
  const rockShade = 'rgba(0,0,0,0.24)';
  const snow = isNight ? 'rgba(198,218,244,0.86)' : 'rgba(246,251,255,0.96)';
  const haze = isNight ? 'rgba(52,70,104,0.6)' : 'rgba(170,192,218,0.62)'; // farthest (lightest)

  const glowId = `${idPrefix}-hbbg-glow`;
  const blurId = `${idPrefix}-hbbg-blur`;

  // The backdrop fills the full widescreen overflow so the ranges run edge-to-edge.
  const spanL = -BLEED_X - 80;
  const spanR = CONTENT_W + BLEED_X + 80;

  const defs = (
    <defs>
      <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={isNight ? 'rgba(90,170,255,0.34)' : 'rgba(120,190,255,0.22)'} />
        <stop offset="1" stopColor="rgba(90,170,255,0)" />
      </radialGradient>
      <filter id={blurId} x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>
  );

  // ── Sky glow + breathing aurora ribbon behind the massif ──
  const skyGlow = <ellipse cx={CONTENT_W * 0.6} cy={base - 300} rx={720} ry={320} fill={`url(#${glowId})`} />;
  const auroraD = `M ${spanL} ${base - 300} Q ${CONTENT_W * 0.28} ${base - 452} ${CONTENT_W * 0.58} ${base - 340} T ${spanR} ${base - 372}`;
  const aurora = ambient ? (
    <motion.path
      d={auroraD} fill="none" stroke="rgba(120,200,255,0.6)" strokeWidth={54} strokeLinecap="round"
      filter={`url(#${blurId})`}
      animate={{ opacity: isNight ? [0.18, 0.4, 0.18] : [0.1, 0.22, 0.1] }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
    />
  ) : (
    <path d={auroraD} fill="none" stroke="rgba(120,200,255,0.6)" strokeWidth={54} strokeLinecap="round" filter={`url(#${blurId})`} opacity={isNight ? 0.22 : 0.12} />
  );

  // ── Layered distant mountain ranges (far → near), spanning the whole canvas ──
  const ridge = (amp: number, yTop: number, phase: number, fill: string, key: string) => {
    const pts: string[] = [`${spanL} ${base}`];
    for (let x = spanL; x <= spanR; x += 150) {
      const h = amp * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.011 + phase)));
      pts.push(`${x} ${yTop - h}`);
    }
    pts.push(`${spanR} ${base}`);
    return <path key={key} d={`M ${pts.join(' L ')} Z`} fill={fill} />;
  };
  // Three layered ranges, each nearer one darker + taller than the last, so the
  // near snow-capped peaks (drawn after, in `rock`) read clearly in front.
  const backHaze = (
    <g>
      {ridge(56, base - 104, 0.6, haze, 'r-farthest')}
      {ridge(92, base - 134, 2.1, rockFar, 'r-far')}
      {ridge(132, base - 162, 3.4, rockMid, 'r-mid')}
    </g>
  );

  // ── Snow-capped side peaks ──
  const peak = (cx: number, h: number, w: number, key: string) => {
    const ty = base - h;
    return (
      <g key={key}>
        <polygon points={`${cx - w} ${base}, ${cx - w * 0.28} ${ty + h * 0.22}, ${cx} ${ty}, ${cx + w * 0.36} ${ty + h * 0.28}, ${cx + w} ${base}`} fill={rock} />
        <polygon points={`${cx} ${ty}, ${cx + w * 0.36} ${ty + h * 0.28}, ${cx + w} ${base}, ${cx + w * 0.4} ${base} Z`} fill={rockShade} />
        <polygon points={`${cx - w * 0.2} ${ty + h * 0.2}, ${cx} ${ty}, ${cx + w * 0.26} ${ty + h * 0.24}, ${cx + w * 0.16} ${ty + h * 0.32}, ${cx + w * 0.05} ${ty + h * 0.2}, ${cx - w * 0.06} ${ty + h * 0.34}, ${cx - w * 0.14} ${ty + h * 0.26}`} fill={snow} />
      </g>
    );
  };
  // Snow-capped peaks across the whole canvas (incl. the widescreen overflow).
  const midPeaks: [number, number, number][] = [
    [-520, 290, 280], [-180, 252, 220], [180, 300, 250],
    [620, 262, 220], [1280, 300, 250], [1640, 282, 240],
    [2000, 300, 250], [2300, 252, 220],
  ];

  return (
    <g aria-hidden data-skyline="homebase-backdrop" data-id={idPrefix}>
      {defs}
      {skyGlow}
      {aurora}
      {backHaze}
      {midPeaks.map(([cx, h, w], i) => peak(cx, h, w, `mtn-${i}`))}
    </g>
  );
}

// ── LC International — bespoke home-base skyline ─────────────────────────────
// The flagship LessonCaptain home base across the bay: a dramatic snow-capped
// massif with a GLOWING WATERFALL cascading into the bay, fronted by a curated
// skyline of distinctive futuristic LC architecture — a twisting helix tower,
// skybridge twins with a sky-garden, a rounded "canister" stack, a diagrid hero
// spire, an observation-ring tower, a geodesic biosphere dome, a curved sail
// tower, and an arched gateway tower. Alive with a sky-tram pod riding a cable to
// the peak, drifting light drones, an airship, and a breathing aurora. LC-blue
// silhouettes + cyan/white light keep the brand identity at every time of day,
// while the sky/sun/moon follow the flight clock. Animated magic is gated on
// `ambient` (still frames render rich static fallbacks). Pairs with the LC
// control tower (foreground hero).
function HomeBaseSkyline({ palette, rand, idPrefix, ambient }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const isNight = palette.light === 'moon';
  // LC navy massing — two tones for day/night so it darkens at night yet stays blue.
  const f = isNight ? 'rgb(12,22,46)' : 'rgb(22,38,72)';
  const fHi = isNight ? 'rgb(20,34,66)' : 'rgb(34,52,92)';   // lit face / accent mass
  const rim = 'rgba(120,200,255,0.85)';   // LC-blue leading-edge light
  const lit = isNight ? 'rgba(150,220,255,0.92)' : 'rgba(150,220,255,0.5)'; // window/glass glow
  const warm = palette.windowWarm;
  // Hero-massif rock tones (the distant range tiers now live in HomeBaseBackdrop).
  const rock = isNight ? 'rgb(20,30,52)' : 'rgb(66,86,116)';       // near (darkest)
  const rockShade = 'rgba(0,0,0,0.24)';
  const snow = isNight ? 'rgba(198,218,244,0.86)' : 'rgba(246,251,255,0.96)';

  const wfId = `${idPrefix}-hb-wf`;
  const mistId = `${idPrefix}-hb-mist`;
  const glowId = `${idPrefix}-hb-glow`;
  const bodyId = `${idPrefix}-hb-body`;
  const glassId = `${idPrefix}-hb-glass`;

  const defs = (
    <defs>
      {/* dimensional navy body sheen (lighter top → darker base) */}
      <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={fHi} />
        <stop offset="1" stopColor={f} />
      </linearGradient>
      {/* lit glass — for the glowing observation cabs/crowns */}
      <linearGradient id={glassId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={isNight ? 'rgba(160,228,255,0.9)' : 'rgba(150,222,255,0.62)'} />
        <stop offset="1" stopColor={isNight ? 'rgba(64,124,194,0.6)' : 'rgba(92,152,210,0.42)'} />
      </linearGradient>
      <linearGradient id={wfId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="rgba(255,255,255,0.95)" />
        <stop offset="0.5" stopColor="rgba(196,238,255,0.82)" />
        <stop offset="1" stopColor="rgba(150,220,255,0.5)" />
      </linearGradient>
      <radialGradient id={mistId} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="rgba(224,246,255,0.6)" />
        <stop offset="1" stopColor="rgba(224,246,255,0)" />
      </radialGradient>
      <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={isNight ? 'rgba(90,170,255,0.34)' : 'rgba(120,190,255,0.22)'} />
        <stop offset="1" stopColor="rgba(90,170,255,0)" />
      </radialGradient>
    </defs>
  );

  // ── Full-canvas span — the home base fills its own widescreen overflow, so the
  //    city runs edge-to-edge instead of relying on the generic bleed. The distant
  //    mountain ranges + aurora now live in HomeBaseBackdrop (a deeper parallax
  //    layer); only the hero massif + waterfall + city remain here. ──
  const spanL = -BLEED_X - 80;
  const spanR = CONTENT_W + BLEED_X + 80;

  // ── Hero massif (tallest, central-right) + glowing waterfall + mist ──
  const hmX = CONTENT_W * 0.6;
  const hmH = 386;
  const hmW = 360;
  const hmTy = base - hmH;
  const apexX = hmX - hmW * 0.08;
  const heroMassif = (
    <g>
      <polygon points={`${hmX - hmW} ${base}, ${hmX - hmW * 0.34} ${hmTy + hmH * 0.26}, ${apexX} ${hmTy}, ${hmX + hmW * 0.2} ${hmTy + hmH * 0.14}, ${hmX + hmW * 0.5} ${hmTy + hmH * 0.4}, ${hmX + hmW} ${base}`} fill={rock} />
      <polygon points={`${apexX} ${hmTy}, ${hmX + hmW * 0.2} ${hmTy + hmH * 0.14}, ${hmX + hmW * 0.5} ${hmTy + hmH * 0.4}, ${hmX + hmW} ${base}, ${hmX + hmW * 0.3} ${base}, ${apexX} ${hmTy}`} fill={rockShade} />
      <polygon points={`${apexX - hmW * 0.18} ${hmTy + hmH * 0.22}, ${apexX} ${hmTy}, ${apexX + hmW * 0.16} ${hmTy + hmH * 0.1}, ${apexX + hmW * 0.06} ${hmTy + hmH * 0.2}, ${apexX - hmW * 0.04} ${hmTy + hmH * 0.13}, ${apexX - hmW * 0.12} ${hmTy + hmH * 0.24}`} fill={snow} />
    </g>
  );

  const wfX = apexX + 6;
  const wfTop = base - 302;
  const wfBot = base - 94;
  const wfMid = (wfTop + wfBot) / 2;
  const waterfall = (
    <g>
      {/* soft glow behind the cascade */}
      <rect x={wfX - 22} y={wfTop} width={44} height={wfBot - wfTop + 30} fill={`url(#${mistId})`} />
      {/* source notch at the snowline */}
      <ellipse cx={wfX} cy={wfTop} rx={13} ry={5} fill={`url(#${wfId})`} />
      {/* framing rocks each side of the chute */}
      <polygon points={`${wfX - 15} ${wfTop + 6}, ${wfX - 9} ${wfMid}, ${wfX - 14} ${wfBot}`} fill={rockShade} />
      <polygon points={`${wfX + 15} ${wfTop + 6}, ${wfX + 9} ${wfMid}, ${wfX + 14} ${wfBot}`} fill={rockShade} />
      {/* two-tier cascade */}
      <path d={`M ${wfX - 6} ${wfTop} L ${wfX + 6} ${wfTop} L ${wfX + 8} ${wfMid - 6} L ${wfX - 8} ${wfMid - 6} Z`} fill={`url(#${wfId})`} />
      <path d={`M ${wfX - 9} ${wfMid + 2} L ${wfX + 9} ${wfMid + 2} L ${wfX + 13} ${wfBot} L ${wfX - 13} ${wfBot} Z`} fill={`url(#${wfId})`} />
      {/* mid-ledge spray */}
      <ellipse cx={wfX} cy={wfMid} rx={18} ry={7} fill={`url(#${mistId})`} />
      {/* falling shimmer streaks (ambient) */}
      {ambient && [0, 1, 2, 3, 4, 5].map((i) => {
        const span = wfBot - wfTop;
        return (
          <motion.rect
            key={i} x={wfX - 8 + (i % 3) * 6} width={1.8} height={24} rx={1} fill="rgba(255,255,255,0.85)"
            initial={{ y: wfTop + ((i * 34) % span) }}
            animate={{ y: [wfTop + ((i * 34) % span), wfBot - 12] }}
            transition={{ duration: 0.9 + (i % 3) * 0.18, repeat: Infinity, ease: 'linear', delay: i * 0.18 }}
          />
        );
      })}
      {/* faint mist rainbow (ambient, magical) */}
      {ambient && (
        <g opacity={0.32}>
          {['rgba(255,150,150,0.5)', 'rgba(255,228,150,0.5)', 'rgba(150,230,180,0.5)', 'rgba(150,200,255,0.5)'].map((c, i) => (
            <path key={i} d={`M ${wfX - 30} ${wfBot - 2 - i * 3} A 30 30 0 0 1 ${wfX + 30} ${wfBot - 2 - i * 3}`} fill="none" stroke={c} strokeWidth={2} />
          ))}
        </g>
      )}
      {/* base mist pool + rising mist clouds */}
      <ellipse cx={wfX} cy={wfBot + 3} rx={34} ry={12} fill={`url(#${mistId})`} />
      {ambient ? (
        [0, 1, 2].map((i) => (
          <motion.ellipse
            key={i} cx={wfX - 18 + i * 18} cy={wfBot} rx={14} ry={7} fill={`url(#${mistId})`}
            animate={{ cy: [wfBot, wfBot - 24], opacity: [0.5, 0] }}
            transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: 'easeOut', delay: i * 0.9 }}
          />
        ))
      ) : (
        <>
          <ellipse cx={wfX - 16} cy={wfBot - 2} rx={15} ry={7} fill={`url(#${mistId})`} />
          <ellipse cx={wfX + 16} cy={wfBot} rx={13} ry={6} fill={`url(#${mistId})`} />
        </>
      )}
      {/* pool ripple rings (ambient) */}
      {ambient && [0, 1].map((i) => (
        <motion.ellipse
          key={`r${i}`} cx={wfX} cy={wfBot + 4} rx={8} ry={3} fill="none" stroke="rgba(190,235,255,0.5)" strokeWidth={1}
          animate={{ rx: [6, 30], ry: [2, 9], opacity: [0.6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut', delay: i * 1.2 }}
        />
      ))}
    </g>
  );

  // ── Dense city fill — a full skyline of varied futuristic mid-rises behind the
  //    hero towers, so LC International reads as a real metropolis. A short
  //    corridor under the falls stays low so the waterfall still reads. ──
  const wfL = wfX - 46, wfR = wfX + 46;
  const cityFill: React.ReactNode[] = [];
  let lx = spanL;
  let lk = 0;
  while (lx < spanR) {
    const inFalls = lx > wfL && lx < wfR;
    const w = randRange(rand, 26, 66);
    const h = inFalls ? randRange(rand, 40, 74) : randRange(rand, 86, 214);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={lx} y={top} width={w} height={h} fill={`url(#${bodyId})`} />];
    // varied futuristic crowns
    const roll = rand();
    if (roll > 0.74) {
      const sw = w * 0.58;
      parts.push(<rect key="s" x={lx + (w - sw) / 2} y={top - 16} width={sw} height={16} fill={`url(#${bodyId})`} />);
      if (rand() > 0.5) parts.push(<rect key="sm" x={lx + w / 2 - 1} y={top - 38} width={2} height={22} fill={f} />);
    } else if (roll > 0.52) {
      parts.push(<polygon key="r" points={`${lx} ${top}, ${lx + w} ${top - randRange(rand, 12, 28)}, ${lx + w} ${top}`} fill={f} />);
    } else if (roll > 0.36) {
      parts.push(<rect key="m" x={lx + w / 2 - 1} y={top - 24} width={2} height={24} fill={f} />);
      parts.push(<circle key="bc" cx={lx + w / 2} cy={top - 25} r={2} fill={warm} />);
    } else if (roll > 0.24) {
      parts.push(<path key="d" d={`M ${lx + w * 0.2} ${top} Q ${lx + w / 2} ${top - w * 0.32} ${lx + w * 0.8} ${top} Z`} fill={`url(#${bodyId})`} />);
    }
    // occasional LC-blue lit leading edge
    if (rand() > 0.6) parts.push(<rect key="e" x={lx} y={top} width={2} height={h} fill={rim} opacity={0.5} />);
    parts.push(...litWindows(lx, w, h, top, palette, rand, isNight));
    cityFill.push(<g key={lk}>{parts}</g>);
    lx += w + randRange(rand, 5, 15);
    lk += 1;
  }

  // Lit glass observation crown — the polished "control-tower cab" look, shared
  // by several towers so the city reads crafted, not flat.
  const glassCab = (cx: number, topY: number, w: number, k?: string) => {
    const hw = w / 2;
    const pts = `${cx - hw} ${topY + 12}, ${cx + hw} ${topY + 12}, ${cx + hw - 4} ${topY - 4}, ${cx} ${topY - 17}, ${cx - hw + 4} ${topY - 4}`;
    return (
      <g key={k}>
        <ellipse cx={cx} cy={topY + 2} rx={hw + 9} ry={13} fill={`url(#${glowId})`} />
        <polygon points={pts} fill={`url(#${glassId})`} />
        <polygon points={pts} fill="none" stroke={rim} strokeWidth={1.4} strokeLinejoin="round" />
        <line x1={cx - hw * 0.4} y1={topY - 10} x2={cx - hw * 0.4} y2={topY + 12} stroke="rgba(16,32,56,0.5)" strokeWidth={1} />
        <line x1={cx + hw * 0.4} y1={topY - 10} x2={cx + hw * 0.4} y2={topY + 12} stroke="rgba(16,32,56,0.5)" strokeWidth={1} />
        <circle cx={cx} cy={topY - 23} r={3} fill={warm} />
      </g>
    );
  };

  // ── 1. Helix tower — twisting stack of rotated segments ──
  const hxX = CONTENT_W * 0.095;
  const helix = (() => {
    const segN = 9, segH = 24, w = 30;
    const parts: React.ReactNode[] = [];
    for (let i = 0; i < segN; i += 1) {
      const y = base - i * segH;
      const top = y - segH;
      const dxB = Math.sin(i * 0.82) * 9;
      const dxT = Math.sin((i + 1) * 0.82) * 9;
      parts.push(<polygon key={i} points={`${hxX - w / 2 + dxB} ${y}, ${hxX - w / 2 + dxT} ${top}, ${hxX + w / 2 + dxT} ${top}, ${hxX + w / 2 + dxB} ${y}`} fill={i % 2 ? f : fHi} />);
      parts.push(<line key={`e${i}`} x1={hxX - w / 2 + dxB} y1={y} x2={hxX - w / 2 + dxT} y2={top} stroke={rim} strokeWidth={1.4} opacity={0.6} />);
    }
    const topY = base - segN * segH;
    return (
      <g>
        {parts}
        <rect x={hxX - 1.5} y={topY - 30} width={3} height={30} fill={f} />
        <circle cx={hxX} cy={topY - 32} r={3.5} fill={warm} />
      </g>
    );
  })();

  // ── 2. Skybridge twins — two towers + a lit bridge + sky-garden ──
  const sbX = CONTENT_W * 0.2;
  const sbH1 = 256, sbH2 = 212, tw = 32;
  const skybridge = (
    <g>
      <rect x={sbX - 46} y={base - sbH1} width={tw} height={sbH1} fill={`url(#${bodyId})`} />
      <rect x={sbX + 12} y={base - sbH2} width={tw} height={sbH2} fill={`url(#${bodyId})`} />
      <rect x={sbX - 46} y={base - sbH1} width={2.5} height={sbH1} fill={rim} opacity={0.6} />
      <rect x={sbX + 12} y={base - sbH2} width={2.5} height={sbH2} fill={rim} opacity={0.6} />
      {/* glazed skybridge linking the towers */}
      <rect x={sbX - 14} y={base - sbH2 + 22} width={26} height={12} fill={fHi} />
      <rect x={sbX - 14} y={base - sbH2 + 25} width={26} height={3} fill={lit} />
      {litWindows(sbX - 46, tw, sbH1, base - sbH1, palette, rand, isNight)}
      {litWindows(sbX + 12, tw, sbH2, base - sbH2, palette, rand, isNight)}
      {/* sky-garden crown on the tall tower + a glass cab on the shorter one */}
      <ellipse cx={sbX - 30} cy={base - sbH1} rx={20} ry={8} fill={palette.foliage} opacity={0.9} />
      <circle cx={sbX - 30} cy={base - sbH1 - 6} r={3} fill={warm} />
      {glassCab(sbX + 28, base - sbH2, 30)}
    </g>
  );

  // ── 3. Canister tower — rounded-top stack with lit "tile" bands ──
  const c1 = CONTENT_W * 0.295;
  const cH = 232;
  const cTop = base - cH;
  const canister = (
    <g>
      <path d={`M ${c1 - 40} ${base} L ${c1 - 40} ${cTop + 40} A 40 40 0 0 1 ${c1 + 40} ${cTop + 40} L ${c1 + 40} ${base} Z`} fill={`url(#${bodyId})`} />
      <path d={`M ${c1 - 40} ${base} L ${c1 - 40} ${cTop + 40} A 40 40 0 0 1 ${c1} ${cTop}`} fill="none" stroke={rim} strokeWidth={2.5} />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={c1 - 34} y={cTop + 28 + i * 22} width={68} height={5} fill={lit} opacity={isNight ? 0.7 : 0.45} />
      ))}
      {glassCab(c1, cTop, 50)}
    </g>
  );

  // ── 4. Diagrid hero spire — tallest, tapered, X-braced ──
  const dsX = CONTENT_W * 0.4;
  const dsH = 322;
  const dsTop = base - dsH;
  const halfB = 26, halfT = 9;
  const hwAt = (t: number) => halfB + (halfT - halfB) * t;
  const dsPts = `${dsX - halfB} ${base}, ${dsX - halfT} ${dsTop}, ${dsX + halfT} ${dsTop}, ${dsX + halfB} ${base}`;
  const diagrid = (
    <g>
      <polygon points={dsPts} fill={`url(#${bodyId})`} />
      {Array.from({ length: 9 }, (_, i) => {
        const t0 = i / 9, t1 = (i + 1) / 9;
        const y0 = base - dsH * t0, y1 = base - dsH * t1;
        const hw0 = hwAt(t0), hw1 = hwAt(t1);
        return (
          <g key={i}>
            <line x1={dsX - hw0} y1={y0} x2={dsX + hw1} y2={y1} stroke={lit} strokeWidth={1.4} opacity={isNight ? 0.65 : 0.38} />
            <line x1={dsX + hw0} y1={y0} x2={dsX - hw1} y2={y1} stroke={lit} strokeWidth={1.4} opacity={isNight ? 0.65 : 0.38} />
          </g>
        );
      })}
      <polyline points={dsPts} fill="none" stroke={rim} strokeWidth={2} strokeLinejoin="round" />
      {glassCab(dsX, dsTop + 10, 30)}
      <rect x={dsX - 1.5} y={dsTop - 50} width={3} height={50} fill={f} />
      <circle cx={dsX} cy={dsTop - 52} r={3.5} fill={warm} />
    </g>
  );

  // ── 5. Observation-ring tower — twin legs + a glowing ring + spire ──
  const c2 = CONTENT_W * 0.5;
  const ringY = base - 250;
  const ring = (
    <g>
      <rect x={c2 - 16} y={ringY} width={9} height={base - ringY} fill={f} />
      <rect x={c2 + 7} y={ringY} width={9} height={base - ringY} fill={f} />
      <rect x={c2 - 16} y={base - 120} width={32} height={7} fill={f} />
      <circle cx={c2} cy={ringY - 6} r={46} fill="none" stroke={f} strokeWidth={16} />
      <circle cx={c2} cy={ringY - 6} r={46} fill="none" stroke={rim} strokeWidth={3} />
      <circle cx={c2} cy={ringY - 6} r={36} fill="none" stroke={lit} strokeWidth={2} opacity={isNight ? 0.8 : 0.4} />
      <rect x={c2 - 1.5} y={ringY - 92} width={3} height={40} fill={f} />
      <circle cx={c2} cy={ringY - 94} r={3.5} fill={warm} />
    </g>
  );

  // ── 6. Geodesic biosphere dome (waterfront) ──
  const gdX = CONTENT_W * 0.68;
  const gdR = 78;
  const merN = 8;
  const nodeUV: [number, number][] = [[-0.5, 0.4], [-0.2, 0.66], [0.16, 0.5], [0.42, 0.34], [-0.04, 0.85]];
  const geo = (
    <g>
      {/* outer glow */}
      <ellipse cx={gdX} cy={base - gdR * 0.5} rx={gdR + 16} ry={gdR * 0.72} fill={`url(#${glowId})`} />
      {/* podium it sits on */}
      <rect x={gdX - gdR - 8} y={base - 14} width={(gdR + 8) * 2} height={16} fill={f} />
      <rect x={gdX - gdR - 8} y={base - 14} width={(gdR + 8) * 2} height={3} fill={rim} opacity={0.5} />
      {/* glass dome body (gradient) + lit interior */}
      <path d={`M ${gdX - gdR} ${base} A ${gdR} ${gdR} 0 0 1 ${gdX + gdR} ${base} Z`} fill={`url(#${bodyId})`} />
      <ellipse cx={gdX} cy={base} rx={gdR * 0.74} ry={gdR * 0.5} fill={`url(#${glassId})`} opacity={isNight ? 0.55 : 0.4} />
      {/* meridians */}
      {Array.from({ length: merN + 1 }, (_, i) => {
        const bx = gdX - gdR + (2 * gdR) * (i / merN);
        return <line key={`m${i}`} x1={bx} y1={base} x2={gdX} y2={base - gdR} stroke={lit} strokeWidth={0.9} opacity={isNight ? 0.45 : 0.28} />;
      })}
      {/* parallels */}
      {[0.22, 0.44, 0.66, 0.85].map((v, i) => {
        const ry = gdR * v;
        const dx = Math.sqrt(Math.max(0, gdR * gdR - ry * ry));
        return <path key={`p${i}`} d={`M ${gdX - dx} ${base - ry} A ${gdR} ${gdR} 0 0 1 ${gdX + dx} ${base - ry}`} fill="none" stroke={lit} strokeWidth={0.9} opacity={isNight ? 0.45 : 0.28} />;
      })}
      {/* glowing geodesic nodes */}
      {nodeUV.map(([u, v], i) => {
        const ry = gdR * v;
        const dx = Math.sqrt(Math.max(0, gdR * gdR - ry * ry));
        return <circle key={`n${i}`} cx={gdX + dx * u} cy={base - ry} r={3.4} fill={`url(#${glassId})`} opacity={0.85} />;
      })}
      {/* rim highlight + apex finial */}
      <path d={`M ${gdX - gdR} ${base} A ${gdR} ${gdR} 0 0 1 ${gdX + gdR} ${base}`} fill="none" stroke={rim} strokeWidth={2} />
      <rect x={gdX - 1.5} y={base - gdR - 12} width={3} height={12} fill={f} />
      <circle cx={gdX} cy={base - gdR - 14} r={3} fill={warm} />
    </g>
  );

  // ── 7. Sail tower — curved LC sail with a lit leading edge ──
  const c3 = CONTENT_W * 0.775;
  const sH = 258;
  const sail = (
    <g>
      <path d={`M ${c3 + 26} ${base - sH - 4} C ${c3 - 34} ${base - sH + 60} ${c3 - 52} ${base - 92} ${c3 - 44} ${base} L ${c3 + 24} ${base} Z`} fill={rim} opacity={0.1} />
      <path d={`M ${c3 + 22} ${base} L ${c3 + 28} ${base} L ${c3 + 30} ${base - sH} L ${c3 + 24} ${base - sH} Z`} fill={f} />
      <path d={`M ${c3 + 28} ${base - sH + 4} C ${c3 - 28} ${base - sH + 64} ${c3 - 46} ${base - 92} ${c3 - 38} ${base} L ${c3 + 24} ${base} Z`} fill={`url(#${bodyId})`} />
      <path d={`M ${c3 + 28} ${base - sH + 4} C ${c3 - 28} ${base - sH + 64} ${c3 - 46} ${base - 92} ${c3 - 38} ${base}`} fill="none" stroke={rim} strokeWidth={2.4} />
      {[0.3, 0.5, 0.7, 0.86].map((t, i) => (
        <rect key={i} x={c3 - 34 + i * 15} y={base - sH * t} width={2.5} height={sH * 0.14} fill={lit} opacity={0.5} />
      ))}
      <circle cx={c3 + 27} cy={base - sH + 4} r={4} fill={rim} />
    </g>
  );

  // ── 8. Arched gateway tower — a tall lit portal through the base ──
  const agX = CONTENT_W * 0.9;
  const agW = 92, agH = 234, legW = 26, lintelH = 74;
  const lintelBot = base - agH + lintelH;
  const inL = agX - agW / 2 + legW, inR = agX + agW / 2 - legW;
  const arch = (
    <g>
      {/* lintel block */}
      <rect x={agX - agW / 2} y={base - agH} width={agW} height={lintelH} fill={`url(#${bodyId})`} />
      {/* legs */}
      <rect x={agX - agW / 2} y={lintelBot} width={legW} height={agH - lintelH} fill={`url(#${bodyId})`} />
      <rect x={agX + agW / 2 - legW} y={lintelBot} width={legW} height={agH - lintelH} fill={`url(#${bodyId})`} />
      {glassCab(agX, base - agH, 34)}
      {/* arched portal underside hanging from the lintel */}
      <path d={`M ${inL} ${lintelBot} Q ${agX} ${lintelBot + 46} ${inR} ${lintelBot} Z`} fill={f} />
      <path d={`M ${inL} ${lintelBot} Q ${agX} ${lintelBot + 46} ${inR} ${lintelBot}`} fill="none" stroke={rim} strokeWidth={2} opacity={0.8} />
      <rect x={agX - agW / 2} y={base - agH} width={2.5} height={agH} fill={rim} opacity={0.6} />
      {litWindows(agX - agW / 2, agW, lintelH, base - agH, palette, rand, isNight)}
      <circle cx={agX} cy={base - agH - 6} r={3.5} fill={warm} />
    </g>
  );

  // ── LessonCaptain Stadium — a civic arena with the LC logo on its scoreboard ──
  const stadX = CONTENT_W * 0.46;
  const stW = 84;
  const stH = 56;
  const scrW = 36, scrH = 48;
  const scrCy = base - stH - 30 - 36;
  const scrTop = scrCy - scrH / 2;
  const stadium = (
    <g>
      <ellipse cx={stadX} cy={base - stH} rx={stW + 16} ry={22} fill={`url(#${glowId})`} />
      {/* bowl facade */}
      <path d={`M ${stadX - stW} ${base} L ${stadX - stW} ${base - stH} Q ${stadX} ${base - stH - 32} ${stadX + stW} ${base - stH} L ${stadX + stW} ${base} Z`} fill={`url(#${bodyId})`} />
      {/* open roof oval (lit pitch within) */}
      <ellipse cx={stadX} cy={base - stH} rx={stW * 0.82} ry={15} fill={`url(#${glassId})`} />
      {/* facade lit ribs */}
      {Array.from({ length: 11 }, (_, i) => {
        const fx = stadX - stW + 10 + i * ((stW * 2 - 20) / 10);
        return <rect key={i} x={fx} y={base - stH + 6} width={2} height={stH - 10} fill={lit} opacity={isNight ? 0.5 : 0.3} />;
      })}
      {/* cantilever roof rim */}
      <path d={`M ${stadX - stW} ${base - stH} Q ${stadX} ${base - stH - 32} ${stadX + stW} ${base - stH}`} fill="none" stroke={rim} strokeWidth={2} />
      <path d={`M ${stadX - stW} ${base - stH} Q ${stadX} ${base - stH - 32} ${stadX + stW} ${base - stH}`} fill="none" stroke={lit} strokeWidth={5} opacity={0.25} />
      {/* scoreboard supports + glowing screen + LC logo */}
      <rect x={stadX - 22} y={scrCy} width={3} height={40} fill={f} />
      <rect x={stadX + 19} y={scrCy} width={3} height={40} fill={f} />
      <rect x={stadX - scrW / 2 - 5} y={scrTop - 5} width={scrW + 10} height={scrH + 10} rx={7} fill={`url(#${glowId})`} />
      <rect x={stadX - scrW / 2} y={scrTop} width={scrW} height={scrH} rx={5} fill="#0b1830" />
      <rect x={stadX - scrW / 2} y={scrTop} width={scrW} height={scrH} rx={5} fill="none" stroke={rim} strokeWidth={1.5} />
      <g transform={`translate(${stadX} ${scrCy}) scale(0.075) translate(-259,-259)`}>
        <path d={LC_L_MARK} fill="#aee0ff" />
      </g>
    </g>
  );

  // ── Sky-tram — a cable between the observation-ring tower and a mountainside
  //    station, with a pod riding it (so it goes somewhere at both ends). ──
  const trA = { x: c2, y: ringY - 6 };          // docks at the observation ring
  const trB = { x: apexX + 84, y: base - 252 }; // mountainside station
  const pod = (
    <g transform={`translate(${trA.x} ${trA.y})`}>
      <line x1={0} y1={-9} x2={0} y2={-3} stroke="rgba(150,200,255,0.6)" strokeWidth={1.2} />
      <rect x={-7} y={-3} width={14} height={9} rx={2} fill={fHi} />
      <rect x={-7} y={-3} width={14} height={2.5} fill={lit} />
    </g>
  );
  const peakStation = (
    <g>
      {/* platform planted on the mountainside */}
      <rect x={trB.x - 14} y={trB.y - 6} width={28} height={18} fill={fHi} />
      <rect x={trB.x - 14} y={trB.y - 6} width={28} height={3} fill={rim} />
      <rect x={trB.x - 11} y={trB.y} width={22} height={10} fill={lit} opacity={0.55} />
      {/* angled struts anchoring it into the slope */}
      <line x1={trB.x - 10} y1={trB.y + 12} x2={trB.x - 17} y2={trB.y + 44} stroke={f} strokeWidth={3} />
      <line x1={trB.x + 10} y1={trB.y + 12} x2={trB.x + 17} y2={trB.y + 44} stroke={f} strokeWidth={3} />
      <circle cx={trB.x} cy={trB.y - 9} r={2.5} fill={warm} />
    </g>
  );
  const skyTram = (
    <g>
      {peakStation}
      <line x1={trA.x} y1={trA.y} x2={trB.x} y2={trB.y} stroke="rgba(150,200,255,0.45)" strokeWidth={1.2} />
      {ambient ? (
        <motion.g
          animate={{ x: [0, trB.x - trA.x, 0], y: [0, trB.y - trA.y, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {pod}
        </motion.g>
      ) : (
        <g transform={`translate(${(trB.x - trA.x) * 0.5} ${(trB.y - trA.y) * 0.5})`}>{pod}</g>
      )}
    </g>
  );

  // ── Drifting light drones + a slow airship + a pulsing summit beacon ──
  const orbDefs = [
    { x: CONTENT_W * 0.32, y: base - 356, d: 5.4 },
    { x: CONTENT_W * 0.74, y: base - 392, d: 6.6 },
    { x: CONTENT_W * 0.47, y: base - 432, d: 6.0 },
    { x: CONTENT_W * 0.12, y: base - 372, d: 5.8 },
    { x: CONTENT_W * 0.9, y: base - 350, d: 6.3 },
    { x: CONTENT_W * 0.6, y: base - 410, d: 5.6 },
  ];
  const orbs = orbDefs.map((o, i) =>
    ambient ? (
      <motion.circle
        key={i} cx={o.x} cy={o.y} r={3} fill={rim}
        animate={{ cy: [o.y, o.y - 16, o.y], opacity: [0.4, 0.95, 0.4] }}
        transition={{ duration: o.d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.8 }}
      />
    ) : (
      <circle key={i} cx={o.x} cy={o.y} r={2.5} fill={rim} opacity={0.6} />
    ),
  );

  // Nose leads to the RIGHT (matches the left→right drift); tail fin trails left.
  const airshipBody = (
    <g>
      <ellipse cx={0} cy={0} rx={34} ry={12} fill={f} />
      <ellipse cx={0} cy={0} rx={34} ry={12} fill="none" stroke={rim} strokeWidth={1} opacity={0.5} />
      {/* tail fins on the left (trailing edge) */}
      <polygon points="-28 -4, -44 -10, -44 2, -30 6" fill={f} />
      <polygon points="-30 -2, -42 -2, -42 2, -30 4" fill={fHi} />
      {/* gondola + nav light */}
      <rect x={-7} y={10} width={14} height={5} rx={2} fill={fHi} />
      <circle cx={0} cy={16} r={2} fill={warm} />
      {/* nose accent on the right (leading edge) */}
      <circle cx={30} cy={0} r={2.5} fill={rim} opacity={0.7} />
      {/* trailing "LESSON CAPTAIN" banner (flutters gently) */}
      <line x1={-44} y1={1} x2={-58} y2={4} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'right center' }}
        animate={{ rotate: [-1.5, 1.5, -1.5], skewX: [0, -4, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M -58 -7 L -188 -7 L -177 4 L -188 14 L -58 14 Z" fill="rgba(43,118,194,0.86)" />
        <path d="M -58 -7 L -188 -7 L -177 4 L -188 14 L -58 14 Z" fill="none" stroke="rgba(234,244,255,0.35)" strokeWidth={1} />
        <text
          x={-121} y={7} textAnchor="middle" fontSize={11} fontWeight={700}
          letterSpacing={1.6} fill="#eaf4ff"
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        >
          LESSON CAPTAIN
        </text>
      </motion.g>
    </g>
  );
  // Start/end fully off the true CANVAS edges (skyline is offset by BLEED_X), with
  // extra lead for the trailing banner, so it always enters from the screen edge —
  // never popping in mid-air — at any viewport width up to 32:9.
  const shipStart = -BLEED_X - 220;
  const shipEnd = VIEWBOX.w - BLEED_X + 300;
  const airship = ambient ? (
    <motion.g
      initial={{ x: shipStart }}
      animate={{ x: shipEnd }}
      transition={{ duration: 56, repeat: Infinity, ease: 'linear' }}
    >
      <g transform={`translate(0 ${base - 366})`}>{airshipBody}</g>
    </motion.g>
  ) : null;

  const summitBeacon = ambient ? (
    <motion.circle
      cx={apexX} cy={hmTy - 4} r={4.5} fill="rgba(255,255,255,0.95)"
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  ) : (
    <circle cx={apexX} cy={hmTy - 4} r={4} fill="rgba(255,255,255,0.9)" />
  );

  // ── Gliding bird flock (flaps + drifts) ──
  const birds = ambient ? (
    <motion.g
      initial={{ x: -30 }}
      animate={{ x: 130 }}
      transition={{ duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
    >
      {[[0, 0], [16, 7], [32, 2], [-16, 7], [-32, 2]].map(([bx, by], i) => {
        const px = CONTENT_W * 0.36 + bx;
        const py = base - 372 + by;
        return (
          <motion.path
            key={i}
            d={`M ${px} ${py} q 6 -5 12 0 q 6 -5 12 0`}
            fill="none" stroke="rgba(36,48,72,0.7)" strokeWidth={1.8} strokeLinecap="round"
            animate={{ d: [`M ${px} ${py} q 6 -5 12 0 q 6 -5 12 0`, `M ${px} ${py} q 6 -1 12 0 q 6 -1 12 0`] }}
            transition={{ duration: 0.55, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay: (i % 2) * 0.12 }}
          />
        );
      })}
    </motion.g>
  ) : null;

  // ── Twinkling city window lights ──
  const twinklePos: [number, number][] = [
    [240, base - 150], [470, base - 120], [610, base - 96], [690, base - 170],
    [880, base - 130], [1130, base - 160], [1300, base - 110], [1460, base - 150],
    [70, base - 110], [1560, base - 100],
  ];
  const twinkles = ambient
    ? twinklePos.map(([tx, ty], i) => (
        <motion.rect
          key={i} x={tx} y={ty} width={3.2} height={3.2} fill={i % 3 === 0 ? warm : lit}
          animate={{ opacity: [0.15, 0.95, 0.15] }}
          transition={{ duration: 2.2 + (i % 4) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.4 }}
        />
      ))
    : null;

  // ── High-altitude jet with a contrail + blinking nav light (faster, higher) ──
  const jet = ambient ? (
    <motion.g
      initial={{ x: spanL }}
      animate={{ x: spanR }}
      transition={{ duration: 26, repeat: Infinity, ease: 'linear', delay: 5 }}
    >
      <g transform={`translate(0 ${base - 472})`}>
        <rect x={-30} y={-0.6} width={30} height={1.4} rx={0.7} fill="rgba(220,235,255,0.45)" />
        <polygon points="0 0, -8 -2.4, -8 2.4" fill={fHi} />
        <motion.circle cx={1} cy={0} r={1.6} fill={warm} animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1, repeat: Infinity }} />
      </g>
    </motion.g>
  ) : null;

  return (
    <g aria-hidden data-skyline="homebase" data-id={idPrefix}>
      {defs}
      {heroMassif}
      {summitBeacon}
      {waterfall}
      {cityFill}
      {helix}
      {skybridge}
      {canister}
      {diagrid}
      {ring}
      {geo}
      {sail}
      {arch}
      {stadium}
      {skyTram}
      {twinkles}
      {orbs}
      {birds}
      {jet}
      {airship}
    </g>
  );
}

// ── New York — Art-Deco supertall skyline ────────────────────────────────────
// A dense run of setback towers anchored by the Empire State (stepped + mast) and
// a Chrysler-style terraced crown. Pairs with the Statue of Liberty (foreground).
function NycSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 38, 80);
    const h = randRange(rand, 130, 300);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.5) {
      const sw = w * 0.62;
      const sh = randRange(rand, 22, 52);
      parts.push(<rect key="s" x={x + (w - sw) / 2} y={top - sh} width={sw} height={sh} fill={f} />);
      if (rand() > 0.55) parts.push(<rect key="m" x={x + w / 2 - 1.5} y={top - sh - 24} width={3} height={24} fill={f} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 12);
    k += 1;
  }
  const ex = CONTENT_W * 0.45;
  const empire = (
    <g>
      <rect x={ex - 30} y={base - 300} width={60} height={300} fill={f} />
      <rect x={ex - 22} y={base - 342} width={44} height={42} fill={f} />
      <rect x={ex - 14} y={base - 374} width={28} height={32} fill={f} />
      <rect x={ex - 8} y={base - 396} width={16} height={22} fill={f} />
      <rect x={ex - 2} y={base - 456} width={4} height={60} fill={f} />
      <circle cx={ex} cy={base - 458} r={3.5} fill={palette.windowWarm} />
      {litWindows(ex - 30, 60, 296, base - 296, palette, rand, isNight)}
    </g>
  );
  const cx2 = CONTENT_W * 0.6;
  const chrysler = (
    <g>
      <rect x={cx2 - 22} y={base - 258} width={44} height={258} fill={f} />
      {[0, 1, 2, 3].map((i) => {
        const hw = 22 - i * 5;
        const yy = base - 258 - i * 18;
        return <path key={i} d={`M ${cx2 - hw} ${yy} Q ${cx2} ${yy - 22} ${cx2 + hw} ${yy} Z`} fill={f} />;
      })}
      <rect x={cx2 - 1.5} y={base - 372} width={3} height={42} fill={f} />
      <circle cx={cx2} cy={base - 374} r={3} fill={palette.windowWarm} />
      {litWindows(cx2 - 22, 44, 254, base - 254, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="nyc" data-id={idPrefix}>
      {items}
      {empire}
      {chrysler}
    </g>
  );
}

// ── London — historic frontage + The Shard & The Gherkin ─────────────────────
// Low historic blocks (pitched roofs / domes) with the modern cluster rising
// behind. Pairs with Big Ben (foreground).
function LondonSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 58, 118);
    const h = randRange(rand, 80, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    const roll = rand();
    if (roll > 0.62) parts.push(<polygon key="r" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 14, 28)}, ${x + w} ${top}`} fill={f} />);
    else if (roll > 0.42) parts.push(<path key="d" d={`M ${x + w * 0.32} ${top} A ${w * 0.18} ${w * 0.18} 0 0 1 ${x + w * 0.68} ${top} Z`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  // The Shard
  const sx = CONTENT_W * 0.5;
  const sTop = base - 340;
  const shard = (
    <g>
      {/* clean glass silhouette + a shaded right face for form */}
      <polygon points={`${sx - 30} ${base}, ${sx - 6} ${sTop + 20}, ${sx + 6} ${sTop + 20}, ${sx + 30} ${base}`} fill={f} />
      <polygon points={`${sx} ${base}, ${sx + 30} ${base}, ${sx + 6} ${sTop + 20}, ${sx} ${sTop + 20}`} fill="rgba(0,0,0,0.18)" />
      {/* fractured glass top */}
      <polygon points={`${sx - 6} ${sTop + 20}, ${sx - 3} ${sTop - 14}, ${sx} ${sTop + 18}`} fill={f} />
      <polygon points={`${sx} ${sTop + 18}, ${sx + 2} ${sTop - 6}, ${sx + 6} ${sTop + 20}`} fill={f} />
      {/* subtle glass mullions (no window boxes) */}
      {[-18, -10, -2, 6, 14].map((m, i) => (
        <line key={i} x1={sx + m * 0.75} y1={base} x2={sx + m * 0.12} y2={sTop + 24} stroke={palette.landmarkAccent} strokeWidth={1} opacity={0.26} />
      ))}
    </g>
  );
  // The Gherkin
  const gx = CONTENT_W * 0.64;
  const gTop = base - 196;
  const gherkin = (
    <g>
      <path d={`M ${gx - 26} ${base} C ${gx - 30} ${base - 96} ${gx - 22} ${gTop + 8} ${gx} ${gTop - 12} C ${gx + 22} ${gTop + 8} ${gx + 30} ${base - 96} ${gx + 26} ${base} Z`} fill={f} />
      {[-60, -20, 20, 60, 100].map((o, i) => (
        <path key={i} d={`M ${gx - 26} ${base - 30 - i * 8} L ${gx} ${base - 70 - i * 8}`} stroke={palette.landmarkAccent} strokeWidth={1} opacity={0.22} fill="none" />
      ))}
      <circle cx={gx} cy={gTop - 16} r={4} fill={f} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="london" data-id={idPrefix}>
      {items}
      {shard}
      {gherkin}
    </g>
  );
}

// ── Dubai — supertall glass towers + Burj Al Arab sail ────────────────────────
// Pairs with the Burj Khalifa (foreground).
function DubaiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 64);
    const h = randRange(rand, 140, 330);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.5) parts.push(<polygon key="t" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 20, 46)}, ${x + w} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 6, 14);
    k += 1;
  }
  // Burj Al Arab — the sail
  const sx = CONTENT_W * 0.58;
  const sH = 262;
  const goldS = 'rgb(255,206,84)';
  const sail = (
    <g>
      {/* soft golden glow */}
      <path d={`M ${sx + 34} ${base - sH - 6} C ${sx - 40} ${base - sH + 60} ${sx - 60} ${base - 92} ${sx - 52} ${base} L ${sx + 30} ${base} Z`} fill={goldS} opacity={0.12} />
      {/* mast + sail body */}
      <path d={`M ${sx - 2} ${base} L ${sx + 2} ${base} L ${sx + 30} ${base - sH} L ${sx + 24} ${base - sH} Z`} fill={f} />
      <path d={`M ${sx + 26} ${base - sH + 4} C ${sx - 30} ${base - sH + 64} ${sx - 48} ${base - 92} ${sx - 40} ${base} L ${sx + 24} ${base} Z`} fill={f} />
      {/* bright gold outline */}
      <path d={`M ${sx + 26} ${base - sH + 4} C ${sx - 30} ${base - sH + 64} ${sx - 48} ${base - 92} ${sx - 40} ${base}`} fill="none" stroke={goldS} strokeWidth={2.2} />
      <path d={`M ${sx + 26} ${base - sH + 4} L ${sx + 24} ${base}`} stroke={goldS} strokeWidth={2} opacity={0.8} />
      {/* lit accents up the sail */}
      {[0.28, 0.46, 0.64, 0.82].map((t, i) => (
        <rect key={i} x={sx - 36 + i * 16} y={base - sH * t} width={2.5} height={sH * 0.16} fill={goldS} opacity={0.55} />
      ))}
      {/* mast-tip beacon */}
      <circle cx={sx + 24} cy={base - sH + 4} r={4.5} fill={goldS} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="dubai" data-id={idPrefix}>
      {items}
      {sail}
    </g>
  );
}

// ── Singapore — CBD towers + Marina Bay Sands ────────────────────────────────
// Pairs with the Supertree (foreground).
function SingaporeSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 34, 64);
    const h = randRange(rand, 120, 250);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  // Marina Bay Sands — three tapering towers + the boat SkyPark. A distinct
  // light steel tone (not the dark building silhouette) so it stands out.
  const mx = CONTENT_W * 0.56;
  const mH = 208;
  const warm = palette.windowWarm;
  const mbsFill = isNight ? 'rgb(120,140,170)' : 'rgb(168,186,210)';
  const mbs = (
    <g>
      {/* soft glow so it stands out */}
      <ellipse cx={mx + 6} cy={base - mH + 12} rx={130} ry={76} fill={warm} opacity={0.1} />
      {[mx - 60, mx, mx + 60].map((tx, i) => {
        // the three towers lean inward toward the centre tower
        const topX = tx + (mx - tx) * 0.07;
        return (
          <g key={i}>
            <polygon points={`${tx - 18} ${base}, ${topX - 9} ${base - mH}, ${topX + 9} ${base - mH}, ${tx + 18} ${base}`} fill={mbsFill} />
            <polygon points={`${tx} ${base}, ${topX} ${base - mH}, ${topX + 9} ${base - mH}, ${tx + 18} ${base}`} fill="rgba(0,0,0,0.2)" />
            {/* lit floor bands */}
            {Array.from({ length: 10 }, (_, r) => (
              <rect key={r} x={topX - 8} y={base - 24 - r * 18} width={16} height={2.5} fill={warm} opacity={0.55} />
            ))}
          </g>
        );
      })}
      {/* boat-shaped SkyPark (right cantilever) with a lit edge */}
      <path d={`M ${mx - 80} ${base - mH - 6} L ${mx + 86} ${base - mH - 6} Q ${mx + 116} ${base - mH - 10} ${mx + 110} ${base - mH - 22} L ${mx - 80} ${base - mH - 22} Z`} fill={mbsFill} />
      <rect x={mx - 80} y={base - mH - 10} width={196} height={2.5} fill="rgb(255,224,150)" opacity={0.85} />
      {/* infinity-pool edge + rooftop garden trees */}
      <rect x={mx - 70} y={base - mH - 21} width={118} height={2} fill="rgba(150,210,235,0.7)" />
      {[-58, -42, 58, 72, 88].map((o, i) => (
        <circle key={i} cx={mx + o} cy={base - mH - 24} r={3} fill={palette.foliage} />
      ))}
    </g>
  );
  return (
    <g aria-hidden data-skyline="singapore" data-id={idPrefix}>
      {items}
      {mbs}
    </g>
  );
}

// ── Sydney — Harbour Bridge + CBD ────────────────────────────────────────────
// The steel through-arch "coat hanger" with stone pylons + hangers, a CBD tower
// line, and Sydney Tower's golden turret. Pairs with the Opera House (foreground).
function SydneySkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 34, 66);
    const h = randRange(rand, 110, 240);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  // Sydney Tower (golden turret)
  const stx = CONTENT_W * 0.62;
  const sydneyTower = (
    <g>
      <rect x={stx - 4} y={base - 286} width={8} height={286} fill={f} />
      <path d={`M ${stx - 20} ${base - 300} L ${stx + 20} ${base - 300} L ${stx + 13} ${base - 270} L ${stx - 13} ${base - 270} Z`} fill={f} />
      <rect x={stx - 20} y={base - 304} width={40} height={5} fill="rgb(255,206,84)" opacity={0.7} />
      <rect x={stx - 1.5} y={base - 344} width={3} height={44} fill={f} />
      <circle cx={stx} cy={base - 346} r={3} fill="rgb(255,206,84)" />
    </g>
  );
  // Harbour Bridge
  const bx = CONTENT_W * 0.26;
  const bw = 186;
  const deckY = base - 28;
  const rise = 122;
  const archAt = (hx: number) => deckY - rise * (1 - ((hx - bx) / bw) ** 2);
  const steel = 'rgb(104,116,132)';
  const steelLit = 'rgba(255,224,182,0.75)'; // dawn catch-light on the arch
  const bridge = (
    <g>
      <rect x={bx - bw - 11} y={base - 104} width={22} height={104} fill={steel} />
      <rect x={bx + bw - 11} y={base - 104} width={22} height={104} fill={steel} />
      {Array.from({ length: 13 }, (_, i) => {
        const hx = bx - bw + (i + 0.5) * ((2 * bw) / 13);
        return <line key={i} x1={hx} y1={deckY} x2={hx} y2={archAt(hx)} stroke={steel} strokeWidth={1.5} opacity={0.75} />;
      })}
      <path d={`M ${bx - bw} ${deckY} Q ${bx} ${deckY - rise + 18} ${bx + bw} ${deckY}`} fill="none" stroke={steel} strokeWidth={5} opacity={0.85} />
      <path d={`M ${bx - bw} ${deckY} Q ${bx} ${deckY - rise - 28} ${bx + bw} ${deckY}`} fill="none" stroke={steel} strokeWidth={11} />
      <path d={`M ${bx - bw} ${deckY - 3} Q ${bx} ${deckY - rise - 31} ${bx + bw} ${deckY - 3}`} fill="none" stroke={steelLit} strokeWidth={2.5} />
      <rect x={bx - bw - 13} y={deckY} width={2 * bw + 26} height={7} fill={steel} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="sydney" data-id={idPrefix}>
      {items}
      {sydneyTower}
      {bridge}
    </g>
  );
}

// ── Hong Kong — Victoria Peak + dense harbour skyline + Bank of China ────────
// Pairs with the harbour junk (foreground).
function HongKongSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const peak = (
    <g>
      <path d={`M ${CONTENT_W * 0.48} ${base} Q ${CONTENT_W * 0.72} ${base - 290} ${CONTENT_W * 0.9} ${base - 150} Q ${CONTENT_W} ${base - 110} ${CONTENT_W + 40} ${base} Z`} fill="rgba(40,52,46,0.95)" />
      <path d={`M ${CONTENT_W * 0.72} ${base - 290} Q ${CONTENT_W * 0.82} ${base - 200} ${CONTENT_W * 0.9} ${base - 150} L ${CONTENT_W * 0.78} ${base - 150} Z`} fill="rgba(0,0,0,0.16)" />
    </g>
  );
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 22, 50);
    const h = randRange(rand, 140, 320);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.6) parts.push(<rect key="m" x={x + w / 2 - 1} y={top - randRange(rand, 14, 40)} width={2} height={40} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  // Bank of China Tower — asymmetric prisms + X bracing + antennas
  const bx = CONTENT_W * 0.4;
  const bocH = 356;
  const litEdge = 'rgba(180,232,255,0.9)'; // cool lit glass edge
  const bocPts = `${bx - 24} ${base}, ${bx - 24} ${base - bocH + 80}, ${bx} ${base - bocH}, ${bx + 24} ${base - bocH + 168}, ${bx + 24} ${base}`;
  const boc = (
    <g>
      {/* glow */}
      <polygon points={`${bx - 31} ${base}, ${bx - 31} ${base - bocH + 80}, ${bx} ${base - bocH - 8}, ${bx + 31} ${base - bocH + 168}, ${bx + 31} ${base}`} fill={litEdge} opacity={0.12} />
      <polygon points={bocPts} fill={f} />
      {/* lit X bracing */}
      {[0, 1, 2, 3].map((i) => {
        const y0 = base - i * 80;
        const y1 = base - (i + 1) * 80;
        return (
          <g key={i}>
            <line x1={bx - 24} y1={y0} x2={bx + 24} y2={y1} stroke="rgba(150,210,240,0.7)" strokeWidth={1.5} />
            <line x1={bx + 24} y1={y0} x2={bx - 24} y2={y1} stroke="rgba(150,210,240,0.7)" strokeWidth={1.5} />
          </g>
        );
      })}
      {/* lit prism edges */}
      <polyline points={bocPts} fill="none" stroke={litEdge} strokeWidth={2} strokeLinejoin="round" />
      {/* antennas + beacon */}
      <rect x={bx - 1.5} y={base - bocH - 48} width={3} height={48} fill={litEdge} />
      <circle cx={bx} cy={base - bocH - 50} r={3.5} fill="rgba(255,255,255,0.95)" />
    </g>
  );
  return (
    <g aria-hidden data-skyline="hongkong" data-id={idPrefix}>
      {peak}
      {items}
      {boc}
    </g>
  );
}

// ── Moscow — Stalinist "Seven Sisters" over the city ─────────────────────────
// Pairs with St Basil's (foreground).
function MoscowSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 50, 100);
    const h = randRange(rand, 80, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.82) {
      // occasional green onion dome
      parts.push(<ellipse key="o" cx={x + w / 2} cy={top} rx={9} ry={16} fill="rgba(74,120,96,0.9)" />);
      parts.push(<rect key="oc" x={x + w / 2 - 1} y={top - 24} width={2} height={10} fill={f} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  const stone = 'rgb(156,154,142)'; // pale Stalinist stone — stands out vs the dark city
  const stoneShade = 'rgba(0,0,0,0.2)';
  const tier = (tx: number, ty: number, tw: number, th: number, kk: string) => (
    <g key={kk}>
      <rect x={tx} y={ty} width={tw} height={th} fill={stone} />
      <rect x={tx + tw * 0.62} y={ty} width={tw * 0.38} height={th} fill={stoneShade} />
    </g>
  );
  const sister = (cx: number, sc: number, key: string) => {
    const H = 300 * sc;
    return (
      <g key={key}>
        {tier(cx - 50 * sc, base - H * 0.4, 100 * sc, H * 0.4, 't1')}
        {tier(cx - 36 * sc, base - H * 0.62, 72 * sc, H * 0.22, 't2')}
        {tier(cx - 24 * sc, base - H * 0.8, 48 * sc, H * 0.18, 't3')}
        {tier(cx - 14 * sc, base - H * 0.92, 28 * sc, H * 0.12, 't4')}
        <polygon points={`${cx - 11 * sc} ${base - H * 0.92}, ${cx} ${base - H - 30 * sc}, ${cx + 11 * sc} ${base - H * 0.92}`} fill={stone} />
        <polygon points={`${cx} ${base - H - 30 * sc}, ${cx + 11 * sc} ${base - H * 0.92}, ${cx} ${base - H * 0.92}`} fill={stoneShade} />
        <rect x={cx - 1.5} y={base - H - 30 * sc - 24} width={3} height={24} fill={stone} />
        <circle cx={cx} cy={base - H - 30 * sc - 26} r={4} fill="rgba(224,62,52,1)" />
        {litWindows(cx - 50 * sc, 100 * sc, H * 0.4, base - H * 0.4, palette, rand, isNight)}
      </g>
    );
  };
  return (
    <g aria-hidden data-skyline="moscow" data-id={idPrefix}>
      {items}
      {sister(CONTENT_W * 0.44, 1, 's1')}
      {sister(CONTENT_W * 0.66, 0.8, 's2')}
    </g>
  );
}

// ── Istanbul — the horizon of domes + minarets ───────────────────────────────
// Pairs with the foreground grand mosque.
function IstanbulSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 40, 82);
    const h = randRange(rand, 58, 120);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.72) parts.push(<polygon key="r" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 10, 20)}, ${x + w} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  const stone = 'rgb(150,146,132)'; // pale Ottoman stone — stands out vs the dark city
  const stoneShade = 'rgba(0,0,0,0.16)';
  const gold = 'rgba(255,210,120,0.95)';
  const mosque = (cx: number, sc: number, key: string) => {
    const bH = 60 * sc;
    const dR = 36 * sc;
    const drumTop = base - bH - dR * 0.7;
    return (
      <g key={key}>
        <rect x={cx - 50 * sc} y={base - bH} width={100 * sc} height={bH} fill={stone} />
        {/* semi-domes + central dome (shaded right) */}
        <path d={`M ${cx - dR * 1.5} ${base - bH} A ${dR * 0.7} ${dR * 0.7} 0 0 1 ${cx - dR * 0.1} ${base - bH} Z`} fill={stone} />
        <path d={`M ${cx + dR * 0.1} ${base - bH} A ${dR * 0.7} ${dR * 0.7} 0 0 1 ${cx + dR * 1.5} ${base - bH} Z`} fill={stone} />
        <rect x={cx - dR} y={drumTop} width={dR * 2} height={dR * 0.7} fill={stone} />
        <path d={`M ${cx - dR} ${drumTop} A ${dR} ${dR} 0 0 1 ${cx + dR} ${drumTop} Z`} fill={stone} />
        <path d={`M ${cx} ${drumTop - dR} A ${dR} ${dR} 0 0 1 ${cx + dR} ${drumTop} L ${cx} ${drumTop} Z`} fill={stoneShade} />
        {/* gold finial */}
        <rect x={cx - 1.5} y={drumTop - dR - 16} width={3} height={16} fill={gold} />
        <circle cx={cx} cy={drumTop - dR - 18} r={3.2} fill={gold} />
        {/* flanking minarets (stone, gold tips) */}
        {[-58 * sc, 58 * sc].map((mxx, i) => (
          <g key={i}>
            <rect x={cx + mxx - 3 * sc} y={base - bH - 120 * sc} width={6 * sc} height={120 * sc} fill={stone} />
            <rect x={cx + mxx - 5 * sc} y={base - bH - 134 * sc} width={10 * sc} height={6 * sc} fill={stone} />
            <polygon points={`${cx + mxx - 5 * sc} ${base - bH - 134 * sc}, ${cx + mxx} ${base - bH - 160 * sc}, ${cx + mxx + 5 * sc} ${base - bH - 134 * sc}`} fill={stone} />
            <circle cx={cx + mxx} cy={base - bH - 162 * sc} r={2.2 * sc} fill={gold} />
          </g>
        ))}
      </g>
    );
  };
  return (
    <g aria-hidden data-skyline="istanbul" data-id={idPrefix}>
      {items}
      {mosque(CONTENT_W * 0.28, 0.72, 'm3')}
      {mosque(CONTENT_W * 0.72, 0.8, 'm2')}
      {mosque(CONTENT_W * 0.5, 1, 'm1')}
    </g>
  );
}

// ── Berlin — Fernsehturm + Berlin Cathedral ──────────────────────────────────
// Pairs with the Brandenburg Gate (foreground).
function BerlinSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 50, 100);
    const h = randRange(rand, 80, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  // Berlin Cathedral (green dome)
  const cx2 = CONTENT_W * 0.64;
  const cathedral = (
    <g>
      <rect x={cx2 - 40} y={base - 96} width={80} height={96} fill={f} />
      <rect x={cx2 - 22} y={base - 132} width={44} height={36} fill={f} />
      <path d={`M ${cx2 - 24} ${base - 132} A 24 30 0 0 1 ${cx2 + 24} ${base - 132} Z`} fill="rgba(98,142,118,0.92)" />
      <rect x={cx2 - 2} y={base - 180} width={4} height={16} fill="rgba(216,182,92,0.95)" />
      <circle cx={cx2} cy={base - 182} r={3} fill="rgba(216,182,92,0.95)" />
    </g>
  );
  // Fernsehturm (TV Tower) — tapering concrete shaft + steel observation sphere
  // (deck band + facets + the famous pink "cross of light") + antenna beacons.
  const tx = CONTENT_W * 0.4;
  const shaftTop = base - 296;
  const sphereY = base - 322;
  const sphereR = 28;
  const steel = 'rgb(150,164,182)';
  const sphereHi = 'rgba(228,240,252,0.9)';
  const deckWarm = isNight ? 'rgba(255,214,150,0.92)' : 'rgba(255,226,172,0.55)';
  const crossLit = isNight ? 'rgba(255,182,222,0.92)' : 'rgba(255,255,255,0.8)';
  const fernseh = (
    <g>
      {/* tapering concrete shaft (two-tone) */}
      <polygon points={`${tx - 11} ${base}, ${tx - 4} ${shaftTop}, ${tx + 4} ${shaftTop}, ${tx + 11} ${base}`} fill={f} />
      <polygon points={`${tx} ${base}, ${tx} ${shaftTop}, ${tx + 4} ${shaftTop}, ${tx + 11} ${base}`} fill="rgba(0,0,0,0.2)" />
      {/* sphere + shaded crescent + steel rim */}
      <circle cx={tx} cy={sphereY} r={sphereR} fill={steel} />
      <path d={`M ${tx} ${sphereY - sphereR} A ${sphereR} ${sphereR} 0 0 1 ${tx} ${sphereY + sphereR} Z`} fill="rgba(0,0,0,0.18)" />
      <circle cx={tx} cy={sphereY} r={sphereR} fill="none" stroke={sphereHi} strokeWidth={2} />
      {/* meridian facets */}
      {[-0.6, -0.3, 0, 0.3, 0.6].map((m, i) => {
        const ext = Math.sqrt(1 - m * m) * sphereR;
        return <path key={i} d={`M ${tx + m * sphereR} ${sphereY - ext} A ${sphereR * 0.55} ${sphereR} 0 0 1 ${tx + m * sphereR} ${sphereY + ext}`} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />;
      })}
      {/* observation-deck lit window band */}
      <path d={`M ${tx - sphereR} ${sphereY - 2} A ${sphereR} ${sphereR} 0 0 0 ${tx + sphereR} ${sphereY - 2}`} fill="none" stroke={deckWarm} strokeWidth={4} />
      {/* the pink cross of light */}
      <path d={`M ${tx - 16} ${sphereY} L ${tx + 16} ${sphereY} M ${tx} ${sphereY - 16} L ${tx} ${sphereY + 16}`} stroke={crossLit} strokeWidth={2} />
      {/* upper lantern ring + antenna + red beacons */}
      <rect x={tx - 6} y={sphereY - sphereR - 10} width={12} height={10} fill={steel} />
      <polygon points={`${tx - 3} ${sphereY - sphereR - 10}, ${tx - 1.5} ${base - 446}, ${tx + 1.5} ${base - 446}, ${tx + 3} ${sphereY - sphereR - 10}`} fill={f} />
      <rect x={tx - 1.5} y={base - 486} width={3} height={40} fill={f} />
      <circle cx={tx} cy={base - 486} r={3.5} fill="rgba(255,90,90,0.95)" />
      <circle cx={tx} cy={base - 430} r={2.6} fill="rgba(255,90,90,0.8)" />
    </g>
  );
  return (
    <g aria-hidden data-skyline="berlin" data-id={idPrefix}>
      {items}
      {cathedral}
      {fernseh}
    </g>
  );
}

// ── Seoul — N Seoul Tower on Namsan + dense modern towers ────────────────────
// Pairs with the palace gate (foreground).
function SeoulSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const nx = CONTENT_W * 0.72;
  const nH = 190;
  const namsan = (
    <g>
      <path d={`M ${nx - 200} ${base} Q ${nx - 70} ${base - nH} ${nx} ${base - nH} Q ${nx + 90} ${base - nH} ${nx + 200} ${base} Z`} fill="rgba(44,62,48,0.95)" />
      <path d={`M ${nx} ${base - nH} Q ${nx + 90} ${base - nH} ${nx + 200} ${base} L ${nx + 90} ${base} Z`} fill="rgba(0,0,0,0.16)" />
    </g>
  );
  const tB = base - nH;
  const seoulTower = (
    <g>
      <polygon points={`${nx - 8} ${tB}, ${nx - 4} ${tB - 120}, ${nx + 4} ${tB - 120}, ${nx + 8} ${tB}`} fill="rgb(150,160,174)" />
      <path d={`M ${nx - 20} ${tB - 120} L ${nx + 20} ${tB - 120} L ${nx + 14} ${tB - 146} L ${nx - 14} ${tB - 146} Z`} fill="rgb(160,170,184)" />
      <rect x={nx - 18} y={tB - 136} width={36} height={4} fill={palette.windowWarm} opacity={0.75} />
      <rect x={nx - 1.5} y={tB - 204} width={3} height={58} fill="rgb(150,160,174)" />
      <circle cx={nx} cy={tB - 206} r={3.5} fill="rgba(255,90,90,0.95)" />
    </g>
  );
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 28, 58);
    const h = randRange(rand, 120, 260);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="seoul" data-id={idPrefix}>
      {namsan}
      {seoulTower}
      {items}
    </g>
  );
}

// ── Bangkok — Wat Arun prang + modern towers ─────────────────────────────────
// Pairs with the temple roof (foreground).
function BangkokSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  // Vibrant Bangkok neon — gold / pink / teal, bright at night, muted by day.
  const na = isNight ? 0.92 : 0.32;
  const neon = [`rgba(255,196,84,${na})`, `rgba(255,108,150,${na})`, `rgba(86,212,200,${na})`];

  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 32, 66);
    const h = randRange(rand, 150, 340);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.6) parts.push(<rect key="m" x={x + w / 2 - 1} y={top - randRange(rand, 14, 38)} width={2} height={38} fill={f} />);
    // colourful neon sign down an edge (bright at night)
    if (rand() > 0.62) {
      const sx = rand() > 0.5 ? x + 4 : x + w - 8;
      const sh = randRange(rand, h * 0.3, h * 0.55);
      parts.push(<rect key="n" x={sx} y={top + 14} width={4} height={sh} fill={neon[k % 3]} />);
      for (let t = 0; t < sh; t += 16) parts.push(<rect key={`nt${t}`} x={sx - 1.5} y={top + 16 + t} width={7} height={3} fill={neon[(k + 1) % 3]} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }

  // MahaNakhon — the unmistakable pixel-eroded supertall, tallest in the frame.
  const mhx = CONTENT_W * 0.62;
  const mhH = 392;
  const cut = isNight ? 'rgba(120,210,232,0.6)' : 'rgba(0,0,0,0.4)';
  const mahanakhon = (
    <g>
      <rect x={mhx - 30} y={base - mhH} width={60} height={mhH} fill={f} />
      {Array.from({ length: 15 }, (_, i) => {
        const yy = base - 56 - i * 22;
        const xx = mhx - 30 + (i % 5) * 12;
        return <rect key={i} x={xx} y={yy} width={15} height={15} fill={cut} />;
      })}
      <rect x={mhx - 30} y={base - mhH} width={60} height={6} fill={palette.windowCool} opacity={0.65} />
      {litWindows(mhx - 30, 60, mhH, base - mhH, palette, rand, isNight)}
    </g>
  );

  // A gold Thai temple (tiered roofs + chofa finials + a gold chedi) flanked by
  // two gold chedis, plus a gold-domed building among the towers.
  const cream = 'rgb(234,226,202)';
  const gold = 'rgb(228,184,72)';
  const goldDk = 'rgb(178,136,50)';
  const red = 'rgb(152,60,50)';
  const wx = CONTENT_W * 0.48; // clear of the foreground temple-roof landmark (~0.32)

  const roofTier = (cx: number, cy: number, hw: number, rh: number, key: string) => (
    <path
      key={key}
      d={`M ${cx - hw} ${cy} Q ${cx - hw - 7} ${cy - 3} ${cx - hw - 11} ${cy - 15} L ${cx} ${cy - rh} L ${cx + hw + 11} ${cy - 15} Q ${cx + hw + 7} ${cy - 3} ${cx + hw} ${cy} Z`}
      fill={gold}
    />
  );
  const chofa = (cx: number, cy: number, rh: number, key: string) => (
    <g key={key}>
      <path d={`M ${cx} ${cy - rh} Q ${cx - 7} ${cy - rh - 11} ${cx - 3} ${cy - rh - 20}`} stroke={goldDk} strokeWidth={2.5} fill="none" />
      <path d={`M ${cx} ${cy - rh} Q ${cx + 7} ${cy - rh - 11} ${cx + 3} ${cy - rh - 20}`} stroke={goldDk} strokeWidth={2.5} fill="none" />
    </g>
  );
  const thaiTemple = (cx: number, sc: number) => {
    const W = 56 * sc;
    const bH = 44 * sc;
    return (
      <g>
        {isNight && <ellipse cx={cx} cy={base - 70 * sc} rx={W * 1.8} ry={80 * sc} fill={gold} opacity={0.16} />}
        <rect x={cx - W} y={base - bH} width={W * 2} height={bH} fill={cream} />
        <rect x={cx - W} y={base - 8} width={W * 2} height={8} fill={red} />
        {[-W * 0.62, -W * 0.2, W * 0.2, W * 0.62].map((o, i) => (
          <rect key={i} x={cx + o - 3} y={base - bH + 6} width={6} height={bH - 14} fill={red} opacity={0.4} />
        ))}
        {roofTier(cx, base - bH, W * 0.98, 38 * sc, 'r1')}
        {chofa(cx, base - bH, 38 * sc, 'c1')}
        {roofTier(cx, base - bH - 30 * sc, W * 0.7, 32 * sc, 'r2')}
        {roofTier(cx, base - bH - 56 * sc, W * 0.46, 26 * sc, 'r3')}
        {chofa(cx, base - bH - 56 * sc, 26 * sc, 'c3')}
        <polygon points={`${cx - 9} ${base - bH - 82 * sc}, ${cx} ${base - bH - 130 * sc}, ${cx + 9} ${base - bH - 82 * sc}`} fill={gold} />
        <rect x={cx - 1.5} y={base - bH - 146 * sc} width={3} height={16} fill={gold} />
        <circle cx={cx} cy={base - bH - 148 * sc} r={3.5} fill={gold} />
      </g>
    );
  };
  const chedi = (cx: number, h: number, key: string) => (
    <g key={key}>
      <rect x={cx - 13} y={base - h * 0.3} width={26} height={h * 0.3} fill={gold} />
      <path d={`M ${cx - 13} ${base - h * 0.3} Q ${cx - 15} ${base - h * 0.62} ${cx} ${base - h * 0.64} Q ${cx + 15} ${base - h * 0.62} ${cx + 13} ${base - h * 0.3} Z`} fill={gold} />
      <polygon points={`${cx - 7} ${base - h * 0.64}, ${cx} ${base - h}, ${cx + 7} ${base - h * 0.64}`} fill={gold} />
      <rect x={cx - 1.5} y={base - h - 12} width={3} height={12} fill={gold} />
      <circle cx={cx} cy={base - h - 14} r={2.5} fill={gold} />
    </g>
  );

  const ddx = CONTENT_W * 0.78;
  const goldDome = (
    <g>
      <rect x={ddx - 30} y={base - 180} width={60} height={180} fill={f} />
      <rect x={ddx - 22} y={base - 212} width={44} height={32} fill={f} />
      <path d={`M ${ddx - 24} ${base - 212} Q ${ddx} ${base - 256} ${ddx + 24} ${base - 212} Z`} fill={gold} />
      <rect x={ddx - 2} y={base - 268} width={4} height={14} fill={gold} />
      <circle cx={ddx} cy={base - 270} r={3.5} fill={gold} />
      {litWindows(ddx - 30, 60, 180, base - 180, palette, rand, isNight)}
    </g>
  );

  return (
    <g aria-hidden data-skyline="bangkok" data-id={idPrefix}>
      {items}
      {mahanakhon}
      {goldDome}
      {chedi(wx - 70, 140, 'cd1')}
      {chedi(wx + 70, 140, 'cd2')}
      {thaiTemple(wx, 1.1)}
    </g>
  );
}

// ── Beijing — Temple of Heaven + city ────────────────────────────────────────
// Pairs with the Forbidden City gate (foreground).
function BeijingSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 44, 92);
    const h = randRange(rand, 90, 180);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  // Temple of Heaven — 3 blue tiered roofs on a red drum + marble base
  const tx = CONTENT_W * 0.4;
  const blue = 'rgb(58,98,150)';
  const cream = 'rgb(210,200,182)';
  const red = 'rgb(150,58,48)';
  const gold = 'rgba(216,182,92,0.95)';
  const temple = (
    <g>
      <polygon points={`${tx - 92} ${base}, ${tx + 92} ${base}, ${tx + 74} ${base - 16}, ${tx - 74} ${base - 16}`} fill={cream} />
      <polygon points={`${tx - 74} ${base - 16}, ${tx + 74} ${base - 16}, ${tx + 58} ${base - 30}, ${tx - 58} ${base - 30}`} fill={cream} />
      <rect x={tx - 46} y={base - 80} width={92} height={50} fill={red} />
      <polygon points={`${tx - 58} ${base - 80}, ${tx} ${base - 120}, ${tx + 58} ${base - 80}`} fill={blue} />
      <polygon points={`${tx} ${base - 120}, ${tx + 58} ${base - 80}, ${tx} ${base - 80}`} fill="rgba(0,0,0,0.18)" />
      <rect x={tx - 38} y={base - 120} width={76} height={10} fill={red} />
      <polygon points={`${tx - 46} ${base - 120}, ${tx} ${base - 156}, ${tx + 46} ${base - 120}`} fill={blue} />
      <rect x={tx - 30} y={base - 156} width={60} height={9} fill={red} />
      <polygon points={`${tx - 34} ${base - 156}, ${tx} ${base - 192}, ${tx + 34} ${base - 156}`} fill={blue} />
      <rect x={tx - 2} y={base - 208} width={4} height={16} fill={gold} />
      <circle cx={tx} cy={base - 210} r={4} fill={gold} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="beijing" data-id={idPrefix}>
      {items}
      {temple}
    </g>
  );
}

// ── Shanghai — the Lujiazui supertall trio over the Pudong waterfront ─────────
// Pairs with the Oriental Pearl Tower (foreground, left). The three heroes sit
// centre/right so the Pearl reads in front of them: Shanghai Tower (twisting,
// tallest), Jin Mao Tower (tiered pagoda setbacks), and the SWFC "bottle
// opener" (tapering slab with a trapezoidal aperture). A reserved band keeps
// the generic dense filler from overlapping the trio.
function ShanghaiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const litEdge = 'rgba(180,232,255,0.85)'; // cool lit glass edge for the heroes

  // Hero anchors + a reserved clear band so no row building overlaps them.
  const jinMaoX = CONTENT_W * 0.44;
  const towerX = CONTENT_W * 0.54;
  const swfcX = CONTENT_W * 0.64;
  const bandL = jinMaoX - 56;
  const bandR = swfcX + 52;

  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 26, 56);
    const h = randRange(rand, 120, 300);
    if (x + w > bandL && x < bandR) {
      x = bandR;
      continue;
    }
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.62) parts.push(<rect key="m" x={x + w / 2 - 1} y={top - randRange(rand, 14, 38)} width={2} height={38} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }

  // Jin Mao Tower — tiered pagoda setbacks narrowing upward to a thin spire.
  const jinMao = (() => {
    const tiers = 8;
    const baseW = 70;
    const topW = 26;
    const H = 300;
    const tierH = H / tiers;
    const parts: React.ReactNode[] = [];
    for (let i = 0; i < tiers; i += 1) {
      const wTop = baseW - (baseW - topW) * ((i + 1) / tiers);
      const wBot = baseW - (baseW - topW) * (i / tiers);
      const y0 = base - i * tierH;
      const y1 = base - (i + 1) * tierH;
      parts.push(
        <polygon
          key={`t${i}`}
          points={`${jinMaoX - wBot / 2} ${y0}, ${jinMaoX + wBot / 2} ${y0}, ${jinMaoX + wTop / 2} ${y1}, ${jinMaoX - wTop / 2} ${y1}`}
          fill={f}
        />,
      );
      // thin setback ledge line (lit)
      parts.push(<rect key={`l${i}`} x={jinMaoX - wTop / 2} y={y1 - 1} width={wTop} height={1.6} fill={litEdge} opacity={0.5} />);
    }
    // spire
    parts.push(<rect key="sp" x={jinMaoX - 1.5} y={base - H - 36} width={3} height={36} fill={f} />);
    parts.push(<circle key="bc" cx={jinMaoX} cy={base - H - 38} r={3} fill={litEdge} />);
    parts.push(...litWindows(jinMaoX - baseW / 2, baseW, H * 0.5, base - H * 0.5, palette, rand, isNight));
    return <g>{parts}</g>;
  })();

  // SWFC — the "bottle opener": tapering slab, trapezoidal aperture at the top
  // formed as genuine negative space in a single outline.
  const swfc = (() => {
    const H = 330;
    const baseHalf = 38;
    const topHalf = 20;
    const yTop = base - H;
    const yShoulder = base - H + 34; // aperture begins above the shoulder
    const yGapBot = base - H + 40;
    const outline =
      `${swfcX - baseHalf} ${base}, ` +
      `${swfcX - topHalf} ${yShoulder}, ` +
      `${swfcX - topHalf} ${yTop}, ` +
      `${swfcX - 10} ${yTop}, ` +
      `${swfcX - 4} ${yGapBot}, ` +
      `${swfcX + 4} ${yGapBot}, ` +
      `${swfcX + 10} ${yTop}, ` +
      `${swfcX + topHalf} ${yTop}, ` +
      `${swfcX + topHalf} ${yShoulder}, ` +
      `${swfcX + baseHalf} ${base}`;
    return (
      <g>
        <polygon points={outline} fill={f} />
        {/* lit outline along the prongs + aperture */}
        <polyline points={outline} fill="none" stroke={litEdge} strokeWidth={1.4} strokeLinejoin="round" opacity={0.7} />
        {litWindows(swfcX - baseHalf, baseHalf * 2, H * 0.6, base - H * 0.6, palette, rand, isNight)}
      </g>
    );
  })();

  // Shanghai Tower — soft twisting taper with a rounded asymmetric crown.
  const tower = (() => {
    const H = 372;
    const path =
      `M ${towerX - 32} ${base} ` +
      `C ${towerX - 38} ${base - 150} ${towerX - 10} ${base - 220} ${towerX - 16} ${base - 330} ` +
      `C ${towerX - 18} ${base - 356} ${towerX - 2} ${base - H} ${towerX + 12} ${base - H + 8} ` +
      `C ${towerX + 24} ${base - H + 18} ${towerX + 20} ${base - 230} ${towerX + 28} ${base - 150} ` +
      `C ${towerX + 31} ${base - 90} ${towerX + 32} ${base - 40} ${towerX + 32} ${base} Z`;
    return (
      <g>
        <path d={path} fill={f} />
        {/* lit glass seam tracing the twisting left edge */}
        <path
          d={`M ${towerX - 30} ${base - 30} C ${towerX - 36} ${base - 150} ${towerX - 10} ${base - 220} ${towerX - 15} ${base - 330}`}
          fill="none"
          stroke={litEdge}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.7}
        />
        <circle cx={towerX + 2} cy={base - H + 4} r={3} fill={litEdge} />
        {litWindows(towerX - 28, 56, H * 0.62, base - H * 0.62, palette, rand, isNight)}
      </g>
    );
  })();

  return (
    <g aria-hidden data-skyline="shanghai" data-id={idPrefix}>
      {items}
      {jinMao}
      {swfc}
      {tower}
    </g>
  );
}

// ── Rome — St Peter's dome over the historic city ────────────────────────────
// Pairs with the Colosseum (foreground).
function RomeSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  // St Peter's sits at dx; reserve a clear slot so no row building overlaps it.
  const dx = CONTENT_W * 0.42;
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 54, 110);
    const h = randRange(rand, 70, 140);
    if (x + w > dx - 88 && x < dx + 88) {
      x = dx + 88;
      continue;
    }
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    const roll = rand();
    if (roll > 0.8) parts.push(<path key="dm" d={`M ${x + w * 0.32} ${top} A ${w * 0.18} ${w * 0.18} 0 0 1 ${x + w * 0.68} ${top} Z`} fill={f} />);
    else if (roll > 0.6) parts.push(<polygon key="pd" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 10, 18)}, ${x + w} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 8);
    k += 1;
  }
  // St Peter's Basilica dome (pale travertine hero)
  const cream = 'rgb(216,208,188)';
  const creamShade = 'rgba(0,0,0,0.16)';
  const gold = 'rgba(216,184,96,0.92)';
  const stPeters = (
    <g>
      <rect x={dx - 72} y={base - 92} width={144} height={92} fill={cream} />
      <rect x={dx - 50} y={base - 150} width={100} height={58} fill={cream} />
      {[-40, -24, -8, 8, 24, 40].map((o, i) => (
        <rect key={i} x={dx + o - 2} y={base - 148} width={4} height={56} fill={creamShade} />
      ))}
      <path d={`M ${dx - 50} ${base - 150} C ${dx - 56} ${base - 228} ${dx + 56} ${base - 228} ${dx + 50} ${base - 150} Z`} fill={cream} />
      <path d={`M ${dx} ${base - 233} C ${dx + 40} ${base - 228} ${dx + 56} ${base - 190} ${dx + 50} ${base - 150} L ${dx} ${base - 150} Z`} fill={creamShade} />
      {[-30, 0, 30].map((o, i) => (
        <path key={i} d={`M ${dx + o * 0.5} ${base - 150} Q ${dx + o} ${base - 200} ${dx + o * 0.2} ${base - 228}`} stroke={creamShade} strokeWidth={1.5} fill="none" opacity={0.4} />
      ))}
      <rect x={dx - 10} y={base - 252} width={20} height={24} fill={cream} />
      <path d={`M ${dx - 12} ${base - 252} A 12 12 0 0 1 ${dx + 12} ${base - 252} Z`} fill={cream} />
      <rect x={dx - 1.5} y={base - 286} width={3} height={18} fill={gold} />
      <rect x={dx - 5} y={base - 280} width={10} height={2.5} fill={gold} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="rome" data-id={idPrefix}>
      {items}
      {stPeters}
    </g>
  );
}

// ── Amsterdam — gabled canal houses + Westerkerk spire ───────────────────────
// Pairs with the canal houses (foreground).
function AmsterdamSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 24, 44);
    const h = randRange(rand, 90, 160);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    const g = rand();
    if (g > 0.66) {
      parts.push(<path key="g" d={`M ${x} ${top} L ${x} ${top - 8} L ${x + w * 0.25} ${top - 8} L ${x + w * 0.25} ${top - 16} L ${x + w * 0.4} ${top - 16} L ${x + w * 0.4} ${top - 24} L ${x + w * 0.6} ${top - 24} L ${x + w * 0.6} ${top - 16} L ${x + w * 0.75} ${top - 16} L ${x + w * 0.75} ${top - 8} L ${x + w} ${top - 8} L ${x + w} ${top} Z`} fill={f} />);
    } else if (g > 0.33) {
      parts.push(<path key="g" d={`M ${x} ${top} Q ${x + w * 0.2} ${top - 22} ${x + w * 0.5} ${top - 26} Q ${x + w * 0.8} ${top - 22} ${x + w} ${top} Z`} fill={f} />);
    } else {
      parts.push(<polygon key="g" points={`${x} ${top}, ${x + w / 2} ${top - 22}, ${x + w} ${top}`} fill={f} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 2, 5);
    k += 1;
  }
  // Westerkerk — brick tower + tiered spire with the blue/gold imperial crown
  const wx = CONTENT_W * 0.62;
  const brick = 'rgb(122,80,64)';
  const blue = 'rgb(72,106,152)';
  const gold = 'rgba(222,188,92,0.96)';
  const wester = (
    <g>
      <rect x={wx - 16} y={base - 222} width={32} height={222} fill={brick} />
      <rect x={wx - 16} y={base - 180} width={32} height={5} fill="rgba(255,255,255,0.18)" />
      <rect x={wx - 20} y={base - 246} width={40} height={24} fill={brick} />
      <polygon points={`${wx - 16} ${base - 246}, ${wx} ${base - 282}, ${wx + 16} ${base - 246}`} fill={blue} />
      <rect x={wx - 10} y={base - 294} width={20} height={14} fill={blue} />
      <polygon points={`${wx - 10} ${base - 294}, ${wx} ${base - 318}, ${wx + 10} ${base - 294}`} fill={blue} />
      <circle cx={wx} cy={base - 324} r={6} fill={gold} />
      <rect x={wx - 1.5} y={base - 340} width={3} height={16} fill={gold} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="amsterdam" data-id={idPrefix}>
      {items}
      {wester}
    </g>
  );
}

// ── Cape Town — Lion's Head + Signal Hill + the city bowl ────────────────────
// Pairs with Table Mountain (background landmark).
function CapeTownSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const granite = 'rgba(58,66,58,0.95)';
  const peaks = (
    <g>
      {/* Signal Hill (low, far left) */}
      <path d={`M ${CONTENT_W * 0.0} ${base} Q ${CONTENT_W * 0.1} ${base - 120} ${CONTENT_W * 0.22} ${base} Z`} fill={granite} opacity={0.85} />
      {/* Lion's Head (pointed peak) */}
      <path d={`M ${CONTENT_W * 0.16} ${base} L ${CONTENT_W * 0.25} ${base - 268} L ${CONTENT_W * 0.34} ${base} Z`} fill={granite} />
      <path d={`M ${CONTENT_W * 0.25} ${base - 268} L ${CONTENT_W * 0.34} ${base} L ${CONTENT_W * 0.295} ${base} Z`} fill="rgba(0,0,0,0.18)" />
    </g>
  );
  const items: React.ReactNode[] = [];
  let x = CONTENT_W * 0.34;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 60);
    const h = randRange(rand, 90, 210);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="capetown" data-id={idPrefix}>
      {peaks}
      {items}
    </g>
  );
}

// ── Toronto — Rogers Centre dome + dense towers ──────────────────────────────
// Pairs with the CN Tower (foreground).
function TorontoSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 60);
    const h = randRange(rand, 120, 280);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  // Rogers Centre (SkyDome) — low retractable dome
  const rx = CONTENT_W * 0.6;
  const rogers = (
    <g>
      <rect x={rx - 72} y={base - 38} width={144} height={38} fill={f} />
      <path d={`M ${rx - 72} ${base - 38} A 72 50 0 0 1 ${rx + 72} ${base - 38} Z`} fill="rgb(150,154,152)" />
      <path d={`M ${rx} ${base - 88} A 72 50 0 0 1 ${rx + 72} ${base - 38} L ${rx} ${base - 38} Z`} fill="rgba(0,0,0,0.16)" />
      <path d={`M ${rx - 40} ${base - 70} A 40 24 0 0 1 ${rx + 40} ${base - 70}`} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={1.5} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="toronto" data-id={idPrefix}>
      {items}
      {rogers}
    </g>
  );
}

// ── Cairo — Citadel (Mosque of Muhammad Ali) over the city ───────────────────
// Pairs with the Pyramids (midground landmark).
function CairoSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 44, 92);
    const h = randRange(rand, 56, 120);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.82) parts.push(<path key="d" d={`M ${x + w * 0.34} ${top} A ${w * 0.16} ${w * 0.16} 0 0 1 ${x + w * 0.66} ${top} Z`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  const mx = CONTENT_W * 0.64;
  const stone = 'rgb(208,200,182)';
  const stoneShade = 'rgba(0,0,0,0.16)';
  const gold = 'rgba(216,184,96,0.9)';
  const mosque = (
    <g>
      <rect x={mx - 66} y={base - 76} width={132} height={76} fill={stone} />
      <path d={`M ${mx - 56} ${base - 76} A 30 30 0 0 1 ${mx + 4} ${base - 76} Z`} fill={stone} />
      <path d={`M ${mx - 4} ${base - 76} A 30 30 0 0 1 ${mx + 56} ${base - 76} Z`} fill={stone} />
      <rect x={mx - 30} y={base - 120} width={60} height={44} fill={stone} />
      <path d={`M ${mx - 32} ${base - 120} A 32 32 0 0 1 ${mx + 32} ${base - 120} Z`} fill={stone} />
      <path d={`M ${mx} ${base - 152} A 32 32 0 0 1 ${mx + 32} ${base - 120} L ${mx} ${base - 120} Z`} fill={stoneShade} />
      <rect x={mx - 1.5} y={base - 168} width={3} height={16} fill={gold} />
      <circle cx={mx} cy={base - 170} r={3} fill={gold} />
      {[-72, 72].map((mxx, i) => (
        <g key={i}>
          <rect x={mx + mxx - 4} y={base - 212} width={8} height={212} fill={stone} />
          <rect x={mx + mxx - 6} y={base - 170} width={12} height={4} fill={gold} opacity={0.6} />
          <polygon points={`${mx + mxx - 6} ${base - 212}, ${mx + mxx} ${base - 250}, ${mx + mxx + 6} ${base - 212}`} fill={stone} />
          <circle cx={mx + mxx} cy={base - 252} r={2.5} fill={gold} />
        </g>
      ))}
    </g>
  );
  return (
    <g aria-hidden data-skyline="cairo" data-id={idPrefix}>
      {items}
      {mosque}
    </g>
  );
}

// ── Los Angeles — downtown cluster (US Bank + Wilshire Grand) ─────────────────
// Pairs with the Hollywood sign (midground landmark).
function LaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 60);
    const h = randRange(rand, 120, 260);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  const ux = CONTENT_W * 0.4;
  const usbank = (
    <g>
      <rect x={ux - 24} y={base - 300} width={48} height={300} fill={f} />
      <path d={`M ${ux - 24} ${base - 300} A 24 14 0 0 1 ${ux + 24} ${base - 300} Z`} fill={f} />
      <circle cx={ux} cy={base - 312} r={7} fill="none" stroke="rgba(255,236,180,0.6)" strokeWidth={2} />
      {litWindows(ux - 24, 48, 300, base - 300, palette, rand, isNight)}
    </g>
  );
  const wx = CONTENT_W * 0.52;
  const wilshire = (
    <g>
      <polygon points={`${wx - 22} ${base}, ${wx - 14} ${base - 330}, ${wx + 14} ${base - 330}, ${wx + 22} ${base}`} fill={f} />
      <polygon points={`${wx - 14} ${base - 330}, ${wx} ${base - 392}, ${wx + 14} ${base - 330}`} fill="rgba(150,200,255,0.5)" />
      <rect x={wx - 1.5} y={base - 420} width={3} height={28} fill={f} />
      <circle cx={wx} cy={base - 422} r={3.5} fill="rgba(255,236,180,0.95)" />
      {litWindows(wx - 18, 36, 330, base - 330, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="la" data-id={idPrefix}>
      {items}
      {usbank}
      {wilshire}
    </g>
  );
}

// ── Mumbai — Gateway of India + dense towers ─────────────────────────────────
// Pairs with the Sea Link (foreground).
function MumbaiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 60);
    const h = randRange(rand, 120, 250);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  // The Gateway of India is now a dedicated foreground landmark, so the skyline
  // is just the dense Mumbai high-rise wall (the old in-skyline gateway is gone).
  return (
    <g aria-hidden data-skyline="mumbai" data-id={idPrefix}>
      {items}
    </g>
  );
}

// ── Madrid — Metropolis Building over the city ───────────────────────────────
// Pairs with the Puerta de Alcalá (foreground).
function MadridSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 50, 100);
    const h = randRange(rand, 80, 160);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.7) parts.push(<polygon key="r" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 12, 26)}, ${x + w} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 8);
    k += 1;
  }
  const mx = CONTENT_W * 0.42;
  const slate = 'rgb(64,72,84)';
  const stone = 'rgb(206,198,182)';
  const gold = 'rgb(224,186,86)';
  const metropolis = (
    <g>
      <rect x={mx - 32} y={base - 160} width={64} height={160} fill={stone} />
      <rect x={mx + 12} y={base - 160} width={20} height={160} fill="rgba(0,0,0,0.14)" />
      {[-22, -8, 8, 22].map((o, i) => (
        <rect key={i} x={mx + o - 1.5} y={base - 156} width={3} height={156} fill="rgba(0,0,0,0.12)" />
      ))}
      <rect x={mx - 26} y={base - 200} width={52} height={40} fill={slate} />
      <path d={`M ${mx - 26} ${base - 200} A 26 30 0 0 1 ${mx + 26} ${base - 200} Z`} fill={slate} />
      <path d={`M ${mx} ${base - 230} A 26 30 0 0 1 ${mx + 26} ${base - 200} L ${mx} ${base - 200} Z`} fill="rgba(0,0,0,0.2)" />
      <circle cx={mx} cy={base - 238} r={4} fill={gold} />
      <path d={`M ${mx - 8} ${base - 240} L ${mx} ${base - 234} L ${mx + 8} ${base - 240}`} stroke={gold} strokeWidth={2} fill="none" />
      <rect x={mx - 1.5} y={base - 250} width={3} height={12} fill={gold} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="madrid" data-id={idPrefix}>
      {items}
      {metropolis}
    </g>
  );
}

// Generic dense tower run shared by several of the simpler variants below.
function towerRun(
  base: number,
  f: string,
  palette: SceneLayerProps['palette'],
  rand: () => number,
  isNight: boolean,
  wMin: number,
  wMax: number,
  hMin: number,
  hMax: number,
  gapMax = 10,
  wide = false,
): React.ReactNode[] {
  const items: React.ReactNode[] = [];
  let x = wide ? -640 : -40;
  const end = wide ? CONTENT_W + 640 : CONTENT_W + 40;
  let k = 0;
  while (x < end) {
    const w = randRange(rand, wMin, wMax);
    const h = randRange(rand, hMin, hMax);
    const top = base - h;
    items.push(
      <g key={k}>
        <rect x={x} y={top} width={w} height={h} fill={f} />
        {litWindows(x, w, h, top, palette, rand, isNight)}
      </g>,
    );
    x += w + randRange(rand, 4, gapMax);
    k += 1;
  }
  return items;
}

// ── Mexico City — Torre Latinoamericana + Ángel de la Independencia ───────────
function MexicoCitySkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 40, 84, 90, 210);
  // Torre Latinoamericana — tiered crown + antenna.
  const tx = CONTENT_W * 0.66;
  const torre = (
    <g>
      <rect x={tx - 20} y={base - 300} width={40} height={300} fill={f} />
      <rect x={tx - 14} y={base - 320} width={28} height={20} fill={f} />
      <rect x={tx - 8} y={base - 334} width={16} height={14} fill={f} />
      <rect x={tx - 1.5} y={base - 386} width={3} height={52} fill={f} />
      <circle cx={tx} cy={base - 388} r={3.5} fill="rgba(255,90,90,0.9)" />
      {litWindows(tx - 20, 40, 300, base - 300, palette, rand, isNight)}
    </g>
  );
  // Ángel de la Independencia — tall stone column crowned by a golden winged
  // Victory (wings spread, laurel wreath raised), rising above the city.
  const ax = CONTENT_W * 0.5;
  const stoneL = 'rgb(212,204,188)';
  const gold = 'rgb(230,188,82)';
  const angel = (
    <g>
      <rect x={ax - 24} y={base - 34} width={48} height={34} fill={stoneL} />
      <rect x={ax - 15} y={base - 56} width={30} height={22} fill={stoneL} />
      <rect x={ax - 9} y={base - 252} width={18} height={196} fill={stoneL} />
      <rect x={ax - 13} y={base - 264} width={26} height={12} fill={stoneL} />
      {/* golden winged Victory */}
      <path d={`M ${ax} ${base - 286} C ${ax - 34} ${base - 308} ${ax - 32} ${base - 280} ${ax - 6} ${base - 276} Z`} fill={gold} />
      <path d={`M ${ax} ${base - 286} C ${ax + 34} ${base - 308} ${ax + 32} ${base - 280} ${ax + 6} ${base - 276} Z`} fill={gold} />
      <path d={`M ${ax - 6} ${base - 270} L ${ax - 4} ${base - 300} L ${ax + 4} ${base - 300} L ${ax + 6} ${base - 270} Z`} fill={gold} />
      <circle cx={ax} cy={base - 306} r={6} fill={gold} />
      <rect x={ax + 4} y={base - 326} width={3} height={24} fill={gold} transform={`rotate(22 ${ax + 5} ${base - 302})`} />
      <circle cx={ax + 14} cy={base - 328} r={6} fill="none" stroke={gold} strokeWidth={2.5} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="mexicocity" data-id={idPrefix}>
      {items}
      {torre}
      {angel}
    </g>
  );
}

// ── Buenos Aires — European city of verdigris cupolas ────────────────────────
function BuenosAiresSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const dome = 'rgb(96,116,108)';
  const stone = 'rgb(196,188,170)';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 52, 104);
    const h = randRange(rand, 80, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.66) {
      const cw = randRange(rand, 16, 26);
      const cx = x + w / 2;
      parts.push(<rect key="cd" x={cx - cw} y={top - cw * 0.7} width={cw * 2} height={cw * 0.7} fill={stone} />);
      parts.push(<path key="cdo" d={`M ${cx - cw} ${top - cw * 0.7} A ${cw} ${cw * 1.1} 0 0 1 ${cx + cw} ${top - cw * 0.7} Z`} fill={dome} />);
      parts.push(<rect key="cf" x={cx - 1.5} y={top - cw * 0.7 - cw * 1.1 - 10} width={3} height={10} fill={stone} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 8);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="buenosaires" data-id={idPrefix}>
      {items}
    </g>
  );
}

// ── Vancouver — Canada Place sails + glass towers (mountains behind) ──────────
function VancouverSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 30, 58, 120, 260);
  const cx = CONTENT_W * 0.4;
  const white = 'rgb(238,240,244)';
  // Canada Place — the Teflon fabric "sails" on the cruise-ship pier.
  const sails = (
    <g>
      <rect x={cx - 100} y={base - 34} width={200} height={34} fill={white} />
      <rect x={cx - 100} y={base - 10} width={200} height={4} fill="rgba(0,0,0,0.12)" />
      {[{ o: -78, h: 70 }, { o: -40, h: 104 }, { o: 0, h: 128 }, { o: 40, h: 104 }, { o: 78, h: 70 }].map((s, i) => {
        const apexX = cx + s.o + 10; // sails lean right
        const apexY = base - 34 - s.h;
        const spine = `M ${cx + s.o - 26} ${base - 34} C ${cx + s.o - 22} ${base - 34 - s.h * 0.5} ${apexX - 10} ${base - 34 - s.h * 0.9} ${apexX} ${apexY}`;
        return (
          <g key={i}>
            <path d={`${spine} C ${apexX + 14} ${base - 34 - s.h * 0.5} ${cx + s.o + 26} ${base - 46} ${cx + s.o + 26} ${base - 34} Z`} fill={white} />
            <path d={`M ${apexX} ${apexY} C ${apexX + 14} ${base - 34 - s.h * 0.5} ${cx + s.o + 26} ${base - 46} ${cx + s.o + 26} ${base - 34} L ${apexX} ${base - 34} Z`} fill="rgba(0,0,0,0.1)" />
            <path d={spine} fill="none" stroke="rgb(255,255,255)" strokeWidth={1.6} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
  // Harbour Centre (Vancouver Lookout) — saucer observation deck on a slim shaft.
  const hcx = CONTENT_W * 0.56;
  const harbourCentre = (
    <g>
      {/* rectangular building podium the tower rises from */}
      <rect x={hcx - 46} y={base - 100} width={92} height={100} fill={f} />
      {litWindows(hcx - 46, 92, 100, base - 100, palette, rand, isNight)}
      {/* tower shaft + saucer observation deck (a little shorter) */}
      <rect x={hcx - 8} y={base - 232} width={16} height={136} fill={f} />
      <ellipse cx={hcx} cy={base - 232} rx={28} ry={9} fill={f} />
      <ellipse cx={hcx} cy={base - 244} rx={20} ry={7} fill={f} />
      <rect x={hcx - 20} y={base - 236} width={40} height={4} fill={palette.windowWarm} opacity={0.6} />
      <rect x={hcx - 1.5} y={base - 274} width={3} height={30} fill={f} />
      <circle cx={hcx} cy={base - 276} r={3} fill="rgba(255,90,90,0.9)" />
    </g>
  );
  // Science World — the geodesic dome on False Creek (triangulated + lit nodes).
  const swx = CONTENT_W * 0.66;
  const swR = 38;
  const swCy = base - swR * 0.64;
  const swNode = isNight ? 'rgba(255,224,150,0.95)' : 'rgba(255,255,255,0.7)';
  const scienceWorld = (
    <g>
      {/* base structure */}
      <rect x={swx - 28} y={base - 16} width={56} height={16} fill={f} />
      {/* dome + shaded right + waterline */}
      <circle cx={swx} cy={swCy} r={swR} fill="rgb(192,202,212)" />
      <path d={`M ${swx} ${swCy - swR} A ${swR} ${swR} 0 0 1 ${swx} ${swCy + swR} Z`} fill="rgba(0,0,0,0.1)" />
      <line x1={swx - swR} y1={swCy} x2={swx + swR} y2={swCy} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
      {/* latitude rings */}
      {[0.74, 0.46, 0.18].map((ly, i) => {
        const yy = swCy - swR * ly;
        const hw = Math.sqrt(Math.max(0, 1 - ly * ly)) * swR;
        return <path key={`lat${i}`} d={`M ${swx - hw} ${yy} A ${hw} ${hw * 0.42} 0 0 0 ${swx + hw} ${yy}`} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={0.8} />;
      })}
      {/* radial struts */}
      {[-0.8, -0.5, -0.2, 0.2, 0.5, 0.8].map((m, i) => (
        <line key={`r${i}`} x1={swx} y1={swCy - swR * 0.97} x2={swx + m * swR} y2={swCy} stroke="rgba(0,0,0,0.13)" strokeWidth={0.7} />
      ))}
      {/* lit nodes dotting the frame */}
      {[[-0.5, 0.74], [0.5, 0.74], [-0.25, 0.46], [0.25, 0.46], [0, 0.18], [-0.72, 0.28], [0.72, 0.28]].map(([m, ly], i) => {
        const yy = swCy - swR * ly;
        const hw = Math.sqrt(Math.max(0, 1 - ly * ly)) * swR;
        return <circle key={`n${i}`} cx={swx + m * hw} cy={yy} r={1.3} fill={swNode} />;
      })}
    </g>
  );
  return (
    <g aria-hidden data-skyline="vancouver" data-id={idPrefix}>
      {items}
      {scienceWorld}
      {sails}
      {harbourCentre}
    </g>
  );
}

// ── Miami — neon Art-Deco beachfront (colourful at night) ────────────────────
function MiamiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const na = isNight ? 0.9 : 0.32;
  const neon = [`rgba(255,108,180,${na})`, `rgba(90,220,230,${na})`, `rgba(150,120,255,${na})`];
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 32, 64);
    const h = randRange(rand, 120, 270);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(<rect key="ne" x={x} y={top} width={w} height={3} fill={neon[k % 3]} />);
    if (rand() > 0.6) parts.push(<rect key="ns" x={x + 2} y={top} width={3} height={h * 0.5} fill={neon[(k + 1) % 3]} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 9);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="miami" data-id={idPrefix}>
      {items}
    </g>
  );
}

// ── Honolulu — Waikiki beachfront + the pink Royal Hawaiian ──────────────────
function HonoluluSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 34, 64, 90, 200);
  const px = CONTENT_W * 0.34;
  const pink = 'rgb(224,140,168)';
  const royal = (
    <g>
      <rect x={px - 40} y={base - 92} width={80} height={92} fill={pink} />
      <rect x={px - 40} y={base - 92} width={80} height={4} fill="rgba(255,255,255,0.3)" />
      {Array.from({ length: 4 }, (_, i) => (
        <rect key={i} x={px - 34} y={base - 78 + i * 20} width={68} height={3} fill="rgba(255,255,255,0.25)" />
      ))}
    </g>
  );
  return (
    <g aria-hidden data-skyline="honolulu" data-id={idPrefix}>
      {items}
      {royal}
    </g>
  );
}

// ── Delhi — Qutub Minar + Lotus Temple ───────────────────────────────────────
function DelhiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 44, 90, 70, 150, 8);
  const lx = CONTENT_W * 0.4;
  const white = 'rgb(236,238,242)';
  const lotus = (
    <g>
      <ellipse cx={lx} cy={base - 6} rx={70} ry={10} fill={white} />
      {[-44, -22, 0, 22, 44].map((o, i) => (
        <path key={i} d={`M ${lx + o - 16} ${base - 8} Q ${lx + o} ${base - 70} ${lx + o + 16} ${base - 8} Z`} fill={white} />
      ))}
      {[-33, -11, 11, 33].map((o, i) => (
        <path key={`s${i}`} d={`M ${lx + o - 10} ${base - 8} Q ${lx + o} ${base - 50} ${lx + o + 10} ${base - 8} Z`} fill="rgba(0,0,0,0.1)" />
      ))}
    </g>
  );
  const qx = CONTENT_W * 0.62;
  const red = 'rgb(176,96,64)';
  const qutub = (
    <g>
      <polygon points={`${qx - 18} ${base}, ${qx - 9} ${base - 300}, ${qx + 9} ${base - 300}, ${qx + 18} ${base}`} fill={red} />
      <polygon points={`${qx} ${base}, ${qx + 9} ${base - 300}, ${qx + 18} ${base}`} fill="rgba(0,0,0,0.16)" />
      {[0.25, 0.5, 0.72, 0.88].map((t, i) => {
        const yy = base - 300 * t;
        const hw = 18 - (18 - 9) * t;
        return <rect key={i} x={qx - hw - 2} y={yy} width={hw * 2 + 4} height={4} fill="rgba(0,0,0,0.2)" />;
      })}
      <rect x={qx - 7} y={base - 318} width={14} height={18} fill={red} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="delhi" data-id={idPrefix}>
      {items}
      {lotus}
      {qutub}
    </g>
  );
}

// ── Jakarta — Istiqlal Mosque + dense towers ─────────────────────────────────
function JakartaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 62);
    const h = randRange(rand, 130, 300);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.5) parts.push(<polygon key="t" points={`${x} ${top}, ${x + w / 2} ${top - randRange(rand, 16, 40)}, ${x + w} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 5, 11);
    k += 1;
  }
  const ix = CONTENT_W * 0.32;
  const stone = 'rgb(202,206,202)';
  const istiqlal = (
    <g>
      <rect x={ix - 50} y={base - 70} width={100} height={70} fill={stone} />
      <rect x={ix - 44} y={base - 110} width={88} height={40} fill={stone} />
      <path d={`M ${ix - 44} ${base - 110} A 44 36 0 0 1 ${ix + 44} ${base - 110} Z`} fill={stone} />
      <path d={`M ${ix} ${base - 146} A 44 36 0 0 1 ${ix + 44} ${base - 110} L ${ix} ${base - 110} Z`} fill="rgba(0,0,0,0.16)" />
      <rect x={ix - 1.5} y={base - 160} width={3} height={14} fill="rgba(216,184,96,0.9)" />
      <rect x={ix + 60} y={base - 200} width={9} height={200} fill={stone} />
      <polygon points={`${ix + 60} ${base - 200}, ${ix + 64.5} ${base - 224}, ${ix + 69} ${base - 200}`} fill={stone} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="jakarta" data-id={idPrefix}>
      {items}
      {istiqlal}
    </g>
  );
}

// ── Lagos — dense metropolis + NECOM House tower ─────────────────────────────
function LagosSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 32, 66, 110, 260);
  const nx = CONTENT_W * 0.4;
  const necom = (
    <g>
      <rect x={nx - 20} y={base - 310} width={40} height={310} fill={f} />
      <rect x={nx - 22} y={base - 314} width={44} height={6} fill={f} />
      <polygon points={`${nx - 3} ${base - 314}, ${nx - 1.5} ${base - 404}, ${nx + 1.5} ${base - 404}, ${nx + 3} ${base - 314}`} fill={f} />
      <rect x={nx - 1} y={base - 444} width={2} height={40} fill={f} />
      <circle cx={nx} cy={base - 446} r={3} fill="rgba(255,90,90,0.9)" />
      {litWindows(nx - 20, 40, 310, base - 310, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="lagos" data-id={idPrefix}>
      {items}
      {necom}
    </g>
  );
}

// ── Lisbon — 25 de Abril Bridge + Cristo Rei + terracotta city ───────────────
function LisbonSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const terra = 'rgb(176,86,58)';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 40, 84);
    const h = randRange(rand, 70, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(<polygon key="r" points={`${x - 2} ${top}, ${x + w / 2} ${top - randRange(rand, 12, 22)}, ${x + w + 2} ${top}`} fill={terra} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  const bx = CONTENT_W * 0.46;
  const red = 'rgb(196,64,48)';
  const deckY = base - 46;
  const span = 150;
  const towerTop = base - 168;
  const sag = base - 96 - towerTop;
  const cableAt = (hx: number) => towerTop + sag * (1 - ((hx - bx) / span) ** 2);
  const bridge = (
    <g>
      {[bx - span, bx + span].map((tx, i) => (
        <g key={i}>
          <rect x={tx - 5} y={towerTop} width={10} height={base - towerTop} fill={red} />
          <rect x={tx - 9} y={towerTop} width={18} height={8} fill={red} />
          <rect x={tx - 9} y={towerTop + 34} width={18} height={8} fill={red} />
        </g>
      ))}
      <path d={`M ${bx - span} ${towerTop} Q ${bx - span / 2} ${cableAt(bx - span / 2)} ${bx} ${cableAt(bx)} Q ${bx + span / 2} ${cableAt(bx + span / 2)} ${bx + span} ${towerTop}`} fill="none" stroke={red} strokeWidth={3} />
      <path d={`M ${bx - span - 70} ${deckY} L ${bx - span} ${towerTop}`} stroke={red} strokeWidth={2.5} fill="none" />
      <path d={`M ${bx + span + 70} ${deckY} L ${bx + span} ${towerTop}`} stroke={red} strokeWidth={2.5} fill="none" />
      <rect x={bx - span - 80} y={deckY} width={2 * span + 160} height={6} fill={red} />
      {Array.from({ length: 13 }, (_, i) => {
        const hx = bx - span + (i + 0.5) * ((2 * span) / 13);
        return <line key={i} x1={hx} y1={deckY} x2={hx} y2={cableAt(hx)} stroke={red} strokeWidth={1.3} opacity={0.7} />;
      })}
    </g>
  );
  const crx = CONTENT_W * 0.78;
  const pale = 'rgb(212,206,190)';
  const cristoRei = (
    <g>
      <rect x={crx - 14} y={base - 80} width={28} height={80} fill={pale} />
      <rect x={crx - 3} y={base - 134} width={6} height={54} fill={pale} />
      <rect x={crx - 24} y={base - 126} width={48} height={6} fill={pale} />
      <circle cx={crx} cy={base - 140} r={5} fill={pale} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="lisbon" data-id={idPrefix}>
      {items}
      {bridge}
      {cristoRei}
    </g>
  );
}

// ── Dublin — The Spire + Convention Centre + Georgian city ───────────────────
function DublinSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 40, 86);
    const h = randRange(rand, 70, 140);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.82) parts.push(<polygon key="s" points={`${x + w / 2 - 8} ${top}, ${x + w / 2} ${top - randRange(rand, 30, 60)}, ${x + w / 2 + 8} ${top}`} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  const sx = CONTENT_W * 0.42;
  const steel = 'rgb(176,184,196)';
  const spire = (
    <g>
      <polygon points={`${sx - 6} ${base}, ${sx - 1} ${base - 330}, ${sx + 1} ${base - 330}, ${sx + 6} ${base}`} fill={steel} />
      <polygon points={`${sx - 1} ${base - 330}, ${sx} ${base - 362}, ${sx + 1} ${base - 330}`} fill={steel} />
      <circle cx={sx} cy={base - 362} r={2.5} fill="rgba(255,255,255,0.95)" />
    </g>
  );
  const ccx = CONTENT_W * 0.62;
  const cc = (
    <g>
      <rect x={ccx - 30} y={base - 90} width={60} height={90} fill={f} />
      <ellipse cx={ccx + 6} cy={base - 90} rx={34} ry={14} fill="rgba(120,170,200,0.6)" transform={`rotate(-12 ${ccx} ${base - 90})`} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="dublin" data-id={idPrefix}>
      {items}
      {cc}
      {spire}
    </g>
  );
}

// ── Reykjavik — colourful roofs + Harpa ──────────────────────────────────────
function ReykjavikSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const roofs = ['rgb(190,72,64)', 'rgb(70,110,160)', 'rgb(80,150,110)', 'rgb(214,176,80)'];
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 30, 56);
    const h = randRange(rand, 50, 100);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(<polygon key="r" points={`${x - 2} ${top}, ${x + w / 2} ${top - randRange(rand, 14, 24)}, ${x + w + 2} ${top}`} fill={roofs[k % 4]} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 6);
    k += 1;
  }
  const hx = CONTENT_W * 0.6;
  const harpa = (
    <g>
      <rect x={hx - 50} y={base - 70} width={100} height={70} fill="rgb(60,78,96)" />
      {Array.from({ length: 24 }, (_, i) => {
        const cxx = hx - 46 + (i % 8) * 12;
        const cyy = base - 64 + Math.floor(i / 8) * 20;
        return <rect key={i} x={cxx} y={cyy} width={9} height={9} fill={`rgba(120,180,210,${0.3 + (i % 3) * 0.2})`} />;
      })}
    </g>
  );
  return (
    <g aria-hidden data-skyline="reykjavik" data-id={idPrefix}>
      {items}
      {harpa}
    </g>
  );
}

// ── Panama City — F&F twisting tower + modern skyline ────────────────────────
function PanamaCitySkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 28, 56, 130, 300, 9);
  const tx = CONTENT_W * 0.42;
  const glass = 'rgba(110,170,140,0.7)';
  const twist = (
    <g>
      <rect x={tx - 22} y={base - 330} width={44} height={330} fill={f} />
      {Array.from({ length: 11 }, (_, i) => {
        const yy = base - 30 - i * 28;
        const off = Math.sin(i * 0.9) * 10;
        return <rect key={i} x={tx - 22 + off} y={yy} width={44} height={10} fill={glass} />;
      })}
      {litWindows(tx - 22, 44, 330, base - 330, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="panamacity" data-id={idPrefix}>
      {items}
      {twist}
    </g>
  );
}

// ── Ho Chi Minh City — Landmark 81 + dense towers ────────────────────────────
function HcmcSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 28, 56, 130, 300, 9);
  const lx = CONTENT_W * 0.42;
  const lm81 = (
    <g>
      {[-18, -9, 0, 9, 18].map((o, i) => {
        const hh = 300 - Math.abs(o) * 6;
        return <rect key={i} x={lx + o - 5} y={base - hh} width={10} height={hh} fill={f} />;
      })}
      <rect x={lx - 1.5} y={base - 360} width={3} height={60} fill={f} />
      <circle cx={lx} cy={base - 362} r={3.5} fill="rgba(255,90,90,0.9)" />
      {litWindows(lx - 22, 44, 300, base - 300, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="hcmc" data-id={idPrefix}>
      {items}
      {lm81}
    </g>
  );
}

// ── Almaty — Tian Shan snow peaks behind the city ────────────────────────────
function AlmatySkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const rock = 'rgb(80,88,100)';
  const rockBack = 'rgba(80,88,100,0.6)';
  const snow = 'rgb(238,242,248)';
  const W = CONTENT_W;
  // Snow cap whose sides lie ON the peak's actual slopes (down to depth d), so it
  // matches the mountain's angles instead of being a symmetric triangle.
  const snowOnPeak = (px: number, py: number, lx: number, ly: number, rx: number, ry: number, d: number, key: string) => {
    const xl = px + (lx - px) * (d / (ly - py));
    const xr = px + (rx - px) * (d / (ry - py));
    return <polygon key={key} points={`${px} ${py}, ${xl} ${py + d}, ${xr} ${py + d}`} fill={snow} />;
  };
  const mtns = (
    <g>
      {/* back ridge (extends into the side bleed so it never cuts off) */}
      <path d={`M -640 ${base} L ${W * 0.08} ${base - 230} L ${W * 0.28} ${base - 300} L ${W * 0.46} ${base - 250} L ${W * 0.64} ${base - 310} L ${W * 0.86} ${base - 250} L ${W + 640} ${base} Z`} fill={rockBack} />
      {/* front ridge */}
      <path d={`M -640 ${base} L ${W * 0.16} ${base - 320} L ${W * 0.32} ${base - 180} L ${W * 0.5} ${base - 372} L ${W * 0.66} ${base - 210} L ${W * 0.82} ${base - 330} L ${W + 640} ${base} Z`} fill={rock} />
      {/* big snow caps following each peak's actual slopes */}
      {snowOnPeak(W * 0.16, base - 320, -640, base, W * 0.32, base - 180, 116, 's1')}
      {snowOnPeak(W * 0.5, base - 372, W * 0.32, base - 180, W * 0.66, base - 210, 128, 's2')}
      {snowOnPeak(W * 0.82, base - 330, W * 0.66, base - 210, W + 640, base, 112, 's3')}
    </g>
  );
  const items = towerRun(base, f, palette, rand, isNight, 32, 64, 90, 200, 10, true);
  return (
    <g aria-hidden data-skyline="almaty" data-id={idPrefix}>
      {mtns}
      {items}
    </g>
  );
}

// ── Nairobi — modern towers + Times Tower ────────────────────────────────────
function NairobiSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 32, 66, 100, 230);
  const tx = CONTENT_W * 0.6;
  const times = (
    <g>
      <rect x={tx - 22} y={base - 280} width={44} height={280} fill={f} />
      <polygon points={`${tx - 22} ${base - 280}, ${tx} ${base - 330}, ${tx + 22} ${base - 280}`} fill={f} />
      <rect x={tx - 1.5} y={base - 360} width={3} height={30} fill={f} />
      <circle cx={tx} cy={base - 362} r={3} fill="rgba(255,90,90,0.9)" />
      {litWindows(tx - 22, 44, 280, base - 280, palette, rand, isNight)}
    </g>
  );
  return (
    <g aria-hidden data-skyline="nairobi" data-id={idPrefix}>
      {items}
      {times}
    </g>
  );
}

// ── Lima — colonial old town (domes + bell towers) ───────────────────────────
function LimaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const cream = 'rgb(208,188,152)';
  const terra = 'rgb(168,92,62)';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 46, 92);
    const h = randRange(rand, 64, 130);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.72) {
      const cx = x + w / 2;
      parts.push(<rect key="dr" x={cx - 16} y={top - 12} width={32} height={12} fill={cream} />);
      parts.push(<path key="do" d={`M ${cx - 16} ${top - 12} A 16 18 0 0 1 ${cx + 16} ${top - 12} Z`} fill={terra} />);
      parts.push(<rect key="df" x={cx - 1.5} y={top - 42} width={3} height={12} fill={terra} />);
    }
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  // a colonial church — twin cream bell towers + terracotta dome
  const cx = CONTENT_W * 0.6;
  const church = (
    <g>
      <rect x={cx - 60} y={base - 120} width={120} height={120} fill={cream} />
      <rect x={cx - 18} y={base - 158} width={36} height={38} fill={cream} />
      <path d={`M ${cx - 18} ${base - 158} A 18 22 0 0 1 ${cx + 18} ${base - 158} Z`} fill={terra} />
      <rect x={cx - 1.5} y={base - 196} width={3} height={16} fill={terra} />
      {[-44, 44].map((o, i) => (
        <g key={i}>
          <rect x={cx + o - 12} y={base - 184} width={24} height={64} fill={cream} />
          <polygon points={`${cx + o - 12} ${base - 184}, ${cx + o} ${base - 210}, ${cx + o + 12} ${base - 184}`} fill={terra} />
        </g>
      ))}
    </g>
  );
  return (
    <g aria-hidden data-skyline="lima" data-id={idPrefix}>
      {items}
      {church}
    </g>
  );
}

// ── Bogotá — green Andes (Cerros Orientales) + brick city ────────────────────
function BogotaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const W = CONTENT_W;
  const green = 'rgba(44,64,46,0.95)';
  const cerros = (
    <g>
      <path d={`M -640 ${base} L ${W * 0.06} ${base - 250} L ${W * 0.18} ${base - 180} L ${W * 0.32} ${base - 300} L ${W * 0.46} ${base - 210} L ${W * 0.56} ${base - 250} L ${W * 0.56} ${base} Z`} fill={green} />
      <path d={`M ${W * 0.32} ${base - 300} L ${W * 0.4} ${base - 240} L ${W * 0.24} ${base - 240} Z`} fill="rgba(0,0,0,0.16)" />
    </g>
  );
  const brick = 'rgb(140,80,64)';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 38, 76);
    const h = randRange(rand, 80, 200);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.6) parts.push(<rect key="r" x={x} y={top} width={w} height={5} fill={brick} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 8);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="bogota" data-id={idPrefix}>
      {cerros}
      {items}
    </g>
  );
}

// ── Perth — Swan Bell Tower + glass towers ───────────────────────────────────
function PerthSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 32, 62, 120, 250);
  const bx = CONTENT_W * 0.42;
  const copper = 'rgb(184,108,68)';
  const glass = 'rgba(150,190,210,0.7)';
  const bell = (
    <g>
      <polygon points={`${bx - 16} ${base}, ${bx - 6} ${base - 240}, ${bx + 6} ${base - 240}, ${bx + 16} ${base}`} fill={glass} />
      <polygon points={`${bx - 16} ${base}, ${bx - 6} ${base - 240}, ${bx} ${base - 240}, ${bx} ${base}`} fill={f} opacity={0.4} />
      <path d={`M ${bx - 6} ${base - 240} L ${bx - 40} ${base - 286} L ${bx - 2} ${base - 270} Z`} fill={copper} />
      <path d={`M ${bx + 6} ${base - 240} L ${bx + 40} ${base - 286} L ${bx + 2} ${base - 270} Z`} fill={copper} />
      <rect x={bx - 1.5} y={base - 300} width={3} height={60} fill={copper} />
      <circle cx={bx} cy={base - 302} r={3} fill={copper} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="perth" data-id={idPrefix}>
      {items}
      {bell}
    </g>
  );
}

// ── Auckland — Harbour Bridge + CBD (Sky Tower in front) ─────────────────────
function AucklandSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 30, 58, 110, 240);
  const steel = 'rgb(96,104,116)';
  const bx = CONTENT_W * 0.66;
  const bw = 150;
  const deckY = base - 60;
  const bridge = (
    <g>
      <rect x={bx - bw - 8} y={base - 90} width={16} height={90} fill={steel} />
      <rect x={bx + bw - 8} y={base - 90} width={16} height={90} fill={steel} />
      <path d={`M ${bx - bw} ${deckY} Q ${bx} ${deckY - 96} ${bx + bw} ${deckY}`} fill="none" stroke={steel} strokeWidth={9} />
      <rect x={bx - bw - 12} y={deckY} width={2 * bw + 24} height={7} fill={steel} />
      {Array.from({ length: 11 }, (_, i) => {
        const hx = bx - bw + (i + 0.5) * ((2 * bw) / 11);
        const ay = deckY - 96 * (1 - ((hx - bx) / bw) ** 2);
        return <line key={i} x1={hx} y1={deckY} x2={hx} y2={ay} stroke={steel} strokeWidth={1.4} opacity={0.7} />;
      })}
    </g>
  );
  return (
    <g aria-hidden data-skyline="auckland" data-id={idPrefix}>
      {items}
      {bridge}
    </g>
  );
}

// ── Suva — green tropical hills + a low colonial town ────────────────────────
function SuvaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const W = CONTENT_W;
  const green = 'rgba(40,72,46,0.92)';
  const hills = (
    <path d={`M -640 ${base} Q ${W * 0.18} ${base - 150} ${W * 0.36} ${base - 90} Q ${W * 0.56} ${base - 170} ${W * 0.78} ${base - 100} Q ${W * 0.92} ${base - 60} ${W + 640} ${base - 120} L ${W + 640} ${base} Z`} fill={green} />
  );
  const roofs = ['rgb(176,86,58)', 'rgb(80,120,150)', 'rgb(214,200,176)'];
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 36, 70);
    const h = randRange(rand, 50, 96);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(<polygon key="r" points={`${x - 2} ${top}, ${x + w / 2} ${top - randRange(rand, 12, 20)}, ${x + w + 2} ${top}`} fill={roofs[k % 3]} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="suva" data-id={idPrefix}>
      {hills}
      {items}
    </g>
  );
}

// ── Ulaanbaatar — Soviet blocks + gers on the steppe ─────────────────────────
function UlaanbaatarSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const W = CONTENT_W;
  const steppe = (
    <path d={`M -640 ${base} Q ${W * 0.3} ${base - 110} ${W * 0.6} ${base - 70} Q ${W * 0.85} ${base - 100} ${W + 640} ${base - 60} L ${W + 640} ${base} Z`} fill="rgba(92,96,86,0.85)" />
  );
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 70, 140); // wide Soviet apartment blocks
    const h = randRange(rand, 70, 150);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 4, 8);
    k += 1;
  }
  const white = 'rgb(224,224,220)';
  const ger = (gx: number, key: string) => (
    <g key={key}>
      <path d={`M ${gx - 22} ${base} L ${gx - 18} ${base - 18} Q ${gx} ${base - 30} ${gx + 18} ${base - 18} L ${gx + 22} ${base} Z`} fill={white} />
      <rect x={gx - 4} y={base - 12} width={8} height={12} fill="rgba(0,0,0,0.3)" />
    </g>
  );
  return (
    <g aria-hidden data-skyline="ulaanbaatar" data-id={idPrefix}>
      {steppe}
      {items}
      {ger(CONTENT_W * 0.12, 'g1')}
      {ger(CONTENT_W * 0.2, 'g2')}
      {ger(CONTENT_W * 0.86, 'g3')}
    </g>
  );
}

// ── Dakar — Grande Mosquée + modern towers ───────────────────────────────────
function DakarSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 34, 66, 100, 230);
  const mx = CONTENT_W * 0.42;
  const stone = 'rgb(206,200,184)';
  const gold = 'rgba(216,184,96,0.9)';
  const mosque = (
    <g>
      <rect x={mx - 54} y={base - 78} width={108} height={78} fill={stone} />
      <rect x={mx - 30} y={base - 118} width={60} height={40} fill={stone} />
      <path d={`M ${mx - 30} ${base - 118} A 30 26 0 0 1 ${mx + 30} ${base - 118} Z`} fill={stone} />
      <path d={`M ${mx} ${base - 144} A 30 26 0 0 1 ${mx + 30} ${base - 118} L ${mx} ${base - 118} Z`} fill="rgba(0,0,0,0.16)" />
      <circle cx={mx} cy={base - 150} r={3} fill={gold} />
      <rect x={mx + 64} y={base - 270} width={12} height={270} fill={stone} />
      <rect x={mx + 61} y={base - 234} width={18} height={6} fill={gold} opacity={0.5} />
      <polygon points={`${mx + 64} ${base - 270}, ${mx + 70} ${base - 300}, ${mx + 76} ${base - 270}`} fill={stone} />
      <circle cx={mx + 70} cy={base - 302} r={2.5} fill={gold} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="dakar" data-id={idPrefix}>
      {items}
      {mosque}
    </g>
  );
}

// ── Manila — bayfront towers + Manila Cathedral ──────────────────────────────
function ManilaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 32, 62, 110, 250);
  const mx = CONTENT_W * 0.6;
  const stone = 'rgb(200,196,182)';
  const cathedral = (
    <g>
      <rect x={mx - 50} y={base - 120} width={100} height={120} fill={stone} />
      <polygon points={`${mx - 54} ${base - 120}, ${mx} ${base - 150}, ${mx + 54} ${base - 120}`} fill={stone} />
      <rect x={mx - 26} y={base - 170} width={52} height={50} fill={stone} />
      <path d={`M ${mx - 26} ${base - 170} A 26 30 0 0 1 ${mx + 26} ${base - 170} Z`} fill={stone} />
      <path d={`M ${mx} ${base - 200} A 26 30 0 0 1 ${mx + 26} ${base - 170} L ${mx} ${base - 170} Z`} fill="rgba(0,0,0,0.16)" />
      <rect x={mx - 1.5} y={base - 216} width={3} height={16} fill={stone} />
      <rect x={mx - 5} y={base - 210} width={10} height={2.5} fill={stone} />
    </g>
  );
  return (
    <g aria-hidden data-skyline="manila" data-id={idPrefix}>
      {items}
      {cathedral}
    </g>
  );
}

// ── Santiago — dense city + Torre Entel (Gran Torre + Andes are background) ───
function SantiagoSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items = towerRun(base, f, palette, rand, isNight, 30, 58, 110, 240);
  const ex = CONTENT_W * 0.66;
  const entel = (
    <g>
      <polygon points={`${ex - 10} ${base}, ${ex - 4} ${base - 300}, ${ex + 4} ${base - 300}, ${ex + 10} ${base}`} fill={f} />
      <rect x={ex - 18} y={base - 326} width={36} height={26} fill={f} />
      <rect x={ex - 16} y={base - 322} width={32} height={4} fill={palette.windowWarm} opacity={0.6} />
      <rect x={ex - 1.5} y={base - 380} width={3} height={54} fill={f} />
      <circle cx={ex} cy={base - 382} r={3} fill="rgba(255,90,90,0.9)" />
    </g>
  );
  return (
    <g aria-hidden data-skyline="santiago" data-id={idPrefix}>
      {items}
      {entel}
    </g>
  );
}

// ── Recife — dense Boa Viagem beachfront towers ──────────────────────────────
function RecifeSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const items: React.ReactNode[] = [];
  let x = -40;
  let k = 0;
  while (x < CONTENT_W + 40) {
    const w = randRange(rand, 28, 54);
    const h = randRange(rand, 130, 290);
    const top = base - h;
    const parts: React.ReactNode[] = [<rect key="b" x={x} y={top} width={w} height={h} fill={f} />];
    if (rand() > 0.7) parts.push(<rect key="a" x={x + w / 2 - 1} y={top - randRange(rand, 12, 30)} width={2} height={30} fill={f} />);
    parts.push(...litWindows(x, w, h, top, palette, rand, isNight));
    items.push(<g key={k}>{parts}</g>);
    x += w + randRange(rand, 3, 7);
    k += 1;
  }
  return (
    <g aria-hidden data-skyline="recife" data-id={idPrefix}>
      {items}
    </g>
  );
}

// ── Addis Ababa — green Entoto highlands behind the city ─────────────────────
function AddisAbabaSkyline({ palette, rand, idPrefix }: SceneLayerProps) {
  const base = LAYOUT.apronY + 12;
  const f = palette.buildingSilhouette;
  const isNight = palette.light === 'moon';
  const W = CONTENT_W;
  const green = 'rgba(52,72,52,0.9)';
  const hills = (
    <path d={`M -640 ${base} Q ${W * 0.24} ${base - 180} ${W * 0.5} ${base - 110} Q ${W * 0.76} ${base - 190} ${W + 640} ${base - 120} L ${W + 640} ${base} Z`} fill={green} />
  );
  const items = towerRun(base, f, palette, rand, isNight, 34, 68, 90, 210, 10, true);
  return (
    <g aria-hidden data-skyline="addisababa" data-id={idPrefix}>
      {hills}
      {items}
    </g>
  );
}
