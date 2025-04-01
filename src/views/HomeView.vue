<script setup>
// --- Core Vue/Router/Pinia Imports ---
import { ref, onMounted, watch } from 'vue' // removed computed, not needed here anymore
import { storeToRefs } from 'pinia'

// --- Store Imports ---
import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings'

// --- API & Composables ---
import { findFacilities } from '@/api/facilities'
// useLeafletMap is NO LONGER directly used here

// --- Component Imports ---
import AppHeader from '@/components/AppHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import MapComponent from '@/components/MapComponent.vue' // <-- Import the new component

// --- Element Plus Imports ---
import { ElNotification, ElMessage, ElRadioGroup, ElRadioButton, ElIcon } from 'element-plus' // ElIcon needed for buttons
import { Van, Promotion } from '@element-plus/icons-vue'

// --- Store Instantiation ---
const locationStore = useLocationStore()
const mapSettingsStore = useMapSettingsStore()

// --- Reactive State from Stores ---
const { selectedTravelMode } = storeToRefs(mapSettingsStore)

// --- Local Component State ---
const searchQuery = ref('')
const destinationFacility = ref(null) // Still needed to pass as prop
const destinationLoading = ref(false)
const destinationError = ref(null)
// mapContainerRef is NO LONGER needed here

// --- Map State (Managed via MapComponent props/emits) ---
// We still need local refs to receive updates from MapComponent for notifications
const isRouting = ref(false)
const routingError = ref(null)
const routeSummary = ref(null)

// --- Computed Properties ---
// currentModeIcon is NO LONGER needed here (handled in MapComponent)

// --- Methods ---

// Fetch Destination Logic (remains the same)
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
      destinationFacility.value = formattedDestination // Update the ref passed to MapComponent
      console.log('HomeView: Destination data ref updated:', destinationFacility.value)
    } else {
      throw new Error('No suitable facilities found.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    const errorMessage = error?.message || 'Could not load destination.'
    destinationError.value = errorMessage
    destinationFacility.value = null // Clear the ref passed to MapComponent
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
  mapSettingsStore.setTravelMode(newMode) // MapComponent's composable will react to this
}

// --- Lifecycle & Watchers ---

onMounted(() => {
  // Attempt to get location on mount (remains the same)
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
  // Map initialization is now handled within MapComponent
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

// Watch Routing Status (Now watches the local ref updated by MapComponent)
watch(isRouting, (routing) => {
  if (routing && !routingError.value) {
    // Check local routingError ref
    ElMessage({
      message: 'Calculating route...',
      type: 'info',
      duration: 3000,
    })
  }
})

// Watch Routing Errors (Now watches the local ref updated by MapComponent)
watch(routingError, (error) => {
  if (error) {
    ElNotification({
      title: 'Routing Error',
      message: error, // Error message comes from MapComponent -> composable
      type: 'error',
      duration: 0,
    })
  }
})

// Watch Route Summary (Now watches the local ref updated by MapComponent)
watch(routeSummary, (summary, oldSummary) => {
  // Check local routingError ref as well
  if (summary !== null && oldSummary === null && !routingError.value) {
    console.log('HomeView: Route summary updated:', summary)
    ElMessage.closeAll('info') // Close any "Calculating" messages
    ElMessage({
      message: 'Route calculated.', // Summary text itself is now in MapComponent overlay
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
      <MapComponent
        :destination-facility="destinationFacility"
        v-model:is-routing="isRouting"
        v-model:routing-error="routingError"
        v-model:route-summary="routeSummary"
      />
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

/* Styles for Travel Mode Selector */
.travel-mode-selector {
  padding: 8px 15px;
  background-color: #f9f9f9; /* Light background */
  text-align: center;
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Prevent shrinking */
  z-index: 10; /* Ensure it's visually distinct */
}

/* ElIcon adjustments within buttons if needed */
.travel-mode-selector .el-radio-button__inner .el-icon {
  margin-right: 4px; /* Add space between icon and text */
  vertical-align: middle; /* Align icon better */
}
.travel-mode-selector .el-radio-button__inner {
  display: inline-flex; /* Help with vertical alignment */
  align-items: center;
}

.map-main-content {
  padding: 0; /* Remove padding */
  flex-grow: 1; /* Take remaining space */
  position: relative; /* Keep for potential future absolute elements */
  overflow: hidden; /* Prevent content spill */
}
</style>
