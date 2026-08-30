<script setup>
import { ref, computed, defineAsyncComponent, onMounted, h, getCurrentInstance } from 'vue'
import { BRow, BCol, useModal } from 'bootstrap-vue-next'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhArrowClockwise from '~icons/ph/arrow-clockwise'
import IPhTrash from '~icons/ph/trash'
import IPhFiles from '~icons/ph/files'
import IPhDownloadSimple from '~icons/ph/download-simple'
import IPhTranslate from '~icons/ph/translate'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import IPhUser from '~icons/ph/user'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhBrain from '~icons/ph/brain'
import IPhInfo from '~icons/ph/info'
import confirmImage from '@/assets/app-modal-default-light.svg'
import confirmImageDark from '@/assets/app-modal-default-dark.svg'
import IPhWarning from '~icons/ph/warning'
import IPhMagnifyingGlass from '~icons/ph/magnifying-glass'
import IPhFunnel from '~icons/ph/funnel'
import IPhTreeStructure from '~icons/ph/tree-structure'
import IPhFile from '~icons/ph/file'
import IPhGlobe from '~icons/ph/globe'
import IPhPaperclip from '~icons/ph/paperclip'
import IPhCalendarPlus from '~icons/ph/calendar-plus'
import IPhStar from '~icons/ph/star'
import IPhHash from '~icons/ph/hash'
import IPhUsers from '~icons/ph/users'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'
import { capitalize } from '@/utils/formatting'
import { getDocs as getDocsFromTask, queryLabel as queryLabelFromTask } from '@/utils/task'
import LanguageSelector from './LanguageSelector.vue'

const props = defineProps({
  taskId: { type: String, required: true }
})

const core = useCore()
const { api } = core
const asrStore = useAsrStore()
const { $toast: toast } = getCurrentInstance()?.proxy ?? {}

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const DisplayStatus = defineAsyncComponent(() => core.findComponent('Display/DisplayStatus'))
const CardPanel = defineAsyncComponent(() => core.findComponent('CardPanel/CardPanel'))
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const DisplayStatusLabel = defineAsyncComponent(() => core.findComponent('Display/DisplayStatusLabel'))
const DisplayDatetime = defineAsyncComponent(() => core.findComponent('Display/DisplayDatetime'))
const DisplayUser = defineAsyncComponent(() => core.findComponent('Display/DisplayUser'))
const ProjectButton = defineAsyncComponent(() => core.findComponent('Project/ProjectButton'))
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))

const { create: createModal } = useModal()

const task = ref(null)
const loading = ref(true)
const docDetails = ref({})
const showDeleteModal = ref(false)
const showTranscribeModal = ref(false)
const DocumentModalComponent = ref(null)

core.findComponent('Document/DocumentModal').then((c) => {
  DocumentModalComponent.value = c
  return c
}).catch(() => {})

const taskTitle = computed(() => {
  if (!task.value) return ''
  return task.value.args?.name || taskNameFromDocs()
})

function taskNameFromDocs() {
  if (isQueryBased.value) return queryLabel()
  const docs = getDocs()
  if (docs.length === 0) return '—'
  if (docs.length === 1) return docDisplayName(docs[0])
  return `[batch] ${docs.length} documents`
}

function queryLabel() {
  return queryLabelFromTask(task.value)
}

function getDocs() {
  return getDocsFromTask(task.value)
}

function docDisplayName(docId) {
  const doc = docDetails.value[docId]
  if (!doc) return docId
  const path = doc._source?.path || ''
  const basename = path.split('/').pop()
  return basename || docId
}

function docCategory(docId) {
  const doc = docDetails.value[docId]
  const contentType = doc?._source?.contentType || ''
  const category = contentType.split('/')[0]
  return capitalize(category || '—')
}

function docProject() {
  const project = task.value?.args?.project
  return (Array.isArray(project) ? project[0] : project) || ''
}

function docState() {
  if (task.value?.state === 'DONE') return 'DONE'
  if (task.value?.state === 'ERROR') return 'ERROR'
  return task.value?.state || 'QUEUED'
}

const isQueryBased = computed(() => {
  if (task.value?.args?.query) return true
  const raw = task.value?.args?.docs
  if (!raw) return false
  if (Array.isArray(raw) && raw.length === 2 && typeof raw[0] === 'string' && raw[0].startsWith('java.util.')) {
    return typeof raw[1] === 'object' && !Array.isArray(raw[1])
  }
  return typeof raw === 'object' && !Array.isArray(raw)
})

const docs = computed(() => getDocs())

const taskState = computed(() => task.value?.state || 'QUEUED')

const nbDocuments = computed(() => docs.value.length)

const nbDocumentsLabel = computed(() => {
  return `${nbDocuments.value} document${nbDocuments.value !== 1 ? 's' : ''}`
})

const isFinished = computed(() => {
  const state = task.value?.state
  return state === 'DONE' || state === 'ERROR' || state === 'CANCELLED'
})

function getQueryString() {
  const q = task.value?.args?.query
  if (q) {
    if (q.query_string?.query) return q.query_string.query
    if (q.match_all !== undefined) return '*'
    if (q.bool?.must?.[0]?.query_string?.query) return q.bool.must[0].query_string.query
    return JSON.stringify(q)
  }
  const label = queryLabel()
  return label === '—' ? '*' : label
}

const ES_KEY_TO_FILTER_NAME = {
  'contentType': 'contentType',
  'tags': 'tags',
  'language': 'language',
  'extractionLevel': 'extractionLevel',
  'byDirname': 'path',
  'metadata.tika_metadata_dcterms_created': 'creationDate',
  'extractionDate': 'indexingDate',
  '_id': 'starred'
}

const FILTER_ICONS = {
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

const CONTENT_TYPE_LABELS = {
  'audio/aac': 'AAC audio',
  'audio/aiff': 'AIFF audio',
  'audio/mp4': 'MP4 audio',
  'audio/mpeg': 'MPEG audio',
  'audio/ogg': 'OGG audio',
  'audio/vnd.wave': 'WAV audio',
  'audio/wav': 'WAV audio',
  'audio/wave': 'WAV audio',
  'audio/x-wav': 'WAV audio',
  'audio/x-pn-wav': 'WAV audio',
  'video/mp4': 'MP4 audio/video',
  'video/mpeg': 'MPEG video',
  'video/mov': 'MOV video'
}

function filterValueLabel(filterName, value) {
  const { t } = core.i18n.global
  if (filterName === 'contentType') {
    return CONTENT_TYPE_LABELS[value] || value
  }
  if (filterName === 'language') {
    return t(`filter.lang.${value}`, value)
  }
  if (filterName === 'extractionLevel') {
    const levelKey = `level${String(value).padStart(2, '0')}`
    return t(`filter.level.${levelKey}`, value)
  }
  if (filterName === 'starred') {
    return value === 'true' ? t('filter.starred') : t('filter.notStarred')
  }
  return value
}

const taskFilters = computed(() => {
  const filters = task.value?.args?.query?.bool?.filter
  if (!Array.isArray(filters)) return []
  const result = []
  for (const clause of filters) {
    if (!clause.terms) continue
    const [esKey, values] = Object.entries(clause.terms)[0]
    const filterName = ES_KEY_TO_FILTER_NAME[esKey] || esKey
    const icon = FILTER_ICONS[filterName] || IPhFile
    for (const value of values) {
      result.push({ filterName, esKey, value, label: filterValueLabel(filterName, value), icon })
    }
  }
  return result
})

function buildFilterRouteQuery() {
  const query = {}
  for (const { filterName, value } of taskFilters.value) {
    const key = `f[${filterName}]`
    if (query[key]) {
      query[key] = [].concat(query[key], value)
    }
    else {
      query[key] = value
    }
  }
  return query
}

const toSeeDocuments = computed(() => {
  if (isQueryBased.value) {
    return { name: 'search', query: { q: getQueryString(), ...buildFilterRouteQuery() } }
  }
  const docIds = getDocs()
  if (docIds.length === 1) {
    const project = task.value?.args?.project
    if (project) {
      return { name: 'document.doc', params: { index: project, id: docIds[0], routing: docIds[0] } }
    }
  }
  return { name: 'search', query: { q: getDocs().map(id => `_id:${id}`).join(' OR ') } }
})

const searchHref = computed(() => {
  if (!isQueryBased.value) return ''
  const resolved = core.router.resolve(toSeeDocuments.value)
  return `${window.location.origin}${resolved.href}`
})

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

const taskLanguages = computed(() => {
  let langs = task.value?.args?.languages
  if (!Array.isArray(langs)) return '—'
  langs = langs.flat().filter(v => typeof v === 'string' && !v.includes('.'))
  if (langs.length === 0) return '—'
  return langs.map((code) => {
    try {
      return languageNames.of(code)
    }
    catch {
      return code
    }
  }).join(', ')
})

const MODEL_LABELS = {
  'parakeet': 'Parakeet',
  'faster-whisper': 'Faster-Whisper'
}

const taskModel = computed(() => {
  const args = task.value?.args || {}
  const model = args.model || args.config?.model || 'parakeet'
  return MODEL_LABELS[model] ?? model
})

const taskDate = computed(() => {
  return task.value?.createdAt || task.value?.creationDate || null
})

const taskUser = computed(() => {
  const args = task.value?.args || {}
  return args.user?.id || task.value?.user?.id || task.value?.user || '—'
})

const taskProject = computed(() => {
  const project = task.value?.args?.project
  return (Array.isArray(project) ? project[0] : project) || null
})

const fullTaskId = computed(() => `asr.transcription-${props.taskId}`)

async function fetchTask() {
  loading.value = true
  let fetchedTask = null
  try {
    fetchedTask = await api.sendAction(`/api/task/${encodeURIComponent(fullTaskId.value)}`)
  }
  catch {
    fetchedTask = null
  }
  if (fetchedTask) {
    await resolveDocDetails(fetchedTask)
  }
  task.value = fetchedTask
  loading.value = false
}

async function resolveDocDetails(taskData) {
  const project = taskData.args?.project
  if (!project) return
  const docs = taskData.args?.docs || []
  const docList = docs.length === 2 && docs[0] === 'java.util.ArrayList' ? docs[1] : docs
  if (!Array.isArray(docList)) return
  const ids = docList.filter(id => !docDetails.value[id])
  if (!ids.length) return
  try {
    const result = await api.elasticsearch.getDocumentsByIds(project, ids)
    const hits = result?.hits?.hits || []
    for (const hit of hits) {
      docDetails.value[hit._id] = hit
    }
  }
  catch {
    // documents not found
  }
}

function openDocument(docId) {
  const index = task.value?.args?.project
  if (!DocumentModalComponent.value) return
  const component = h(DocumentModalComponent.value, {
    index,
    id: docId,
    routing: docId,
    onOk: () => {},
    onClose: () => {},
    onCancel: () => {}
  })
  createModal({ component }).show()
}

const taskLanguageCodes = computed(() => {
  const langs = task.value?.args?.languages
  if (!Array.isArray(langs)) return []
  return langs.flat().filter(v => typeof v === 'string' && !v.includes('.'))
})

const canTranscribe = computed(() => {
  return asrStore.selectedLanguages.length > 0
})

function requestTranscribeAgain() {
  asrStore.selectedLanguages.splice(0, asrStore.selectedLanguages.length, ...taskLanguageCodes.value)
  asrStore.fetchModels()
  showTranscribeModal.value = true
}

async function confirmTranscribeAgain() {
  showTranscribeModal.value = false
  const args = task.value?.args || {}
  const name = args.name || taskTitle.value
  try {
    const response = await api.sendAction('/api/asr/transcribe', {
      method: 'POST',
      data: {
        project: args.project,
        docs: task.value?.args?.docs,
        name,
        languages: [...asrStore.selectedLanguages],
        batch_size: args.batch_size || 2
      }
    })
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = core.i18n.global.t('asr.viewTranscriptions')
    toast?.success(core.i18n.global.t('asr.transcriptionLaunched', { name }), { href, linkLabel })
    if (response?.taskId) {
      const newTaskId = response.taskId.replace('asr.transcription-', '')
      core.router.push({ name: 'task.transcriptions.detail', params: { taskId: newTaskId } })
    }
  }
  catch {
    const { href } = core.router.resolve({ name: 'task.transcriptions' })
    const linkLabel = core.i18n.global.t('asr.viewTranscriptions')
    toast?.error(core.i18n.global.t('asr.transcriptionError', { name }), { href, linkLabel })
  }
}

function requestDelete() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  showDeleteModal.value = false
  try {
    await api.sendAction(`/api/task/clean/${encodeURIComponent(fullTaskId.value)}`, { method: 'DELETE' })
    core.router.push({ name: 'task.transcriptions' })
  }
  catch {
    // task may already be cleaned
  }
}

const deleteDescription = computed(() => {
  const n = docs.value.length
  return core.i18n.global.t('asr.detailDeleteDescription', { count: n })
})

function downloadCsv() {
  const rows = [['State', 'Document name', 'Category', 'Project']]
  for (const docId of getDocs()) {
    rows.push([
      docState(),
      docDisplayName(docId),
      docCategory(docId),
      docProject() || '—'
    ])
  }
  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = window.document.createElement('a')
  a.href = url
  a.download = `${taskTitle.value || 'transcription'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(fetchTask)
</script>

<template>
  <div class="transcription-detail">
    <component
      :is="PageHeader"
      no-toggle-settings
    >
      <template #title>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb m-0">
            <li class="breadcrumb-item">
              <router-link :to="{ name: 'task.transcriptions' }">
                <component
                  :is="IPhFileAudio"
                  class="me-1"
                />
                {{ $t('asr.transcriptions') }}
              </router-link>
            </li>
            <li class="breadcrumb-item active">
              <span
                v-if="loading"
                class="spinner-border spinner-border-sm"
              />
              <span v-else>{{ taskTitle }}</span>
            </li>
          </ol>
        </nav>
      </template>
    </component>

    <component
      :is="PageContainer"
      fluid
      class="pb-3"
    >
      <div
        v-if="loading"
        class="text-center text-muted py-5"
      >
        <span class="spinner-border spinner-border-sm me-2" />
        {{ $t('asr.loading') }}
      </div>

      <div
        v-else-if="!task"
        class="text-center text-muted py-5"
      >
        {{ $t('asr.taskNotFound') }}
      </div>

      <b-row v-else>
        <b-col
          lg="8"
          cols="12"
        >
          <div
            v-if="isQueryBased"
            class="d-flex flex-column align-items-center justify-content-center py-5 text-muted"
          >
            <component
              :is="IPhMagnifyingGlass"
              style="font-size: 3em"
              class="mb-3"
            />
            <p class="mb-3">
              {{ $t('asr.detailQueryBased') }}
            </p>
            <router-link
              :to="toSeeDocuments"
              class="btn btn-outline-primary d-inline-flex align-items-center gap-2"
            >
              <component :is="IPhMagnifyingGlass" />
              {{ $t('asr.detailSeeQuery') }}
            </router-link>
          </div>
          <div
            v-else
            class="table-responsive"
          >
            <table class="table table-borderless table-striped table-hover page-table align-middle">
              <thead>
                <tr>
                  <th class="page-table-th text-nowrap">
                    <span class="page-table-th__content">{{ $t('asr.colState') }}</span>
                  </th>
                  <th
                    class="page-table-th text-nowrap"
                    style="min-width: 250px"
                  >
                    <span class="page-table-th__content">
                      <component
                        :is="IPhFileAudio"
                        class="me-1"
                        style="font-size: 1.25em"
                      />
                      {{ $t('asr.detailColDocName') }}
                    </span>
                  </th>
                  <th class="page-table-th text-nowrap">
                    <span class="page-table-th__content">{{ $t('asr.colCategory') }}</span>
                  </th>
                  <th class="page-table-th text-nowrap">
                    <span class="page-table-th__content">{{ $t('asr.colProject') }}</span>
                  </th>
                  <th class="page-table-th" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="docId in docs"
                  :key="docId"
                  class="page-table-tr"
                >
                  <td>
                    <component
                      :is="DisplayStatus"
                      :value="docState()"
                    />
                  </td>
                  <td class="fw-medium">
                    <a
                      href="#"
                      class="text-action"
                      @click.prevent="openDocument(docId)"
                    >
                      {{ docDisplayName(docId) }}
                    </a>
                  </td>
                  <td>{{ docCategory(docId) }}</td>
                  <td>
                    <component
                      :is="ProjectButton"
                      v-if="docProject()"
                      :project="docProject()"
                    />
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </b-col>

        <b-col
          lg="4"
          cols="12"
        >
          <component
            :is="CardPanel"
            border
            class="transcription-detail__card"
            body-class="p-4 gap-3"
            content-class="transcription-detail__card__content gap-3"
            title-class="transcription-detail__card__title"
            :title="taskTitle"
            no-x-icon
          >
            <div class="d-flex flex-wrap gap-3">
              <component
                :is="ButtonIcon"
                :icon-left="IPhArrowClockwise"
                :label="$t('asr.transcribeAgain')"
                variant="link"
                :disabled="!isFinished"
                @click="requestTranscribeAgain"
              />
              <component
                :is="ButtonIcon"
                :icon-left="IPhTrash"
                :label="$t('asr.detailDelete')"
                variant="link"
                @click="requestDelete"
              />
            </div>
            <div class="transcription-detail__card__details">
              <ul class="transcription-detail__card__details__list list-unstyled">
                <li>
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2">
                    <span class="d-inline-flex gap-2 align-items-center">
                      <component
                        :is="DisplayStatus"
                        class="border-0"
                        :value="taskState"
                        no-tooltip
                      />
                      <component
                        :is="DisplayStatusLabel"
                        :value="taskState"
                      />
                    </span>
                  </div>
                </li>
                <li v-if="!isQueryBased">
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailNbDocuments')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component
                        :is="IPhFiles"
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                      />
                      {{ nbDocumentsLabel }}
                    </div>
                  </div>
                </li>
                <li v-if="!isQueryBased">
                  <component
                    :is="ButtonIcon"
                    :label="$t('asr.detailDownloadCsv')"
                    :icon-left="IPhDownloadSimple"
                    variant="outline-primary"
                    class="text-nowrap"
                    @click="downloadCsv"
                  />
                </li>
              </ul>
              <hr class="my-1">
              <ul class="transcription-detail__card__details__list list-unstyled">
                <li class="my-0">
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailModel')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component
                        :is="IPhBrain"
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                      />
                      {{ taskModel }}
                    </div>
                  </div>
                </li>
                <li class="mt-2">
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailLanguage')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component
                        :is="IPhTranslate"
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                      />
                      {{ taskLanguages }}
                    </div>
                  </div>
                </li>
                <li v-if="isQueryBased">
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center gap-2"
                  >
                    <component
                      :is="IPhMagnifyingGlass"
                      class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                    />
                    <router-link
                      :to="toSeeDocuments"
                      class="text-truncate"
                    >
                      {{ searchHref }}
                    </router-link>
                  </div>
                </li>
                <li>
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailDate')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component
                        :is="IPhCalendarBlank"
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                      />
                      <component
                        :is="DisplayDatetime"
                        v-if="taskDate"
                        :value="taskDate"
                      />
                      <span v-else>—</span>
                    </div>
                  </div>
                </li>
                <li>
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailUser')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component
                        :is="IPhUser"
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                      />
                      <component
                        :is="DisplayUser"
                        hide-avatar
                        :value="taskUser"
                      />
                    </div>
                  </div>
                </li>
                <li>
                  <div
                    class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2"
                    :title="$t('asr.detailProjects')"
                  >
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <span
                        class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0 d-inline-flex justify-content-center"
                        style="padding: 0.75rem 0"
                      >
                        <i-ph-circles-three-plus />
                      </span>
                      <component
                        :is="ProjectButton"
                        v-if="taskProject"
                        :project="taskProject"
                      />
                    </div>
                  </div>
                </li>
                <li v-if="taskFilters.length > 0">
                  <div class="transcription-detail__card__entry d-flex align-items-start gap-2">
                    <component
                      :is="IPhFunnel"
                      class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0"
                    />
                    <div class="d-flex flex-wrap gap-2">
                      <component
                        :is="ButtonIcon"
                        v-for="(filter, index) in taskFilters"
                        :key="index"
                        variant="outline-secondary"
                        size="sm"
                        :icon-left="filter.icon"
                        :label="filter.label"
                        no-x-icon
                        class="transcription-detail__filter-chip"
                      />
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </component>
        </b-col>
      </b-row>
    </component>

    <component
      :is="AppModal"
      v-model="showDeleteModal"
      :image="confirmImage"
      :image-dark="confirmImageDark"
      image-width="60px"
      :title="$t('asr.detailDeleteTitle')"
      :ok-title="$t('asr.detailDeleteConfirm')"
      size="md"
      @ok="confirmDelete"
    >
      <div class="text-center text-secondary">
        {{ deleteDescription }}
      </div>
    </component>

    <component
      :is="AppModal"
      v-model="showTranscribeModal"
      size="lg"
    >
      <template #header>
        <div class="w-100 position-relative">
          <button
            type="button"
            class="btn-close position-absolute top-0 end-0"
            @click="showTranscribeModal = false"
          />
          <h5 class="d-flex align-items-center gap-2 m-0 pe-4">
            <component :is="IPhFileAudio" />
            {{ $t('asr.transcribeAgain') }}
          </h5>
        </div>
      </template>

      <div class="d-flex flex-column gap-4">
        <p class="text-muted mb-0">
          <component
            :is="IPhInfo"
            class="me-1"
          />
          {{ $t('asr.info') }}
        </p>

        <div>
          <language-selector />
          <p class="text-muted mb-0 small mt-2">
            <component
              :is="IPhWarning"
              class="me-1"
            />
            <strong>{{ $t('asr.batchLanguageWarningTitle') }}</strong>
            {{ $t('asr.batchLanguageWarningText') }}
          </p>
        </div>
      </div>

      <template #footer>
        <button
          class="btn btn-action d-flex align-items-center gap-2"
          :disabled="!canTranscribe"
          @click="confirmTranscribeAgain"
        >
          <component :is="IPhFileAudio" />
          {{ $t('asr.transcribe') }}
        </button>
      </template>
    </component>
  </div>
</template>

<style scoped>
.transcription-detail__card {
  min-width: min(300px, 100%);
}

.transcription-detail__card :deep(.transcription-detail__card__title) {
  padding: 0.125rem 0;
}

.transcription-detail__card__details__list {
  margin: 0;
}

.transcription-detail__card__details__list li {
  margin: 0.75rem 0;
}

.transcription-detail__card__details__list li:first-of-type {
  margin-top: 0;
}

.transcription-detail__card__entry__icon {
  width: 1.75rem;
  padding: 0.12rem 0;
  font-size: 1.25em;
}

.transcription-detail__card__entry--buttons .transcription-detail__card__entry__icon {
  padding: 0.75rem 0;
}

</style>

<style>
.transcription-detail__filter-chip.btn {
  border-style: dashed;
  border-color: currentColor;
  color: var(--bs-body-color);
  background: var(--bs-body-bg);
  cursor: default;
}

.transcription-detail__filter-chip.btn:hover {
  cursor: default;
}
</style>
