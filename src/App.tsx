import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Launch } from './types'
import { fetchLaunches } from './api/launches'
import LaunchGlobe from './components/LaunchGlobe'
import LaunchList from './components/LaunchList'
import LaunchDetail from './components/LaunchDetail'
import Countdown from './components/Countdown'
import Legend from './components/Legend'

export default function App() {
  const [launches, setLaunches] = useState<Launch[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Launch | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(false)

  const load = useCallback((force = false) => {
    fetchLaunches(force).then(setLaunches).catch(e => setError(String(e.message ?? e)))
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(() => load(), 10 * 60 * 1000)
    return () => clearInterval(id)
  }, [load])

  const countries = useMemo(
    () => [...new Set(launches.map(l => l.provider.countryCode).filter(Boolean))].sort(),
    [launches],
  )
  const shown = useMemo(
    () => (filter ? launches.filter(l => l.provider.countryCode === filter) : launches),
    [launches, filter],
  )
  const next = launches.find(l => +new Date(l.net) > Date.now() - 10 * 60 * 1000)

  const select = (l: Launch) => { setSelected(l); setListOpen(false) }

  return (
    <div className="app">
      <motion.div className="globe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }}>
        <LaunchGlobe launches={shown} selected={selected} onSelect={select} />
      </motion.div>

      <motion.header className="header" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
        <h1>Rocket Launches <span>Worldwide</span></h1>
        <Countdown launch={next} onClick={() => next && select(next)} />
      </motion.header>

      <motion.aside className={`side panel ${listOpen ? 'open' : ''}`}
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.9 }}>
        <button className="sheet-handle" onClick={() => setListOpen(o => !o)}>
          {listOpen ? 'Hide' : `Upcoming launches (${shown.length})`}
        </button>
        {error && <div className="error">{error} <button onClick={() => load(true)}>Retry</button></div>}
        {!launches.length && !error && <div className="loading">Scanning launch sites…</div>}
        <LaunchList launches={shown} selectedId={selected?.id} onSelect={select}
          countries={countries} filter={filter} onFilter={setFilter} />
      </motion.aside>

      {/* Legend and detail share the bottom-left corner; the detail panel takes it while open */}
      <AnimatePresence mode="wait">
        {selected
          ? <LaunchDetail key="detail" launch={selected} onClose={() => setSelected(null)} />
          : <Legend key="legend" />}
      </AnimatePresence>

      <footer className="credit">Data: <a href="https://thespacedevs.com" target="_blank" rel="noreferrer">The Space Devs</a></footer>
    </div>
  )
}
