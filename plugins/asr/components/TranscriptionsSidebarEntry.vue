<script setup>
import IPhFileAudio from '~icons/ph/file-audio'

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
    <a
      href="#/tasks/transcriptions"
      class="transcriptions-sidebar-entry__link text-truncate d-flex flex-grow-1"
    >
      <i-ph-file-audio class="me-2" style="font-size: 1.25em" />
      {{ $t('asr.transcriptions') }}
    </a>
  </div>
</template>

<style scoped>
.transcriptions-sidebar-entry {
  position: relative;
}

.transcriptions-sidebar-entry:hover::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 0.25rem;
  bottom: 0.25rem;
  width: 2px;
  border-radius: 1px;
  background: var(--bs-primary);
}

.transcriptions-sidebar-entry__link {
  cursor: pointer;
  color: inherit;
  text-decoration: none;
}

.transcriptions-sidebar-entry__link:hover {
  color: inherit;
}
</style>
