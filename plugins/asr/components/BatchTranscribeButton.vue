<script setup>
import { ref } from 'vue'
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

const modalOpen = ref(false)
const selectedDocuments = ref([])

function handleClick() {
  selectedDocuments.value = [...props.selectionEntries]
  modalOpen.value = true
}
</script>

<template>
  <button
    class="btn button-icon"
    :disabled="noSelection"
    @click="handleClick"
  >
    <span class="button-icon__icon-left">
      <i-ph-file-audio />
    </span>
    <span class="button-icon__label">{{ $t('asr.transcribe') }}</span>
  </button>
  <batch-transcribe-modal
    v-model="modalOpen"
    :selected-documents="selectedDocuments"
  />
</template>
