import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Globe, { type GlobeMethods } from 'react-globe.gl'
import {
  AdditiveBlending, CanvasTexture, CylinderGeometry, DoubleSide, Group, Mesh,
  MeshBasicMaterial, SphereGeometry, Sprite, SpriteMaterial,
} from 'three'
import type { Launch, Pad } from '../types'
import { country } from '../countries'
import { statusColor, tMinus } from '../useNow'

const IMG = 'https://unpkg.com/three-globe@2.41.12/example/img'

// Beacon = soft glow sprite + white core on the pad, with a tapered light beam fading upward.
// Globe radius is 100 units. The objects layer points +Z away from the surface.
function gradientTexture(paint: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  paint(c.getContext('2d')!, w, h)
  return new CanvasTexture(c)
}
const glowTex = gradientTexture((ctx, w) => {
  const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, w)
}, 64, 64)
// Cylinder UVs run v=0 at the base to v=1 at the top, and the canvas top maps to v=1
const beamTex = gradientTexture((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, 'rgba(255,255,255,0)')
  g.addColorStop(0.6, 'rgba(255,255,255,0.35)')
  g.addColorStop(1, 'rgba(255,255,255,1)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}, 2, 128)

const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending } as const
const beamGeo = new CylinderGeometry(0.03, 0.22, 1, 12, 1, true)
  .translate(0, 0.5, 0) // base at origin
  .rotateX(Math.PI / 2) // +Y -> +Z
const hitGeo = new SphereGeometry(1.6, 8, 6)
const hitMat = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
const coreMat = new SpriteMaterial({ map: glowTex, color: '#ffffff', ...additive })
const mats = new Map<string, { glow: SpriteMaterial; beam: MeshBasicMaterial }>()
const beaconMats = (color: string) => {
  if (!mats.has(color)) mats.set(color, {
    glow: new SpriteMaterial({ map: glowTex, color, ...additive }),
    beam: new MeshBasicMaterial({ map: beamTex, color, side: DoubleSide, ...additive }),
  })
  return mats.get(color)!
}

interface Beacon { root: Group; glow: Sprite; beam: Mesh }

function makeBeacon(color: string): Beacon {
  const m = beaconMats(color)
  const beam = new Mesh(beamGeo, m.beam)
  const glow = new Sprite(m.glow)
  glow.position.z = 0.3
  const core = new Sprite(coreMat)
  core.position.z = 0.3
  core.scale.setScalar(0.7)
  const hit = new Mesh(hitGeo, hitMat) // invisible, makes beacons easier to hover/click
  const root = new Group()
  root.add(beam, glow, core, hit)
  return { root, glow, beam }
}

const padKey = (lat: number, lng: number) => `${lat.toFixed(2)},${lng.toFixed(2)}`

function padLabel(pad: Pad) {
  const l = pad.launches[0]
  const c = country(l.provider.countryCode)
  const more = pad.launches.length > 1 ? `<div class="gl-more">+${pad.launches.length - 1} more from this pad</div>` : ''
  const status = `<div class="gl-status"><span style="color:${statusColor[l.status] ?? '#fff'}">● ${l.status}</span> · ${tMinus(l.net, Date.now())}</div>`
  return `<div class="gl-label"><b>${c.flag} ${l.rocket.fullName}</b><div>${l.name}</div>${status}<div class="gl-sub">${l.location}</div>${more}</div>`
}

interface Props {
  launches: Launch[]
  selected: Launch | null
  onSelect: (l: Launch) => void
}

export default function LaunchGlobe({ launches, selected, onSelect }: Props) {
  const ref = useRef<GlobeMethods | undefined>(undefined)
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pads = useMemo<Pad[]>(() => {
    const m = new Map<string, Pad>()
    for (const l of launches) {
      const key = padKey(l.lat, l.lng)
      if (!m.has(key)) m.set(key, { key, lat: l.lat, lng: l.lng, launches: [] })
      m.get(key)!.launches.push(l)
    }
    return [...m.values()]
  }, [launches])

  // Pulsing rings on the next 5 launches (+ selected), faster for sooner launches
  const rings = useMemo(() => {
    const r = launches.slice(0, 5).map((l, i) => ({ lat: l.lat, lng: l.lng, rank: i, sel: false }))
    if (selected) r.push({ lat: selected.lat, lng: selected.lng, rank: 0, sel: true })
    return r
  }, [launches, selected])

  // Synthetic ascent arcs: launch eastward
  const arcs = useMemo(
    () => launches.slice(0, 12).map(l => ({
      startLat: l.lat, startLng: l.lng,
      endLat: l.lat * 0.6, endLng: l.lng + 25,
      color: statusColor[l.status] ?? '#fff',
      sel: selected?.id === l.id,
    })),
    [launches, selected],
  )

  // Beacons are created by the objects layer; keep a handle on each so the animation loop can update it.
  // The factory must stay referentially stable, or react-globe.gl rebuilds every object on each render.
  const beacons = useRef(new WeakMap<Pad, Beacon>())
  const makePadBeacon = useCallback((d: object) => {
    const pad = d as Pad
    const b = makeBeacon(statusColor[pad.launches[0].status] ?? '#fff')
    beacons.current.set(pad, b)
    return b.root
  }, [])

  const live = useRef({ pads, launches, selected })
  useEffect(() => { live.current = { pads, launches, selected } }, [pads, launches, selected])

  // Beam height encodes how soon the launch is; the next launch and the selection breathe
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const { pads, launches, selected } = live.current
      const t = performance.now() / 1000
      const soonest = launches[0] ? +new Date(launches[0].net) : Date.now()
      const nextKey = launches[0] && padKey(launches[0].lat, launches[0].lng)
      const selKey = selected && padKey(selected.lat, selected.lng)
      for (const pad of pads) {
        const b = beacons.current.get(pad)
        if (!b) continue
        const days = (+new Date(pad.launches[0].net) - soonest) / 864e5
        const sel = pad.key === selKey
        const active = sel || pad.key === nextKey
        const pulse = active ? 1 + 0.25 * Math.sin(t * 3) : 1
        const width = (sel ? 1.8 : 1) * (active ? 1 + 0.15 * Math.sin(t * 7) : 1)
        b.glow.scale.setScalar(3 * (sel ? 1.6 : 1) * pulse)
        b.beam.scale.set(width, width, Math.max(2, 18 - days * 0.6))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Intro: start far away, swoop in, then auto-rotate
  useEffect(() => {
    const g = ref.current
    if (!g) return
    g.pointOfView({ lat: 20, lng: -40, altitude: 6 }, 0)
    const t = setTimeout(() => g.pointOfView({ lat: 25, lng: -60, altitude: 2.4 }, 2500), 300)
    const c = g.controls()
    c.autoRotate = true
    c.autoRotateSpeed = 0.35
    c.enableDamping = true
    return () => clearTimeout(t)
  }, [])

  // Fly to selection
  useEffect(() => {
    const g = ref.current
    if (!g) return
    g.controls().autoRotate = !selected
    if (selected) g.pointOfView({ lat: selected.lat, lng: selected.lng, altitude: 1.5 }, 1500)
  }, [selected])

  return (
    <Globe
      ref={ref}
      width={size.w}
      height={size.h}
      globeImageUrl={`${IMG}/earth-night.jpg`}
      bumpImageUrl={`${IMG}/earth-topology.png`}
      backgroundImageUrl={`${IMG}/night-sky.png`}
      atmosphereColor="#4aa3ff"
      atmosphereAltitude={0.22}
      objectsData={pads}
      objectLat="lat"
      objectLng="lng"
      objectAltitude={0.002}
      objectThreeObject={makePadBeacon}
      objectLabel={p => padLabel(p as Pad)}
      onObjectClick={p => onSelect((p as Pad).launches[0])}
      ringsData={rings}
      ringColor={(r: object) => {
        const sel = (r as { sel: boolean }).sel
        return (t: number) => sel ? `rgba(255,255,255,${1 - t})` : `rgba(120,200,255,${1 - t})`
      }}
      ringMaxRadius={(r: object) => ((r as { sel: boolean }).sel ? 6 : 3.5)}
      ringPropagationSpeed={(r: object) => 3 - (r as { rank: number }).rank * 0.4}
      ringRepeatPeriod={(r: object) => 700 + (r as { rank: number }).rank * 250}
      arcsData={arcs}
      arcColor={(a: object) => [(a as { color: string }).color, 'rgba(255,255,255,0)']}
      arcAltitude={0.35}
      arcStroke={(a: object) => ((a as { sel: boolean }).sel ? 0.9 : 0.35)}
      arcDashLength={0.4}
      arcDashGap={0.6}
      arcDashInitialGap={() => Math.random()}
      arcDashAnimateTime={2200}
    />
  )
}
