<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhTextAa from '~icons/ph/text-aa'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhTranslate from '~icons/ph/translate'
import IPhBrain from '~icons/ph/brain'
import IPhGear from '~icons/ph/gear'

import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import LanguageSelector from '@/components/LanguageSelector.vue'

const core = useCore()
const asrStore = useAsrStore()

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const ProjectDropdownSelector = defineAsyncComponent(() => core.findComponent('Project/ProjectDropdownSelector/ProjectDropdownSelector'))

const name = ref('')
const selectedProjects = ref(core.projectIds.map(name => ({ name })))
const selectedModel = ref('parakeet')
const skipAlreadyTranscribed = ref(true)
const submitting = ref(false)

const allProjects = computed(() => core.projects ?? core.projectIds.map(name => ({ name })))

const breadcrumbRoutes = ['task', 'task.transcriptions', 'task.transcriptions.new']

const isValid = computed(() => {
  return name.value.trim().length > 0
    && selectedProjects.value.length > 0
    && asrStore.selectedLanguages.length > 0
})

onMounted(() => {
  asrStore.fetchModels()
  asrStore.selectedLanguages = []
})

function reset() {
  name.value = ''
  selectedProjects.value = core.projectIds.map(name => ({ name }))
  asrStore.selectedLanguages = []
  selectedModel.value = 'parakeet'
  skipAlreadyTranscribed.value = true
}

async function submit() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  try {
    const project = selectedProjects.value.map(p => p.name).join(',')
    await asrStore.transcribeBatch(project, [], { name: name.value })
    core.router.push({ name: 'task.transcriptions' })
  } catch {
    // error handling will be added later
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <component :is="PageHeader" no-toggle-settings :breadcrumb-routes="breadcrumbRoutes" />
  <component :is="PageContainer" fluid>
    <form class="transcription-new d-flex flex-column gap-3" novalidate @submit.prevent="submit" @reset.prevent="reset">
      <!-- Step 1: Name and project -->
      <div class="transcription-new__step bg-tertiary-subtle p-3 rounded-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="transcription-new__step__index badge rounded-pill bg-action text-white">1</span>
          <h6 class="m-0">{{ $t('asr.newForm.nameAndProject') }}</h6>
        </div>
        <div class="ms-md-5 d-flex flex-column gap-3">
          <div class="row align-items-center">
            <label class="col-auto d-flex align-items-center gap-1 form-label m-0">
              <i-ph-text-aa />
              {{ $t('asr.newForm.name') }} *
            </label>
            <div class="col">
              <input
                v-model="name"
                type="text"
                class="form-control"
                :placeholder="$t('asr.newForm.namePlaceholder')"
              >
            </div>
          </div>
          <div class="row align-items-center">
            <label class="col-auto d-flex align-items-center gap-1 form-label m-0">
              <i-ph-circles-three-plus />
              {{ $t('asr.newForm.project') }} *
            </label>
            <div class="col">
              <component
                :is="ProjectDropdownSelector"
                v-model="selectedProjects"
                :projects="allProjects"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Documents to transcribe -->
      <div class="transcription-new__step bg-tertiary-subtle p-3 rounded-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="transcription-new__step__index badge rounded-pill bg-action text-white">2</span>
          <h6 class="m-0">{{ $t('asr.newForm.documents') }}</h6>
        </div>
        <div class="ms-md-5">
          <p class="text-muted small mb-2">
            <i-ph-file-audio class="me-1" />
            {{ $t('asr.newForm.documentsHint') }}
          </p>
          <input
            type="text"
            class="form-control"
            :placeholder="$t('asr.newForm.documentsPlaceholder')"
            disabled
          >
        </div>
      </div>

      <!-- Step 3: Languages -->
      <div class="transcription-new__step bg-tertiary-subtle p-3 rounded-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="transcription-new__step__index badge rounded-pill bg-action text-white">3</span>
          <h6 class="m-0">{{ $t('asr.newForm.languages') }}</h6>
        </div>
        <div class="ms-md-5">
          <language-selector />
          <p class="text-muted small mt-2 mb-0">
            {{ $t('asr.newForm.languagesHint') }}
          </p>
        </div>
      </div>

      <!-- Step 3: Model -->
      <div class="transcription-new__step bg-tertiary-subtle p-3 rounded-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="transcription-new__step__index badge rounded-pill bg-action text-white">3</span>
          <h6 class="m-0">{{ $t('asr.newForm.model') }}</h6>
        </div>
        <div class="ms-md-5 d-flex flex-column gap-2">
          <div class="row align-items-center">
            <label class="col-auto d-flex align-items-center gap-1 form-label m-0">
              <i-ph-brain />
              {{ $t('asr.newForm.selectModel') }} *
            </label>
            <div class="col d-flex flex-column gap-1">
              <div class="form-check">
                <input
                  id="model-parakeet"
                  v-model="selectedModel"
                  class="form-check-input"
                  type="radio"
                  value="parakeet"
                >
                <label class="form-check-label" for="model-parakeet">Parakeet</label>
              </div>
              <div class="form-check">
                <input
                  id="model-faster-whisper"
                  v-model="selectedModel"
                  class="form-check-input"
                  type="radio"
                  value="faster-whisper"
                >
                <label class="form-check-label" for="model-faster-whisper">Faster-Whisper</label>
              </div>
            </div>
          </div>
          <p class="text-muted small mb-0">
            {{ $t('asr.newForm.parakeetInfo') }}
          </p>
          <p class="text-muted small mb-0">
            {{ $t('asr.newForm.fasterWhisperInfo') }}
          </p>
          <p class="text-muted small mb-0">
            {{ $t('asr.info') }}
          </p>
        </div>
      </div>

      <!-- Step 4: Options (NOT IN V1) -->
      <div class="transcription-new__step bg-tertiary-subtle p-3 rounded-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="transcription-new__step__index badge rounded-pill bg-action text-white">4</span>
          <h6 class="m-0">
            {{ $t('asr.newForm.options') }}
            <span class="badge bg-warning text-dark ms-1">NOT IN V1</span>
          </h6>
        </div>
        <div class="ms-md-5">
          <div class="row align-items-center">
            <label class="col-auto d-flex align-items-center gap-1 form-label m-0">
              <i-ph-gear />
              {{ $t('asr.newForm.skipAlreadyTranscribed') }}
            </label>
            <div class="col d-flex gap-3">
              <div class="form-check">
                <input
                  id="skip-yes"
                  v-model="skipAlreadyTranscribed"
                  class="form-check-input"
                  type="radio"
                  :value="true"
                >
                <label class="form-check-label" for="skip-yes">{{ $t('asr.newForm.yes') }}</label>
              </div>
              <div class="form-check">
                <input
                  id="skip-no"
                  v-model="skipAlreadyTranscribed"
                  class="form-check-input"
                  type="radio"
                  :value="false"
                >
                <label class="form-check-label" for="skip-no">{{ $t('asr.newForm.no') }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form footer -->
      <div class="d-flex justify-content-end gap-3 mb-4">
        <button type="reset" class="btn btn-outline-secondary d-inline-flex align-items-center gap-2">
          <i-ph-arrow-counter-clockwise />
          {{ $t('asr.newForm.reset') }}
        </button>
        <button
          type="submit"
          class="btn btn-primary d-inline-flex align-items-center gap-2"
          :disabled="!isValid || submitting"
        >
          {{ $t('asr.newForm.transcribe') }}
          <i-ph-file-audio />
        </button>
      </div>
    </form>
  </component>
</template>

<style scoped>
.transcription-new__step {
  box-shadow: 0 0 0 1px var(--bs-action, var(--bs-primary)) inset;
}

.transcription-new__step__index {
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  background-color: var(--bs-action, var(--bs-primary)) !important;
}

@media (prefers-color-scheme: dark) {
  .transcription-new__step {
    box-shadow: 0 0 0 1px var(--bs-white) inset;
  }
}
</style>
