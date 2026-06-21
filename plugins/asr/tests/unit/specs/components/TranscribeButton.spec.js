import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'
import { defineComponent } from 'vue'

import CoreSetup from '~tests/unit/CoreSetup'
import TranscribeButton from '@/components/TranscribeButton.vue'

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({ sendAction: vi.fn() })
  }
})

describe('TranscribeButton.vue', () => {
  const TestComponent = defineComponent({
    components: { TranscribeButton },
    template: '<suspense><transcribe-button /></suspense>'
  })

  beforeEach(() => {
    const target = document.createElement('div')
    target.classList.add('document-entries-list__start__list')
    document.body.appendChild(target)
  })

  afterEach(() => {
    document.querySelector('.document-entries-list__start__list')?.remove()
  })

  describe('with an audio document', () => {
    let wrapper
    let store

    beforeEach(async () => {
      const { plugins } = CoreSetup.init().useAll()
      const testWrapper = mount(TestComponent, { global: { plugins } })
      await flushPromises()
      wrapper = testWrapper.findComponent(TranscribeButton)
      const { useAsrStore } = await import('@/stores/asr')
      store = useAsrStore()
    })

    it('is visible', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.isVisible()).toBe(true)
    })

    it('shows "no text transcribed" message', () => {
      expect(wrapper.text()).toContain('asr.noTextTranscribed')
    })

    it('shows the transcribe button', () => {
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('button').text()).toBe('asr.transcribe')
    })

    it('opens the transcribe panel on click', async () => {
      await wrapper.find('button').trigger('click')
      await flushPromises()
      const panel = document.querySelector('.document-entries-list__start__list .transcribe-panel')
      expect(panel).not.toBeNull()
    })

    it('disables the button while transcription is in progress', async () => {
      store.taskState = 'RUNNING'
      await flushPromises()
      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
    })

    it('shows transcription in progress message', async () => {
      store.taskState = 'RUNNING'
      await flushPromises()
      expect(wrapper.text()).toContain('asr.transcriptionInProgress')
    })
  })

  describe('with a PDF document', () => {
    let wrapper

    beforeEach(async () => {
      const { plugins } = CoreSetup.init({ document: { contentType: 'application/pdf' } }).useAll()
      const testWrapper = mount(TestComponent, { global: { plugins } })
      await flushPromises()
      wrapper = testWrapper.findComponent(TranscribeButton)
    })

    it('is not visible', () => {
      expect(wrapper.find('.transcribe-button').exists()).toBe(false)
    })
  })
})
