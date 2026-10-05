import type { DestinationPack } from '@/lib/world-flight/types';
import type { TripHotelContent } from '../types';

/** Hotel content for a destination. No AI: the check-in script lives in the component. */
export function buildTripHotelContent(destination: DestinationPack): TripHotelContent {
  return {
    activityKey: 'trip-hotel',
    topicContext: destination.city,
    city: destination.city,
    framingPrompt: `You've made it into ${destination.city}. Check in at your hotel.`,
    ...(destination.hotels?.length ? { hotels: destination.hotels.map((h) => ({ name: h.name, tier: h.tier, price: h.price })) } : {}),
  };
}
