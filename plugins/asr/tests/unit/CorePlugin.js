import { createPinia } from 'pinia'

class CorePlugin {
  constructor(options = {}) {
    this.documentOptions = {
      id: 'doc1',
      index: 'test-project',
      contentType: 'audio/mpeg',
      contentTypeCategory: 'audio',
      ...options.document
    }
  }

  install(app) {
    app.config.globalProperties.$core = this
    app.config.globalProperties.$t = (key) => key
  }

  findComponent(path) {
    const name = path.split('/').pop()
    return { name, template: '<span><slot /></span>' }
  }

  get stores() {
    const doc = this.documentOptions
    return {
      useDocumentStore() {
        return { document: doc }
      }
    }
  }

  get pinia() {
    this._pinia = this._pinia || createPinia()
    return this._pinia
  }

  get plugins() {
    return [this, this.pinia]
  }

  static init(options) {
    return new CorePlugin(options)
  }
}

export default CorePlugin
