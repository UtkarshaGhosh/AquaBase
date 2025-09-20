export const CACHE_KEY = 'reverse_geocode_cache_v1';

let disabled = false;
let failures = 0;
if (typeof window !== 'undefined') {
  try { disabled = sessionStorage.getItem('reverse_geocode_disabled') === '1'; } catch (e) {}
  try {
    // If FullStory is present or sets a namespace, avoid external fetches to prevent noise/errors
    if ((window as any).FS || (window as any)["_fs_namespace"]) {
      disabled = true;
      try { sessionStorage.setItem('reverse_geocode_disabled', '1'); } catch (e) {}
    }
  } catch {}
}

export async function getAreaName(lat: number, lon: number): Promise<string> {
  const fallback = `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  if (typeof window === 'undefined') return fallback;
  if (disabled || !navigator.onLine) return fallback;

  const id = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {} as Record<string, string>;
    if (cache && cache[id]) return cache[id];

    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AquaBase/1.0 (+contact@example.com)' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
      const j = await res.json();
      const address = j.address || {};
      const label = address.city || address.town || address.village || address.county || address.state || j.display_name || fallback;
      cache[id] = label;
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) {}
      return label;
    } catch (err) {
      clearTimeout(timer);
      failures += 1;
      if (failures >= 1) {
        disabled = true;
        try { sessionStorage.setItem('reverse_geocode_disabled', '1'); } catch (e) {}
      }
      return fallback;
    }
  } catch {
    return fallback;
  }
}
