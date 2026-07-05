<script setup>
import { computed, ref, inject, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import TranscribePanel from './TranscribePanel.vue'

const core = useCore()
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))

const { stores } = useCore()
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

const panelOpen = ref(false)

const document = computed(() => documentStore.document)
const isAudioVideo = computed(() => {
  const ct = document.value?.contentType || ''
  return ct.startsWith('audio/') || ct.startsWith('video/')
})

const canTranscribe = computed(() => {
  // TODO: check user role (editor/admin)
  return true
})

const isInModal = inject('modal', false)
const isDuplicateInline = ref(false)

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTimeRange(timestamp) {
  return `${formatTimestamp(timestamp.start_s)}-${formatTimestamp(timestamp.end_s)}`
}

function openPanel() {
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
}

// WORKAROUND: Hide the "No content extracted" message from datashare-client
// when this plugin handles the content area for audio/video files.
// A cleaner alternative would be a hook-aware condition in datashare-client's
// DocumentContent.vue (e.g. hide the message when document.content.body:before has registered hooks).
let noContentObserver = null

function hideNoContent() {
  const el = window.document.querySelector('.document-content__body--no-content')
  if (el) {
    el.style.display = 'none'
    return true
  }
  return false
}

onMounted(() => {
  // When document is rendered both in modal and inline (grid/list view),
  // hide the inline instance to avoid duplicate content below search results
  if (!isInModal && window.document.querySelector('.document-modal')) {
    isDuplicateInline.value = true
    return
  }
  if (isAudioVideo.value) {
    asrStore.fetchTranscription(document.value.index, document.value.id)
    if (!hideNoContent()) {
      noContentObserver = new MutationObserver(() => {
        if (hideNoContent()) {
          noContentObserver.disconnect()
          noContentObserver = null
        }
      })
      noContentObserver.observe(window.document.body, { childList: true, subtree: true })
    }
  }
})

onUnmounted(() => {
  if (noContentObserver) {
    noContentObserver.disconnect()
    noContentObserver = null
  }
  const el = window.document.querySelector('.document-content__body--no-content')
  if (el) {
    el.style.display = ''
  }
})
</script>

<template>
  <div v-if="isAudioVideo && !isDuplicateInline">
    <div v-if="asrStore.hasTranscription" class="transcribe-button alert alert-warning d-flex align-items-center justify-content-between w-100 mb-0 px-3 py-2">
      <span class="d-flex align-items-center gap-2">
        <i-ph-file-audio style="font-size: 1.25em" />
        {{ $t('asr.transcriptionDisclaimer') }}
      </span>
      <button
        v-if="canTranscribe"
        class="btn btn-outline-warning transcribe-button__btn"
        :disabled="asrStore.isTranscribing"
        @click="openPanel"
      >
        {{ $t('asr.transcribeAgain') }}
      </button>
    </div>
    <div v-else class="transcribe-button alert alert-warning d-flex align-items-center justify-content-between w-100 mb-0 px-3 py-2">
      <span v-if="asrStore.isTranscribing">
        <span class="spinner-border spinner-border-sm me-2" />
        {{ $t('asr.transcriptionInProgress') }}
      </span>
      <span v-else class="d-flex align-items-center gap-2">
        <i-ph-file-audio style="font-size: 1.25em" />
        {{ $t('asr.noTextTranscribed') }}
      </span>
      <button
        v-if="canTranscribe"
        class="btn btn-outline-warning transcribe-button__btn"
        :disabled="asrStore.isTranscribing"
        @click="openPanel"
      >
        {{ $t('asr.transcribe') }}
      </button>
    </div>
    <div v-if="asrStore.hasTranscription" class="transcribe-button__content p-3">
      <div v-for="(t, i) in asrStore.transcription.transcripts" :key="i" class="transcribe-button__line d-flex mb-2">
        <span v-if="t.timestamp" class="transcribe-button__timestamp text-muted text-nowrap me-3 flex-shrink-0">{{ formatTimeRange(t.timestamp) }}</span>
        <span>{{ t.text }}</span>
      </div>
    </div>

    <!--
      WORKAROUND: Teleport to the document entries list to replace its content with the transcribe panel.
      This is a standalone approach that avoids modifying datashare-client.
      A cleaner alternative would be a dedicated hook in datashare-client
      (e.g. "document-entries-list:replace") that hides the list when a plugin registers on it.
    -->
    <teleport v-if="!isInModal" to=".document-entries-list__start__list">
      <transcribe-panel v-if="panelOpen" @close="closePanel" />
    </teleport>
    <component
      v-else
      :is="AppModal"
      v-model="panelOpen"
      size="md"
      no-header-close
    >
      <template #header>
        <span />
      </template>
      <transcribe-panel v-if="panelOpen" @close="closePanel" />
      <template #footer>
        <span />
      </template>
    </component>
  </div>
</template>

<style scoped>
.transcribe-button__btn {
  background-color: white;
}

.transcribe-button__btn:hover {
  background-color: var(--bs-warning);
  color: white;
}

.transcribe-button__line {
  align-items: baseline;
}

.transcribe-button__timestamp {
  font-size: 0.85em;
  font-family: monospace;
  width: 13em;
}
</style>
