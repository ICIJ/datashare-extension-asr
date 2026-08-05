import { createPinia } from 'pinia'
import { RouterLinkStub } from '@vue/test-utils'
import { vi } from 'vitest'

class CoreSetup {
  constructor(options = {}) {
    this.documentOptions = {
      id: 'doc1',
      index: 'test-project',
      contentType: 'audio/mpeg',
      contentTypeCategory: 'audio',
      ...options.document
    }
    this._pinia = createPinia()
    this.projectIds = options.projectIds || ['test-project']
    this.api = {
      sendAction: options.sendAction || vi.fn().mockResolvedValue(null),
      elasticsearch: {
        search: options.elasticsearchSearch || (() => Promise.resolve({ aggregations: { languages: { buckets: [] } } })),
        getDocumentsByIds: options.getDocumentsByIds || vi.fn().mockResolvedValue({ hits: { hits: [] } })
      }
    }
    this.router = {
      push: vi.fn(),
      resolve: vi.fn().mockReturnValue({ href: '#' })
    }
    this.i18n = {
      global: {
        t: (key, params) => key,
        mergeLocaleMessage: vi.fn()
      }
    }
    this._toast = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    }
  }

  install(app) {
    app.config.globalProperties.$core = this
    app.config.globalProperties.$t = (key) => key
    app.config.globalProperties.$toast = this._toast
    app.component('RouterLink', RouterLinkStub)
  }

  findComponent(path) {
    const name = path.split('/').pop()
    if (name === 'FormControlSearch') {
      return Promise.resolve({
        name,
        props: { modelValue: { type: String, default: '' }, size: String, placeholder: String },
        emits: ['update:modelValue'],
        template: '<input type="text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />'
      })
    }
    if (name === 'AppModal') {
      return Promise.resolve({
        name,
        props: { modelValue: Boolean, size: String, okTitle: String, okOnly: Boolean },
        emits: ['update:modelValue'],
        template: '<div class="app-modal"><slot name="header" /><slot /><slot name="footer" /></div>'
      })
    }
    return Promise.resolve({ name, template: '<span><slot /></span>' })
  }

  get stores() {
    const doc = this.documentOptions
    return {
      useDocumentStore() {
        return { document: doc }
      }
    }
  }

  get plugins() {
    return [this, this._pinia]
  }

  useAll() {
    return { plugins: this.plugins }
  }

  static init(options) {
    return new CoreSetup(options)
  }
}

export default CoreSetup
