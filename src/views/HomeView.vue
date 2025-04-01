<script setup>
// --- Core Vue/Router/Pinia Imports ---
import { ref, onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'

// --- Store Imports ---
import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings'
import { useDestinationStore } from '@/stores/destinationStore' // <-- Import Destination Store

// --- API & Composables ---
import { findFacilities } from '@/api/facilities'

// --- Component Imports ---
import AppHeader from '@/components/AppHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import MapComponent from '@/components/MapComponent.vue'

// --- Element Plus Imports ---
import { ElNotification, ElMessage, ElRadioGroup, ElRadioButton, ElIcon } from 'element-plus'
import { Van, Promotion } from '@element-plus/icons-vue'

// --- Store Instantiation ---
const locationStore = useLocationStore()
const mapSettingsStore = useMapSettingsStore()
const destinationStore = useDestinationStore() // <-- Instantiate Destination Store

// --- Reactive State from Stores ---
const { selectedTravelMode } = storeToRefs(mapSettingsStore)
// Get reactive destination and routing state from destinationStore
const { isRouting, routingError, routeSummary } = storeToRefs(destinationStore)

// --- Local Component State ---
const destinationLoading = ref(false) // For API call state
const destinationError = ref(null) // For API call errors specifically
const availableFacilities = ref([]) // To populate search suggestions

// --- Computed Properties ---
// Format facilities for the SearchBar's el-autocomplete
const searchSuggestions = computed(() => {
  return availableFacilities.value.map((facility) => {
    const address = [facility.street, facility.house_number, facility.city]
      .filter(Boolean)
      .join(' ')
      .trim()
    return {
      value: facility.name || `Facility ID ${facility.id}`, // Text displayed & searched
      address: address || 'Address not available', // Secondary display text
      facilityData: facility, // Keep original data for selection handling
    }
  })
})

// --- Methods ---

// Fetch Destination Logic (now updates the store)
async function fetchDestinationFacility() {
  if (destinationLoading.value || !locationStore.latitude) return
  destinationLoading.value = true
  destinationError.value = null // Clear previous API error
  console.log('HomeView: Fetching destination facility...')

  try {
    const response = await findFacilities({ has_emergency: true }) // Fetch nearby emergency facilities
    console.log('HomeView: API Response:', response)
    availableFacilities.value = response?.data || []

    if (availableFacilities.value.length > 0) {
      const firstFacility = availableFacilities.value[0]
      // Set the first facility in the destination store
      destinationStore.setDestination(firstFacility)
      // Check if the store successfully set it (i.e., if coords were valid)
      if (!destinationStore.selectedFacility) {
        console.warn(
          'HomeView: Closest facility lacked coordinates, no initial destination set in store.',
        )
        // Optional: Notify user? Maybe ElMessage.warning(...)
      } else {
        console.log('HomeView: Initial destination set in store.')
      }
    } else {
      destinationStore.clearDestination() // Clear store if no facilities found
      throw new Error('No suitable facilities found nearby.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    destinationError.value = error?.message || 'Could not load destination facilities.' // Store API specific error
    destinationStore.clearDestination() // Clear store on error
    availableFacilities.value = []
    ElNotification({
      title: 'Facility Loading Error',
      message: destinationError.value,
      type: 'error',
      duration: 5000,
    })
  } finally {
    destinationLoading.value = false
  }
}

// Handler to update the travel mode in the store
function handleModeChange(newMode) {
  mapSettingsStore.setTravelMode(newMode)
}

// Handler for when a facility is selected in SearchBar (now updates the store)
function handleFacilitySelected(selectedSuggestion) {
  if (!selectedSuggestion || !selectedSuggestion.facilityData) {
    console.warn('HomeView: Invalid facility selected from search.')
    return
  }
  const facility = selectedSuggestion.facilityData
  console.log('HomeView: Facility selected from search:', facility)

  // Set selected facility in the destination store
  // The store's setDestination action handles validation and formatting
  destinationStore.setDestination(facility)

  // Check if the store rejected it (e.g., no coords)
  if (!destinationStore.selectedFacility || destinationStore.selectedFacility.id !== facility.id) {
    ElMessage.error(
      `Selected facility "${facility.name || facility.id}" could not be set as destination (missing location data?).`,
    )
  } else {
    console.log('HomeView: destinationStore updated by search selection.')
    // Optional: Maybe show a success message
    // ElMessage.success(`Destination set to ${destinationStore.selectedFacility.name}`)
  }
}

// --- Lifecycle & Watchers ---

onMounted(() => {
  // Attempt to get location on mount
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
})

// Watch Location Errors (now clears destination store)
watch(
  () => locationStore.error,
  (error) => {
    if (error && !locationStore.latitude) {
      ElNotification({
        title: 'Location Error',
        message: `${error}. Cannot find nearby facilities.`,
        type: 'warning',
        duration: 0,
      })
      destinationError.value = null
      destinationLoading.value = false
      destinationStore.clearDestination() // Clear store
      availableFacilities.value = []
    }
  },
)

// Watch Location Success (triggers initial facility fetch)
watch(
  () => locationStore.latitude,
  (newLatitude, oldLatitude) => {
    if (
      newLatitude !== null &&
      oldLatitude === null && // Trigger only on first location fix
      !locationStore.isLoading &&
      !locationStore.error
    ) {
      // Fetch facilities only if not already loading and store has no destination yet and list is empty
      if (
        !destinationLoading.value &&
        !destinationStore.selectedFacility &&
        availableFacilities.value.length === 0
      ) {
        fetchDestinationFacility()
      }
    } else if (newLatitude === null && oldLatitude !== null) {
      // Location lost
      destinationStore.clearDestination() // Clear store
      availableFacilities.value = []
      ElNotification({
        title: 'Location Lost',
        message: 'Location signal lost. Please check device settings.',
        type: 'warning',
        duration: 0,
      })
    }
  },
  { immediate: false }, // Don't run immediately, wait for location
)

// --- Watchers for Routing State (Now watch store refs for notifications) ---
watch(isRouting, (routing) => {
  if (routing && !routingError.value) {
    // Check store's routingError
    console.log('HomeView: Routing started (from store state)')
    // Optional: Show brief message, but MapComponent likely shows indicator
    // ElMessage({ message: 'Calculating route...', type: 'info', duration: 1500 })
  }
})

watch(routingError, (error) => {
  if (error) {
    // Show persistent notification based on store error state
    ElNotification({
      title: 'Routing Problem',
      message: error,
      type: 'error',
      duration: 0, // Keep open until dismissed
    })
    console.error('HomeView: Routing error occurred (from store state):', error)
  }
})

watch(routeSummary, (summary, oldSummary) => {
  // Check store's routingError
  if (summary !== null && oldSummary === null && !routingError.value) {
    console.log('HomeView: Route summary updated (from store state):', summary)
    ElMessage.closeAll('info') // Close any calculating messages
    // MapComponent shows the summary, maybe just a brief success confirmation here
    ElMessage({
      message: 'Route calculated.',
      type: 'success',
      duration: 3000,
    })
  } else if (summary === null && oldSummary !== null) {
    console.log('HomeView: Route summary cleared (from store state)')
    // Optional: Close any success messages if route is cleared
    ElMessage.closeAll('success')
  }
})
</script>

<template>
  <el-container class="main-container">
    <AppHeader />

    <SearchBar
      :suggestions="searchSuggestions"
      @facility-selected="handleFacilitySelected"
      :placeholder="
        locationStore.isLoading
          ? 'Getting location...'
          : !locationStore.latitude
            ? 'Location unavailable'
            : destinationLoading
              ? 'Loading facilities...'
              : 'Search nearby facilities...'
      "
      :disabled="!locationStore.latitude || destinationLoading || locationStore.isLoading"
    />

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
      <MapComponent />
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
  background-color: #f9f9f9;
  text-align: center;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  z-index: 10;
}
.travel-mode-selector .el-radio-button__inner .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}
.travel-mode-selector .el-radio-button__inner {
  display: inline-flex;
  align-items: center;
}

.map-main-content {
  padding: 0;
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}
</style>
