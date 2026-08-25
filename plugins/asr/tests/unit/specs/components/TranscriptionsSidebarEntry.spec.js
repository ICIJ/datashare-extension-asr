import { mount } from '@vue/test-utils'
import { RouterLinkStub } from '@vue/test-utils'

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

    it('has a link to the transcriptions list', () => {
      const links = wrapper.findAllComponents(RouterLinkStub)
      const listLink = links.find(l => l.props('to')?.name === 'task.transcriptions')
      expect(listLink).toBeTruthy()
    })

    it('has an action link to create a new transcription', () => {
      const links = wrapper.findAllComponents(RouterLinkStub)
      const newLink = links.find(l => l.props('to')?.name === 'task.transcriptions.new')
      expect(newLink).toBeTruthy()
    })
  })

  describe('outside the Tasks section', () => {
    it('is not visible', () => {
      const wrapper = createWrapper({ to: { name: 'search.documents' } })
      expect(wrapper.find('.transcriptions-sidebar-entry').exists()).toBe(false)
    })
  })
})
