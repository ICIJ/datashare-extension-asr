import { mount } from '@vue/test-utils'

import CorePlugin from '../../CorePlugin.js'
import TranscriptionsSidebarEntry from '@/components/TranscriptionsSidebarEntry.vue'

describe('TranscriptionsSidebarEntry.vue', () => {
  function createWrapper(props = {}) {
    const { plugins } = CorePlugin.init()
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
