<script setup>
import { defineAsyncComponent } from 'vue'
import { useCore } from '@/composables/useCore'
import { taskErrorFull } from '@/utils/task'
import errorImage from '@/assets/app-modal-error-light.svg'
import errorImageDark from '@/assets/app-modal-error-dark.svg'

defineProps({
  task: { type: Object, default: null }
})
const modelValue = defineModel({ type: Boolean, default: false })

const core = useCore()
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))
</script>

<template>
  <component
    :is="AppModal"
    v-model="modelValue"
    :image="errorImage"
    :image-width="70"
    :ok-title="$t('asr.ok')"
    ok-only
    size="lg"
  >
    <template #header-image-source>
      <source
        :srcset="errorImageDark"
        media="(prefers-color-scheme: dark)"
      >
    </template>
    <div class="d-flex flex-column gap-4 mt-0 pt-0">
      <div>
        <p class="text-center fw-medium">
          {{ $t('asr.errorTitle') }}
        </p>
        <div class="bg-tertiary-subtle d-block text-body-emphasis m-0 rounded-1">
          <pre class="p-3 m-0"><code>{{ taskErrorFull(task) }}</code></pre>
        </div>
      </div>
      <p class="m-0">
        {{ $t('asr.errorDescription') }}
      </p>
    </div>
  </component>
</template>
