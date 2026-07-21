<script setup>
import { ref, computed, getCurrentInstance, defineAsyncComponent, onMounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
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

const eligibleDocs = computed(() => {
  return props.selectedDocuments.filter(doc => isEligibleForAsr(doc.contentType || ''))
})

const ineligibleCount = computed(() => {
  return props.selectedDocuments.length - eligibleDocs.value.length
})

const canTranscribe = computed(() => {
  return asrStore.selectedLanguages.length > 0 && eligibleDocs.value.length > 0
})

onMounted(() => {
  asrStore.fetchModels()
})

async function handleBatchTranscribe() {
  const docsByProject = {}
  for (const doc of eligibleDocs.value) {
    const project = doc.index || doc.routing
    if (!docsByProject[project]) docsByProject[project] = []
    docsByProject[project].push(doc.id)
  }

  let successCount = 0
  let errorCount = 0

  for (const [project, docIds] of Object.entries(docsByProject)) {
    try {
      const name = `[batch] ${docIds.length} documents`
      await asrStore.transcribeBatch(project, docIds, { name })
      successCount += docIds.length
    } catch {
      errorCount += docIds.length
    }
  }

  if (successCount > 0) {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.success(t?.('asr.batchTranscriptionLaunched', { count: successCount }, successCount) ?? `Transcription launched for ${successCount} documents`, { href, linkLabel })
  }
  if (errorCount > 0) {
    const { href: errorHref } = core.router.resolve({ name: 'task.transcriptions' })
    const errorLinkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.error(t?.('asr.batchTranscriptionError', { count: errorCount }, errorCount) ?? `There was an error while launching transcription for ${errorCount} documents`, { href: errorHref, linkLabel: errorLinkLabel })
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

      <div v-if="ineligibleCount > 0" class="alert alert-warning mb-0 py-2">
        {{ $t('asr.batchNotEligible', { count: ineligibleCount }, ineligibleCount) }}
      </div>

      <div>
        <language-selector />
        <p class="text-muted mb-0 small mt-2">
          <i-ph-warning class="me-1" />
          <strong>{{ $t('asr.batchLanguageWarningTitle') }}</strong>
          {{ $t('asr.batchLanguageWarningText') }}
        </p>
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
