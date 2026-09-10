<script setup>
import { computed, inject, defineAsyncComponent, onMounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { useCore } from '@/composables/useCore'
import { useAsrStore, isEligibleForAsr } from '@/stores/asr'
import { formatTimeRange } from '@/utils/formatting'
import TranscribePanel from './TranscribePanel.vue'

const core = useCore()
const { stores } = core
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))
const isInModal = inject('modal', false)
const documentStore = stores.useDocumentStore()
const asrStore = useAsrStore()

const document = computed(() => documentStore.document)
const contentType = computed(() => document.value?.contentType || '')
const isEligible = computed(() => isEligibleForAsr(contentType.value))

onMounted(() => {
  if (isEligible.value) {
    asrStore.fetchTranscription(document.value.index, document.value.id)
  }
})

</script>

<template>
  <div
    v-if="isEligible"
    class="mt-3"
  >
    <div v-if="asrStore.hasTranscription">
      <div class="alert alert-warning d-flex align-items-center justify-content-between mb-3 px-3 py-2">
        <span class="d-flex align-items-center gap-2">
          <i-ph-file-audio style="font-size: 1.25em" />
          {{ $t('asr.transcriptionDisclaimer') }}
        </span>
        <button
          class="btn btn-outline-warning transcribe-viewer-panel__btn"
          @click="asrStore.openPanel()"
        >
          {{ $t('asr.transcribeAgain') }}
        </button>
      </div>
      <div class="transcribe-viewer-panel__content px-3">
        <div
          v-for="(t, i) in asrStore.transcription.transcripts"
          :key="i"
          class="transcribe-viewer-panel__line d-flex mb-2"
        >
          <span
            v-if="t.timestamp"
            class="transcribe-viewer-panel__timestamp text-muted text-nowrap me-3 flex-shrink-0"
          >{{ formatTimeRange(t.timestamp) }}</span>
          <span>{{ t.text }}</span>
        </div>
      </div>
    </div>
    <div
      v-else
      class="alert alert-warning d-flex align-items-center justify-content-between px-3 py-2"
    >
      <span class="d-flex align-items-center gap-2">
        <i-ph-file-audio style="font-size: 1.25em" />
        {{ $t('asr.noTextTranscribed') }}
      </span>
      <button
        class="btn btn-outline-warning transcribe-viewer-panel__btn"
        @click="asrStore.openPanel()"
      >
        {{ $t('asr.transcribe') }}
      </button>
    </div>
    <component
      :is="AppModal"
      v-if="isInModal"
      :model-value="asrStore.panelOpen"
      size="md"
      no-header-close
      @update:model-value="v => { if (!v) asrStore.closePanel() }"
    >
      <template #header>
        <span />
      </template>
      <transcribe-panel
        v-if="asrStore.panelOpen"
        @close="asrStore.closePanel()"
      />
      <template #footer>
        <span />
      </template>
    </component>
  </div>
</template>

<style scoped>
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

@media (max-width: 767.98px) {
  .transcribe-viewer-panel__timestamp {
    display: none;
  }
}
</style>
