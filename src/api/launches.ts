import type { Launch } from '../types'

const BASE = import.meta.env.VITE_LL_BASE ?? 'https://ll.thespacedevs.com'
const URL = `${BASE}/2.2.0/launch/upcoming/?limit=30&mode=detailed`
const CACHE_KEY = 'rlw-launches-v2'
const TTL = 30 * 60 * 1000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = any

const wikiSearch = (q: string) =>
  `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`

function mapLaunch(r: Raw): Launch {
  const cfg = r.rocket?.configuration ?? {}
  const lsp = r.launch_service_provider ?? {}
  const rocketName = cfg.full_name || cfg.name || 'Unknown rocket'
  const vid = [...(r.vidURLs ?? [])].sort((a: Raw, b: Raw) => (b.priority ?? 0) - (a.priority ?? 0))[0]
  return {
    id: r.id,
    name: r.mission?.name || r.name,
    net: r.net,
    status: r.status?.abbrev ?? 'TBD',
    statusName: r.status?.name ?? '',
    lat: parseFloat(r.pad?.latitude),
    lng: parseFloat(r.pad?.longitude),
    padName: r.pad?.name ?? '',
    location: r.pad?.location?.name ?? '',
    images: [...new Set<string>([
      r.image,
      cfg.image_url,
      ...(r.mission_patches ?? []).map((p: Raw) => p.image_url),
      lsp.image_url,
      r.pad?.map_image,
      lsp.logo_url,
    ].filter(Boolean))],
    webcastUrl: vid?.url ?? null,
    orbit: r.mission?.orbit?.abbrev ?? null,
    rocket: {
      fullName: rocketName,
      family: cfg.family ?? '',
      variant: cfg.variant ?? '',
      wikiUrl: cfg.wiki_url || wikiSearch(rocketName),
    },
    provider: {
      name: lsp.name ?? 'Unknown',
      type: lsp.type ?? '',
      countryCode: (lsp.country_code || r.pad?.location?.country_code || '').split(',')[0].trim(),
      wikiUrl: lsp.wiki_url || wikiSearch(lsp.name ?? ''),
    },
  }
}

export async function fetchLaunches(force = false): Promise<Launch[]> {
  if (!force) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')
      if (c && Date.now() - c.t < TTL) return c.data
    } catch { /* ignore */ }
  }
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`Launch API error ${res.status}`)
  const json = await res.json()
  const data = (json.results as Raw[])
    .map(mapLaunch)
    .filter(l => Number.isFinite(l.lat) && Number.isFinite(l.lng))
    .sort((a, b) => +new Date(a.net) - +new Date(b.net))
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })) } catch { /* ignore */ }
  return data
}
