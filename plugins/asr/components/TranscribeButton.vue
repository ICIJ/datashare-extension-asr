<script setup>
import { computed } from 'vue'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'

const { stores } = useCore()
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

const document = computed(() => documentStore.document)
const isAudioVideo = computed(() => {
  const ct = document.value?.contentType || ''
  return ct.startsWith('audio/') || ct.startsWith('video/')
})

const canTranscribe = computed(() => {
  // TODO: check user role (editor/admin)
  return true
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
      @click="asrStore.openPanel()"
    >
      {{ $t('asr.transcribe') }}
    </button>
  </div>
</template>
