import BatchTranscribeButton from './components/BatchTranscribeButton.vue'
import TranscribeViewerPanel from './components/TranscribeViewerPanel.vue'

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
      selectLanguages: 'Select languages*',
      selectLanguagesHint: 'Select all the languages you can hear in the file.',
      search: 'Search',
      transcriptionLaunched: 'Transcription launched for {name}',
      transcriptionError: 'There was an error while launching transcription for {name}',
      viewTranscriptions: 'View transcriptions',
      batchModalTitle: 'Transcribe {count} audio or video document | Transcribe {count} audio or video documents',
      batchNotEligible: '{count} selected document is not eligible to ASR as its file type is not audio nor video. | {count} selected documents are not eligible to ASR as their file type is not audio nor video.',
      batchLanguageWarningTitle: 'All documents must be in the same languages.',
      batchLanguageWarningText: 'Split the selection in as many languages as you have.',
      batchTranscriptionLaunched: 'Transcription launched for {count} document | Transcription launched for {count} documents',
      batchTranscriptionError: 'There was an error while launching transcription for {count} document | There was an error while launching transcription for {count} documents'
    }
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
})
