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
  const transcriptionDocId = ref(null)
  const isTranscribing = computed(() => taskState.value === 'RUNNING')
  const hasTranscription = computed(() => transcription.value !== null)
  const languages = computed(() => Object.keys(availableModels.value || {}).sort())

  async function fetchTranscription(project, docId) {
    try {
      transcription.value = await api.sendAction(`/api/asr/transcription/${project}/${docId}`)
      transcriptionDocId.value = docId
    }
    catch {
      transcription.value = null
      transcriptionDocId.value = null
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
      data.query = query
    }
    return api.sendAction('/api/asr/transcribe', { method: 'POST', data })
  }

  async function transcribe(project, docId, { model } = {}) {
    const response = await transcribeBatch(project, [docId], { model })
    taskId.value = response.taskId
    taskState.value = 'RUNNING'
  }

  async function stopTranscription() {
    if (!taskId.value) return
    try {
      await api.sendAction(`/api/task/stop/${taskId.value}`, { method: 'PUT' })
      taskState.value = 'CANCELLED'
    }
    catch {
      // task may already be finished
    }
  }

  async function pollTaskStatus() {
    if (!taskId.value) return
    try {
      const task = await api.sendAction(`/api/task/${taskId.value}`)
      taskState.value = task.state
    }
    catch {
      // task not found
    }
  }

  function openPanel() {
    panelOpen.value = true
  }

  function closePanel() {
    panelOpen.value = false
  }

  function reset() {
    selectedLanguage.value = null
    taskId.value = null
    taskState.value = null
    transcription.value = null
    transcriptionDocId.value = null
  }

  return {
    availableModels,
    selectedLanguage,
    panelOpen,
    taskId,
    taskState,
    transcription,
    transcriptionDocId,
    isTranscribing,
    hasTranscription,
    languages,
    fetchTranscription,
    fetchModels,
    transcribe,
    transcribeBatch,
    stopTranscription,
    pollTaskStatus,
    settingsOrder,
    settingsPerPage,
    settingsProperties,
    openPanel,
    closePanel,
    reset
  }
})
