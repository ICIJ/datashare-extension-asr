<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useCore } from '@/composables/useCore'
import BatchTranscribeModal from './BatchTranscribeModal.vue'

const core = useCore()
const modalOpen = ref(false)
const selectedDocuments = ref([])
let observer = null
let disabledObserver = null
let injectedButton = null
let referenceButton = null

function getSelectionEntries() {
  // Try to access selectionEntries from SearchSelection's Vue component tree
  const selectionEl = document.querySelector('.search-selection')
  if (selectionEl) {
    let comp = selectionEl.__vueParentComponent
    while (comp) {
      // Try setupState (internal instance) or proxy (public instance)
      const state = comp.setupState ?? {}
      const proxy = comp.proxy ?? {}
      const entries = state.selectionEntries ?? proxy.selectionEntries
      if (entries) {
        const value = entries.value ?? entries
        if (Array.isArray(value) && value.length > 0) return value
        break
      }
      comp = comp.parent
    }
  }
  // Fallback: get selected IDs from DOM and cross-reference with search store
  const selectedIds = new Set()
  // Table view
  document.querySelectorAll('.page-table-tr--selected').forEach(row => {
    const link = row.querySelector('a[href*="/d/"]')
    if (link) {
      const href = link.getAttribute('href')
      const match = href.match(/\/d\/[^/]+\/([^/]+)/)
      if (match) selectedIds.add(match[1])
    }
  })
  // Card/list view
  document.querySelectorAll('.document-card--selected').forEach(card => {
    const link = card.querySelector('a[href*="/d/"]')
    if (link) {
      const href = link.getAttribute('href')
      const match = href.match(/\/d\/[^/]+\/([^/]+)/)
      if (match) selectedIds.add(match[1])
    }
  })
  if (selectedIds.size === 0) return []
  try {
    const searchStore = core.stores.useSearchStore()
    const hits = searchStore.hits ?? []
    return hits.filter(hit => selectedIds.has(hit.id))
  } catch {
    return [...selectedIds].map(id => ({ id }))
  }
}

// Phosphor file-audio icon (regular weight, same as ~icons/ph/file-audio)
const FILE_AUDIO_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 256 256"><path d="M99.06,128.61a8,8,0,0,0-8.72,1.73L68.69,152H48a8,8,0,0,0-8,8v40a8,8,0,0,0,8,8H68.69l21.65,21.66A8,8,0,0,0,104,224V136A8,8,0,0,0,99.06,128.61ZM88,204.69,77.66,194.34A8,8,0,0,0,72,192H56V168H72a8,8,0,0,0,5.66-2.34L88,155.31ZM152,180a40,40,0,0,1-20,34.64,8,8,0,0,1-8-13.86,24,24,0,0,0,0-41.56,8,8,0,0,1,8-13.86A40,40,0,0,1,152,180ZM213.66,82.34l-56-56A8,8,0,0,0,152,24H56A16,16,0,0,0,40,40v80a8,8,0,0,0,16,0V40h96V88a8,8,0,0,0,8,8h48V216H168a8,8,0,0,0,0,16h32a16,16,0,0,0,16-16V88A8,8,0,0,0,213.66,82.34ZM160,51.31,188.69,80H160Z"/></svg>'

function createButton(referenceBtn) {
  // Clone the reference button to get all attrs, scoped data-v, and classes
  if (referenceBtn) {
    const btn = referenceBtn.cloneNode(true)
    btn.setAttribute('data-asr-batch', 'true')
    // Replace icon SVG
    const iconEl = btn.querySelector('.button-icon__icon-left') || btn.querySelector('.app-icon')
    if (iconEl) {
      iconEl.innerHTML = FILE_AUDIO_SVG
    }
    // Replace label text
    const labelEl = btn.querySelector('.button-icon__label')
    if (labelEl) {
      labelEl.textContent = 'Transcribe'
    }
    // Disabled state is synced from reference button via MutationObserver
    // Remove tooltip wrapper if any
    const tooltip = btn.querySelector('[data-bs-toggle]')
    if (tooltip) tooltip.removeAttribute('data-bs-toggle')
    // No inline color — handled by syncDisabledState
    // Clone again to strip event listeners
    const newBtn = btn.cloneNode(true)
    newBtn.addEventListener('click', handleClick)
    return newBtn
  }
  // Fallback
  const btn = document.createElement('button')
  btn.className = 'btn button-icon'
  btn.setAttribute('data-asr-batch', 'true')
  btn.innerHTML = `<span class="app-icon button-icon__icon-left" style="font-size:1.25em;display:inline-flex">${FILE_AUDIO_SVG}</span><span class="button-icon__label" style="margin-left:.5rem">Transcribe</span>`
  btn.addEventListener('click', handleClick)
  return btn
}

function handleClick() {
  selectedDocuments.value = [...getSelectionEntries()]
  modalOpen.value = true
}

function tryInject() {
  // Already injected and still in DOM
  if (document.querySelector('[data-asr-batch]')) return
  const selectionBar = document.querySelector('.search-selection.form-actions')
  // No selection bar visible
  if (!selectionBar) return
  // Try compact mode: inject into dropdown menu
  const menus = document.querySelectorAll('ul.form-actions-compact-dropdown__menu')
  for (const menu of menus) {
    const buttons = menu.querySelectorAll('.btn')
    const hasSelectionActions = Array.from(buttons).some(btn => {
      const text = btn.textContent?.trim().toLowerCase()
      return text === 'unstar' || text === 'tag' || text?.includes('star')
    })
    if (!hasSelectionActions) continue
    const li = menu.querySelector(':scope > li')
    if (!li) continue
    referenceButton = li.querySelector('.button-icon')
    injectedButton = createButton(referenceButton)
    li.appendChild(injectedButton)
    syncDisabledState()
    watchDisabledState()
    return
  }
  // Non-compact mode: inject inline after existing buttons
  const inlineButtons = selectionBar.querySelectorAll(':scope > .button-icon')
  if (inlineButtons.length > 0) {
    const lastButton = inlineButtons[inlineButtons.length - 1]
    referenceButton = lastButton
    injectedButton = createButton(referenceButton)
    lastButton.after(injectedButton)
    syncDisabledState()
    watchDisabledState()
  }
}

function syncDisabledState() {
  if (!injectedButton || !referenceButton) return
  const isDisabled = referenceButton.hasAttribute('disabled')
  if (isDisabled) {
    injectedButton.setAttribute('disabled', '')
    injectedButton.classList.add('disabled')
    injectedButton.style.color = ''
    injectedButton.style.opacity = '0.65'
  } else {
    injectedButton.removeAttribute('disabled')
    injectedButton.classList.remove('disabled')
    injectedButton.style.color = 'var(--bs-link-color)'
    injectedButton.style.opacity = ''
  }
}

function watchDisabledState() {
  if (disabledObserver) disabledObserver.disconnect()
  if (!referenceButton) return
  disabledObserver = new MutationObserver(syncDisabledState)
  disabledObserver.observe(referenceButton, { attributes: true, attributeFilter: ['disabled'] })
}

function removeButton() {
  if (disabledObserver) {
    disabledObserver.disconnect()
    disabledObserver = null
  }
  referenceButton = null
  const el = document.querySelector('[data-asr-batch]')
  if (el) {
    el.removeEventListener('click', handleClick)
    el.parentNode?.removeChild(el)
    injectedButton = null
  }
}

onMounted(() => {
  observer = new MutationObserver(() => {
    const selectionBar = document.querySelector('.search-selection.form-actions')
    if (selectionBar) {
      tryInject()
    } else {
      removeButton()
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  removeButton()
})
</script>

<template>
  <batch-transcribe-modal
    v-model="modalOpen"
    :selected-documents="selectedDocuments"
  />
</template>
