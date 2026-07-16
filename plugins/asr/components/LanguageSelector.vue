<script setup>
import { ref, computed, defineAsyncComponent, onMounted } from 'vue'
import IPhTranslate from '~icons/ph/translate'
import { useAsrStore } from '@/stores/asr'
import { useCore } from '@/composables/useCore'

const core = useCore()
const FormControlSearch = defineAsyncComponent(() => core.findComponent('Form/FormControl/FormControlSearch'))

const languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

function languageName(code) {
  try {
    return languageNames.of(code) || code
  } catch {
    return code
  }
}

// Map ES language name (e.g. "ENGLISH") to ASR ISO 639-1 code (e.g. "en")
// by matching the display name against the available ASR languages
function esLanguageToCode(esLang, asrLanguages) {
  const target = esLang.toLowerCase()
  return asrLanguages.find(code => {
    return languageName(code).toLowerCase() === target
  }) || null
}

const asrStore = useAsrStore()
const open = ref(false)
const search = ref('')
const projectLanguages = ref([])

const MAX_PROJECT_LANGUAGES = 5

onMounted(async () => {
  try {
    const response = await core.api.elasticsearch.search({
      index: core.projectIds.join(','),
      body: {
        size: 0,
        aggs: { languages: { terms: { field: 'language', size: MAX_PROJECT_LANGUAGES } } }
      }
    })
    const buckets = response?.aggregations?.languages?.buckets || []
    projectLanguages.value = buckets
      .map(b => esLanguageToCode(b.key, asrStore.languages))
      .filter(Boolean)
  } catch {
    projectLanguages.value = []
  }
})

const sortedLanguages = computed(() => {
  return [...asrStore.languages].sort((a, b) => languageName(a).localeCompare(languageName(b)))
})

const otherLanguages = computed(() => {
  const projectSet = new Set(projectLanguages.value)
  return sortedLanguages.value.filter(code => !projectSet.has(code))
})

const filteredProjectLanguages = computed(() => {
  if (!search.value) return projectLanguages.value
  const q = search.value.toLowerCase()
  return projectLanguages.value.filter(code =>
    languageName(code).toLowerCase().includes(q) || code.toLowerCase().includes(q)
  )
})

const filteredOtherLanguages = computed(() => {
  if (!search.value) return otherLanguages.value
  const q = search.value.toLowerCase()
  return otherLanguages.value.filter(code =>
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
    <div class="language-selector__row">
      <label class="form-label m-0 text-nowrap d-flex align-items-center gap-1">
        <i-ph-translate />
        {{ $t('asr.selectLanguages') }}
      </label>
      <div class="dropdown">
        <button
          class="btn btn-outline-light dropdown-toggle w-100 d-flex justify-content-between align-items-center"
          @click="open = !open"
        >
          <span class="text-truncate">{{ displayValue }}</span>
        </button>
      <div v-if="open" class="dropdown-menu show w-100 p-2">
        <div class="language-selector__search mb-2">
          <component
            :is="FormControlSearch"
            v-model="search"
            size="sm"
            :placeholder="$t('asr.search')"
          />
        </div>
        <div class="language-selector__list">
          <label
            v-for="code in filteredProjectLanguages"
            :key="'project-' + code"
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
          <hr v-if="filteredProjectLanguages.length > 0 && filteredOtherLanguages.length > 0" class="my-1">
          <label
            v-for="code in filteredOtherLanguages"
            :key="'other-' + code"
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
  </div>
</template>

<style scoped>
.language-selector__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
}

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
