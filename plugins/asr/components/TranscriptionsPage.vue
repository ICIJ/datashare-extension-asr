<script setup>
import { ref, computed, watch, defineAsyncComponent, onMounted, onUnmounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhTrash from '~icons/ph/trash'
import IPhPlay from '~icons/ph/play'
import IPhTranslate from '~icons/ph/translate'
import IPhBrain from '~icons/ph/brain'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhUserCircle from '~icons/ph/user-circle'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import IPhClockCountdown from '~icons/ph/clock-countdown'
import IPhSortAscending from '~icons/ph/sort-ascending'
import IPhSortDescending from '~icons/ph/sort-descending'
import { useCore } from '@/composables/useCore'
import { useAsrStore, MODEL_LABELS } from '@/stores/asr'
import { capitalize, formatTaskTimestamp, displayLanguage } from '@/utils/formatting'
import { getDocs as getDocsFromTask, taskErrorFull, isQueryBasedDocs } from '@/utils/task'
import { stripJacksonTypes } from '@/utils/jackson'
import confirmImageLight from '@/assets/app-modal-default-light.svg'
import confirmImageDark from '@/assets/app-modal-default-dark.svg'
import errorImageLight from '@/assets/app-modal-error-light.svg'
import errorImageDark from '@/assets/app-modal-error-dark.svg'

const ASR_TASK_NAME = 'asr.transcription'
const ASR_TASK_PREFIX = `${ASR_TASK_NAME}-`

function taskUuid(task) {
  return task.id.startsWith(ASR_TASK_PREFIX) ? task.id.slice(ASR_TASK_PREFIX.length) : task.id
}

const core = useCore()
const { api } = core
const asrStore = useAsrStore()

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const RowPagination = defineAsyncComponent(() => core.findComponent('RowPagination/RowPagination'))
const DisplayStatus = defineAsyncComponent(() => core.findComponent('Display/DisplayStatus'))
const DisplayProgress = defineAsyncComponent(() => core.findComponent('Display/DisplayProgress'))
const ProjectButton = defineAsyncComponent(() => core.findComponent('Project/ProjectButton'))
const DismissableAlert = defineAsyncComponent(() => core.findComponent('Dismissable/DismissableAlert'))
const ButtonIcon = defineAsyncComponent(() => core.findComponent('Button/ButtonIcon'))
const AppModal = defineAsyncComponent(() => core.findComponent('AppModal/AppModal'))

const tasks = ref([])
const docNames = ref({})
const docCategories = ref({})
const totalRows = ref(0)
const page = ref(1)
const perPage = computed(() => asrStore.settingsPerPage)
const order = computed(() => asrStore.settingsOrder)
const visibleColumns = computed(() => asrStore.settingsProperties)
const search = ref('')
const loading = ref(false)
const errorModalVisible = ref(false)
const errorModalTask = ref(null)
const deleteModalVisible = ref(false)
const deleteModalTaskId = ref(null)

let pollInterval = null

const from = computed(() => (page.value - 1) * perPage.value)

async function fetchTasks() {
  loading.value = true
  let fetchedTasks = []
  try {
    const result = await api.getTasks({
      name: ASR_TASK_NAME,
      from: from.value,
      size: perPage.value,
      sort: 'createdAt',
      order: order.value
    })
    if (Array.isArray(result)) {
      fetchedTasks = result
      if (result.length < perPage.value && page.value === 1) {
        totalRows.value = result.length
      }
    }
    else if (result?.items) {
      fetchedTasks = result.items
      totalRows.value = result.pagination?.total ?? result.items.length
    }
  }
  catch {
    fetchedTasks = []
  }
  await resolveDocNames(fetchedTasks)
  tasks.value = fetchedTasks
  loading.value = false
}

async function resolveDocNames(taskList) {
  const byProject = {}
  for (const task of taskList) {
    const project = task.args?.project
    if (!project) continue
    for (const docId of getDocs(task)) {
      if (docNames.value[docId]) continue
      ;(byProject[project] ??= new Set()).add(docId)
    }
  }
  const promises = Object.entries(byProject).map(async ([project, idSet]) => {
    const ids = [...idSet]
    try {
      const result = await api.elasticsearch.getDocumentsByIds(project, ids)
      const hits = result?.hits?.hits || []
      for (const hit of hits) {
        const path = hit._source?.path || ''
        const basename = path.split('/').pop()
        if (basename) docNames.value[hit._id] = basename
        const contentType = hit._source?.contentType || ''
        const category = contentType.split('/')[0]
        if (category) docCategories.value[hit._id] = category
      }
    }
    catch {
      // documents not found
    }
    for (const id of ids) {
      if (!docNames.value[id]) docNames.value[id] = id
    }
  })
  await Promise.all(promises)
}

function requestDelete(taskId) {
  deleteModalTaskId.value = taskId
  deleteModalVisible.value = true
}

async function confirmDelete() {
  deleteModalVisible.value = false
  const taskId = deleteModalTaskId.value
  deleteModalTaskId.value = null
  if (!taskId) return
  try {
    await api.sendAction(`/api/task/clean/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
    await fetchTasks()
  }
  catch {
    // task may already be cleaned
  }
}

function getDocs(task) {
  return getDocsFromTask(task)
}

function docDisplayName(docId) {
  return docNames.value[docId] || docId
}

function taskName(task) {
  if (task.args?.name) return task.args.name
  const docs = getDocs(task)
  if (isQueryBasedDocs(task.args?.docs) || docs.length > 1) {
    const ts = formatTaskTimestamp(task.createdAt || task.creationDate)
    return ts ? `asr_transcription_${ts}` : 'asr_transcription'
  }
  if (docs.length === 0) return '—'
  return docDisplayName(docs[0])
}

function taskProgress(task) {
  if (task.state === 'DONE') return 1
  if (task.progress != null) return Math.max(0, Math.min(1, task.progress))
  return 0
}

function categoryFromQuery(task) {
  let raw = task?.args?.docs
  if (Array.isArray(raw) && raw.length === 2 && typeof raw[0] === 'string' && raw[0].startsWith('java.util.')) {
    raw = raw[1]
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const cleaned = stripJacksonTypes(raw)
  const filters = cleaned?.bool?.filter
  if (!Array.isArray(filters)) return null
  for (const clause of filters) {
    if (!clause.terms?.contentType) continue
    const types = clause.terms.contentType
    const categories = new Set(types.map(t => t.split('/')[0]))
    if (categories.size === 1) return capitalize([...categories][0])
    return 'Mixed'
  }
  return null
}

function taskCategory(task) {
  if (isQueryBasedDocs(task?.args?.docs)) {
    return categoryFromQuery(task) || ''
  }
  const docs = getDocs(task)
  if (docs.length === 0) return ''
  const categories = new Set(docs.map(id => docCategories.value[id]).filter(Boolean))
  if (categories.size === 0) return '—'
  if (categories.size === 1) return capitalize([...categories][0])
  return 'Mixed'
}

function taskLanguage(task) {
  return displayLanguage(task.args?.language)
}

function taskModel(task) {
  const args = task.args || task.properties || {}
  const model = args.config?.inference?.model || 'parakeet'
  return MODEL_LABELS[model] ?? model
}

function taskProject(task) {
  const args = task.args || task.properties || {}
  const project = args.project
  return (Array.isArray(project) ? project[0] : project) || '—'
}

function taskUser(task) {
  const args = task.args || {}
  return args.user?.id || task.user?.id || task.user || '—'
}

function taskDate(task) {
  const ts = task.createdAt || task.creationDate
  if (!ts) return '—'
  const date = new Date(ts)
  return date.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

const sortIcon = computed(() => order.value === 'desc' ? IPhSortAscending : IPhSortDescending)

function toggleOrder() {
  asrStore.settingsOrder = order.value === 'desc' ? 'asc' : 'desc'
}

const filteredTasks = computed(() => {
  if (!search.value) return tasks.value
  const q = search.value.toLowerCase()
  return tasks.value.filter((task) => {
    const name = taskName(task).toLowerCase()
    const docs = getDocs(task).some(id => (docNames.value[id] || id).toLowerCase().includes(q))
    return name.includes(q) || docs
  })
})

function isVisible(col) {
  return visibleColumns.value.includes(col)
}

const colSpan = computed(() => visibleColumns.value.length + 1)

function showError(task) {
  errorModalTask.value = task
  errorModalVisible.value = true
}

watch(page, () => fetchTasks())
watch(perPage, () => {
  page.value = 1
  fetchTasks()
})
watch(order, () => {
  page.value = 1
  fetchTasks()
})

onMounted(() => {
  fetchTasks()
  pollInterval = setInterval(fetchTasks, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <div class="transcriptions-page">
    <component
      :is="PageHeader"
      v-model:page="page"
      v-model:search-query="search"
      searchable
      paginable
      :per-page="perPage"
      :total-rows="totalRows"
      :search-placeholder="$t('asr.searchTranscriptions')"
    >
      <template #pagination="{ page: p, setPage, perPage: pp, totalRows: tr }">
        <div class="page-header-toolbar__pagination">
          <component
            :is="RowPagination"
            :model-value="p"
            :total-rows="tr"
            :per-page="pp"
            keypath-row-range="asr.rowRange"
            keypath-row-range-fewer="asr.rowRangeFewer"
            keypath-row-range-compact="asr.rowRangeCompact"
            @update:model-value="setPage"
          />
        </div>
      </template>
    </component>

    <component
      :is="PageContainer"
      fluid
    >
      <component
        :is="DismissableAlert"
        variant="info"
        persist
        name="task.transcriptions.list.info"
      >
        {{ $t('asr.pageInfo') }}
      </component>

      <div class="transcriptions-page__table table-responsive">
        <table class="table table-borderless table-striped table-hover page-table align-middle">
          <thead>
            <tr>
              <th
                v-if="isVisible('state')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-clock-countdown
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colState') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('name')"
                class="page-table-th text-nowrap"
                style="min-width: 250px"
              >
                <span class="page-table-th__content">
                  <i-ph-file-audio
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colName') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('progress')"
                class="page-table-th text-nowrap"
                style="min-width: 150px"
              >
                <span class="page-table-th__content">
                  <i-ph-clock-countdown
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colProgress') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('category')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-play
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colCategory') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('language')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-translate
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colLanguage') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('model')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-brain
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colModel') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('project')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-circles-three-plus
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colProject') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('user')"
                class="page-table-th text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-user-circle
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colUser') }}</span>
                </span>
              </th>
              <th
                v-if="isVisible('launchedOn')"
                class="page-table-th page-table-th--sortable page-table-th--sorted text-nowrap"
              >
                <span class="page-table-th__content">
                  <i-ph-calendar-blank
                    class="me-1 my-2"
                    style="font-size: 1.25em"
                  />
                  <span>{{ $t('asr.colLaunchedOn') }}</span>
                  <component
                    :is="ButtonIcon"
                    :icon-left="sortIcon"
                    class="page-table-th-sort page-table-th-sort--sorted ms-1"
                    variant="outline-tertiary"
                    icon-left-size="1em"
                    hide-label
                    @click="toggleOrder"
                  />
                </span>
              </th>
              <th class="page-table-th text-nowrap" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="loading && filteredTasks.length === 0"
              class="page-table-tr"
            >
              <td
                :colspan="colSpan"
                class="text-center text-muted py-4"
              >
                <span class="spinner-border spinner-border-sm me-2" />
                {{ $t('asr.loading') }}
              </td>
            </tr>
            <tr
              v-else-if="filteredTasks.length === 0"
              class="page-table-tr"
            >
              <td
                :colspan="colSpan"
                class="text-center text-muted py-4"
              >
                {{ $t('asr.noTranscriptions') }}
              </td>
            </tr>
            <tr
              v-for="task in filteredTasks"
              :key="task.id"
              class="page-table-tr"
            >
              <td v-if="isVisible('state')">
                <button
                  v-if="task.state === 'ERROR'"
                  class="btn btn-link p-0 border-0"
                  @click="showError(task)"
                >
                  <component
                    :is="DisplayStatus"
                    :value="task.state"
                  />
                </button>
                <component
                  :is="DisplayStatus"
                  v-else
                  :value="task.state"
                />
              </td>
              <td
                v-if="isVisible('name')"
                class="fw-medium"
              >
                <router-link
                  :to="{ name: 'task.transcriptions.detail', params: { taskId: taskUuid(task) } }"
                  class="text-action"
                >
                  {{ taskName(task) }}
                </router-link>
              </td>
              <td v-if="isVisible('progress')">
                <component
                  :is="DisplayProgress"
                  :value="taskProgress(task)"
                />
              </td>
              <td v-if="isVisible('category')">
                {{ taskCategory(task) }}
              </td>
              <td v-if="isVisible('language')">
                {{ taskLanguage(task) }}
              </td>
              <td v-if="isVisible('model')">
                {{ taskModel(task) }}
              </td>
              <td v-if="isVisible('project')">
                <component
                  :is="ProjectButton"
                  v-if="taskProject(task) !== '—'"
                  :project="taskProject(task)"
                />
                <span v-else>—</span>
              </td>
              <td v-if="isVisible('user')">
                {{ taskUser(task) }}
              </td>
              <td v-if="isVisible('launchedOn')">
                {{ taskDate(task) }}
              </td>
              <td>
                <button
                  class="btn btn-sm btn-link text-muted p-0"
                  @click="requestDelete(task.id)"
                >
                  <i-ph-trash style="font-size: 1.1em" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </component>

    <component
      :is="AppModal"
      v-model="deleteModalVisible"
      :image="confirmImageLight"
      :image-width="60"
      :title="$t('asr.deleteTitle')"
      :ok-title="$t('asr.deleteConfirm')"
      size="md"
      @ok="confirmDelete"
    >
      <template #header-image-source>
        <source
          :srcset="confirmImageDark"
          media="(prefers-color-scheme: dark)"
        >
      </template>
      <div class="text-center text-secondary">
        {{ $t('asr.deleteDescription') }}
      </div>
    </component>

    <component
      :is="AppModal"
      v-model="errorModalVisible"
      :image="errorImageLight"
      :image-width="70"
      :ok-title="$t('asr.ok')"
      ok-only
      size="lg"
      class="transcription-error-modal"
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
            <pre class="p-3 m-0"><code>{{ taskErrorFull(errorModalTask) }}</code></pre>
          </div>
        </div>
        <p class="m-0">
          {{ $t('asr.errorDescription') }}
        </p>
      </div>
    </component>
  </div>
</template>

<style scoped>
.transcriptions-page__table .page-table {
  font-size: 0.875rem;
}

.page-table-th--sorted.page-table-th--sortable {
  color: var(--bs-action-text-emphasis);
}

.page-table-th-sort {
  --bs-border-width: 0;
  --bs-btn-padding-x: 0.125rem;
  --bs-btn-padding-y: 0.125rem;
  --bs-btn-color: var(--bs-secondary-text-emphasis);
}

.page-table-th-sort--sorted {
  --bs-btn-color: var(--bs-action-text-emphasis);
  --bs-btn-bg: var(--bs-action-bg-subtle);
}
</style>
