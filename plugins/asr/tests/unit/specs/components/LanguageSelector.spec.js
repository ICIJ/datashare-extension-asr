import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'

import CorePlugin from '../../CorePlugin.js'
import LanguageSelector from '@/components/LanguageSelector.vue'

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({ sendAction: vi.fn() })
  }
})

describe('LanguageSelector.vue', () => {
  let wrapper

  beforeEach(async () => {
    const core = CorePlugin.init()
    wrapper = mount(LanguageSelector, { global: { plugins: core.plugins } })
    // Set available models in store
    const { useAsrStore } = await import('@/stores/asr')
    const store = useAsrStore()
    store.availableModels = { en: ['parakeet'], fr: ['parakeet'], pt: ['parakeet'] }
    await flushPromises()
  })

  it('shows "Unknown" when no language is selected', () => {
    expect(wrapper.find('button').text()).toBe('Unknown')
  })

  it('opens dropdown on click', async () => {
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
  })

  it('lists available languages', async () => {
    await wrapper.find('button').trigger('click')
    const labels = wrapper.findAll('.dropdown-item')
    expect(labels.length).toBe(3)
  })

  it('selects a language on checkbox click', async () => {
    const { useAsrStore } = await import('@/stores/asr')
    const store = useAsrStore()

    await wrapper.find('button').trigger('click')
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)

    expect(store.selectedLanguages).toContain('en')
  })
})
