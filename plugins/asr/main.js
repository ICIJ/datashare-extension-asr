import { markRaw } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import TranscriptionsSidebarEntry from './components/TranscriptionsSidebarEntry.vue'
import TranscriptionsPage from './components/TranscriptionsPage.vue'
import TranscriptionsSettings from './components/TranscriptionsSettings.vue'
import BatchTranscribeButton from './components/BatchTranscribeButton.vue'
import TranscribeViewerPanel from './components/TranscribeViewerPanel.vue'
import TranscriptionDownloadButtons from './components/TranscriptionDownloadButtons.vue'
import TranscriptionsBoardEntry from './components/TranscriptionsBoardEntry.vue'

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
      info: "Datashare uses Nvidia's Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.",
      selectLanguages: 'Select languages*',
      selectLanguagesHint: 'Select all the languages you can hear in the file.',
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
      colLanguages: 'Languages',
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
      batchLanguageWarningTitle: 'All documents must be in the same languages.',
      batchLanguageWarningText: 'Split the selection in as many languages as you have.',
      batchTranscriptionLaunched: 'Transcription launched for {count} document | Transcription launched for {count} documents',
      batchTranscriptionError: 'There was an error while launching transcription for {count} document | There was an error while launching transcription for {count} documents',
      transcription: 'Transcription',
      viewTranscriptions: 'View transcriptions',
      downloadTranscription: 'Download transcription',
      downloadWithTimestamps: 'Download with timestamps',
      boardEntry: {
        title: 'Transcriptions',
        description: 'Automatically transcribe video and audio documents into text, using Nvidia\'s Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.'
      }
    }
  })

  core.registerTaskName('asr.transcription', {
    icon: IPhFileAudio,
    title: 'asr.transcription',
    listRoute: { name: 'task.transcriptions' },
    linkTitle: 'asr.transcription',
    getProjects: (item) => [item.args?.project].filter(Boolean),
    getTitle: (item) => item.args?.name ?? 'asr.transcription'
  })

  core.registerHook({
    name: 'asr-batch-transcribe',
    target: 'search-selection.compact:after',
    definition: BatchTranscribeButton
  })

  core.registerHook({
    name: 'asr-transcribe-audio-viewer',
    target: 'document.viewer.audio:after',
    definition: TranscribeViewerPanel
  })

  core.registerHook({
    name: 'asr-transcribe-video-viewer',
    target: 'document.viewer.video:after',
    definition: TranscribeViewerPanel
  })

  core.registerHook({
    name: 'asr-transcription-download',
    target: 'document-download-popover.buttons:after',
    definition: TranscriptionDownloadButtons
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

  // The router is created after the 'datashare:ready' event (in the .then() callback),
  // so we wait for it to be available before adding the route.
  const waitForRouter = setInterval(() => {
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
    }
  }, 50)
})
