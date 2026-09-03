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
    it('is invalid when no language is selected', async () => {
      createWrapper()
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(false)
    })

    it('is valid when a language is selected', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguage = 'en'
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

    it('clears selected language', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguage = 'en'

      wrapper.vm.reset()

      expect(asrStore.selectedLanguage).toBeNull()
    })
  })

  describe('submit', () => {
    it('calls transcribeBatch with docs and query and navigates to the list', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguage = 'en'
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        method: 'POST',
        data: expect.objectContaining({
          docs: { match_all: {} }
        })
      }))
      expect(core.router.push).toHaveBeenCalledWith({ name: 'task.transcriptions' })
    })

    it('sends a query_string query when search text is provided', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.query = 'exp*'
      asrStore.selectedLanguage = 'en'
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        data: expect.objectContaining({
          docs: { query_string: { query: 'exp*' } }
        })
      }))
    })

    it('includes the selected model in the payload', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.selectedModel = 'model-b'
      asrStore.selectedLanguage = 'en'
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

  describe('selectedLanguageName', () => {
    it('shows the full name for a selected language', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      asrStore.selectedLanguage = 'fr'
      await flushPromises()
      expect(wrapper.vm.selectedLanguageName).toBe('French')
    })

    it('returns empty string when no language is selected', async () => {
      createWrapper()
      await flushPromises()
      expect(wrapper.vm.selectedLanguageName).toBe('')
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
