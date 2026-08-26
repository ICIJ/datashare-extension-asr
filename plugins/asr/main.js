import { markRaw } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { formatTaskTimestamp } from './utils/formatting'
import TranscriptionsSidebarEntry from './components/TranscriptionsSidebarEntry.vue'
import TranscriptionsPage from './components/TranscriptionsPage.vue'
import TranscriptionsSettings from './components/TranscriptionsSettings.vue'
import BatchTranscribeButton from './components/BatchTranscribeButton.vue'
import TranscribeViewerPanel from './components/TranscribeViewerPanel.vue'
import TranscribePanelHook from './components/TranscribePanelHook.vue'
import TranscriptionDownloadButtons from './components/TranscriptionDownloadButtons.vue'
import TranscriptionsBoardEntry from './components/TranscriptionsBoardEntry.vue'
import TranscriptionDetail from './components/TranscriptionDetail.vue'
import TranscriptionNew from './components/TranscriptionNew.vue'

document.addEventListener('datashare:ready', async ({ detail: { core } }) => {
  core.i18n.global.mergeLocaleMessage('en', {
    asr: {
      transcribe: 'Transcribe',
      transcriptions: 'Transcriptions',
      noTextTranscribed: 'No text transcribed',
      unsupportedFormat: 'This audio/video format is not supported for transcription.',
      transcriptionAvailable: 'Transcription available',
      transcriptionDisclaimer: 'This is an automatic transcription. Always check original.',
      transcribeAgain: 'Transcribe again',
      close: 'Close',
      noTextTranscribedVisitor: 'No text transcribed. Ask an editor or an admin to run transcription.',
      transcriptionInProgress: 'Transcription in progress...',
      stopTranscription: 'Stop transcription',
      info: 'Datashare uses Nvidia\'s Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.',
      selectModel: 'Select a model',
      selectLanguage: 'Select a language*',
      selectLanguageHint: 'Select the language spoken in the file.',
      search: 'Search',
      searchTranscriptions: 'Search in transcriptions',
      transcriptionLaunched: 'Transcription launched for {name}',
      transcriptionError: 'There was an error while launching transcription for {name}',
      pageInfo: 'Transcriptions are Automatic Speech Recognitions (ASR): audio/video transcribed into text. Only editors and admins can run transcriptions.',
      loading: 'Loading...',
      noTranscriptions: 'No transcriptions yet.',
      colState: 'State',
      colName: 'Name of the documents',
      colProgress: 'Progress',
      colCategory: 'Category',
      colLanguage: 'Language',
      colModel: 'Model',
      colProject: 'Project',
      colUser: 'User',
      colLaunchedOn: 'Launched on',
      breadcrumbTasks: 'Tasks',
      rowRange: 'to {to} of 0 transcriptions | to {to} of 1 transcription | to {to} of {total} transcriptions',
      rowRangeFewer: 'of 0 transcriptions | of 1 transcription | to {total} transcriptions',
      rowRangeCompact: 'of 0 transcriptions | of 1 transcription | of {total} transcriptions',
      errorTitle: 'The error is',
      errorDescription: 'The transcription encountered a problem.',
      ok: 'Ok',
      settingsTitle: 'Transcriptions settings',
      settingsSortBy: 'Sort by',
      settingsPerPage: 'Transcriptions per page',
      settingsProperties: 'Properties',
      sortOldFirst: 'Launched on (old first)',
      sortRecentFirst: 'Launched on (recent first)',
      batchModalTitle: 'Transcribe {count} audio or video document | Transcribe {count} audio or video documents',
      batchNotEligible: '{count} selected document is not eligible to ASR as its file type is not audio nor video. | {count} selected documents are not eligible to ASR as their file type is not audio nor video.',
      batchLanguageWarningTitle: 'All documents must be in the same language.',
      batchLanguageWarningText: 'Split the selection by language.',
      batchTranscriptionLaunched: 'Transcription launched for {count} document | Transcription launched for {count} documents',
      batchTranscriptionError: 'There was an error while launching transcription for {count} document | There was an error while launching transcription for {count} documents',
      multipleProjectsWarning: 'Transcription is not available on several projects. Select documents from one project only.',
      transcription: 'Transcription',
      viewTranscriptions: 'View transcriptions',
      downloadTranscription: 'Download transcription',
      downloadWithTimestamps: 'Download with timestamps',
      boardEntry: {
        title: 'Transcriptions',
        description: 'Automatically transcribe video and audio documents into text, using Nvidia\'s Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.'
      },
      detailColDocName: 'Document name',
      detailDelete: 'Delete',
      detailRunningCount: 'Running for {count} documents',
      detailSuccessCount: 'Success for {count} documents',
      detailFailureCount: 'Failure for {count} documents',
      detailSeeDocument: 'See document',
      detailSeeAllDocuments: 'See all documents',
      detailDownloadCsv: 'Download list (CSV)',
      deleteTitle: 'Are you sure?',
      deleteConfirm: 'Yes, proceed',
      deleteDescription: 'You are about to delete this transcription task and all its results.',
      detailDeleteTitle: 'Are you sure?',
      detailDeleteConfirm: 'Yes, proceed',
      detailDeleteDescription: 'You are about to delete the transcriptions of {count} documents.',
      detailQueryBased: 'This transcription is based on a search query.',
      detailSeeQuery: 'See query in Search',
      detailNbDocuments: 'Number of documents',
      detailModel: 'Model',
      detailLanguage: 'Language',
      detailDate: 'Date',
      detailUser: 'User',
      detailProjects: 'Projects',
      taskNotFound: 'Task not found.',
      newTranscription: 'New transcription',
      allSupportedTypes: 'All supported types',
      newForm: {
        title: 'Create a new transcription',
        name: 'Name',
        namePlaceholder: 'Give a name to your transcription',
        project: 'Project',
        documents: 'Documents to transcribe',
        documentsPlaceholder: 'Type queries, use operators or type regex...',
        languages: 'Languages',
        languagesHint: 'All the documents must be in the same language(s). If you have documents with mixed languages, refine your document selection at step 2.',
        model: 'Model',
        selectModel: 'Select a model',
        parakeetInfo: 'Parakeet is Nvidia\'s Parakeet-tdt-0.6b-v3.',
        fasterWhisperInfo: 'Faster-Whisper is Systran\'s model.',
        yourSelection: 'Your selection :',
        selectionSummaryCount: '{audioCount} audio and {videoCount} video documents',
        selectionSummaryRest: 'in {languages} are selected to be transcribed with {model}.',
        selectionWarningCount: '{count} selected documents',
        selectionWarningRest: 'won\'t be transcribed because their format is not supported.',
        reset: 'Reset',
        transcribe: 'Transcribe'
      }
    }
  })

  if (typeof core.registerTaskName === 'function') {
    core.registerTaskName('asr.transcription', {
      icon: IPhFileAudio,
      title: 'asr.transcription',
      listRoute: { name: 'task.transcriptions' },
      linkTitle: 'asr.transcription',
      getProjects: item => [item.args?.project].filter(Boolean),
      getTitle(item) {
        const ts = formatTaskTimestamp(item.createdAt || item.creationDate)
        return ts ? `asr_transcription_${ts}` : 'asr.transcription'
      },
      getRoute(item) {
        const prefix = 'asr.transcription-'
        const taskId = item.id.startsWith(prefix) ? item.id.slice(prefix.length) : item.id
        return { name: 'task.transcriptions.detail', params: { taskId } }
      }
    })
  }

  core.registerHook({
    name: 'asr-batch-transcribe',
    target: 'search-selection.compact:after',
    definition: BatchTranscribeButton
  })

  core.registerHook({
    name: 'asr-transcribe-panel',
    target: 'document-entries-list:before',
    definition: TranscribePanelHook
  })

  core.registerHook({
    name: 'asr-transcribe-viewer-panel',
    target: 'document.viewer.audio:after',
    definition: markRaw(TranscribeViewerPanel)
  })

  core.registerHook({
    name: 'asr-transcribe-viewer-panel-video',
    target: 'document.viewer.video:after',
    definition: markRaw(TranscribeViewerPanel)
  })

  core.registerHook({
    name: 'asr-download-transcription',
    target: 'document.download-popover:after',
    definition: markRaw(TranscriptionDownloadButtons)
  })

  core.registerHook({
    name: 'asr-transcriptions-board',
    target: 'task-board-list:after',
    definition: TranscriptionsBoardEntry
  })

  core.registerHook({
    name: 'asr-transcriptions-sidebar',
    target: 'app-sidebar-section-entries:after',
    definition: TranscriptionsSidebarEntry
  })

  let retries = 0
  const waitForRouter = setInterval(() => {
    if (++retries > 100) {
      clearInterval(waitForRouter)
      return
    }
    if (core.router) {
      clearInterval(waitForRouter)
      core.router.addRoute('task', {
        name: 'task.transcriptions',
        path: 'transcriptions',
        components: {
          default: TranscriptionsPage,
          settings: TranscriptionsSettings
        },
        meta: {
          title: 'asr.transcriptions',
          icon: markRaw(IPhFileAudio)
        }
      })
      core.router.addRoute('task', {
        name: 'task.transcriptions.new',
        path: 'transcriptions/new',
        components: {
          default: TranscriptionNew
        },
        meta: {
          title: 'asr.newForm.title',
          icon: markRaw(IPhFileAudio)
        }
      })
      core.router.addRoute('task', {
        name: 'task.transcriptions.detail',
        path: 'transcriptions/:taskId',
        components: {
          default: TranscriptionDetail
        },
        props: { default: true },
        meta: {
          title: 'asr.transcriptions',
          icon: markRaw(IPhFileAudio)
        }
      })
    }
  }, 50)
})
