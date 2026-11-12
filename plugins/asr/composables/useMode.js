import { computed } from 'vue'
import { useCore } from './useCore'

export const SERVER_MODE = 'SERVER'

export function isServerMode(core) {
  return core?.mode?.modeName === SERVER_MODE
}

export function useMode() {
  const core = useCore()
  const isServer = computed(() => isServerMode(core))
  return { isServer }
}
