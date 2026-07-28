import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'

import CoreSetup from '~tests/unit/CoreSetup'
import TranscribeButton from '@/components/TranscribeButton.vue'

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({ sendAction: vi.fn() })
  }
})

describe('TranscribeButton.vue', () => {
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
    let core

    beforeEach(async () => {
      core = CoreSetup.init()
      const { plugins } = core.useAll()
      wrapper = mount(TranscribeButton, { global: { plugins } })
      await flushPromises()
      const { useAsrStore } = await import('@/stores/asr')
      store = useAsrStore(core._pinia)
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
      wrapper = mount(TranscribeButton, { global: { plugins } })
      await flushPromises()
    })

    it('is not visible', () => {
      expect(wrapper.find('.transcribe-button').exists()).toBe(false)
    })
  })
})
