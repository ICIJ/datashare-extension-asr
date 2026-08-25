export function stripJacksonTypes(obj) {
  if (Array.isArray(obj)) return obj.map(stripJacksonTypes)
  if (obj && typeof obj === 'object') {
    const cleaned = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k !== '@type') cleaned[k] = stripJacksonTypes(v)
    }
    return cleaned
  }
  return obj
}

export function unwrapJacksonList(arr) {
  if (!Array.isArray(arr)) return []
  if (arr.length === 2 && arr[0] === 'java.util.ArrayList') {
    return arr[1]
  }
  return arr
}
