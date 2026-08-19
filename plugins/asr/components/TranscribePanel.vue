<script setup>
import { getCurrentInstance, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhInfo from '~icons/ph/info'
import IPhStop from '~icons/ph/stop'
import IPhX from '~icons/ph/x'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import LanguageSelector from './LanguageSelector.vue'

const emit = defineEmits(['close'])

const core = useCore()
const { stores } = core
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()
const { $toast: toast, $t: t } = getCurrentInstance()?.proxy ?? {}

const hiddenElements = []

// WORKAROUND: Hide the document entries list and its header to make room for the transcribe panel.
// This is a standalone approach that directly manipulates the DOM of datashare-client
// to avoid requiring changes in the client codebase.
// A cleaner alternative would be a dedicated hook in datashare-client
// (e.g. "document-entries-list:replace") that hides the list when a plugin registers on it.
onMounted(async () => {
  await asrStore.fetchModels()
  const container = document.querySelector('.document-entries-list__start__list')
  if (container) {
    container.scrollTop = 0
    container.style.overflow = 'visible'
    Array.from(container.children).forEach((child) => {
      if (!child.classList.contains('transcribe-panel')) {
        child.style.display = 'none'
        hiddenElements.push(child)
      }
    })
    hiddenElements.push({ style: container.style, _restoreOverflow: true })
  }
  const header = document.querySelector('.document-entries-list__start__header')
  if (header) {
    header.style.display = 'none'
    hiddenElements.push(header)
  }
})

onUnmounted(() => {
  hiddenElements.forEach((el) => {
    if (el._restoreOverflow) {
      el.style.overflow = ''
    }
    else {
      el.style.display = ''
    }
  })
  hiddenElements.length = 0
})

async function handleTranscribe() {
  const doc = documentStore.document
  const name = doc.title || doc.id
  try {
    await asrStore.transcribe(doc.index, doc.id, { name })
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.success(t?.('asr.transcriptionLaunched', { name }) ?? `Transcription launched for ${name}`, { href, linkLabel })
    emit('close')
  }
  catch {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = t?.('asr.viewTranscriptions') ?? 'View transcriptions'
    toast?.error(t?.('asr.transcriptionError', { name }) ?? `There was an error while launching transcription for ${name}`, { href, linkLabel })
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

    <p class="text-muted small d-flex align-items-start gap-2">
      <i-ph-info class="flex-shrink-0 mt-1" />
      <span>{{ $t('asr.selectLanguagesHint') }}</span>
    </p>

    <p class="text-muted small d-flex align-items-start gap-2">
      <i-ph-info class="flex-shrink-0 mt-1" />
      <span>{{ $t('asr.info') }}</span>
    </p>

    <button
      v-if="!asrStore.isTranscribing"
      class="btn d-flex align-items-center gap-2"
      :class="asrStore.selectedLanguages.length > 0 ? 'btn-action' : 'btn-light'"
      :disabled="asrStore.selectedLanguages.length === 0"
      @click="handleTranscribe"
    >
      <i-ph-file-audio />
      {{ $t('asr.transcribe') }}
    </button>
    <button
      v-else
      class="btn btn-outline-light d-flex align-items-center gap-2"
      @click="asrStore.stopTranscription()"
    >
      <i-ph-stop />
      {{ $t('asr.stopTranscription') }}
    </button>
  </div>
</template>
