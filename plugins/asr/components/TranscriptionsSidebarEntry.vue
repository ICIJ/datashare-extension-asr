<script setup>
import IPhFileAudio from '~icons/ph/file-audio'
import IPhPlus from '~icons/ph/plus'

const props = defineProps({
  title: { type: String, default: '' },
  to: { type: Object, default: () => ({}) },
  compact: { type: Boolean, default: false },
  active: { type: Boolean, default: false }
})

const isTaskSection = () => props.to?.name === 'task.task-board'
</script>

<template>
  <div
    v-if="isTaskSection()"
    class="transcriptions-sidebar-entry d-flex align-items-center flex-truncate"
  >
    <router-link
      :to="{ name: 'task.transcriptions' }"
      class="transcriptions-sidebar-entry__link text-truncate d-flex flex-grow-1"
    >
      <i-ph-file-audio class="me-2" style="font-size: 1.25em" />
      {{ $t('asr.transcriptions') }}
    </router-link>
    <router-link
      :to="{ name: 'task.transcriptions.new' }"
      class="transcriptions-sidebar-entry__action ms-2 d-flex"
      :title="$t('asr.newTranscription')"
    >
      <i-ph-plus style="font-size: 1.25em" />
      <span class="visually-hidden">{{ $t('asr.newTranscription') }}</span>
    </router-link>
  </div>
</template>

<style scoped>
.transcriptions-sidebar-entry {
  position: relative;
}

.transcriptions-sidebar-entry:hover::before,
.transcriptions-sidebar-entry:has(.router-link-active)::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 0.25rem;
  bottom: 0.25rem;
  width: 2px;
  border-radius: 1px;
  background: var(--bs-primary);
}

.transcriptions-sidebar-entry:has(.router-link-active) {
  font-weight: 500;
}

.transcriptions-sidebar-entry__link,
.transcriptions-sidebar-entry__action {
  cursor: pointer;
  color: inherit;
  text-decoration: none;
}

.transcriptions-sidebar-entry__link:hover,
.transcriptions-sidebar-entry__action:hover {
  color: inherit;
}
</style>
