import { flushPromises, mount } from '@vue/test-utils'
import { vi } from 'vitest'

import CoreSetup from '~tests/unit/CoreSetup'
import LanguageSelector from '@/components/LanguageSelector.vue'

vi.mock('@/composables/useApi', () => {
  return {
    useApi: () => ({ sendAction: vi.fn() })
  }
})

const BDropdownStub = {
  name: 'BDropdown',
  template: '<div class="dropdown"><slot name="button-content" /><slot /></div>'
}

describe('LanguageSelector.vue', () => {
  let wrapper
  let store

  beforeEach(async () => {
    const { plugins } = CoreSetup.init().useAll()
    wrapper = mount(LanguageSelector, {
      global: { plugins, stubs: { BDropdown: BDropdownStub } }
    })
    const { useAsrStore } = await import('@/stores/asr')
    store = useAsrStore()
    store.availableModels = { en: ['parakeet'], fr: ['parakeet'], pt: ['parakeet'] }
    await flushPromises()
  })

  it('shows "Unknown" when no language is selected', () => {
    expect(wrapper.text()).toContain('Unknown')
  })

  it('lists available languages', () => {
    const items = wrapper.findAll('.language-selector__item')
    expect(items.length).toBe(3)
  })

  it('sorts languages alphabetically', () => {
    const names = wrapper.findAll('.language-selector__item span span').map(el => el.text())
    expect(names).toEqual(['English', 'French', 'Portuguese'])
  })

  it('selects a language on checkbox click', async () => {
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(true)
    expect(store.selectedLanguages).toContain('en')
  })

  it('deselects a language on checkbox uncheck', async () => {
    store.selectedLanguages.push('en')
    await flushPromises()
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    await checkboxes[0].setValue(false)
    expect(store.selectedLanguages).not.toContain('en')
  })

  it('displays selected language names', async () => {
    store.selectedLanguages.push('pt')
    await flushPromises()
    expect(wrapper.text()).toContain('Portuguese')

    store.selectedLanguages.push('fr')
    await flushPromises()
    expect(wrapper.text()).toContain('Portuguese')
    expect(wrapper.text()).toContain('French')
  })

  it('filters languages by search', async () => {
    await flushPromises()
    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('port')
    await flushPromises()
    const items = wrapper.findAll('.language-selector__item')
    expect(items.length).toBe(1)
    expect(items[0].text()).toContain('Portuguese')
  })

  it('filters languages by code', async () => {
    await flushPromises()
    const searchInput = wrapper.find('input[type="text"]')
    await searchInput.setValue('fr')
    await flushPromises()
    const items = wrapper.findAll('.language-selector__item')
    expect(items.length).toBe(1)
    expect(items[0].text()).toContain('French')
  })

  describe('with project languages from ES', () => {
    let wrapper

    beforeEach(async () => {
      const coreSetup = CoreSetup.init({
        elasticsearchSearch: () => Promise.resolve({
          aggregations: {
            languages: {
              buckets: [
                { key: 'FRENCH', doc_count: 10 },
                { key: 'ENGLISH', doc_count: 5 }
              ]
            }
          }
        })
      })
      const { useAsrStore } = await import('@/stores/asr')
      const pinia = coreSetup._pinia
      const store = useAsrStore(pinia)
      store.availableModels = { en: ['parakeet'], fr: ['parakeet'], pt: ['parakeet'], es: ['parakeet'] }
      store.selectedLanguages = []

      wrapper = mount(LanguageSelector, {
        global: { plugins: coreSetup.plugins, stubs: { BDropdown: BDropdownStub } }
      })
      await flushPromises()
    })

    it('shows project languages before other languages', () => {
      const items = wrapper.findAll('.language-selector__item')
      expect(items[0].text()).toContain('French')
      expect(items[1].text()).toContain('English')
    })

    it('shows a separator between project and other languages', () => {
      expect(wrapper.find('hr').exists()).toBe(true)
    })

    it('has 4 total languages (2 project + 2 other)', () => {
      const items = wrapper.findAll('.language-selector__item')
      expect(items.length).toBe(4)
    })
  })
})
