export function capitalize(str) {
  if (!str || str === '—') return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' })

export function languageName(code) {
  try {
    return languageDisplayNames.of(code) || code
  }
  catch {
    return code
  }
}

export function displayLanguage(code) {
  if (!code || typeof code !== 'string') return '—'
  try {
    const name = languageDisplayNames.of(code)
    if (name) return capitalize(name)
  }
  catch {
    // not an ISO code
  }
  return capitalize(code)
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function formatTaskTimestamp(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
}

export function formatTimeRange(timestamp) {
  return `${formatTimestamp(timestamp.start_s)}-${formatTimestamp(timestamp.end_s)}`
}
