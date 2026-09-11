import { markRaw } from 'vue'
import IPhFileAudio from '~icons/ph/file-audio'
import { formatTaskTimestamp } from './utils/formatting'
import BatchTranscribeButton from './components/BatchTranscribeButton.vue'
import TranscribeViewerPanel from './components/TranscribeViewerPanel.vue'
import TranscribePanelHook from './components/TranscribePanelHook.vue'
import TranscriptionDownloadButtons from './components/TranscriptionDownloadButtons.vue'

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
      transcriptionLaunched: 'Transcription launched for {name}',
      transcriptionError: 'There was an error while launching transcription for {name}',
      viewTranscriptions: 'View transcriptions',
      batchModalTitle: 'Transcribe {count} audio or video document | Transcribe {count} audio or video documents',
      batchNotEligible: '{count} selected document is not eligible to ASR as its file type is not audio nor video. | {count} selected documents are not eligible to ASR as their file type is not audio nor video.',
      batchLanguageWarningTitle: 'All documents must be in the same language.',
      batchLanguageWarningText: 'Split the selection by language.',
      batchTranscriptionLaunched: 'Transcription launched for {count} document | Transcription launched for {count} documents',
      batchTranscriptionError: 'There was an error while launching transcription for {count} document | There was an error while launching transcription for {count} documents',
      multipleProjectsWarning: 'Transcription is not available on several projects. Select documents from one project only.',
      downloadTranscription: 'Download transcription',
      downloadWithTimestamps: 'Download with timestamps'
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
})
