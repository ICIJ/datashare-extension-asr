<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { useCore } from '@/composables/useCore'
import { useAsrStore, isEligibleForAsr } from '@/stores/asr'
import TranscribePanel from './TranscribePanel.vue'

const { stores } = useCore()
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

const panelOpen = ref(false)

const document = computed(() => documentStore.document)
const contentType = computed(() => document.value?.contentType || '')
const isAudioVideo = computed(() => contentType.value.startsWith('audio/') || contentType.value.startsWith('video/'))
const isEligible = computed(() => isEligibleForAsr(contentType.value))

let observer = null
const injectedEl = ref(null)

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTimeRange(timestamp) {
  return `${formatTimestamp(timestamp.start_s)}-${formatTimestamp(timestamp.end_s)}`
}

function removeInjected() {
  if (injectedEl.value) {
    injectedEl.value.remove()
    injectedEl.value = null
  }
}

function tryInject() {
  if (injectedEl.value) return
  const viewer = window.document.querySelector('.audio-viewer, .video-viewer')
  if (!viewer) return

  const el = window.document.createElement('div')
  el.setAttribute('data-asr-viewer-panel', 'true')
  viewer.parentNode.insertBefore(el, viewer.nextSibling)
  injectedEl.value = el
}

onMounted(() => {
  observer = new MutationObserver(() => {
    const viewer = window.document.querySelector('.audio-viewer, .video-viewer')
    if (viewer) {
      tryInject()
    } else if (injectedEl.value) {
      removeInjected()
    }
  })
  observer.observe(window.document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  removeInjected()
})

// Fetch transcription when document changes
watch(() => document.value?.id, (id) => {
  if (id && isAudioVideo.value && isEligible.value) {
    asrStore.fetchTranscription(document.value.index, id)
  }
}, { immediate: true })
</script>

<template>
  <teleport v-if="injectedEl" to="[data-asr-viewer-panel]">
    <div v-if="isAudioVideo && isEligible" class="mt-3">
      <div v-if="asrStore.hasTranscription">
        <div class="alert alert-warning d-flex align-items-center justify-content-between mb-3 px-3 py-2">
          <span class="d-flex align-items-center gap-2">
            <i-ph-file-audio style="font-size: 1.25em" />
            {{ $t('asr.transcriptionDisclaimer') }}
          </span>
          <button
            class="btn btn-outline-warning transcribe-viewer-panel__btn"
            :disabled="asrStore.isTranscribing"
            @click="panelOpen = true"
          >
            {{ $t('asr.transcribeAgain') }}
          </button>
        </div>
        <div class="transcribe-viewer-panel__content px-3">
          <div v-for="(t, i) in asrStore.transcription.transcripts" :key="i" class="transcribe-viewer-panel__line d-flex mb-2">
            <span v-if="t.timestamp" class="transcribe-viewer-panel__timestamp text-muted text-nowrap me-3 flex-shrink-0">{{ formatTimeRange(t.timestamp) }}</span>
            <span>{{ t.text }}</span>
          </div>
        </div>
      </div>
      <div v-else class="alert alert-warning d-flex align-items-center justify-content-between px-3 py-2">
        <span v-if="asrStore.isTranscribing">
          <span class="spinner-border spinner-border-sm me-2" />
          {{ $t('asr.transcriptionInProgress') }}
        </span>
        <span v-else class="d-flex align-items-center gap-2">
          <i-ph-file-audio style="font-size: 1.25em" />
          {{ $t('asr.noTextTranscribed') }}
        </span>
        <button
          class="btn btn-outline-warning transcribe-viewer-panel__btn"
          :disabled="asrStore.isTranscribing"
          @click="panelOpen = true"
        >
          {{ $t('asr.transcribe') }}
        </button>
      </div>
    </div>
  </teleport>
  <teleport to=".document-entries-list__start__list">
    <transcribe-panel v-if="panelOpen" @close="panelOpen = false" />
  </teleport>
</template>

<style>
.transcribe-viewer-panel__btn {
  background-color: white;
}

.transcribe-viewer-panel__btn:hover {
  background-color: var(--bs-warning);
  color: white;
}

.transcribe-viewer-panel__timestamp {
  font-size: 0.85em;
  font-family: monospace;
  width: 13em;
}

.transcribe-viewer-panel__line {
  align-items: baseline;
}
</style>
