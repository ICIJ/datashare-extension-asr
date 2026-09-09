import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

const DEFAULT_BATCH_SIZE = 2

export const SUPPORTED_CONTENT_TYPES = new Set([
  'audio/aac',
  'audio/aiff',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/vnd.wave',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/x-pn-wav',
  'video/mp4',
  'video/mpeg',
  'video/mov'
])

export const MODEL_LABELS = {
  'parakeet': 'Parakeet',
  'parakeet_trt': 'Parakeet TRT',
  'fireredasr2_aed': 'FireRedASR2'
}

export function isEligibleForAsr(contentType) {
  return SUPPORTED_CONTENT_TYPES.has(contentType)
}

export const useAsrStore = defineStore('asr', () => {
  const api = useApi()

  const availableModels = ref({})
  const selectedLanguage = ref(null)
  const panelOpen = ref(false)
  const taskId = ref(null)
  const taskState = ref(null) // null | 'RUNNING' | 'DONE' | 'ERROR' | 'CANCELLED'

  const settingsOrder = ref('desc')
  const settingsPerPage = ref(25)
  const settingsProperties = ref(['state', 'name', 'progress', 'category', 'language', 'model', 'project', 'user', 'launchedOn'])

  const transcription = ref(null)
  const isTranscribing = computed(() => taskState.value === 'RUNNING')
  const hasTranscription = computed(() => transcription.value !== null)
  const languages = computed(() => Object.keys(availableModels.value || {}).sort())

  async function fetchTranscription(project, docId) {
    try {
      transcription.value = await api.sendAction(`/api/asr/transcription/${project}/${docId}`)
    }
    catch {
      transcription.value = null
    }
  }

  async function fetchModels() {
    try {
      availableModels.value = await api.sendAction('/api/asr/models')
    }
    catch {
      availableModels.value = {}
    }
  }

  async function transcribeBatch(project, docIds, { model, query } = {}) {
    const data = {
      project,
      docs: docIds,
      model,
      language: selectedLanguage.value,
      batch_size: DEFAULT_BATCH_SIZE
    }
    if (query) {
      data.docs = query
    }
    return api.sendAction('/api/asr/transcribe', { method: 'POST', data })
  }

  async function transcribe(project, docId, { model } = {}) {
    const response = await transcribeBatch(project, [docId], { model })
    taskId.value = response.taskId
    taskState.value = 'RUNNING'
  }

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  return {
    availableModels,
    selectedLanguage,
    panelOpen,
    taskId,
    taskState,
    transcription,
    isTranscribing,
    hasTranscription,
    languages,
    fetchTranscription,
    fetchModels,
    transcribe,
    transcribeBatch,
    openPanel,
    closePanel,
    settingsOrder,
    settingsPerPage,
    settingsProperties
  }
})
