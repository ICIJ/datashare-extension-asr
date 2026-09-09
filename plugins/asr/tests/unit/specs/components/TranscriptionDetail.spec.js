import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { nextTick } from 'vue'

import CoreSetup from '~tests/unit/CoreSetup'
import TranscriptionDetail from '@/components/TranscriptionDetail.vue'

const sendActionMock = vi.fn()
const getDocumentsByIdsMock = vi.fn()

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({
      sendAction: sendActionMock,
      elasticsearch: {
        getDocumentsByIds: getDocumentsByIdsMock
      }
    })
  }
})

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useModal: () => ({
      create: vi.fn().mockReturnValue({ show: vi.fn() })
    })
  }
})

describe('TranscriptionDetail.vue', () => {
  const taskId = '5a042ff6-4ce5-4f25-b714-366e929c9229'

  const baseTask = {
    id: `asr.transcription-${taskId}`,
    name: 'asr.transcription',
    state: 'DONE',
    createdAt: '2026-07-20T10:00:00Z',
    args: {
      project: 'test-project',
      name: 'my-audio.mp3',
      docs: ['doc1', 'doc2'],
      language: 'en',
      batch_size: 2,
      user: { id: 'testuser' }
    }
  }

  const esHits = {
    hits: {
      hits: [
        { _id: 'doc1', _source: { path: '/data/audio/interview.mp3', contentType: 'audio/mpeg' } },
        { _id: 'doc2', _source: { path: '/data/video/meeting.mp4', contentType: 'video/mp4' } }
      ]
    }
  }

  function createWrapper(taskData = baseTask, options = {}) {
    sendActionMock.mockReset()
    getDocumentsByIdsMock.mockReset()
    sendActionMock.mockResolvedValue(taskData)
    getDocumentsByIdsMock.mockResolvedValue(esHits)

    const core = CoreSetup.init(options)
    core.api.sendAction = sendActionMock
    core.api.elasticsearch.getDocumentsByIds = getDocumentsByIdsMock
    const { plugins } = core.useAll()
    const wrapper = mount(TranscriptionDetail, {
      props: { taskId },
      global: { plugins }
    })
    return { wrapper, core }
  }

  describe('task fetching', () => {
    it('fetches the task with the full prefixed ID on mount', async () => {
      createWrapper()
      await flushPromises()
      expect(sendActionMock).toHaveBeenCalledWith(
        `/api/task/asr.transcription-${taskId}`
      )
    })

    it('shows task not found message when task is null', async () => {
      sendActionMock.mockReset()
      sendActionMock.mockRejectedValue(new Error('not found'))
      getDocumentsByIdsMock.mockReset()
      const core = CoreSetup.init()
      core.api.sendAction = sendActionMock
      core.api.elasticsearch.getDocumentsByIds = getDocumentsByIdsMock
      const { plugins } = core.useAll()
      const wrapper = mount(TranscriptionDetail, {
        props: { taskId },
        global: { plugins }
      })
      await flushPromises()
      expect(wrapper.text()).toContain('asr.taskNotFound')
    })
  })

  describe('document list', () => {
    it('displays document names from ES path', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('interview.mp3')
      expect(wrapper.text()).toContain('meeting.mp4')
    })

    it('displays document categories', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('Audio')
      expect(wrapper.text()).toContain('Video')
    })

    it('handles java.util.ArrayList wrapper in docs', async () => {
      const task = {
        ...baseTask,
        args: { ...baseTask.args, docs: ['java.util.ArrayList', ['doc1', 'doc2']] }
      }
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.text()).toContain('interview.mp3')
      expect(wrapper.text()).toContain('meeting.mp4')
    })

    it('falls back to docId when ES details are unavailable', async () => {
      sendActionMock.mockReset()
      sendActionMock.mockResolvedValue(baseTask)
      getDocumentsByIdsMock.mockReset()
      getDocumentsByIdsMock.mockResolvedValue({ hits: { hits: [] } })
      const core = CoreSetup.init()
      core.api.sendAction = sendActionMock
      core.api.elasticsearch.getDocumentsByIds = getDocumentsByIdsMock
      const { plugins } = core.useAll()
      const wrapper = mount(TranscriptionDetail, {
        props: { taskId },
        global: { plugins }
      })
      await flushPromises()
      expect(wrapper.text()).toContain('doc1')
      expect(wrapper.text()).toContain('doc2')
    })
  })

  describe('transcribe again button', () => {
    it('is not finished when task is RUNNING', async () => {
      const task = { ...baseTask, state: 'RUNNING' }
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.vm.isFinished).toBe(false)
    })

    it('is enabled when task is DONE', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      expect(wrapper.vm.isFinished).toBe(true)
    })

    it('is enabled when task is ERROR', async () => {
      const task = { ...baseTask, state: 'ERROR' }
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.vm.isFinished).toBe(true)
    })

    it('is enabled when task is CANCELLED', async () => {
      const task = { ...baseTask, state: 'CANCELLED' }
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.vm.isFinished).toBe(true)
    })
  })

  describe('delete action', () => {
    it('calls the delete API with the full prefixed task ID', async () => {
      sendActionMock.mockResolvedValueOnce(baseTask) // fetchTask
      sendActionMock.mockResolvedValueOnce(null) // delete
      const { wrapper, core } = createWrapper()
      await flushPromises()

      wrapper.vm.showDeleteModal = true
      await nextTick()

      await wrapper.vm.confirmDelete()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith(
        `/api/task/clean/asr.transcription-${taskId}`,
        { method: 'DELETE' }
      )
      expect(core.router.push).toHaveBeenCalledWith({ name: 'task.transcriptions' })
    })
  })

  describe('transcribe again action', () => {
    it('pre-selects the original task language in the store', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()

      wrapper.vm.requestTranscribeAgain()

      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      expect(store.selectedLanguage).toBe('en')
    })

    it('calls the transcribe API with correct parameters', async () => {
      sendActionMock.mockResolvedValueOnce(baseTask) // fetchTask
      sendActionMock.mockResolvedValueOnce({ taskId: `asr.transcription-new-uuid` }) // transcribe
      const { wrapper } = createWrapper()
      await flushPromises()

      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'

      await wrapper.vm.confirmTranscribeAgain()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', {
        method: 'POST',
        data: {
          project: 'test-project',
          docs: ['doc1', 'doc2'],
          name: 'my-audio.mp3',
          language: 'en',
          batch_size: 2
        }
      })
    })
  })

  describe('query-based tasks', () => {
    const queryTask = {
      ...baseTask,
      args: {
        ...baseTask.args,
        name: null,
        docs: { '@type': 'java.util.LinkedHashMap', 'match_all': {} }
      }
    }

    it('shows the search query message instead of the document table', async () => {
      const { wrapper } = createWrapper(queryTask)
      await flushPromises()
      expect(wrapper.text()).toContain('asr.detailQueryBased')
      expect(wrapper.text()).toContain('asr.detailSeeQuery')
      expect(wrapper.find('table').exists()).toBe(false)
    })

    it('uses timestamp-based title for query-based tasks', async () => {
      const { wrapper } = createWrapper(queryTask)
      await flushPromises()
      expect(wrapper.vm.taskTitle).toBe('asr_transcription_20260720_100000')
    })

    it('sends original docs in transcribe again', async () => {
      const docs = { '@type': 'java.util.LinkedHashMap', 'match_all': {} }
      const task = { ...queryTask, args: { ...queryTask.args, docs } }
      sendActionMock.mockResolvedValueOnce(task)
      sendActionMock.mockResolvedValueOnce({ taskId: 'asr.transcription-new-uuid' })
      const { wrapper } = createWrapper(task)
      await flushPromises()

      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'fr'

      await wrapper.vm.confirmTranscribeAgain()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', {
        method: 'POST',
        data: expect.objectContaining({ docs })
      })
    })
  })

  describe('task model display', () => {
    it('displays the model from config.inference.model', async () => {
      const task = {
        ...baseTask,
        args: { ...baseTask.args, config: { inference: { model: 'model-x' } } }
      }
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.text()).toContain('model-x')
    })

    it('falls back to default model when args.model is absent', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      expect(wrapper.vm.taskModel).toBeTruthy()
    })
  })

  describe('document count', () => {
    it('displays the correct number of documents', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      expect(wrapper.text()).toContain('2 documents')
    })

    it('displays singular form for one document', async () => {
      const task = { ...baseTask, args: { ...baseTask.args, docs: ['doc1'] } }
      getDocumentsByIdsMock.mockResolvedValue({ hits: { hits: [esHits.hits.hits[0]] } })
      const { wrapper } = createWrapper(task)
      await flushPromises()
      expect(wrapper.text()).toContain('1 document')
    })
  })
})
