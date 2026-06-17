import { createPinia } from 'pinia'

class CorePlugin {
  install(app) {
    app.config.globalProperties.$core = this
    app.config.globalProperties.$t = (key) => key
  }

  findComponent(path) {
    const name = path.split('/').pop()
    return { name, template: '<span><slot /></span>' }
  }

  get stores() {
    return {
      useDocumentStore() {
        return {
          document: {
            id: 'doc1',
            index: 'test-project',
            contentType: 'audio/mpeg',
            contentTypeCategory: 'audio'
          }
        }
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

  static init() {
    return new CorePlugin()
  }
}

export default CorePlugin
