import TranscribeButton from './components/TranscribeButton.vue'
import TranscriptionsSidebarEntry from './components/TranscriptionsSidebarEntry.vue'

document.addEventListener('datashare:ready', async ({ detail: { core } }) => {
  core.i18n.global.mergeLocaleMessage('en', {
    asr: {
      transcribe: 'Transcribe',
      transcriptions: 'Transcriptions',
      noTextTranscribed: 'No text transcribed',
      noTextTranscribedVisitor: 'No text transcribed. Ask an editor or an admin to run transcription.',
      transcriptionInProgress: 'Transcription in progress...',
      stopTranscription: 'Stop transcription',
      info: "Datashare uses Nvidia's Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.",
      selectLanguages: 'Select languages*',
      search: 'Search',
      transcriptionLaunched: 'Transcription launched for {name}'
    }
  })

  core.registerHook({
    name: 'asr-transcribe-button',
    target: 'document.content.body:before',
    definition: TranscribeButton
  })

  core.registerHook({
    name: 'asr-transcriptions-sidebar',
    target: 'app-sidebar-section-entries:after',
    definition: TranscriptionsSidebarEntry
  })
})
