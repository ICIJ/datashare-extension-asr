<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import { BRow, BCol } from 'bootstrap-vue-next'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhArrowClockwise from '~icons/ph/arrow-clockwise'
import IPhTrash from '~icons/ph/trash'
import IPhCheckCircle from '~icons/ph/check-circle'
import IPhXCircle from '~icons/ph/x-circle'
import IPhFiles from '~icons/ph/files'
import IPhList from '~icons/ph/list'
import IPhCaretRight from '~icons/ph/caret-right'
import IPhDownloadSimple from '~icons/ph/download-simple'
import IPhTranslate from '~icons/ph/translate'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import IPhUser from '~icons/ph/user'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhBrain from '~icons/ph/brain'
import IPhInfo from '~icons/ph/info'
import confirmImage from '@/assets/app-modal-default-light.svg'
import confirmImageDark from '@/assets/app-modal-default-dark.svg'
import { useCore } from '@/composables/useCore'

const props = defineProps({
  id: { type: String, required: true }
})

const core = useCore()
const { api } = core

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const DisplayStatus = defineAsyncComponent(() => core.findComponent('Display/DisplayStatus'))
const DisplayProjectList = defineAsyncComponent(() => core.findComponent('Display/DisplayProjectList'))
const CardPanel = defineAsyncComponent(() => core.findComponent('CardPanel/CardPanel'))
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const TaskStatus = defineAsyncComponent(() => core.findComponent('Task/TaskStatus'))
const DisplayDatetime = defineAsyncComponent(() => core.findComponent('Display/DisplayDatetime'))
const DisplayUser = defineAsyncComponent(() => core.findComponent('Display/DisplayUser'))
const ProjectButton = defineAsyncComponent(() => core.findComponent('Project/ProjectButton'))
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))

const task = ref(null)
const loading = ref(true)
const docDetails = ref({})
const showDeleteModal = ref(false)

const taskTitle = computed(() => {
  if (!task.value) return ''
  return task.value.args?.name || taskNameFromDocs()
})

function taskNameFromDocs() {
  const docs = getDocs()
  if (docs.length === 0) return '—'
  if (docs.length === 1) return docDisplayName(docs[0])
  return `[batch] ${docs.length} documents`
}

function getDocs() {
  if (!task.value) return []
  console.log('[ASR] task.value:', JSON.stringify(task.value, null, 2))
  const docs = task.value.args?.docs || []
  console.log('[ASR] docs:', docs)
  if (docs.length === 2 && docs[0] === 'java.util.ArrayList') {
    return docs[1]
  }
  return docs
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

function docProject(docId) {
  return task.value?.args?.project || '—'
}

function docState(docId) {
  if (task.value?.state === 'DONE') return 'DONE'
  if (task.value?.state === 'ERROR') return 'ERROR'
  return task.value?.state || 'QUEUED'
}

function capitalize(str) {
  if (!str || str === '—') return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const docs = computed(() => getDocs())

const taskState = computed(() => task.value?.state || 'QUEUED')

const nbDocuments = computed(() => docs.value.length)

const nbDocumentsLabel = computed(() => {
  return `${nbDocuments.value} document${nbDocuments.value !== 1 ? 's' : ''}`
})

const successCount = computed(() => {
  if (task.value?.state === 'DONE') return docs.value.length
  return 0
})

const failureCount = computed(() => {
  if (task.value?.state === 'ERROR') return docs.value.length
  return 0
})

const isRunning = computed(() => {
  const state = task.value?.state
  return state === 'RUNNING' || state === 'QUEUED'
})

const toSeeDocuments = computed(() => {
  const docIds = getDocs()
  if (docIds.length === 1) {
    const project = task.value?.args?.project
    if (project) {
      return { name: 'document.doc', params: { index: project, id: docIds[0], routing: docIds[0] } }
    }
  }
  return { name: 'search', query: { q: getDocs().map(id => `_id:${id}`).join(' OR ') } }
})

const seeDocumentsLabel = computed(() => {
  return docs.value.length === 1
    ? core.i18n.global.t('asr.detailSeeDocument')
    : core.i18n.global.t('asr.detailSeeAllDocuments')
})

const taskLanguages = computed(() => {
  let langs = task.value?.args?.languages
  if (!Array.isArray(langs)) return '—'
  langs = langs.flat().filter(v => typeof v === 'string' && !v.includes('.'))
  if (langs.length === 0) return '—'
  return langs.map(code => {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) }
    catch { return code }
  }).join(', ')
})

const taskModel = computed(() => {
  const config = task.value?.args?.config || {}
  return config.model || 'Nvidia Parakeet-tdt-0.6b-v3'
})

const taskDate = computed(() => {
  return task.value?.createdAt || task.value?.creationDate || null
})

const taskUser = computed(() => {
  const args = task.value?.args || {}
  return args.user?.id || task.value?.user?.id || task.value?.user || '—'
})

const taskProjects = computed(() => {
  return [task.value?.args?.project].filter(Boolean)
})

async function fetchTask() {
  loading.value = true
  try {
    task.value = await api.sendAction(`/api/task/${encodeURIComponent(props.id)}`)
  } catch {
    task.value = null
  } finally {
    loading.value = false
  }
  if (task.value) {
    resolveDocDetails()
  }
}

async function resolveDocDetails() {
  const project = task.value?.args?.project
  if (!project) return
  const ids = getDocs().filter(id => !docDetails.value[id])
  if (!ids.length) return
  try {
    const result = await api.elasticsearch.getDocumentsByIds(project, ids)
    const hits = result?.hits?.hits || []
    for (const hit of hits) {
      docDetails.value[hit._id] = hit
    }
  } catch {
    // documents not found
  }
}

function requestDelete() {
  showDeleteModal.value = true
}

async function confirmDelete() {
  showDeleteModal.value = false
  try {
    await api.sendAction(`/api/task/clean/${encodeURIComponent(props.id)}`, { method: 'DELETE' })
    core.router.push({ name: 'task.transcriptions' })
  } catch {
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
      docState(docId),
      docDisplayName(docId),
      docCategory(docId),
      docProject(docId)
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
    <component :is="PageHeader" no-toggle-settings>
      <template #title>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb m-0">
            <li class="breadcrumb-item">
              <router-link :to="{ name: 'task.transcriptions' }">
                <component :is="IPhFileAudio" class="me-1" />
                {{ $t('asr.transcriptions') }}
              </router-link>
            </li>
            <li class="breadcrumb-item active">
              <span v-if="loading" class="spinner-border spinner-border-sm" />
              <span v-else>{{ taskTitle }}</span>
            </li>
          </ol>
        </nav>
      </template>
    </component>

    <component :is="PageContainer" fluid class="pb-3">
      <div v-if="loading" class="text-center text-muted py-5">
        <span class="spinner-border spinner-border-sm me-2" />
        {{ $t('asr.loading') }}
      </div>

      <div v-else-if="!task" class="text-center text-muted py-5">
        {{ $t('asr.taskNotFound') }}
      </div>

      <b-row v-else>
        <b-col lg="8" cols="12">
          <div class="table-responsive">
            <table class="table table-borderless table-striped table-hover page-table align-middle">
              <thead>
                <tr>
                  <th class="page-table-th text-nowrap">
                    <span class="page-table-th__content">{{ $t('asr.colState') }}</span>
                  </th>
                  <th class="page-table-th text-nowrap" style="min-width: 250px">
                    <span class="page-table-th__content">
                      <component :is="IPhFileAudio" class="me-1" style="font-size: 1.25em" />
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
                <tr v-for="docId in docs" :key="docId" class="page-table-tr">
                  <td>
                    <component :is="DisplayStatus" :value="docState(docId)" />
                  </td>
                  <td class="fw-medium">
                    {{ docDisplayName(docId) }}
                  </td>
                  <td>{{ docCategory(docId) }}</td>
                  <td>
                    <component :is="DisplayProjectList" :values="docProject(docId)" />
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </b-col>

        <b-col lg="4" cols="12">
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
            <div class="d-flex gap-3">
              <component
                :is="ButtonIcon"
                :icon-left="IPhArrowClockwise"
                :label="$t('asr.transcribeAgain')"
                variant="link"
                disabled
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
                    <component :is="TaskStatus" :status="taskState" with-label />
                  </div>
                </li>
                <li v-if="isRunning">
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhInfo" class="transcription-detail__card__entry__icon text-info flex-shrink-0" />
                      {{ $t('asr.detailRunningCount', { count: nbDocuments }) }}
                    </div>
                  </div>
                </li>
                <li v-if="successCount > 0">
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhCheckCircle" class="transcription-detail__card__entry__icon text-success flex-shrink-0" />
                      {{ $t('asr.detailSuccessCount', { count: successCount }) }}
                    </div>
                  </div>
                </li>
                <li v-if="failureCount > 0">
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhXCircle" class="transcription-detail__card__entry__icon text-danger flex-shrink-0" />
                      {{ $t('asr.detailFailureCount', { count: failureCount }) }}
                    </div>
                  </div>
                </li>
                <li>
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailNbDocuments')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhFiles" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      {{ nbDocumentsLabel }}
                    </div>
                  </div>
                </li>
                <li>
                  <component
                    :is="ButtonIcon"
                    :label="seeDocumentsLabel"
                    :to="toSeeDocuments"
                    :icon-left="IPhList"
                    :icon-right="IPhCaretRight"
                    variant="action"
                    class="flex-shrink-1"
                  />
                </li>
                <li>
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
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailModel')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhBrain" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      {{ taskModel }}
                    </div>
                  </div>
                </li>
                <li>
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailLanguage')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhTranslate" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      {{ taskLanguages }}
                    </div>
                  </div>
                </li>
                <li>
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailDate')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhCalendarBlank" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      <component :is="DisplayDatetime" v-if="taskDate" :value="taskDate" />
                      <span v-else>—</span>
                    </div>
                  </div>
                </li>
                <li>
                  <div class="transcription-detail__card__entry d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailUser')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhUser" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      <component :is="DisplayUser" hide-avatar :value="taskUser" />
                    </div>
                  </div>
                </li>
                <li>
                  <div class="transcription-detail__card__entry transcription-detail__card__entry--buttons d-flex align-items-center justify-content-between gap-2" :title="$t('asr.detailProjects')">
                    <div class="d-flex flex-nowrap align-items-start gap-2">
                      <component :is="IPhCirclesThreePlus" class="transcription-detail__card__entry__icon text-secondary-emphasis flex-shrink-0" />
                      <div class="d-flex flex-wrap gap-2">
                        <component
                          :is="ProjectButton"
                          v-for="(project, index) in taskProjects"
                          :key="index"
                          :project="project"
                        />
                      </div>
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
  margin: 0.5rem 0;
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
