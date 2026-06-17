<script setup>
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import LanguageSelector from './LanguageSelector.vue'

const { stores } = useCore()
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

async function handleTranscribe() {
  const doc = documentStore.document
  await asrStore.transcribe(doc.index, doc.id)
}
</script>

<template>
  <div v-if="asrStore.panelOpen" class="transcribe-panel p-3">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="m-0">
        {{ $t('asr.transcribe') }}
      </h4>
      <button class="btn btn-close" @click="asrStore.closePanel()" />
    </div>

    <language-selector class="mb-3" />

    <p class="text-muted small">
      {{ $t('asr.info') }}
    </p>

    <button
      v-if="!asrStore.isTranscribing"
      class="btn btn-light"
      :disabled="asrStore.selectedLanguages.length === 0"
      @click="handleTranscribe"
    >
      {{ $t('asr.transcribe') }}
    </button>
    <button
      v-else
      class="btn btn-outline-light"
      @click="asrStore.stopTranscription()"
    >
      {{ $t('asr.stopTranscription') }}
    </button>
  </div>
</template>

<style scoped>
.transcribe-panel {
  height: 100%;
}
</style>
