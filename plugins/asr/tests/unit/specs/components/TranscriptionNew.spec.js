import { flushPromises, shallowMount } from '@vue/test-utils'
import { vi } from 'vitest'

import CoreSetup from '~tests/unit/CoreSetup'
import TranscriptionNew from '@/components/TranscriptionNew.vue'
import { useAsrStore } from '@/stores/asr'

const sendActionMock = vi.fn()

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({
      sendAction: sendActionMock
    })
  }
})

describe('TranscriptionNew.vue', () => {
  let core, wrapper

  function createWrapper() {
    sendActionMock.mockReset()
    sendActionMock.mockResolvedValue({})
    core = CoreSetup.init()
    core.api.sendAction = sendActionMock
    const { plugins } = core.useAll()
    wrapper = shallowMount(TranscriptionNew, {
      global: { plugins }
    })
    return wrapper
  }

  describe('form validation', () => {
    it('is invalid when no languages are selected', async () => {
      createWrapper()
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(false)
    })

    it('is valid when languages are selected', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguages = ['en']
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(true)
    })
  })

  describe('reset', () => {
    it('clears query and model', async () => {
      createWrapper()
      await flushPromises()
      const defaultModel = wrapper.vm.selectedModel
      wrapper.vm.query = 'some query'
      wrapper.vm.selectedModel = 'model-b'

      wrapper.vm.reset()

      expect(wrapper.vm.query).toBe('')
      expect(wrapper.vm.selectedModel).toBe(defaultModel)
    })

    it('clears selected languages', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguages = ['en', 'fr']

      wrapper.vm.reset()

      expect(asrStore.selectedLanguages).toEqual([])
    })
  })

  describe('submit', () => {
    it('calls transcribeBatch with docs and query and navigates to the list', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguages = ['en']
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          docs: [],
          query: { match_all: {} }
        })
      }))
      expect(core.router.push).toHaveBeenCalledWith({ name: 'task.transcriptions' })
    })

    it('sends a query_string query when search text is provided', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.query = 'exp*'
      asrStore.selectedLanguages = ['en']
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        data: expect.objectContaining({
          query: { query_string: { query: 'exp*' } }
        })
      }))
    })

    it('includes the selected model in the payload', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.selectedModel = 'model-b'
      asrStore.selectedLanguages = ['en']
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        data: expect.objectContaining({ model: 'model-b' })
      }))
    })

    it('does not submit when form is invalid', async () => {
      createWrapper()
      await flushPromises()
      sendActionMock.mockClear()

      await wrapper.vm.submit()
      await flushPromises()

      expect(core.router.push).not.toHaveBeenCalled()
    })
  })

  describe('selectedLanguageNames', () => {
    it('shows the full name for a single language', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguages = ['fr']
      await flushPromises()
      expect(wrapper.vm.selectedLanguageNames).toBe('French')
    })

    it('condenses multiple languages to first name and count', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguages = ['fr', 'en', 'de', 'es']
      await flushPromises()
      expect(wrapper.vm.selectedLanguageNames).toBe('French and 3 other languages')
    })
  })

  describe('initialization', () => {
    it('fetches models on mount', async () => {
      createWrapper()
      await flushPromises()
      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/models')
    })
  })
})
