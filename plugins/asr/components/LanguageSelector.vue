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

const sortedLanguages = computed(() => {
  return [...asrStore.languages].sort((a, b) => languageName(a).localeCompare(languageName(b)))
})

const filteredLanguages = computed(() => {
  if (!search.value) return sortedLanguages.value
  const q = search.value.toLowerCase()
  return sortedLanguages.value.filter(code =>
    languageName(code).toLowerCase().includes(q) || code.toLowerCase().includes(q)
  )
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
      {{ $t('asr.selectLanguages') }}
    </label>
    <div class="dropdown">
      <button
        class="btn btn-outline-light dropdown-toggle w-100 text-start text-truncate"
        @click="open = !open"
      >
        {{ displayValue }}
      </button>
      <div v-if="open" class="dropdown-menu show w-100 p-2">
        <div class="language-selector__search mb-2">
          <input
            v-model="search"
            type="text"
            class="form-control form-control-sm"
            :placeholder="$t('asr.search')"
          >
        </div>
        <div class="language-selector__list">
          <label
            v-for="code in filteredLanguages"
            :key="code"
            class="language-selector__item d-flex align-items-center justify-content-between py-1 px-2"
            :class="{ 'language-selector__item--selected': isSelected(code) }"
          >
            <span class="d-flex align-items-center">
              <input
                type="checkbox"
                class="form-check-input me-2"
                :checked="isSelected(code)"
                @change="toggle(code)"
              >
              <span>{{ languageName(code) }}</span>
            </span>
            <span class="language-selector__item__code">{{ code.toUpperCase() }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.language-selector__list {
  max-height: 200px;
  overflow-y: auto;
}

.language-selector__item {
  cursor: pointer;
  border-radius: 4px;
}

.language-selector__item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.language-selector__item--selected {
  font-weight: bold;
}

.language-selector__item__code {
  opacity: 0.5;
  font-size: 0.85em;
}

.language-selector__item--selected .language-selector__item__code {
  opacity: 1;
  font-weight: bold;
}
</style>
