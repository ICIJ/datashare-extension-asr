<script setup>
import { ref, computed, defineAsyncComponent, onMounted, watch } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhTextAa from '~icons/ph/text-aa'
import IPhBrain from '~icons/ph/brain'
import IPhMagnifyingGlass from '~icons/ph/magnifying-glass'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhTreeStructure from '~icons/ph/tree-structure'
import IPhFile from '~icons/ph/file'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import IPhGlobe from '~icons/ph/globe'
import IPhPaperclip from '~icons/ph/paperclip'
import IPhCalendarPlus from '~icons/ph/calendar-plus'
import IPhStar from '~icons/ph/star'
import IPhHash from '~icons/ph/hash'
import IPhUsers from '~icons/ph/users'
import IPhFunnelSimple from '~icons/ph/funnel-simple'
import IPhCheckCircle from '~icons/ph/check-circle'
import IPhWarning from '~icons/ph/warning'

import { useCore } from '@/composables/useCore'
import { useAsrStore, SUPPORTED_CONTENT_TYPES } from '@/stores/asr'
import LanguageSelector from '@/components/LanguageSelector.vue'

const core = useCore()
const asrStore = useAsrStore()

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const FormCreation = defineAsyncComponent(() => core.findComponent('Form/FormCreation'))
const FormStep = defineAsyncComponent(() => core.findComponent('Form/FormStep/FormStep'))
const FilterTypeProject = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeProject'))
const FilterTypePath = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypePath'))
const FilterType = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterType'))
const FilterTypeDateRange = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeDateRange'))
const FilterTypeStarred = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeStarred'))
const FilterTypeRecommendedBy = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeRecommendedBy'))

const { useSearchStore } = core.stores
const searchStore = useSearchStore()
const formSearchStore = useSearchStore.disposable()
formSearchStore.setIndices(searchStore.indices)

const filterProject = formSearchStore.getFilter({ name: 'project' })
const filterPath = formSearchStore.getFilter({ name: 'path' })
const filterContentType = formSearchStore.getFilter({ name: 'contentType' })
const filterCreationDate = formSearchStore.getFilter({ name: 'creationDate' })
const filterLanguage = formSearchStore.getFilter({ name: 'language' })
const filterExtractionLevel = formSearchStore.getFilter({ name: 'extractionLevel' })
const filterIndexingDate = formSearchStore.getFilter({ name: 'indexingDate' })
const filterStarred = formSearchStore.getFilter({ name: 'starred' })
const filterTags = formSearchStore.getFilter({ name: 'tags' })
const filterRecommendedBy = formSearchStore.getFilter({ name: 'recommendedBy' })

const FILTER_ICONS = {
  project: IPhCirclesThreePlus,
  path: IPhTreeStructure,
  contentType: IPhFile,
  creationDate: IPhCalendarBlank,
  language: IPhGlobe,
  extractionLevel: IPhPaperclip,
  indexingDate: IPhCalendarPlus,
  starred: IPhStar,
  tags: IPhHash,
  recommendedBy: IPhUsers
}

const languageDisplayNames = new Intl.DisplayNames(['en'], { type: 'language' })

const query = ref('')
const name = ref('')
const selectedModel = ref('parakeet')
const skipAlreadyTranscribed = ref(true)
const submitting = ref(false)

const breadcrumbRoutes = ['task', 'task.transcriptions', 'task.transcriptions.new']

const isValid = computed(() => {
  return name.value.trim().length > 0
    && asrStore.selectedLanguages.length > 0
})

const selectionBadges = computed(() => {
  const badges = []
  if (query.value.trim()) {
    badges.push({ type: 'query', label: query.value.trim(), icon: IPhMagnifyingGlass })
  }
  for (const filter of (formSearchStore.activeFilters ?? [])) {
    const icon = FILTER_ICONS[filter.name] || IPhFile
    for (const value of filter.values) {
      badges.push({ type: 'filter', filterName: filter.name, value, label: value, icon })
    }
  }
  return badges
})

const selectedLanguageNames = computed(() => {
  return asrStore.selectedLanguages
    .map(code => languageDisplayNames.of(code))
    .filter(Boolean)
    .join(' and ')
})

const modelDisplayName = computed(() => {
  return selectedModel.value === 'parakeet' ? 'Parakeet' : 'Faster-Whisper'
})

const audioCount = ref(0)
const videoCount = ref(0)
const unsupportedCount = ref(0)

async function fetchDocumentCounts() {
  const index = formSearchStore.indices?.join(',') || core.projectIds.join(',')
  try {
    const filterClauses = (formSearchStore.activeFilters ?? []).map(filter => ({
      terms: { [filter.key]: filter.values }
    }))
    const body = {
      size: 0,
      query: {
        bool: {
          must: query.value.trim()
            ? [{ query_string: { query: query.value.trim() } }]
            : [{ match_all: {} }],
          filter: [{ term: { type: 'Document' } }, ...filterClauses]
        }
      },
      aggs: {
        contentTypes: {
          terms: { field: 'contentType', size: 50 }
        }
      }
    }
    const res = await core.api.elasticsearch.search({ index, body })
    const buckets = res?.aggregations?.contentTypes?.buckets ?? []
    let audio = 0
    let video = 0
    let unsupported = 0
    for (const bucket of buckets) {
      if (SUPPORTED_CONTENT_TYPES.has(bucket.key)) {
        if (bucket.key.startsWith('audio/')) {
          audio += bucket.doc_count
        }
        else {
          video += bucket.doc_count
        }
      }
      else {
        unsupported += bucket.doc_count
      }
    }
    audioCount.value = audio
    videoCount.value = video
    unsupportedCount.value = unsupported
  }
  catch {
    audioCount.value = 0
    videoCount.value = 0
    unsupportedCount.value = 0
  }
}

const filterKey = computed(() => {
  return (formSearchStore.activeFilters ?? [])
    .map(f => `${f.name}:${f.values.join(',')}`)
    .join('|')
})

watch(
  () => [filterKey.value, query.value],
  fetchDocumentCounts
)

onMounted(() => {
  asrStore.fetchModels()
  asrStore.selectedLanguages = []
  fetchDocumentCounts()
})

function dismissBadge(badge) {
  if (badge.type === 'query') {
    query.value = ''
  }
  else {
    formSearchStore.removeFilterValue({ name: badge.filterName, value: badge.value })
  }
}

function reset() {
  query.value = ''
  name.value = ''
  asrStore.selectedLanguages = []
  selectedModel.value = 'parakeet'
  skipAlreadyTranscribed.value = true
  formSearchStore.resetFilterValues()
}

async function submit() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  try {
    const project = formSearchStore.indices?.join(',') || core.projectIds.join(',')
    await asrStore.transcribeBatch(project, [], { name: name.value })
    core.router.push({ name: 'task.transcriptions' })
  }
  catch {
    // error handling will be added later
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <component
    :is="PageHeader"
    no-toggle-settings
    :breadcrumb-routes="breadcrumbRoutes"
  />
  <component
    :is="PageContainer"
    fluid
  >
    <component
      :is="FormCreation"
      class="transcription-new d-flex flex-column gap-4"
      content-class-list="d-flex flex-column gap-3"
      :valid="isValid"
      :submit-label="$t('asr.newForm.transcribe')"
      :submit-icon="IPhFileAudio"
      :reset-label="$t('asr.newForm.reset')"
      @reset="reset"
      @submit="submit"
    >
      <!-- Step 1: Name -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.name')"
        :index="1"
      >
        <div class="row align-items-center">
          <label class="col-sm-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 form-label text-body-emphasis m-0">
            <i-ph-text-aa
              class="text-tertiary"
              style="font-size: 1.25em"
            />
            {{ $t('asr.newForm.name') }}
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
      </component>

      <!-- Step 2: Documents to transcribe -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.documents')"
        :index="2"
        class="transcription-new__filters"
        content-class="bg-transparent rounded-0 d-flex flex-column gap-3 px-0 m-0"
      >
        <component
          :is="FilterTypeProject"
          :filter="filterProject"
          class="p-3"
          content-class="pb-0"
        />
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0">
            <i-ph-magnifying-glass />
          </span>
          <input
            v-model="query"
            type="text"
            class="form-control border-start-0"
            :placeholder="$t('asr.newForm.documentsPlaceholder')"
          >
        </div>
        <component
          :is="FilterTypePath"
          :filter="filterPath"
          actions-position-title
          hide-contextualize
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterType"
          :filter="filterContentType"
          actions-position-title
          hide-contextualize
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterTypeDateRange"
          :filter="filterCreationDate"
          class="p-3"
        />
        <component
          :is="FilterType"
          :filter="filterLanguage"
          actions-position-title
          hide-contextualize
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterType"
          :filter="filterExtractionLevel"
          actions-position-title
          hide-contextualize
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterTypeDateRange"
          :filter="filterIndexingDate"
          class="p-3"
        />
        <component
          :is="FilterTypeStarred"
          :filter="filterStarred"
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterType"
          :filter="filterTags"
          actions-position-title
          hide-contextualize
          class="p-3"
          content-class="pb-0"
        />
        <component
          :is="FilterTypeRecommendedBy"
          :filter="filterRecommendedBy"
          class="p-3"
          content-class="pb-0"
        />
      </component>

      <!-- Step 3: Languages -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.languages')"
        :index="3"
      >
        <language-selector />
        <p class="text-muted small mt-2 mb-0">
          {{ $t('asr.newForm.languagesHint') }}
        </p>
      </component>

      <!-- Step 3: Model -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.model')"
        :index="3"
      >
        <div class="row align-items-center mb-3">
          <label class="col-sm-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 form-label text-body-emphasis m-0">
            <i-ph-brain
              class="text-tertiary"
              style="font-size: 1.25em"
            />
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
              <label
                class="form-check-label"
                for="model-parakeet"
              >Parakeet</label>
            </div>
            <div class="form-check">
              <input
                id="model-faster-whisper"
                v-model="selectedModel"
                class="form-check-input"
                type="radio"
                value="faster-whisper"
              >
              <label
                class="form-check-label"
                for="model-faster-whisper"
              >Faster-Whisper</label>
            </div>
          </div>
        </div>
        <p class="text-muted small mb-1">
          {{ $t('asr.newForm.parakeetInfo') }}
        </p>
        <p class="text-muted small mb-1">
          {{ $t('asr.newForm.fasterWhisperInfo') }}
        </p>
        <p class="text-muted small mb-0">
          {{ $t('asr.info') }}
        </p>
      </component>

      <!-- Step 4: Options (NOT IN V1) -->
      <component
        :is="FormStep"
        :index="4"
        class="transcription-new__options"
      >
        <template #title>
          {{ $t('asr.newForm.options') }}
          <span class="text-danger ms-2">{{ $t('asr.newForm.optionsNotInV1') }}</span>
        </template>
        <div class="row align-items-center">
          <label class="col-sm-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 form-label text-body-emphasis m-0">
            {{ $t('asr.newForm.skipAlreadyTranscribed') }}
          </label>
          <div class="col d-flex flex-column gap-1">
            <div class="form-check">
              <input
                id="skip-yes"
                v-model="skipAlreadyTranscribed"
                class="form-check-input"
                type="radio"
                :value="true"
              >
              <label
                class="form-check-label"
                for="skip-yes"
              >{{ $t('asr.newForm.yes') }}</label>
            </div>
            <div class="form-check">
              <input
                id="skip-no"
                v-model="skipAlreadyTranscribed"
                class="form-check-input"
                type="radio"
                :value="false"
              >
              <label
                class="form-check-label"
                for="skip-no"
              >{{ $t('asr.newForm.no') }}</label>
            </div>
          </div>
        </div>
      </component>

      <!-- Point 5: Your selection -->
      <div
        v-if="selectionBadges.length"
        class="transcription-new__selection"
      >
        <h6 class="d-flex align-items-center gap-2 text-body-secondary mb-3">
          <IPhFunnelSimple />
          {{ $t('asr.newForm.yourSelection') }}
        </h6>
        <div class="d-flex flex-wrap gap-2">
          <span
            v-for="(badge, i) in selectionBadges"
            :key="i"
            class="transcription-new__badge d-inline-flex align-items-center gap-1 rounded-pill border px-3 py-1"
          >
            <component
              :is="badge.icon"
              class="flex-shrink-0"
            />
            <span class="text-truncate">{{ badge.label }}</span>
            <button
              type="button"
              class="btn-close ms-1"
              style="font-size: 0.6em"
              aria-label="Remove"
              @click="dismissBadge(badge)"
            />
          </span>
        </div>
      </div>

      <!-- Point 6: Selection summary -->
      <div
        v-if="asrStore.selectedLanguages.length && (audioCount > 0 || videoCount > 0)"
        class="transcription-new__summary d-flex align-items-center gap-2"
      >
        <IPhCheckCircle
          class="text-success flex-shrink-0"
          style="font-size: 1.4em"
        />
        <span>
          <strong class="text-decoration-underline">{{ $t('asr.newForm.selectionSummaryCount', { audioCount, videoCount }) }}</strong>
          {{ $t('asr.newForm.selectionSummaryRest', { languages: selectedLanguageNames, model: modelDisplayName }) }}
        </span>
      </div>

      <!-- Point 7: Format warning -->
      <div
        v-if="unsupportedCount > 0"
        class="transcription-new__warning d-flex align-items-center gap-2"
      >
        <IPhWarning
          class="text-warning flex-shrink-0"
          style="font-size: 1.4em"
        />
        <span>
          <strong class="text-decoration-underline">{{ $t('asr.newForm.selectionWarningCount', { count: unsupportedCount }) }}</strong>
          {{ $t('asr.newForm.selectionWarningRest') }}
        </span>
      </div>
    </component>
  </component>
</template>

<style scoped>
.transcription-new__filters :deep(.filters-panel-section-filter) {
  background: var(--bs-body-bg);
  margin: 0;
}

.transcription-new__badge {
  background: var(--bs-body-bg);
  font-size: 0.875rem;
  max-width: 300px;
  color: var(--bs-body-color);
}

.transcription-new__summary,
.transcription-new__warning {
  font-size: 0.9rem;
}
</style>
