import { AnimatePresence, motion } from 'framer-motion'
import type { Launch } from '../types'
import { country } from '../countries'
import { tMinus, useNow } from '../useNow'

export default function Countdown({ launch, onClick }: { launch?: Launch; onClick: () => void }) {
  const now = useNow()
  if (!launch) return null
  const diff = +new Date(launch.net) - now
  const liftoff = diff <= 0 && diff > -10 * 60 * 1000
  return (
    <button className="countdown" onClick={onClick}>
      <span className="eyebrow">Next launch · {country(launch.provider.countryCode).flag} {launch.rocket.fullName}</span>
      <AnimatePresence mode="wait">
        {liftoff ? (
          <motion.span key="lift" className="clock liftoff"
            initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [1, 1.08, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.8 }}>LIFTOFF</motion.span>
        ) : (
          <motion.span key="clock" className="clock" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {tMinus(launch.net, now)}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sub">{launch.name}</span>
    </button>
  )
}
