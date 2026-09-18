<script setup>
import { ref, computed, defineAsyncComponent, onMounted, watch, getCurrentInstance } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhBrain from '~icons/ph/brain'
import IPhMagnifyingGlass from '~icons/ph/magnifying-glass'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhCheckCircle from '~icons/ph/check-circle'
import IPhWarning from '~icons/ph/warning'

import { useCore } from '@/composables/useCore'
import { useAsrStore, SUPPORTED_CONTENT_TYPES, MODEL_LABELS } from '@/stores/asr'
import { useModelSelection } from '@/composables/useModelSelection'
import { languageName } from '@/utils/formatting'
import LanguageSelector from '@/components/LanguageSelector.vue'

const core = useCore()
const asrStore = useAsrStore()
const { $toast: toast } = getCurrentInstance()?.proxy ?? {}

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const FormCreation = defineAsyncComponent(() => core.findComponent('Form/FormCreation'))
const FormStep = defineAsyncComponent(() => core.findComponent('Form/FormStep/FormStep'))
const ProjectDropdownSelector = defineAsyncComponent(() => core.findComponent('Project/ProjectDropdownSelector/ProjectDropdownSelector'))
const FilterTypePath = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypePath'))
const FilterType = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterType'))
const FilterTypeDateRange = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeDateRange'))
const FilterTypeStarred = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeStarred'))
const FilterTypeRecommendedBy = defineAsyncComponent(() => core.findComponent('Filter/FilterType/FilterTypeRecommendedBy'))
const FiltersPanelSectionFilterEntry = defineAsyncComponent(() => core.findComponent('FiltersPanel/FiltersPanelSectionFilterEntry'))
const SearchBreadcrumbUri = defineAsyncComponent(() => core.findComponent('Search/SearchBreadcrumbUri/SearchBreadcrumbUri'))

const { useSearchStore } = core.stores
const searchStore = useSearchStore()
const formSearchStore = useSearchStore.disposable()
formSearchStore.setIndices(searchStore.indices.slice(0, 1))

const allProjects = computed(() => core.projects || [])
const selectedProject = computed({
  get: () => {
    const name = formSearchStore.indices?.[0]
    return name ? { name } : null
  },
  set: project => formSearchStore.setIndices(project ? [project.name] : [])
})
const filterPath = formSearchStore.getFilter({ name: 'path' })
const filterContentType = formSearchStore.getFilter({ name: 'contentType' })
const filterCreationDate = formSearchStore.getFilter({ name: 'creationDate' })
const filterLanguage = formSearchStore.getFilter({ name: 'language' })
const filterExtractionLevel = formSearchStore.getFilter({ name: 'extractionLevel' })
const filterIndexingDate = formSearchStore.getFilter({ name: 'indexingDate' })
const filterStarred = formSearchStore.getFilter({ name: 'starred' })
const filterTags = formSearchStore.getFilter({ name: 'tags' })
const filterRecommendedBy = formSearchStore.getFilter({ name: 'recommendedBy' })


const query = ref('')
const { selectedModel, allModelNames, isModelDisabled } = useModelSelection()
const submitting = ref(false)

const breadcrumbRoutes = ['task', 'task.transcriptions', 'task.transcriptions.new']

const overviewUri = computed(() => {
  const routeQuery = formSearchStore.toBaseRouteQuery
  if (query.value.trim()) {
    routeQuery.q = query.value.trim()
  }
  const { href = null } = core.router.resolve({ name: 'search', query: routeQuery }) ?? {}
  return href
})

const isValid = computed(() => {
  return !!asrStore.selectedLanguage && !!selectedModel.value
})

const selectedLanguageName = computed(() => {
  if (!asrStore.selectedLanguage) return ''
  return languageName(asrStore.selectedLanguage)
})

const modelDisplayName = computed(() => {
  return MODEL_LABELS[selectedModel.value] ?? selectedModel.value
})

const audioCount = ref(0)
const videoCount = ref(0)
const unsupportedCount = ref(0)

async function fetchDocumentCounts() {
  const index = formSearchStore.indices?.[0] || core.projectIds[0]
  try {
    const filterClauses = (formSearchStore.activeFilters ?? []).map(filter => ({
      terms: { [filter.key]: filter.values }
    }))
    const hasContentTypeFilter = (formSearchStore.activeFilters ?? []).some(f => f.name === 'contentType')
    if (!hasContentTypeFilter) {
      filterClauses.push({ terms: { contentType: [...SUPPORTED_CONTENT_TYPES] } })
    }
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
  () => [filterKey.value, query.value, (formSearchStore.indices ?? []).join(',')],
  fetchDocumentCounts
)

onMounted(async () => {
  await asrStore.fetchModels()
  asrStore.selectedLanguage = null
  selectedModel.value = null
  fetchDocumentCounts()
})

function filterSupportedEntries(entries) {
  return entries.filter(({ item }) => SUPPORTED_CONTENT_TYPES.has(item.key))
}

function hasContentTypeValue(item) {
  return formSearchStore.hasFilterValue({ name: 'contentType', value: item.key })
}

function toggleContentTypeValue(item, checked) {
  if (checked) {
    formSearchStore.addFilterValue({ name: 'contentType', value: item.key })
  }
  else {
    formSearchStore.removeFilterValue({ name: 'contentType', value: item.key })
  }
}

function reset() {
  query.value = ''
  asrStore.selectedLanguage = null
  selectedModel.value = null
  formSearchStore.resetFilterValues()
}

function buildSearchQuery() {
  const filterClauses = (formSearchStore.activeFilters ?? []).map(filter => ({
    terms: { [filter.key]: filter.values }
  }))
  const hasContentTypeFilter = (formSearchStore.activeFilters ?? []).some(f => f.name === 'contentType')
  if (!hasContentTypeFilter) {
    filterClauses.push({ terms: { contentType: [...SUPPORTED_CONTENT_TYPES] } })
  }
  const hasQuery = query.value.trim().length > 0
  return {
    bool: {
      must: hasQuery
        ? [{ query_string: { query: query.value.trim() } }]
        : [{ match_all: {} }],
      filter: filterClauses
    }
  }
}

async function submit() {
  if (!isValid.value || submitting.value) return
  submitting.value = true
  try {
    const project = formSearchStore.indices?.[0] || core.projectIds[0]
    await asrStore.transcribeBatch(project, [], { model: selectedModel.value, query: buildSearchQuery() })
    core.router.push({ name: 'task.transcriptions' })
  }
  catch {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = core.i18n.global.t('asr.viewTranscriptions')
    toast?.error(core.i18n.global.t('asr.transcriptionError', { name: '' }), { href, linkLabel })
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
      <!-- Step 1: Documents to transcribe -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.documents')"
        :index="1"
        class="transcription-new__filters"
        content-class="bg-transparent rounded-0 d-flex flex-column gap-3 px-0 m-0"
      >
        <div class="row align-items-center p-3">
          <label class="col-sm-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 form-label text-body-emphasis m-0">
            <i-ph-circles-three-plus
              class="text-tertiary"
              style="font-size: 1.25em"
            />
            {{ $t('asr.newForm.project') }}
          </label>
          <div class="col-auto">
            <component
              :is="ProjectDropdownSelector"
              v-model="selectedProject"
              :projects="allProjects"
            />
          </div>
        </div>
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
        >
          <template #default="{ entries }">
            <component
              :is="FiltersPanelSectionFilterEntry"
              v-for="{ item, label } in filterSupportedEntries(entries)"
              :key="item.key"
              :label="label"
              :count="item.doc_count"
              :model-value="hasContentTypeValue(item)"
              @update:model-value="toggleContentTypeValue(item, $event)"
            />
          </template>
        </component>
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

      <!-- Step 2: Language -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.language')"
        :index="2"
      >
        <language-selector />
        <p class="text-muted small mt-2 mb-0">
          {{ $t('asr.newForm.languageHint') }}
        </p>
      </component>

      <!-- Step 3: Model -->
      <component
        :is="FormStep"
        :title="$t('asr.newForm.model')"
        :index="3"
      >
        <div class="row align-items-start mb-3">
          <label class="col-sm-12 col-md-4 col-lg-3 d-flex align-items-center gap-2 form-label text-body-emphasis m-0 pt-1">
            <i-ph-brain
              class="text-tertiary"
              style="font-size: 1.25em"
            />
            {{ $t('asr.newForm.selectModel') }} *
          </label>
          <div class="col d-flex flex-column gap-1">
            <div
              v-for="m in allModelNames"
              :key="m"
              class="form-check"
            >
              <input
                :id="`model-${m}`"
                v-model="selectedModel"
                class="form-check-input"
                type="radio"
                :value="m"
                :disabled="isModelDisabled(m)"
              >
              <label
                class="form-check-label"
                :for="`model-${m}`"
              >{{ MODEL_LABELS[m] ?? m }}</label>
            </div>
          </div>
        </div>
        <p
          v-if="selectedModel === 'parakeet'"
          class="text-muted small mb-1"
        >
          {{ $t('asr.newForm.parakeetInfo') }}
        </p>
        <p
          v-if="selectedModel === 'parakeet_trt'"
          class="text-muted small mb-1"
        >
          {{ $t('asr.newForm.parakeetTrtInfo') }}
        </p>
        <p
          v-if="selectedModel === 'fireredasr2_aed'"
          class="text-muted small mb-1"
        >
          {{ $t('asr.newForm.fireredasr2Info') }}
        </p>
        <p class="text-muted small mb-0">
          {{ $t('asr.info') }}
        </p>
      </component>

      <!-- Point 5: Your selection -->
      <component
        v-if="overviewUri"
        :is="SearchBreadcrumbUri"
        :key="overviewUri"
        :uri="overviewUri"
        class="transcription-new__selection pt-3"
      />

      <!-- Point 6: Selection summary -->
      <div
        v-if="asrStore.selectedLanguage && (audioCount > 0 || videoCount > 0)"
        class="transcription-new__summary d-flex align-items-center gap-2"
      >
        <IPhCheckCircle
          class="text-success flex-shrink-0"
          style="font-size: 1.4em"
        />
        <span>
          <strong class="text-decoration-underline">{{ $t('asr.newForm.selectionSummaryCount', { audioCount, videoCount }) }}</strong>
          {{ $t('asr.newForm.selectionSummaryRest', { language: selectedLanguageName, model: modelDisplayName }) }}
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

.transcription-new__summary,
.transcription-new__warning {
  font-size: 0.9rem;
}
</style>
