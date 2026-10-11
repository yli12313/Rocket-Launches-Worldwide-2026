// Launch Library uses ISO alpha-3 codes; flags need alpha-2.
const A3: Record<string, string> = {
  USA: 'US', RUS: 'RU', CHN: 'CN', IND: 'IN', JPN: 'JP', FRA: 'FR', GUF: 'GF', NZL: 'NZ',
  KAZ: 'KZ', KOR: 'KR', PRK: 'KP', IRN: 'IR', ISR: 'IL', GBR: 'GB', DEU: 'DE', ESP: 'ES',
  ITA: 'IT', AUS: 'AU', CAN: 'CA', BRA: 'BR', NOR: 'NO', SWE: 'SE', UKR: 'UA', EUR: 'EU',
}
const names = new Intl.DisplayNames(['en'], { type: 'region' })

export function country(code: string): { flag: string; name: string } {
  const a2 = A3[code] ?? (code.length === 2 ? code : '')
  if (!a2) return { flag: '🌐', name: code || 'International' }
  if (a2 === 'EU') return { flag: '🇪🇺', name: 'Europe' }
  const flag = String.fromCodePoint(...[...a2].map(c => 0x1f1e6 + c.charCodeAt(0) - 65))
  return { flag, name: code === 'USA' ? 'United States' : names.of(a2) ?? code }
}
