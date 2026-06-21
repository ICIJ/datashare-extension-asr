import { mount } from '@vue/test-utils'

import CoreSetup from '~tests/unit/CoreSetup'
import TranscriptionsSidebarEntry from '@/components/TranscriptionsSidebarEntry.vue'

describe('TranscriptionsSidebarEntry.vue', () => {
  function createWrapper(props = {}) {
    const { plugins } = CoreSetup.init().useAll()
    return mount(TranscriptionsSidebarEntry, {
      props,
      global: { plugins }
    })
  }

  describe('in the Tasks section', () => {
    let wrapper

    beforeEach(() => {
      wrapper = createWrapper({ to: { name: 'task.task-board' } })
    })

    it('is visible', () => {
      expect(wrapper.find('.transcriptions-sidebar-entry').exists()).toBe(true)
    })

    it('shows the transcriptions label', () => {
      expect(wrapper.text()).toContain('asr.transcriptions')
    })
  })
})
