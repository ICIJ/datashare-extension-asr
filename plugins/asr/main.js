import TranscribeButton from './components/TranscribeButton.vue'
import TranscriptionsSidebarEntry from './components/TranscriptionsSidebarEntry.vue'
import TranscriptionsPage from './components/TranscriptionsPage.vue'

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
      searchTranscriptions: 'Search in transcriptions',
      transcriptionLaunched: 'Transcription launched for {name}',
      pageInfo: 'Transcriptions are Automatic Speech Recognitions (ASR): audio/video transcribed into text. Only editors and admins can run transcriptions.',
      gotIt: "Got it, don't show again",
      loading: 'Loading...',
      noTranscriptions: 'No transcriptions yet.',
      colName: 'Name of the documents',
      colProgress: 'Progress',
      colCategory: 'Category',
      colLanguages: 'Languages',
      colModel: 'Model',
      colProject: 'Project',
      colUser: 'User',
      colLaunchedOn: 'Launched on'
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

  // The router is created after the 'datashare:ready' event (in the .then() callback),
  // so we wait for it to be available before adding the route.
  const waitForRouter = setInterval(() => {
    if (core.router) {
      clearInterval(waitForRouter)
      core.router.addRoute('task', {
        name: 'task.transcriptions',
        path: 'transcriptions',
        component: TranscriptionsPage,
        meta: {
          title: 'asr.transcriptions'
        }
      })
    }
  }, 50)
})
