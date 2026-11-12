import { mount } from '@vue/test-utils'

import CoreSetup from '~tests/unit/CoreSetup'
import BatchTranscribeButton from '@/components/BatchTranscribeButton.vue'

describe('BatchTranscribeButton.vue', () => {
  function createWrapper(options = {}) {
    const { plugins } = CoreSetup.init(options).useAll()
    return mount(BatchTranscribeButton, {
      props: { selectionEntries: [{ id: 'doc1', index: 'test-project' }], noSelection: false },
      global: {
        plugins,
        directives: { bTooltip: {} },
        stubs: { BatchTranscribeModal: true }
      }
    })
  }

  it('displays the transcribe button in local mode', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('hides the transcribe button in server mode', () => {
    const wrapper = createWrapper({ modeName: 'SERVER' })
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
