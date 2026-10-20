import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-credits';

export const dynamic = 'force-dynamic';

/**
 * GET /api/live-room/nearby?lat=..&lng=..&country=..
 * Real things around the plane right now, for "look outside" moments (all free, no keys, cached):
 * - another real plane nearby (OpenSky Network);
 * - the northern/southern lights forecast (NOAA planetary K index);
 * - a recent earthquake near the route, magnitude 4.5 or more in the last day (USGS);
 * - a public holiday today in the country below (Nager.Date).
 * Every part is optional: a source that fails is simply left out.
 */

const AIRLINES: Record<string, string> = {
  AAL: 'American Airlines', ACA: 'Air Canada', AFR: 'Air France', AIC: 'Air India', ANA: 'All Nippon Airways', ANZ: 'Air New Zealand',
  BAW: 'British Airways', CAL: 'China Airlines', CCA: 'Air China', CES: 'China Eastern', CPA: 'Cathay Pacific', CSN: 'China Southern',
  DAL: 'Delta', DLH: 'Lufthansa', EIN: 'Aer Lingus', ETD: 'Etihad', ETH: 'Ethiopian Airlines', EVA: 'EVA Air', EZY: 'easyJet',
  FDX: 'FedEx', GIA: 'Garuda Indonesia', IBE: 'Iberia', JAL: 'Japan Airlines', JST: 'Jetstar', KAL: 'Korean Air', KLM: 'KLM',
  MAS: 'Malaysia Airlines', QFA: 'Qantas', QTR: 'Qatar Airways', RYR: 'Ryanair', SAS: 'SAS', SIA: 'Singapore Airlines',
  SWR: 'Swiss', THA: 'Thai Airways', THY: 'Turkish Airlines', UAE: 'Emirates', UAL: 'United Airlines', UPS: 'UPS',
  VIR: 'Virgin Atlantic', VJC: 'VietJet Air', HVN: 'Vietnam Airlines', AXM: 'AirAsia', IGO: 'IndiGo', SVA: 'Saudia',
  PAL: 'Philippine Airlines', CEB: 'Cebu Pacific', AAR: 'Asiana Airlines', AUA: 'Austrian Airlines', FIN: 'Finnair',
  TAP: 'TAP Air Portugal', LOT: 'LOT Polish Airlines', AZA: 'ITA Airways', WJA: 'WestJet', SWA: 'Southwest Airlines',
};

const R = 6371, rad = Math.PI / 180;
const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
const bearing = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const y = Math.sin((b.lng - a.lng) * rad) * Math.cos(b.lat * rad);
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
  return ((Math.atan2(y, x) / rad) + 360) % 360;
};
const get = async (url: string, revalidate: number) => {
  const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'LessonCaptain/1.0 (matt@lessoncaptain.com)' } });
  return res.ok ? res.json() : null;
};

async function nearbyPlane(at: { lat: number; lng: number }) {
  const lat = Math.round(at.lat * 2) / 2, lng = Math.round(at.lng * 2) / 2;
  const d = await get(`https://opensky-network.org/api/states/all?lamin=${lat - 1}&lomin=${lng - 1.2}&lamax=${lat + 1}&lomax=${lng + 1.2}`, 120) as { states?: unknown[][] } | null;
  let best: { callsign: string; airline: string | null; km: number; bearing: number; altitudeM: number } | null = null;
  for (const s of d?.states ?? []) {
    const callsign = String(s[1] ?? '').trim(), lon = Number(s[5]), la = Number(s[6]), alt = Number(s[7]), ground = s[8] === true;
    if (!callsign || ground || !Number.isFinite(lon) || !Number.isFinite(la) || !(alt > 6000)) continue;
    const dist = km(at, { lat: la, lng: lon });
    if (dist < 8 || dist > 90) continue;
    if (!best || dist < best.km) best = { callsign, airline: AIRLINES[callsign.slice(0, 3)] ?? null, km: Math.round(dist), bearing: Math.round(bearing(at, { lat: la, lng: lon })), altitudeM: Math.round(alt / 100) * 100 };
  }
  return best;
}

async function auroraKp() {
  const d = await get('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', 900) as unknown[][] | null;
  const last = d && d.length > 1 ? d[d.length - 1] : null;
  const kp = last ? Number(last[1]) : NaN;
  return Number.isFinite(kp) ? kp : null;
}

type Quake = { magnitude: number; place: string; hoursAgo: number; km: number; big: boolean };
async function recentQuake(at: { lat: number; lng: number }) {
  // every earthquake of magnitude 4.5 or more near the route in the last day, and the big, newsworthy ones (USGS
  // "significant") further away and up to a month back: a calm, factual way into how the Earth works
  type Feed = { features?: Array<{ properties?: { mag?: number; place?: string; time?: number }; geometry?: { coordinates?: number[] } }> } | null;
  const [day, big] = await Promise.all([
    get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson', 600) as Promise<Feed>,
    get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson', 1800) as Promise<Feed>,
  ]);
  let best: Quake | null = null;
  const consider = (f: NonNullable<NonNullable<Feed>['features']>[number], reach: number, isBig: boolean) => {
    const [lng, lat] = f.geometry?.coordinates ?? [];
    const mag = f.properties?.mag ?? 0;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || mag < 4.5) return;
    const dist = km(at, { lat, lng });
    if (dist > reach) return;
    const q: Quake = { magnitude: Math.round(mag * 10) / 10, place: (f.properties?.place ?? '').slice(0, 80), hoursAgo: Math.max(1, Math.round((Date.now() - (f.properties?.time ?? Date.now())) / 3600000)), km: Math.round(dist), big: isBig || mag >= 6.5 };
    // the strongest one in reach wins
    if (!best || q.magnitude > best.magnitude) best = q;
  };
  for (const f of day?.features ?? []) consider(f, 400, false);
  for (const f of big?.features ?? []) consider(f, 1500, true);
  return best as Quake | null;
}

async function holidayToday(country: string) {
  if (!country) return null;
  const list = await get('https://date.nager.at/api/v3/AvailableCountries', 86400) as Array<{ countryCode: string; name: string }> | null;
  const want = country.toLowerCase().replace(/^the /, '');
  const c = list?.find((x) => x.name.toLowerCase() === want || (want === 'united states of america' && x.countryCode === 'US'));
  if (!c) return null;
  const year = new Date().getUTCFullYear();
  const days = await get(`https://date.nager.at/api/v3/PublicHolidays/${year}/${c.countryCode}`, 86400) as Array<{ date: string; name: string; localName: string; global?: boolean }> | null;
  const today = new Date().toISOString().slice(0, 10);
  const h = days?.find((x) => x.date === today && x.global !== false);
  return h ? { name: h.name, localName: h.localName, country: c.name } : null;
}

export async function GET(request: Request) {
  const { teacher, error } = await requireAuth();
  if (error) return error;
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat')), lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  const country = (url.searchParams.get('country') ?? '').slice(0, 80);
  const at = { lat, lng };
  const settle = <T,>(p: Promise<T>) => p.catch(() => null);
  const [plane, kp, quake, holiday] = await Promise.all([settle(nearbyPlane(at)), settle(auroraKp()), settle(recentQuake(at)), settle(holidayToday(country))]);
  return NextResponse.json({ plane, kp, quake, holiday });
}
