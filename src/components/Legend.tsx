import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { statusColor } from '../useNow'

const STATUSES: [string, string][] = [
  ['Go', 'Go for launch'],
  ['TBC', 'Date to be confirmed'],
  ['TBD', 'Date not set yet'],
  ['Hold', 'On hold'],
  ['In Flight', 'In flight'],
]

export default function Legend() {
  // Open by default on desktop; on phones it would cover the globe, so start collapsed
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 761px)').matches)

  return (
    <motion.div className="legend panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20, transition: { duration: 0.15 } }} transition={{ delay: 0.3 }}>
      <button className="legend-toggle" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>Reading the globe</span>
        <span className="legend-chev">{open ? '−' : '+'}</span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="legend-body" initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="legend-section">
              <div className="legend-beacons" aria-hidden>
                {[100, 70, 45, 22, 10].map(h => <i key={h} style={{ height: `${h}%` }} />)}
              </div>
              <div>
                <b>Each glowing beacon is a launch pad.</b>
                <div className="legend-note">Taller beam = its next launch is sooner. The tallest beam is the next launch on Earth; pads ~4 weeks out are just a glow.</div>
              </div>
            </div>
            <div className="legend-label">Beacon color = launch status</div>
            <ul className="legend-statuses">
              {STATUSES.map(([abbrev, label]) => (
                <li key={abbrev}><span className="dot" style={{ background: statusColor[abbrev] }} />{label}</li>
              ))}
            </ul>
            <div className="legend-note">
              Pulsing rings mark the next 5 launches, and the very next launch's beacon breathes. Flowing arcs are illustrative ascents, not real trajectories.
              Several launches from one pad share a beacon — hover to see them.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
