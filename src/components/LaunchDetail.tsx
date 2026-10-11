import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Launch } from '../types'
import { country } from '../countries'
import { statusColor, tMinus, useNow } from '../useNow'

export default function LaunchDetail({ launch, onClose }: { launch: Launch; onClose: () => void }) {
  const now = useNow()
  const c = country(launch.provider.countryCode)
  const variant = [launch.rocket.family, launch.rocket.variant].filter(Boolean).join(' · ')
  return (
    <motion.div className="detail panel" key={launch.id}
      initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 40, scale: 0.96 }} transition={{ type: 'spring', damping: 22, stiffness: 220 }}>
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <Hero key={launch.id} images={launch.images} alt={launch.rocket.fullName} />
      <div className="detail-body">
        <span className="status" style={{ color: statusColor[launch.status] ?? '#fff' }}>● {launch.statusName}</span>
        <h2>{launch.rocket.fullName}</h2>
        <div className="mission">{launch.name}</div>
        <div className="clock small">{tMinus(launch.net, now)}</div>
        <div className="when">{new Date(launch.net).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
        <dl>
          <dt>Country</dt><dd>{c.flag} {c.name}</dd>
          <dt>Provider</dt><dd>{launch.provider.name}{launch.provider.type && <span className="badge">{launch.provider.type}</span>}</dd>
          {variant && <><dt>Rocket</dt><dd>{variant}</dd></>}
          {launch.orbit && <><dt>Orbit</dt><dd>{launch.orbit}</dd></>}
          <dt>Pad</dt><dd>{launch.padName}<br /><span className="muted">{launch.location}</span></dd>
        </dl>
        <div className="links">
          <a href={launch.rocket.wikiUrl} target="_blank" rel="noreferrer">Rocket on Wikipedia ↗</a>
          <a href={launch.provider.wikiUrl} target="_blank" rel="noreferrer">{launch.provider.name} on Wikipedia ↗</a>
          {launch.webcastUrl && <a className="live" href={launch.webcastUrl} target="_blank" rel="noreferrer">Watch webcast ↗</a>}
        </div>
      </div>
    </motion.div>
  )
}

// Launch Library image links are sometimes dead (404), so try each candidate in
// turn and end on a drawn beacon placeholder — every launch always shows a picture.
function Hero({ images, alt }: { images: string[]; alt: string }) {
  const [failed, setFailed] = useState(0)
  const src = images[failed]
  if (!src) return <div className="hero hero-fallback" aria-hidden />
  return <img className="hero" src={src} alt={alt} onError={() => setFailed(failed + 1)} />
}
