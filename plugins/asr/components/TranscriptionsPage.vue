<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhInfo from '~icons/ph/info'
import IPhCheckCircle from '~icons/ph/check-circle'
import IPhXCircle from '~icons/ph/x-circle'
import IPhMagnifyingGlass from '~icons/ph/magnifying-glass'
import IPhCaretLeft from '~icons/ph/caret-left'
import IPhCaretRight from '~icons/ph/caret-right'
import IPhCaretDoubleLeft from '~icons/ph/caret-double-left'
import IPhCaretDoubleRight from '~icons/ph/caret-double-right'
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

const tasks = ref([])
const docNames = ref({})
const totalRows = ref(0)
const page = ref(1)
const perPage = ref(100)
const search = ref('')
const loading = ref(false)

let pollInterval = null

const totalPages = computed(() => Math.max(1, Math.ceil(totalRows.value / perPage.value)))
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
  const args = task.args || task.properties || {}
  return args.category || '—'
}

function taskLanguages(task) {
  const args = task.args || task.properties || {}
  const config = args.config || {}
  const lang = config.language || config.languages
  if (!lang) return '—'
  if (Array.isArray(lang)) return lang.join(', ')
  return lang
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

function taskState(task) {
  switch (task.state) {
    case 'DONE': return 'done'
    case 'RUNNING': return 'running'
    case 'ERROR': case 'CANCELLED': return 'error'
    default: return 'running'
  }
}

function progressVariant(task) {
  if (taskState(task) === 'error') return 'secondary'
  return 'primary'
}

function goToPage(p) {
  page.value = Math.max(1, Math.min(p, totalPages.value))
  fetchTasks()
}

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
    <div class="transcriptions-page__header d-flex align-items-center justify-content-between px-4 py-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="goToPage(1)">
          <i-ph-caret-double-left />
        </button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="goToPage(page - 1)">
          <i-ph-caret-left />
        </button>
        <span class="text-muted small">
          <input
            v-model.number="page"
            type="number"
            class="transcriptions-page__page-input"
            min="1"
            :max="totalPages"
            @change="goToPage(page)"
          >
          to {{ Math.min(from + perPage, totalRows) }} of {{ totalRows }} transcriptions
        </span>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages" @click="goToPage(page + 1)">
          <i-ph-caret-right />
        </button>
        <button class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages" @click="goToPage(totalPages)">
          <i-ph-caret-double-right />
        </button>
      </div>
      <div class="transcriptions-page__search">
        <div class="input-group">
          <span class="input-group-text">
            <i-ph-magnifying-glass />
          </span>
          <input
            v-model="search"
            type="text"
            class="form-control"
            :placeholder="$t('asr.searchTranscriptions')"
          >
        </div>
      </div>
    </div>

    <div class="px-4">
      <div class="alert alert-info d-flex align-items-center gap-3 px-3 py-2">
        <i-ph-info class="flex-shrink-0" />
        <span class="flex-grow-1">{{ $t('asr.pageInfo') }}</span>
        <button class="btn btn-sm text-nowrap" style="background: var(--bs-body-bg); color: var(--bs-body-color)" type="button">
          {{ $t('asr.gotIt') }}
        </button>
      </div>
    </div>

    <div class="px-4 table-responsive">
      <table class="table table-borderless table-striped table-hover page-table align-middle">
        <thead>
          <tr>
            <th class="page-table-th text-nowrap" style="width: 2rem" />
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
              <i-ph-check-circle v-if="taskState(task) === 'done'" class="text-success" style="font-size: 1.25em" />
              <span v-else-if="taskState(task) === 'running'" class="spinner-border spinner-border-sm text-info" />
              <i-ph-x-circle v-else class="text-danger" style="font-size: 1.25em" />
            </td>
            <td class="fw-medium">
              {{ taskName(task) }}
            </td>
            <td>
              <span class="display-progress display-progress--primary">
                <span class="display-progress__label">{{ Math.round(taskProgress(task) * 100) }}%</span>
                <span class="display-progress__value" aria-hidden>
                  <span class="display-progress__value__bar" :style="{ width: `${taskProgress(task) * 100}%` }" />
                </span>
              </span>
            </td>
            <td>{{ taskCategory(task) }}</td>
            <td>{{ taskLanguages(task) }}</td>
            <td>{{ taskModel(task) }}</td>
            <td>{{ taskProject(task) }}</td>
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
  </div>
</template>

<style scoped>
.transcriptions-page__page-input {
  width: 3rem;
  text-align: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: inherit;
  padding: 0.1rem 0.25rem;
}

.transcriptions-page__page-input::-webkit-inner-spin-button,
.transcriptions-page__page-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.transcriptions-page__search {
  width: 300px;
}
</style>
