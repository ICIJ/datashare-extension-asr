<script setup>
import { ref, computed } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import BatchTranscribeModal from './BatchTranscribeModal.vue'

const props = defineProps({
  selectionEntries: {
    type: Array,
    default: () => []
  },
  noSelection: {
    type: Boolean,
    default: true
  }
})

const hasMultipleProjects = computed(() => {
  const projects = new Set(props.selectionEntries.map(doc => doc.index || doc.routing))
  return projects.size > 1
})

const isDisabled = computed(() => props.noSelection || hasMultipleProjects.value)

const modalOpen = ref(false)
const selectedDocuments = ref([])

function handleClick() {
  selectedDocuments.value = [...props.selectionEntries]
  modalOpen.value = true
}
</script>

<template>
  <span
    v-b-tooltip.top.body="hasMultipleProjects ? $t('asr.multipleProjectsWarning') : ''"
  >
    <button
      class="btn btn-outline-tertiary button-icon button-icon--use-injected-variant d-inline-flex align-items-center text-nowrap"
      :disabled="isDisabled"
      @click="handleClick"
    >
      <span
        class="app-icon button-icon__icon-left"
        style="font-size: 1.25em; display: inline-flex"
      >
        <IPhFileAudio />
      </span>
      <span class="button-icon__label ms-2">{{ $t('asr.transcribe') }}</span>
    </button>
  </span>
  <batch-transcribe-modal
    v-model="modalOpen"
    :selected-documents="selectedDocuments"
  />
</template>
