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
    it('is invalid when name is empty', async () => {
      createWrapper()
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(false)
    })

    it('is invalid when name is set but no languages selected', async () => {
      createWrapper()
      await flushPromises()
      wrapper.vm.name = 'My transcription'
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(false)
    })

    it('is valid when name is set and languages are selected', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.name = 'My transcription'
      asrStore.selectedLanguages = ['en']
      await flushPromises()
      expect(wrapper.vm.isValid).toBe(true)
    })
  })

  describe('reset', () => {
    it('clears name, query and model', async () => {
      createWrapper()
      await flushPromises()
      wrapper.vm.name = 'My transcription'
      wrapper.vm.query = 'some query'
      wrapper.vm.selectedModel = 'faster-whisper'

      wrapper.vm.reset()

      expect(wrapper.vm.name).toBe('')
      expect(wrapper.vm.query).toBe('')
      expect(wrapper.vm.selectedModel).toBe('parakeet')
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
    it('calls transcribeBatch and navigates to the list', async () => {
      createWrapper()
      await flushPromises()
      const asrStore = useAsrStore()
      wrapper.vm.name = 'My transcription'
      asrStore.selectedLanguages = ['en']
      sendActionMock.mockResolvedValue({ taskId: 'task-123' })

      await wrapper.vm.submit()
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', expect.objectContaining({
        method: 'POST'
      }))
      expect(core.router.push).toHaveBeenCalledWith({ name: 'task.transcriptions' })
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

  describe('initialization', () => {
    it('fetches models on mount', async () => {
      createWrapper()
      await flushPromises()
      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/models')
    })
  })
})
