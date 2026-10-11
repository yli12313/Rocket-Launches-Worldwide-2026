import { motion } from 'framer-motion'
import type { Launch } from '../types'
import { country } from '../countries'
import { statusColor, tMinus, useNow } from '../useNow'

interface Props {
  launches: Launch[]
  selectedId?: string
  onSelect: (l: Launch) => void
  countries: string[]
  filter: string | null
  onFilter: (c: string | null) => void
}

export default function LaunchList({ launches, selectedId, onSelect, countries, filter, onFilter }: Props) {
  const now = useNow()
  return (
    <div className="list-wrap">
      <div className="chips">
        <button className={`chip ${!filter ? 'on' : ''}`} onClick={() => onFilter(null)}>All</button>
        {countries.map(c => (
          <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => onFilter(c)}
            title={country(c).name}>{country(c).flag} {c}</button>
        ))}
      </div>
      <motion.ul className="list" initial="hidden" animate="show" key={filter ?? 'all'}
        variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        {launches.map(l => {
          const c = country(l.provider.countryCode)
          return (
            <motion.li key={l.id}
              variants={{ hidden: { opacity: 0, x: 30 }, show: { opacity: 1, x: 0 } }}
              whileHover={{ x: -4 }}
              className={`row ${selectedId === l.id ? 'sel' : ''}`}
              onClick={() => onSelect(l)}>
              <span className="dot" style={{ background: statusColor[l.status] ?? '#fff' }} />
              <div className="row-main">
                <div className="row-title">{c.flag} {l.rocket.fullName}</div>
                <div className="row-sub">{l.name} · {l.provider.name}</div>
              </div>
              <div className="row-time">{tMinus(l.net, now).replace(/:\d\d$/, '')}</div>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
