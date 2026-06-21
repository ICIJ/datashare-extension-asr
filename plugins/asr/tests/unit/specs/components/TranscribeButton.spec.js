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

    beforeEach(async () => {
      const { plugins } = CoreSetup.init().useAll()
      const testWrapper = mount(TestComponent, { global: { plugins } })
      await flushPromises()
      wrapper = testWrapper.findComponent(TranscribeButton)
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
