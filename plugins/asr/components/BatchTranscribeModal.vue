<script setup>
import { ref, computed, getCurrentInstance, defineAsyncComponent, onMounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhBrain from '~icons/ph/brain'
import IPhInfo from '~icons/ph/info'
import IPhWarning from '~icons/ph/warning'
import { useCore } from '@/composables/useCore'
import { useAsrStore, isEligibleForAsr } from '@/stores/asr'
import LanguageSelector from './LanguageSelector.vue'

const modelValue = defineModel({ type: Boolean })

const props = defineProps({
  selectedDocuments: {
    type: Array,
    default: () => []
  }
})

const core = useCore()
const asrStore = useAsrStore()
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))
const { $toast: toast, $t: t } = getCurrentInstance()?.proxy ?? {}

const MODEL_LABELS = {
  'parakeet': 'Parakeet',
  'parakeet_trt': 'Parakeet TRT',
  'fireredasr2_aed': 'FireRedASR2'
}

const selectedModel = ref('parakeet')

const availableModelNames = computed(() => {
  const models = new Set()
  for (const langs of Object.values(asrStore.availableModels || {})) {
    for (const m of langs) {
      models.add(m)
    }
  }
  return [...models]
})

const eligibleDocs = computed(() => {
  return props.selectedDocuments.filter(doc => isEligibleForAsr(doc.contentType || ''))
})

const ineligibleCount = computed(() => {
  return props.selectedDocuments.length - eligibleDocs.value.length
})

const canTranscribe = computed(() => {
  return !!asrStore.selectedLanguage && eligibleDocs.value.length > 0
})

onMounted(async () => {
  await asrStore.fetchModels()
  if (availableModelNames.value.length && !availableModelNames.value.includes(selectedModel.value)) {
    selectedModel.value = availableModelNames.value[0]
  }
})

async function handleBatchTranscribe() {
  const docs = eligibleDocs.value
  const docsByProject = docs.reduce((acc, doc) => {
    const key = doc.index || doc.routing
    ;(acc[key] ??= []).push(doc)
    return acc
  }, {})

  try {
    const promises = Object.entries(docsByProject).map(([project, projectDocs]) => {
      const docIds = projectDocs.map((doc) => doc.id)
      return asrStore.transcribeBatch(project, docIds, { model: selectedModel.value })
    })
    await Promise.all(promises)
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.success(t?.('asr.batchTranscriptionLaunched', { count: docs.length }, docs.length) ?? `Transcription launched for ${docs.length} documents`, { href, linkLabel })
  }
  catch {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.error(t?.('asr.batchTranscriptionError', { count: docs.length }, docs.length) ?? `There was an error while launching transcription for ${docs.length} documents`, { href, linkLabel })
  }

  modelValue.value = false
}
</script>

<template>
  <component
    :is="AppModal"
    v-model="modelValue"
    size="lg"
    :ok-title="$t('asr.transcribe')"
    ok-only
  >
    <template #header>
      <div class="w-100 position-relative">
        <button
          type="button"
          class="btn-close position-absolute top-0 end-0"
          @click="modelValue = false"
        />
        <h5 class="d-flex align-items-center gap-2 m-0 pe-4">
          <i-ph-file-audio />
          {{ $t('asr.batchModalTitle', { count: eligibleDocs.length }, eligibleDocs.length) }}
        </h5>
      </div>
    </template>

    <div class="d-flex flex-column gap-4">
      <p class="text-muted mb-0">
        <i-ph-info class="me-1" />
        {{ $t('asr.info') }}
      </p>

      <div
        v-if="ineligibleCount > 0"
        class="alert alert-warning mb-0 py-2"
      >
        {{ $t('asr.batchNotEligible', { count: ineligibleCount }, ineligibleCount) }}
      </div>

      <div>
        <language-selector :index="selectedDocuments[0]?.index" />
        <p class="text-muted mb-0 small mt-2">
          <i-ph-warning class="me-1" />
          <strong>{{ $t('asr.batchLanguageWarningTitle') }}</strong>
          {{ $t('asr.batchLanguageWarningText') }}
        </p>
      </div>

      <div class="batch-transcribe-modal__model-selector">
        <label class="form-label m-0 text-nowrap d-flex align-items-center gap-1">
          <IPhBrain />
          {{ $t('asr.selectModel') }}
        </label>
        <b-dropdown
          variant="outline-light"
          boundary="viewport"
          class="w-100"
          toggle-class="w-100 d-flex justify-content-between align-items-center text-truncate"
        >
          <template #button-content>
            {{ MODEL_LABELS[selectedModel] ?? selectedModel }}
          </template>
          <b-dropdown-item
            v-for="m in availableModelNames"
            :key="m"
            :active="selectedModel === m"
            @click="selectedModel = m"
          >
            {{ MODEL_LABELS[m] ?? m }}
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>

    <template #footer>
      <button
        class="btn btn-action d-flex align-items-center gap-2"
        :disabled="!canTranscribe"
        @click="handleBatchTranscribe"
      >
        <i-ph-file-audio />
        {{ $t('asr.transcribe') }}
      </button>
    </template>
  </component>
</template>

<style scoped>
.batch-transcribe-modal__model-selector {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
}
</style>
