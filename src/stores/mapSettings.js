// Example: src/stores/mapSettings.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMapSettingsStore = defineStore('mapSettings', () => {
  // State
  const selectedTravelMode = ref('driving') // 'driving' or 'foot'

  // Getters (optional, can use state directly)
  const isDrivingMode = computed(() => selectedTravelMode.value === 'driving')
  const isfootMode = computed(() => selectedTravelMode.value === 'foot')

  // Actions
  function setTravelMode(mode) {
    if (mode === 'driving' || mode === 'foot') {
      selectedTravelMode.value = mode
      console.log('MapSettingsStore: Travel mode set to', mode)
    } else {
      console.warn('MapSettingsStore: Invalid travel mode attempted:', mode)
    }
  }

  return {
    selectedTravelMode,
    isDrivingMode,
    isfootMode,
    setTravelMode,
  }
})
