<script setup>
import { ref, computed } from 'vue'
import { useAsrStore } from '@/stores/asr'

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

function languageName(code) {
  try {
    return languageNames.of(code) || code
  } catch {
    return code
  }
}

const asrStore = useAsrStore()
const open = ref(false)
const search = ref('')

const filteredLanguages = computed(() => {
  return asrStore.languages.filter(code => {
    const name = languageName(code)
    return name.toLowerCase().includes(search.value.toLowerCase()) ||
           code.toLowerCase().includes(search.value.toLowerCase())
  })
})

const displayValue = computed(() => {
  if (asrStore.selectedLanguages.length === 0) return 'Unknown'
  return asrStore.selectedLanguages
    .map(code => languageName(code))
    .join(', ')
})

function toggle(code) {
  const idx = asrStore.selectedLanguages.indexOf(code)
  if (idx >= 0) {
    asrStore.selectedLanguages.splice(idx, 1)
  } else {
    asrStore.selectedLanguages.push(code)
  }
}

function isSelected(code) {
  return asrStore.selectedLanguages.includes(code)
}
</script>

<template>
  <div class="language-selector">
    <label class="form-label">
      Select languages*
    </label>
    <div class="dropdown">
      <button
        class="btn btn-outline-light dropdown-toggle w-100 text-start text-truncate"
        @click="open = !open"
      >
        {{ displayValue }}
      </button>
      <div v-if="open" class="dropdown-menu show w-100 p-2">
        <input
          v-model="search"
          type="text"
          class="form-control form-control-sm mb-2"
          :placeholder="$t('asr.search')"
        >
        <div class="language-list">
          <label
            v-for="code in filteredLanguages"
            :key="code"
            class="dropdown-item d-flex align-items-center justify-content-between"
          >
            <span class="d-flex align-items-center">
              <input
                type="checkbox"
                class="form-check-input me-2"
                :checked="isSelected(code)"
                @change="toggle(code)"
              >
              {{ languageName(code) }}
            </span>
            <span class="text-muted small">{{ code.toUpperCase() }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
