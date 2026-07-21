<script setup>
import { defineAsyncComponent } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { useCore } from '@/composables/useCore'

const core = useCore()
const TaskBoardListEntry = defineAsyncComponent(() => core.findComponent('Task/TaskBoard/TaskBoardListEntry'))
</script>

<template>
  <component
    :is="TaskBoardListEntry"
    :icon="IPhFileAudio"
    :title="$t('asr.boardEntry.title')"
    :description="$t('asr.boardEntry.description')"
    :list-link="{ name: 'task.transcriptions' }"
  />
</template>
