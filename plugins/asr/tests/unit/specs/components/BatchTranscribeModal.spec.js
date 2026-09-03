import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import CoreSetup from '~tests/unit/CoreSetup'
import BatchTranscribeModal from '@/components/BatchTranscribeModal.vue'

const sendActionMock = vi.fn()

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({ sendAction: sendActionMock })
  }
})

describe('BatchTranscribeModal.vue', () => {
  const audioDocs = [
    { id: 'doc1', contentType: 'audio/mpeg', index: 'project-a' },
    { id: 'doc2', contentType: 'audio/wav', index: 'project-a' }
  ]

  const videoDocs = [
    { id: 'doc3', contentType: 'video/mp4', index: 'project-a' }
  ]

  const pdfDocs = [
    { id: 'doc4', contentType: 'application/pdf', index: 'project-a' },
    { id: 'doc5', contentType: 'text/plain', index: 'project-a' }
  ]

  function createWrapper(selectedDocuments = []) {
    const TestComponent = defineComponent({
      components: { BatchTranscribeModal },
      data: () => ({ open: true, docs: selectedDocuments }),
      template: '<suspense><batch-transcribe-modal v-model="open" :selected-documents="docs" /></suspense>'
    })
    const { plugins } = CoreSetup.init().useAll()
    return mount(TestComponent, { global: { plugins } })
  }

  beforeEach(() => {
    sendActionMock.mockReset()
    sendActionMock.mockResolvedValue({})
  })

  describe('eligible documents filtering', () => {
    it('counts only audio and video documents as eligible', async () => {
      const wrapper = createWrapper([...audioDocs, ...videoDocs, ...pdfDocs])
      await flushPromises()
      const modal = wrapper.findComponent(BatchTranscribeModal)
      // $t returns key, title key is 'asr.batchModalTitle' — check eligible docs via modal title presence
      expect(modal.text()).toContain('asr.batchModalTitle')
      // ineligible warning should also be shown (2 pdf/text docs)
      expect(modal.text()).toContain('asr.batchNotEligible')
    })

    it('shows ineligible count warning when non-audio/video documents are selected', async () => {
      const wrapper = createWrapper([...audioDocs, ...pdfDocs])
      await flushPromises()
      expect(wrapper.text()).toContain('asr.batchNotEligible')
    })

    it('does not show ineligible warning when all documents are eligible', async () => {
      const wrapper = createWrapper([...audioDocs, ...videoDocs])
      await flushPromises()
      expect(wrapper.text()).not.toContain('asr.batchNotEligible')
    })
  })

  describe('transcribe button state', () => {
    it('disables the transcribe button when no language is selected', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const btn = wrapper.find('.btn-action')
      expect(btn.attributes('disabled')).toBeDefined()
    })

    it('enables the transcribe button when a language is selected and eligible docs exist', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'
      await nextTick()
      const btn = wrapper.find('.btn-action')
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('disables the transcribe button when no eligible docs exist', async () => {
      const wrapper = createWrapper(pdfDocs)
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'
      await nextTick()
      const btn = wrapper.find('.btn-action')
      expect(btn.attributes('disabled')).toBeDefined()
    })
  })

  describe('model selector', () => {
    it('renders the model selector dropdown', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const modal = wrapper.findComponent(BatchTranscribeModal)
      expect(modal.text()).toContain('asr.selectModel')
    })

    it('has a default selectedModel', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const modal = wrapper.findComponent(BatchTranscribeModal)
      expect(modal.vm.selectedModel).toBeTruthy()
    })
  })

  describe('batch transcription', () => {
    it('calls transcribeBatch with correct project and doc IDs', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'
      await nextTick()

      await wrapper.find('.btn-action').trigger('click')
      await flushPromises()

      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', {
        method: 'POST',
        data: expect.objectContaining({ project: 'project-a', docs: ['doc1', 'doc2'], language: 'en', batch_size: 2, model: expect.any(String) })
      })
    })

    it('groups documents by project for separate API calls', async () => {
      const mixedDocs = [
        { id: 'doc1', contentType: 'audio/mpeg', index: 'project-a' },
        { id: 'doc2', contentType: 'audio/wav', index: 'project-b' }
      ]
      const wrapper = createWrapper(mixedDocs)
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'
      await nextTick()

      await wrapper.find('.btn-action').trigger('click')
      await flushPromises()

      // +1 for fetchModels call on mount
      expect(sendActionMock).toHaveBeenCalledTimes(3)
      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', {
        method: 'POST',
        data: expect.objectContaining({ project: 'project-a', docs: ['doc1'], language: 'en', batch_size: 2, model: expect.any(String) })
      })
      expect(sendActionMock).toHaveBeenCalledWith('/api/asr/transcribe', {
        method: 'POST',
        data: expect.objectContaining({ project: 'project-b', docs: ['doc2'], language: 'en', batch_size: 2, model: expect.any(String) })
      })
    })

    it('closes the modal after transcription', async () => {
      const wrapper = createWrapper(audioDocs)
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      const store = useAsrStore()
      store.selectedLanguage = 'en'
      await nextTick()

      await wrapper.find('.btn-action').trigger('click')
      await flushPromises()

      expect(wrapper.vm.open).toBe(false)
    })
  })
})
