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
import { useCore } from '@/composables/useCore'

const ASR_TASK_NAME = 'asr.transcription'

const core = useCore()
const { api } = core

const PageHeader = defineAsyncComponent(() => core.findComponent('PageHeader/PageHeader'))
const PageContainer = defineAsyncComponent(() => core.findComponent('PageContainer/PageContainer'))
const RowPagination = defineAsyncComponent(() => core.findComponent('RowPagination/RowPagination'))
const DisplayStatus = defineAsyncComponent(() => core.findComponent('Display/DisplayStatus'))
const DisplayProgress = defineAsyncComponent(() => core.findComponent('Display/DisplayProgress'))
const DisplayProjectList = defineAsyncComponent(() => core.findComponent('Display/DisplayProjectList'))
const DismissableAlert = defineAsyncComponent(() => core.findComponent('Dismissable/DismissableAlert'))

const tasks = ref([])
const docNames = ref({})
const docCategories = ref({})
const docLanguages = ref({})
const totalRows = ref(0)
const page = ref(1)
const perPage = ref(25)
const search = ref('')
const loading = ref(false)

let pollInterval = null

const from = computed(() => (page.value - 1) * perPage.value)

async function fetchTasks() {
  loading.value = true
  try {
    const result = await api.getTasks({
      name: ASR_TASK_NAME,
      from: from.value,
      size: perPage.value,
      order: 'desc'
    })
    if (Array.isArray(result)) {
      tasks.value = result
      if (result.length < perPage.value && page.value === 1) {
        totalRows.value = result.length
      }
    } else if (result?.items) {
      tasks.value = result.items
      totalRows.value = result.pagination?.total ?? result.items.length
    }
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
  resolveDocNames()
}

async function resolveDocNames() {
  for (const task of tasks.value) {
    const project = task.args?.project
    if (!project) continue
    for (const docId of getDocs(task)) {
      if (docNames.value[docId] || !looksLikeHash(docId)) continue
      try {
        const doc = await api.sendAction(`/api/${project}/documents/${docId}`)
        if (doc?.title) {
          docNames.value[docId] = doc.title
        }
        if (doc?.contentTypeCategory) {
          docCategories.value[docId] = doc.contentTypeCategory
        }
        if (doc?.language) {
          docLanguages.value[docId] = doc.language
        }
      } catch {
        // document not found
      }
    }
  }
}

function looksLikeHash(str) {
  return /^[a-f0-9]{40,}$/i.test(str)
}

async function deleteTask(taskId) {
  try {
    await api.sendAction(`/api/task/clean/${encodeURIComponent(taskId)}`, { method: 'DELETE' })
    await fetchTasks()
  } catch {
    // task may already be cleaned
  }
}

function getDocs(task) {
  const args = task.args || {}
  const docs = args.docs || []
  // Jackson format: ["java.util.ArrayList", ["doc1", "doc2"]]
  if (docs.length === 2 && docs[0] === 'java.util.ArrayList') {
    return docs[1]
  }
  return docs
}

function docDisplayName(docId) {
  return docNames.value[docId] || docId
}

function taskName(task) {
  const docs = getDocs(task)
  if (docs.length === 0) return '—'
  if (docs.length === 1) return docDisplayName(docs[0])
  return `[batch] ${docs.length} documents`
}

function taskProgress(task) {
  if (task.state === 'DONE') return 1
  if (task.progress != null) return Math.max(0, Math.min(1, task.progress))
  return 0
}

function taskCategory(task) {
  const docs = getDocs(task)
  if (docs.length === 0) return '—'
  const categories = new Set(docs.map(id => docCategories.value[id]).filter(Boolean))
  if (categories.size === 0) return '—'
  if (categories.size === 1) return capitalize([...categories][0])
  return 'Mixed'
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function taskLanguages(task) {
  const docs = getDocs(task)
  if (docs.length === 0) return '—'
  const languages = new Set(docs.map(id => docLanguages.value[id]).filter(Boolean))
  if (languages.size === 0) return '—'
  return [...languages].map(capitalize).join(', ')
}

function taskModel(task) {
  const args = task.args || task.properties || {}
  const config = args.config || {}
  return config.model || 'Parakeet'
}

function taskProject(task) {
  const args = task.args || task.properties || {}
  return args.project || '—'
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

watch(page, () => fetchTasks())

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
      no-toggle-settings
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

    <component :is="PageContainer" fluid>
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
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-clock-countdown class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colState') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap" style="min-width: 250px">
              <span class="page-table-th__content">
                <i-ph-file-audio class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colName') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap" style="min-width: 150px">
              <span class="page-table-th__content">
                <i-ph-clock-countdown class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colProgress') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-play class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colCategory') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-translate class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colLanguages') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-brain class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colModel') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-circles-three-plus class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colProject') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-user-circle class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colUser') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap">
              <span class="page-table-th__content">
                <i-ph-calendar-blank class="me-1 my-2" style="font-size: 1.25em" />
                <span>{{ $t('asr.colLaunchedOn') }}</span>
              </span>
            </th>
            <th class="page-table-th text-nowrap" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && tasks.length === 0" class="page-table-tr">
            <td colspan="10" class="text-center text-muted py-4">
              <span class="spinner-border spinner-border-sm me-2" />
              {{ $t('asr.loading') }}
            </td>
          </tr>
          <tr v-else-if="tasks.length === 0" class="page-table-tr">
            <td colspan="10" class="text-center text-muted py-4">
              {{ $t('asr.noTranscriptions') }}
            </td>
          </tr>
          <tr v-for="task in tasks" :key="task.id" class="page-table-tr">
            <td>
              <component :is="DisplayStatus" :value="task.state" />
            </td>
            <td class="fw-medium">
              {{ taskName(task) }}
            </td>
            <td>
              <component :is="DisplayProgress" :value="taskProgress(task)" />
            </td>
            <td>{{ taskCategory(task) }}</td>
            <td>{{ taskLanguages(task) }}</td>
            <td>{{ taskModel(task) }}</td>
            <td>
              <component :is="DisplayProjectList" :values="taskProject(task)" />
            </td>
            <td>{{ taskUser(task) }}</td>
            <td>{{ taskDate(task) }}</td>
            <td>
              <button
                v-if="task.state === 'DONE' || task.state === 'ERROR'"
                class="btn btn-sm btn-link text-muted p-0"
                @click="deleteTask(task.id)"
              >
                <i-ph-trash style="font-size: 1.1em" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </component>
  </div>
</template>

<style scoped>
.transcriptions-page__table .page-table {
  font-size: 0.875rem;
}
</style>
