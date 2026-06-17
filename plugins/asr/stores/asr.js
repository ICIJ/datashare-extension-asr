import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useApi } from '@/composables/useApi'

export const useAsrStore = defineStore('asr', () => {
  const api = useApi()

  const availableModels = ref({})
  const selectedLanguages = ref([])
  const panelOpen = ref(false)
  const taskId = ref(null)
  const taskState = ref(null) // null | 'RUNNING' | 'DONE' | 'ERROR' | 'CANCELLED'

  const isTranscribing = computed(() => taskState.value === 'RUNNING')
  const languages = computed(() => Object.keys(availableModels.value).sort())

  async function fetchModels() {
    try {
      availableModels.value = await api.sendAction('/api/asr/models')
    } catch {
      availableModels.value = {}
    }
  }

  async function transcribe(project, docId) {
    const response = await api.sendAction('/api/asr/transcribe', {
      method: 'POST',
      data: {
        project,
        docs: [docId],
        batch_size: 2
      }
    })
    taskId.value = response.taskId
    taskState.value = 'RUNNING'
  }

  async function stopTranscription() {
    if (!taskId.value) return
    try {
      await api.sendAction(`/api/task/stop/${taskId.value}`, { method: 'PUT' })
      taskState.value = 'CANCELLED'
    } catch {
      // task may already be finished
    }
  }

  async function pollTaskStatus() {
    if (!taskId.value) return
    try {
      const task = await api.sendAction(`/api/task/${taskId.value}`)
      taskState.value = task.state
    } catch {
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
    selectedLanguages.value = []
    taskId.value = null
    taskState.value = null
  }

  return {
    availableModels,
    selectedLanguages,
    panelOpen,
    taskId,
    taskState,
    isTranscribing,
    languages,
    fetchModels,
    transcribe,
    stopTranscription,
    pollTaskStatus,
    openPanel,
    closePanel,
    reset
  }
})
