import { useEffect, useState } from 'react'

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function tMinus(target: string, now: number) {
  let s = Math.floor((+new Date(target) - now) / 1000)
  const sign = s < 0 ? '+' : '-'
  s = Math.abs(s)
  const d = Math.floor(s / 86400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hms = `${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
  return `T${sign} ${d ? `${d}d ` : ''}${hms}`
}

export const statusColor: Record<string, string> = {
  Go: '#3ef0a0', TBC: '#5aa8ff', TBD: '#ffb648', Hold: '#ff5a6a', 'In Flight': '#d77bff',
}
