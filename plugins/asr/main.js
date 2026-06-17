import TranscribeButton from './components/TranscribeButton.vue'
import TranscribePanel from './components/TranscribePanel.vue'

document.addEventListener('datashare:ready', async ({ detail: { core } }) => {
  console.log('[ASR plugin] loaded')
  core.i18n.global.mergeLocaleMessage('en', {
    asr: {
      transcribe: 'Transcribe',
      noTextTranscribed: 'No text transcribed',
      noTextTranscribedVisitor: 'No text transcribed. Ask an editor or an admin to run transcription.',
      transcriptionInProgress: 'Transcription in progress...',
      stopTranscription: 'Stop transcription',
      info: "Datashare uses Nvidia's Parakeet-tdt-0.6b-v3 for Automatic Speech Recognition (ASR). All the processing is done within Datashare — no data is sent to third parties.",
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
    name: 'asr-transcribe-panel',
    target: 'search:before',
    definition: TranscribePanel
  })
})
