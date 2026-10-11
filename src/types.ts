export interface Launch {
  id: string
  name: string
  net: string
  status: string
  statusName: string
  lat: number
  lng: number
  padName: string
  location: string
  /** Candidate pictures, best first; the UI falls through them as they fail to load. */
  images: string[]
  webcastUrl: string | null
  orbit: string | null
  rocket: { fullName: string; family: string; variant: string; wikiUrl: string }
  provider: { name: string; type: string; countryCode: string; wikiUrl: string }
}

export interface Pad {
  key: string
  lat: number
  lng: number
  launches: Launch[]
}
