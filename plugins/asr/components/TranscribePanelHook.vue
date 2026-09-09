<script setup>
import { useAsrStore } from '@/stores/asr'
import TranscribePanel from './TranscribePanel.vue'

const asrStore = useAsrStore()
</script>

<template>
  <div
    v-if="asrStore.panelOpen"
    class="transcribe-panel-hook"
  >
    <transcribe-panel @close="asrStore.closePanel()" />
  </div>
</template>

<style>
.transcribe-panel-hook {
  flex: 1;
}

.transcribe-panel-hook ~ * {
  display: none !important;
}

.document-entries-list__start:has(.transcribe-panel-hook) > .document-entries-list__start__header {
  display: none !important;
}
</style>
