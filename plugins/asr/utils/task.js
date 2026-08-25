import { stripJacksonTypes, unwrapJacksonList } from './jackson'

export function getDocs(task) {
  if (!task) return []
  const docs = task.args?.docs || []
  return unwrapJacksonList(docs)
}

export function queryLabel(task) {
  const raw = task?.args?.docs
  if (!raw) return '—'
  let query = raw
  if (Array.isArray(raw) && raw.length === 2 && typeof raw[0] === 'string' && raw[0].startsWith('java.util.')) {
    query = raw[1]
  }
  if (!query || typeof query !== 'object' || Array.isArray(query)) return '—'
  const cleaned = stripJacksonTypes(query)
  const keys = Object.keys(cleaned)
  if (keys.length === 0) return '*'
  if (keys.length === 1 && keys[0] === 'match_all') return '*'
  if (keys.length === 1 && keys[0] === 'query_string' && cleaned.query_string?.query) return cleaned.query_string.query
  return JSON.stringify(cleaned)
}
