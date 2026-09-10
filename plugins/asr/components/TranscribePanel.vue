<script setup>
import { getCurrentInstance, defineAsyncComponent, onMounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhBrain from '~icons/ph/brain'
import IPhInfo from '~icons/ph/info'
import IPhX from '~icons/ph/x'
import { useCore } from '@/composables/useCore'
import { useAsrStore, MODEL_LABELS } from '@/stores/asr'
import { useModelSelection } from '@/composables/useModelSelection'
import LanguageSelector from './LanguageSelector.vue'

const emit = defineEmits(['close'])

const core = useCore()
const { stores } = core
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()
const { $toast: toast, $t: t } = getCurrentInstance()?.proxy ?? {}

const { selectedModel, allModelNames, isModelDisabled } = useModelSelection()

onMounted(async () => {
  await asrStore.fetchModels()
  if (allModelNames.value.length && !allModelNames.value.includes(selectedModel.value)) {
    selectedModel.value = allModelNames.value[0]
  }
})

async function handleTranscribe() {
  const doc = documentStore.document
  const displayName = doc.title || doc.id
  try {
    await asrStore.transcribe(doc.index, doc.id, { model: selectedModel.value })
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.success(t?.('asr.transcriptionLaunched', { name: displayName }) ?? `Transcription launched for ${displayName}`, { href, linkLabel })
    emit('close')
  }
  catch {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.error(t?.('asr.transcriptionError', { name: displayName }) ?? `There was an error while launching transcription for ${displayName}`, { href, linkLabel })
  }
}
</script>

<template>
  <div class="transcribe-panel p-3">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="m-0 d-flex align-items-center gap-2">
        <i-ph-file-audio />
        {{ $t('asr.transcribe') }}
      </h4>
      <component
        :is="ButtonIcon"
        :icon-left="IPhX"
        hide-label
        variant="outline-secondary"
        :label="$t('asr.close')"
        @click="emit('close')"
      />
    </div>

    <language-selector class="mb-3" />

    <div class="transcribe-panel__model-selector mb-3">
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
          v-for="m in allModelNames"
          :key="m"
          :active="selectedModel === m"
          :disabled="isModelDisabled(m)"
          @click="selectedModel = m"
        >
          {{ MODEL_LABELS[m] ?? m }}
        </b-dropdown-item>
      </b-dropdown>
    </div>

    <p
      v-if="selectedModel === 'parakeet'"
      class="text-muted small mb-2"
    >
      {{ $t('asr.newForm.parakeetInfo') }}
    </p>
    <p
      v-if="selectedModel === 'parakeet_trt'"
      class="text-muted small mb-2"
    >
      {{ $t('asr.newForm.parakeetTrtInfo') }}
    </p>
    <p
      v-if="selectedModel === 'fireredasr2_aed'"
      class="text-muted small mb-2"
    >
      {{ $t('asr.newForm.fireredasr2Info') }}
    </p>

    <p class="text-muted small d-flex align-items-start gap-2">
      <i-ph-info class="flex-shrink-0 mt-1" />
      <span>{{ $t('asr.info') }}</span>
    </p>

    <button
      class="btn d-flex align-items-center gap-2"
      :class="asrStore.selectedLanguage && selectedModel ? 'btn-action' : 'btn-light'"
      :disabled="!asrStore.selectedLanguage || !selectedModel"
      @click="handleTranscribe"
    >
      <i-ph-file-audio />
      {{ $t('asr.transcribe') }}
    </button>
  </div>
</template>

<style scoped>
.transcribe-panel__model-selector {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
}
</style>
