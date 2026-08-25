<<<<<<< HEAD
<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import IPhClockCountdown from '~icons/ph/clock-countdown'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhPlay from '~icons/ph/play'
import IPhTranslate from '~icons/ph/translate'
import IPhBrain from '~icons/ph/brain'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhUserCircle from '~icons/ph/user-circle'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'

defineProps({
  hide: {
    type: Function,
    default: () => {}
  },
  visible: {
    type: Boolean
  },
  placement: {
    type: String
  }
})

const core = useCore()
const asrStore = useAsrStore()
const PageSettings = defineAsyncComponent(() => core.findComponent('PageSettings/PageSettings'))
const PageSettingsSection = defineAsyncComponent(() => core.findComponent('PageSettings/PageSettingsSection'))

const sortByOpen = ref(true)
const perPageOpen = ref(true)
const propertiesOpen = ref(true)

const sortByOptions = [
  { value: 'asc', text: computed(() => core.i18n.global.t('asr.sortOldFirst')) },
  { value: 'desc', text: computed(() => core.i18n.global.t('asr.sortRecentFirst')) }
]

const perPageOptions = [
  { value: 10 },
  { value: 25 },
  { value: 50 },
  { value: 100 }
]

const propertyOptions = [
  { value: 'state', icon: IPhClockCountdown, disabled: true, text: computed(() => core.i18n.global.t('asr.colState')) },
  { value: 'name', icon: IPhFileAudio, disabled: true, text: computed(() => core.i18n.global.t('asr.colName')) },
  { value: 'progress', icon: IPhClockCountdown, text: computed(() => core.i18n.global.t('asr.colProgress')) },
  { value: 'category', icon: IPhPlay, text: computed(() => core.i18n.global.t('asr.colCategory')) },
  { value: 'language', icon: IPhTranslate, text: computed(() => core.i18n.global.t('asr.colLanguage')) },
  { value: 'model', icon: IPhBrain, text: computed(() => core.i18n.global.t('asr.colModel')) },
  { value: 'project', icon: IPhCirclesThreePlus, text: computed(() => core.i18n.global.t('asr.colProject')) },
  { value: 'user', icon: IPhUserCircle, text: computed(() => core.i18n.global.t('asr.colUser')) },
  { value: 'launchedOn', icon: IPhCalendarBlank, text: computed(() => core.i18n.global.t('asr.colLaunchedOn')) }
]

function reset() {
  asrStore.settingsOrder = 'desc'
  asrStore.settingsPerPage = 25
  asrStore.settingsProperties = ['state', 'name', 'progress', 'category', 'language', 'model', 'project', 'user', 'launchedOn']
}
</script>

<template>
  <component
    :is="PageSettings"
    :title="$t('asr.settingsTitle')"
    :hide="hide"
    :visible="visible"
    :placement="placement"
    @reset="reset"
  >
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsOrder"
      v-model:open="sortByOpen"
      type="radio"
      :options="sortByOptions"
      :label="$t('asr.settingsSortBy')"
    />
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsPerPage"
      v-model:open="perPageOpen"
      type="radio"
      :options="perPageOptions"
      :label="$t('asr.settingsPerPage')"
    />
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsProperties"
      v-model:open="propertiesOpen"
      type="checkbox"
      :options="propertyOptions"
      :label="$t('asr.settingsProperties')"
    />
  </component>
</template>
||||||| parent of 29b8115 (feat: add transcriptions list page, detail page, sidebar and board entries)
=======
<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import IPhClockCountdown from '~icons/ph/clock-countdown'
import IPhFileAudio from '~icons/ph/file-audio'
import IPhPlay from '~icons/ph/play'
import IPhTranslate from '~icons/ph/translate'
import IPhBrain from '~icons/ph/brain'
import IPhCirclesThreePlus from '~icons/ph/circles-three-plus'
import IPhUserCircle from '~icons/ph/user-circle'
import IPhCalendarBlank from '~icons/ph/calendar-blank'
import { useCore } from '@/composables/useCore'
import { useAsrStore } from '@/stores/asr'

defineProps({
  hide: {
    type: Function,
    default: () => {}
  },
  visible: {
    type: Boolean
  },
  placement: {
    type: String
  }
})

const core = useCore()
const asrStore = useAsrStore()
const PageSettings = defineAsyncComponent(() => core.findComponent('PageSettings/PageSettings'))
const PageSettingsSection = defineAsyncComponent(() => core.findComponent('PageSettings/PageSettingsSection'))

const sortByOpen = ref(true)
const perPageOpen = ref(true)
const propertiesOpen = ref(true)

const sortByOptions = [
  { value: 'asc', text: computed(() => core.i18n.global.t('asr.sortOldFirst')) },
  { value: 'desc', text: computed(() => core.i18n.global.t('asr.sortRecentFirst')) }
]

const perPageOptions = [
  { value: 10 },
  { value: 25 },
  { value: 50 },
  { value: 100 }
]

const propertyOptions = [
  { value: 'state', icon: IPhClockCountdown, disabled: true, text: computed(() => core.i18n.global.t('asr.colState')) },
  { value: 'name', icon: IPhFileAudio, disabled: true, text: computed(() => core.i18n.global.t('asr.colName')) },
  { value: 'progress', icon: IPhClockCountdown, text: computed(() => core.i18n.global.t('asr.colProgress')) },
  { value: 'category', icon: IPhPlay, text: computed(() => core.i18n.global.t('asr.colCategory')) },
  { value: 'languages', icon: IPhTranslate, text: computed(() => core.i18n.global.t('asr.colLanguages')) },
  { value: 'model', icon: IPhBrain, text: computed(() => core.i18n.global.t('asr.colModel')) },
  { value: 'project', icon: IPhCirclesThreePlus, text: computed(() => core.i18n.global.t('asr.colProject')) },
  { value: 'user', icon: IPhUserCircle, text: computed(() => core.i18n.global.t('asr.colUser')) },
  { value: 'launchedOn', icon: IPhCalendarBlank, text: computed(() => core.i18n.global.t('asr.colLaunchedOn')) }
]

function reset() {
  asrStore.settingsOrder = 'desc'
  asrStore.settingsPerPage = 25
  asrStore.settingsProperties = ['state', 'name', 'progress', 'category', 'languages', 'model', 'project', 'user', 'launchedOn']
}
</script>

<template>
  <component
    :is="PageSettings"
    :title="$t('asr.settingsTitle')"
    :hide="hide"
    :visible="visible"
    :placement="placement"
    @reset="reset"
  >
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsOrder"
      v-model:open="sortByOpen"
      type="radio"
      :options="sortByOptions"
      :label="$t('asr.settingsSortBy')"
    />
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsPerPage"
      v-model:open="perPageOpen"
      type="radio"
      :options="perPageOptions"
      :label="$t('asr.settingsPerPage')"
    />
    <component
      :is="PageSettingsSection"
      v-model="asrStore.settingsProperties"
      v-model:open="propertiesOpen"
      type="checkbox"
      :options="propertyOptions"
      :label="$t('asr.settingsProperties')"
    />
  </component>
</template>
>>>>>>> 29b8115 (feat: add transcriptions list page, detail page, sidebar and board entries)
