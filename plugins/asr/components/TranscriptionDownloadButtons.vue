<script setup>
import { computed, defineAsyncComponent, onMounted } from 'vue'
import IPhDownloadSimple from '~icons/ph/download-simple'
import { useCore } from '@/composables/useCore'
import { useAsrStore, isEligibleForAsr } from '@/stores/asr'

const props = defineProps({
  document: {
    type: Object,
    required: true
  }
})

const core = useCore()
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const asrStore = useAsrStore()

const contentType = computed(() => props.document?.contentType || '')
const isEligible = computed(() => isEligibleForAsr(contentType.value))

onMounted(() => {
  if (isEligible.value && !asrStore.hasTranscription) {
    asrStore.fetchTranscription(props.document.index, props.document.id)
  }
})

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function formatTimeRange(timestamp) {
  return `${formatTimestamp(timestamp.start_s)}-${formatTimestamp(timestamp.end_s)}`
}

function downloadFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadTranscription() {
  const text = asrStore.transcription.transcripts.map(t => t.text).join('\n')
  const name = props.document.title || props.document.id
  downloadFile(text, `${name}_transcription.txt`)
}

function downloadWithTimestamps() {
  const text = asrStore.transcription.transcripts.map(t => {
    const ts = t.timestamp ? `[${formatTimeRange(t.timestamp)}] ` : ''
    return `${ts}${t.text}`
  }).join('\n')
  const name = props.document.title || props.document.id
  downloadFile(text, `${name}_transcription_timestamps.txt`)
}
</script>

<template>
  <template v-if="isEligible && asrStore.hasTranscription">
    <component
      :is="ButtonIcon"
      :icon-left="IPhDownloadSimple"
      :label="$t('asr.downloadTranscription')"
      variant="outline-action"
      class="document-download-popover__body__button"
      @click="downloadTranscription"
    />
    <component
      :is="ButtonIcon"
      :icon-left="IPhDownloadSimple"
      :label="$t('asr.downloadWithTimestamps')"
      variant="outline-action"
      class="document-download-popover__body__button"
      @click="downloadWithTimestamps"
    />
  </template>
</template>
