<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import LanguageSelector from './LanguageSelector.vue'

const emit = defineEmits(['close'])

const { stores } = useCore()
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

const hiddenElements = []

onMounted(async () => {
  await asrStore.fetchModels()
  const container = document.querySelector('.document-entries-list__start__list')
  if (container) {
    container.scrollTop = 0
    container.style.overflow = 'visible'
    Array.from(container.children).forEach(child => {
      if (!child.classList.contains('transcribe-panel')) {
        child.style.display = 'none'
        hiddenElements.push(child)
      }
    })
    hiddenElements.push({ style: container.style, _restoreOverflow: true })
  }
  // Hide the header
  const header = document.querySelector('.document-entries-list__start__header')
  if (header) {
    header.style.display = 'none'
    hiddenElements.push(header)
  }
})

onUnmounted(() => {
  hiddenElements.forEach(el => {
    if (el._restoreOverflow) {
      el.style.overflow = ''
    } else {
      el.style.display = ''
    }
  })
  hiddenElements.length = 0
})

async function handleTranscribe() {
  const doc = documentStore.document
  await asrStore.transcribe(doc.index, doc.id)
}
</script>

<template>
  <div class="transcribe-panel p-3">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <h4 class="m-0">
        {{ $t('asr.transcribe') }}
      </h4>
      <button class="btn-close btn-close-white" @click="emit('close')" />
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
