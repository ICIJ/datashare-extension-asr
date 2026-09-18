import { ref, computed, watch } from 'vue'
import { useAsrStore } from '@/stores/asr'

export function useModelSelection() {
  const asrStore = useAsrStore()
  const selectedModel = ref(null)

  const allModelNames = computed(() => {
    const models = new Set()
    for (const langs of Object.values(asrStore.availableModels || {})) {
      for (const m of langs) {
        models.add(m)
      }
    }
    return [...models]
  })

  const modelsForLanguage = computed(() => {
    const lang = asrStore.selectedLanguage
    if (!lang || !asrStore.availableModels?.[lang]) return []
    return asrStore.availableModels[lang]
  })

  function isModelDisabled(model) {
    return modelsForLanguage.value.length === 0 || !modelsForLanguage.value.includes(model)
  }

  watch([() => asrStore.selectedLanguage, () => asrStore.availableModels], () => {
    if (modelsForLanguage.value.length) {
      if (isModelDisabled(selectedModel.value)) {
        selectedModel.value = modelsForLanguage.value[0]
      }
    } else {
      selectedModel.value = null
    }
  }, { immediate: true })

  return { selectedModel, allModelNames, isModelDisabled }
}
