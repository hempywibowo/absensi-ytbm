// Haversine formula: jarak antara dua titik koordinat (meter)
export function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export const CLOCK_IN_RADIUS_METERS = 100;

export function isWithinSchoolRadius(userLat, userLng, schoolLat, schoolLng) {
  return distanceInMeters(userLat, userLng, schoolLat, schoolLng) <= CLOCK_IN_RADIUS_METERS;
}
