export interface GeoPosition {
  lat: number;
  lng: number;
}

export function formatGeoPositionStatus(
  position: GeoPosition | null,
  locked: boolean,
): string {
  if (locked) return 'Position saved';
  if (!position) return 'No position selected';
  return `${Math.abs(position.lat).toFixed(1)} deg ${position.lat >= 0 ? 'N' : 'S'}, ${Math.abs(position.lng).toFixed(1)} deg ${position.lng >= 0 ? 'E' : 'W'}`;
}
