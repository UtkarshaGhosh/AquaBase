export const CACHE_KEY = 'reverse_geocode_cache_v1';

export async function getAreaName(lat: number, lon: number): Promise<string> {
  if (typeof window === 'undefined') return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  const id = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    if (cache && cache[id]) return cache[id];

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'AquaBase/1.0' } });
    if (!res.ok) throw new Error('Geocode failed');
    const j = await res.json();
    const address = j.address || {};
    const label = address.city || address.town || address.village || address.county || address.state || j.display_name || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
    cache[id] = label;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
    return label;
  } catch (e) {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}
