<script setup>
// --- Core Vue/Router/Pinia Imports ---
import { ref, onMounted, watch, computed } from 'vue' // Added computed back
import { storeToRefs } from 'pinia'

// --- Store Imports ---
import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings'

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

// --- Reactive State from Stores ---
const { selectedTravelMode } = storeToRefs(mapSettingsStore)

// --- Local Component State ---
const destinationFacility = ref(null)
const destinationLoading = ref(false)
const destinationError = ref(null)
const availableFacilities = ref([]) // <-- Store the full list here

// --- Map State (Managed via MapComponent props/emits) ---
const isRouting = ref(false)
const routingError = ref(null)
const routeSummary = ref(null)

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

// Fetch Destination Logic (modified to store all facilities)
async function fetchDestinationFacility() {
  if (destinationLoading.value || !locationStore.latitude) return
  destinationLoading.value = true
  destinationError.value = null
  console.log('HomeView: Fetching destination facility...')

  try {
    const response = await findFacilities({ has_emergency: true }) // Fetch nearby emergency facilities
    console.log('HomeView: API Response:', response)

    // Store the whole list
    availableFacilities.value = response?.data || []

    // Still set the first one as the initial destination (closest emergency facility)
    if (availableFacilities.value.length > 0) {
      const firstFacility = availableFacilities.value[0]
      const formattedDestination = {
        id: firstFacility.id,
        name: firstFacility.name || 'Closest ER', // Make name more specific
        address:
          [firstFacility.street, firstFacility.house_number, firstFacility.city]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Address not available',
        latitude: firstFacility.location?.latitude,
        longitude: firstFacility.location?.longitude,
      }
      if (formattedDestination.latitude == null || formattedDestination.longitude == null) {
        // Handle case where the *first* facility lacks coords. Maybe find the next one?
        // For now, we'll just proceed without setting an initial destination if the first is invalid.
        console.warn('Closest facility found lacks coordinates:', firstFacility.name)
        destinationFacility.value = null // Don't set an invalid destination
        // Keep availableFacilities populated for search
      } else {
        destinationFacility.value = formattedDestination // Set the initial destination
        console.log('HomeView: Initial destination set:', destinationFacility.value)
      }
    } else {
      destinationFacility.value = null // No facilities found
      throw new Error('No suitable facilities found nearby.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    const errorMessage = error?.message || 'Could not load destination facilities.'
    destinationError.value = errorMessage // Keep track of the error
    destinationFacility.value = null
    availableFacilities.value = [] // Clear list on error
    ElNotification({
      title: 'Facility Loading Error',
      message: errorMessage,
      type: 'error',
      duration: 5000, // Show for 5 seconds
    })
  } finally {
    destinationLoading.value = false
  }
}

// Handler to update the travel mode in the store
function handleModeChange(newMode) {
  mapSettingsStore.setTravelMode(newMode)
}

// <-- New: Handler for when a facility is selected in SearchBar -->
function handleFacilitySelected(selectedSuggestion) {
  if (!selectedSuggestion || !selectedSuggestion.facilityData) {
    console.warn('HomeView: Invalid facility selected from search.')
    // Maybe clear destination if selection is invalid?
    // destinationFacility.value = null;
    return
  }

  const facility = selectedSuggestion.facilityData
  console.log('HomeView: Facility selected from search:', facility)

  // Check if selected facility has valid coordinates
  if (facility.location?.latitude == null || facility.location?.longitude == null) {
    ElMessage.error(`Selected facility "${facility.name || facility.id}" has no location data.`)
    return // Don't update the destination
  }

  // Format and update the destinationFacility ref
  // This will automatically be picked up by the MapComponent prop binding
  destinationFacility.value = {
    id: facility.id,
    name: facility.name || 'Selected Destination',
    address:
      [facility.street, facility.house_number, facility.city].filter(Boolean).join(' ').trim() ||
      'Address not available',
    latitude: facility.location?.latitude,
    longitude: facility.location?.longitude,
  }
  console.log('HomeView: destinationFacility updated by search selection.')

  // Optional: Clear the search bar text after selection
  // searchQuery.value = ''; // Needs SearchBar to accept v-model again
}

// --- Lifecycle & Watchers ---

onMounted(() => {
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
})

// Watch Location Errors (remains the same)
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
      destinationError.value = null // Maybe keep API error separate?
      destinationLoading.value = false
      destinationFacility.value = null
      availableFacilities.value = [] // Clear facilities if location fails
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
      // Fetch facilities only if not already loading and list is empty
      if (!destinationLoading.value && availableFacilities.value.length === 0) {
        fetchDestinationFacility()
      }
    } else if (newLatitude === null && oldLatitude !== null) {
      // Location lost
      destinationFacility.value = null
      availableFacilities.value = [] // Clear facilities
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

// Watch Routing Status (remains the same)
watch(isRouting, (routing) => {
  if (routing && !routingError.value) {
    ElMessage({ message: 'Calculating route...', type: 'info', duration: 3000 })
  }
})

// Watch Routing Errors (remains the same)
watch(routingError, (error) => {
  if (error) {
    ElNotification({ title: 'Routing Error', message: error, type: 'error', duration: 0 })
  }
})

// Watch Route Summary (remains the same)
watch(routeSummary, (summary, oldSummary) => {
  if (summary !== null && oldSummary === null && !routingError.value) {
    console.log('HomeView: Route summary updated:', summary)
    ElMessage.closeAll('info')
    ElMessage({ message: 'Route calculated.', type: 'success', duration: 2000 })
  }
})
</script>

<template>
  <el-container class="main-container">
    <AppHeader />

    <SearchBar
      :suggestions="searchSuggestions"
      @facility-selected="handleFacilitySelected"
      :placeholder="locationStore.latitude ? 'Search nearby facilities...' : 'Getting location...'"
      :disabled="!locationStore.latitude || destinationLoading"
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

/* Optional overlay style */

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2em;
  color: #333;
  z-index: 1000;
}
</style>
