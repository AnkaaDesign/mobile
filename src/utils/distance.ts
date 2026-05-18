/**
 * Haversine distance between two WGS84 coordinates, in metres.
 * Used by the Incluir Ponto screen to display the distance from the user's
 * current GPS fix to the nearest authorized perimeter centre.
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371_000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Returns the closest authorized perimeter to the user and the user's distance
 * to its centre. When the perimeter list is empty (no geofences configured)
 * returns `null` and `foraDoPerimetro` will always be reported as `false`.
 */
export function nearestPerimeter(
  userLat: number,
  userLon: number,
  perimetros: Array<{ latitude?: number; longitude?: number; raio?: number; nome?: string }>,
): {
  distanceMeters: number;
  perimetro: { latitude?: number; longitude?: number; raio?: number; nome?: string };
  foraDoPerimetro: boolean;
} | null {
  const candidates = perimetros.filter(
    (p) =>
      typeof p.latitude === "number" && Number.isFinite(p.latitude) &&
      typeof p.longitude === "number" && Number.isFinite(p.longitude) &&
      typeof p.raio === "number" && p.raio > 0,
  );
  if (candidates.length === 0) return null;

  let best = candidates[0];
  let bestDistance = haversineMeters(userLat, userLon, best.latitude!, best.longitude!);
  for (let i = 1; i < candidates.length; i++) {
    const p = candidates[i];
    const d = haversineMeters(userLat, userLon, p.latitude!, p.longitude!);
    if (d < bestDistance) {
      best = p;
      bestDistance = d;
    }
  }

  return {
    distanceMeters: bestDistance,
    perimetro: best,
    foraDoPerimetro: bestDistance > best.raio!,
  };
}

/**
 * Formats a distance in metres for display. Single decimal place under 100 m,
 * integer above, switches to km at 1000 m.
 */
export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return "--";
  if (meters < 100) return `${meters.toFixed(2)} metros`;
  if (meters < 1000) return `${Math.round(meters)} metros`;
  return `${(meters / 1000).toFixed(2)} km`;
}
