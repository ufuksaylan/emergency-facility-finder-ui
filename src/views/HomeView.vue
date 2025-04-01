<script setup>
// --- Core Vue/Router/Pinia Imports ---
import { ref, onMounted, watch, computed } from 'vue' // Added computed
import { storeToRefs } from 'pinia' // Import storeToRefs

// --- Store Imports ---
import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings' // Import the new map settings store

// --- API & Composables ---
import { findFacilities } from '@/api/facilities'
import { useLeafletMap } from '@/composables/useLeafletMap'

// --- Component Imports ---
import AppHeader from '@/components/AppHeader.vue'
import SearchBar from '@/components/SearchBar.vue'

// --- Element Plus Imports ---
import { ElNotification, ElMessage, ElRadioGroup, ElRadioButton } from 'element-plus' // Added Radio components
import { Van, Promotion } from '@element-plus/icons-vue' // Added Promotion as placeholder walking icon

// --- Store Instantiation ---
const locationStore = useLocationStore()
const mapSettingsStore = useMapSettingsStore() // Instantiate the map settings store

// --- Reactive State from Stores ---
const { selectedTravelMode } = storeToRefs(mapSettingsStore) // Get reactive state from map settings store

// --- Local Component State ---
const searchQuery = ref('')
const destinationFacility = ref(null)
const destinationLoading = ref(false)
const destinationError = ref(null)
const mapContainerRef = ref(null)

// --- Use the Map Composable (No longer passing mode) ---
const { isRouting, routingError, routeSummary } = useLeafletMap(
  mapContainerRef,
  destinationFacility,
  // selectedTravelMode ref is no longer passed here
)

// --- Computed Properties ---
// Determine the icon based on the selected travel mode from the store
const currentModeIcon = computed(() => {
  // Replace 'Promotion' with a better icon like Bicycle or a custom SVG if available
  return selectedTravelMode.value === 'driving' ? Van : Promotion
})

// --- Methods ---

// Fetch Destination Logic (remains the same as original)
async function fetchDestinationFacility() {
  if (destinationLoading.value || !locationStore.latitude) return
  destinationLoading.value = true
  destinationError.value = null
  console.log('HomeView: Fetching destination facility...')

  try {
    const response = await findFacilities({ has_emergency: true })
    console.log('HomeView: API Response:', response)

    if (response?.data?.[0]) {
      const firstFacility = response.data[0]
      const formattedDestination = {
        id: firstFacility.id,
        name: firstFacility.name || 'Destination',
        address:
          [firstFacility.street, firstFacility.house_number, firstFacility.city]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Address not available',
        latitude: firstFacility.location?.latitude,
        longitude: firstFacility.location?.longitude,
      }
      if (formattedDestination.latitude == null || formattedDestination.longitude == null) {
        throw new Error('Destination coordinates missing in API response.')
      }
      destinationFacility.value = formattedDestination
      console.log('HomeView: Destination data ref updated:', destinationFacility.value)
    } else {
      throw new Error('No suitable facilities found.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    const errorMessage = error?.message || 'Could not load destination.'
    destinationError.value = errorMessage
    destinationFacility.value = null
    ElNotification({
      title: 'Destination Finding Error',
      message: errorMessage,
      type: 'error',
      duration: 0,
    })
  } finally {
    destinationLoading.value = false
  }
}

// Handler to update the travel mode in the store
function handleModeChange(newMode) {
  mapSettingsStore.setTravelMode(newMode) // Call the store action
}

// --- Lifecycle & Watchers ---

onMounted(() => {
  // Attempt to get location on mount (remains the same)
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
  // Map initialization is handled within useLeafletMap
})

// Watch Location Errors (remains the same)
watch(
  () => locationStore.error,
  (error) => {
    if (error && !locationStore.latitude) {
      ElNotification({
        title: 'Location Error',
        message: `${error}. Cannot determine destination.`,
        type: 'warning',
        duration: 0,
      })
      destinationError.value = null
      destinationLoading.value = false
      destinationFacility.value = null
    }
  },
)

// Watch Location Success (remains the same)
watch(
  () => locationStore.latitude,
  (newLatitude, oldLatitude) => {
    if (
      newLatitude !== null &&
      oldLatitude === null &&
      !locationStore.isLoading &&
      !locationStore.error
    ) {
      if (!destinationLoading.value && !destinationFacility.value) {
        fetchDestinationFacility()
      }
    } else if (newLatitude === null && oldLatitude !== null) {
      destinationFacility.value = null
      ElNotification({
        title: 'Location Lost',
        message: 'Location signal lost. Please check device settings.',
        type: 'warning',
        duration: 0,
      })
    }
  },
  { immediate: false },
)

// Watch Routing Status (remains the same)
watch(isRouting, (routing) => {
  if (routing && !routingError.value) {
    ElMessage({
      message: 'Calculating route...',
      type: 'info',
      duration: 3000,
    })
  }
})

// Watch Routing Errors (remains the same)
watch(routingError, (error) => {
  if (error) {
    ElNotification({
      title: 'Routing Error', // Error message now comes formatted from composable
      message: error,
      type: 'error',
      duration: 0,
    })
  }
})

// Watch Route Summary (remains the same)
watch(routeSummary, (summary, oldSummary) => {
  if (summary !== null && oldSummary === null && !routingError.value) {
    console.log('HomeView: Route summary updated:', summary)
    ElMessage.closeAll('info')
    ElMessage({
      message: 'Route calculated.', // Summary text itself comes from composable
      type: 'success',
      duration: 2000,
    })
  }
})
</script>

<template>
  <el-container class="main-container">
    <AppHeader />

    <SearchBar v-model="searchQuery" />

    <div class="travel-mode-selector">
      <el-radio-group
        :model-value="selectedTravelMode"
        @update:model-value="handleModeChange"
        size="small"
      >
        <el-radio-button value="driving">
          <el-icon><Van /></el-icon> Drive
        </el-radio-button>
        <el-radio-button value="foot">
          <el-icon><Promotion /></el-icon> Walk
        </el-radio-button>
      </el-radio-group>
    </div>
    <el-main class="map-main-content">
      <div ref="mapContainerRef" class="map-container"></div>

      <transition name="el-fade-in">
        <div class="directions-overlay" v-if="routeSummary && !routingError">
          <el-icon :size="24" style="margin-right: 8px">
            <component :is="currentModeIcon" />
          </el-icon>
          <div class="directions-text">
            <span>ER is {{ routeSummary }}</span>
            <el-link type="primary" :underline="false">Tap here for directions</el-link>
          </div>
        </div>
      </transition>
    </el-main>
  </el-container>
</template>

<style scoped>
/* Styles specific to HomeView layout */
.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* NEW: Styles for Travel Mode Selector */
.travel-mode-selector {
  padding: 8px 15px;
  background-color: #f9f9f9; /* Light background */
  text-align: center;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Prevent shrinking */
  z-index: 10; /* Ensure it's visually distinct if needed */
}

.map-main-content {
  padding: 0;
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}

.map-container {
  height: 100%;
  width: 100%;
}

.directions-overlay {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 1001; /* Above map layers, below potential modals */
  width: fit-content;
  max-width: 90%;
}

.directions-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.directions-text span {
  font-weight: bold;
  margin-bottom: 2px;
}

.directions-text .el-link {
  font-weight: normal;
}

/* Global Leaflet control styles (remain the same) */
:global(.leaflet-control-zoom a),
:global(.leaflet-control-locate a) {
  border: 1px solid #ccc !important;
  background-color: white !important;
  color: #333 !important;
}
:global(.leaflet-control-zoom a:hover),
:global(.leaflet-control-locate a:hover) {
  background-color: #f4f4f4 !important;
}
</style>
