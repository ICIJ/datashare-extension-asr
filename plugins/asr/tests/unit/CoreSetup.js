import { createPinia } from 'pinia'

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
      elasticsearch: {
        search: options.elasticsearchSearch || (() => Promise.resolve({ aggregations: { languages: { buckets: [] } } }))
      }
    }
  }

  install(app) {
    app.config.globalProperties.$core = this
    app.config.globalProperties.$t = (key) => key
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
