<<<<<<< HEAD
import { stripJacksonTypes, unwrapJacksonList } from './jackson'

export function getDocs(task) {
  if (!task) return []
  const docs = task.args?.docs || []
  return unwrapJacksonList(docs)
}

export function taskErrorFull(task) {
  if (!task?.error) return 'Unknown error'
  const message = task.error.message || task.error.cause || task.error.name || 'Unknown error'
  if (!task.error.stacktrace?.length) return message
  const stacktrace = task.error.stacktrace
    .map(frame => `  at ${frame.name}(${frame.file}:${frame.lineno})`)
    .join('\n')
  return `${message}\n${stacktrace}`
}

export function isQueryBasedDocs(docs) {
  if (!docs) return false
  if (!Array.isArray(docs)) return typeof docs === 'object'
  if (docs.length === 2 && typeof docs[0] === 'string' && docs[0].startsWith('java.util.')) {
    return typeof docs[1] === 'object' && !Array.isArray(docs[1])
  }
  return false
}

function extractQueryLabel(obj) {
  if (!obj || typeof obj !== 'object') return null
  const keys = Object.keys(obj)
  if (keys.length === 0) return '*'
  if (keys.length === 1 && keys[0] === 'match_all') return '*'
  if (keys.length === 1 && keys[0] === 'query_string' && obj.query_string?.query) return obj.query_string.query
  return null
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
  const label = extractQueryLabel(cleaned)
  if (label) return label
  if (cleaned.bool?.must) {
    const must = Array.isArray(cleaned.bool.must) ? cleaned.bool.must : [cleaned.bool.must]
    for (const clause of must) {
      const l = extractQueryLabel(clause)
      if (l) return l
    }
  }
  return '*'
}
||||||| parent of 29b8115 (feat: add transcriptions list page, detail page, sidebar and board entries)
=======
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
>>>>>>> 29b8115 (feat: add transcriptions list page, detail page, sidebar and board entries)
