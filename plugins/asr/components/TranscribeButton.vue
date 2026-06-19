<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import TranscribePanel from './TranscribePanel.vue'

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
  if (isAudioVideo.value) {
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
  <div v-if="isAudioVideo" class="transcribe-button d-flex align-items-center justify-content-between w-100 px-3 py-2">
    <span v-if="asrStore.isTranscribing" class="text-muted">
      <span class="spinner-border spinner-border-sm me-2" />
      {{ $t('asr.transcriptionInProgress') }}
    </span>
    <span v-else class="text-muted">
      {{ $t('asr.noTextTranscribed') }}
    </span>
    <button
      v-if="canTranscribe"
      class="btn btn-outline-light"
      :disabled="asrStore.isTranscribing"
      @click="openPanel"
    >
      {{ $t('asr.transcribe') }}
    </button>

    <!--
      WORKAROUND: Teleport to the document entries list to replace its content with the transcribe panel.
      This is a standalone approach that avoids modifying datashare-client.
      A cleaner alternative would be a dedicated hook in datashare-client
      (e.g. "document-entries-list:replace") that hides the list when a plugin registers on it.
    -->
    <teleport to=".document-entries-list__start__list">
      <transcribe-panel v-if="panelOpen" @close="closePanel" />
    </teleport>
  </div>
</template>
