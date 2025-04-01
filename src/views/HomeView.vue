<template>
  <el-container class="main-container">
    <AppHeader />

    <SearchBar v-model="searchQuery" />

    <div class="status-messages">
      <el-alert
        v-if="locationStore.isLoading && !locationStore.latitude"
        title="Getting your location..."
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="locationStore.error && !locationStore.latitude"
        :title="'Location Error: ' + locationStore.error + '. Cannot determine destination.'"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="destinationLoading"
        title="Finding destination facility..."
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="destinationError"
        :title="'Destination Finding Error: ' + destinationError"
        type="error"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="mapState.isRouting && !mapState.routingError"
        title="Calculating route..."
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="mapState.routingError"
        :title="'Routing Error: ' + mapState.routingError"
        type="error"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="
          !destinationFacility &&
          locationStore.latitude &&
          !destinationLoading &&
          !destinationError &&
          !locationStore.error &&
          !mapState.isRouting
        "
        title="Location found. Waiting for destination data..."
        type="success"
        :closable="false"
        show-icon
      />
      <el-alert
        v-if="
          !locationStore.latitude &&
          !locationStore.error &&
          !destinationLoading &&
          !locationStore.isLoading
        "
        title="Waiting for location permission and data..."
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-main class="map-main-content">
      <div ref="mapContainerRef" class="map-container"></div>

      <transition name="el-fade-in">
        <div class="directions-overlay" v-if="mapState.routeSummary && !mapState.routingError">
          <el-icon :size="24" style="margin-right: 8px"><Van /></el-icon>
          <div class="directions-text">
            <span>ER is {{ mapState.routeSummary }}</span>
            <el-link type="primary" :underline="false">Tap here for directions</el-link>
          </div>
        </div>
      </transition>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLocationStore } from '@/stores/location'
import { findFacilities } from '@/api/facilities'
import { useLeafletMap } from '@/composables/useLeafletMap'
import AppHeader from '@/components/AppHeader.vue'
// Import the new search component
import SearchBar from '@/components/SearchBar.vue'
// Import used icons (Search removed)
import { Van } from '@element-plus/icons-vue' // Removed Search

const locationStore = useLocationStore()
// searchQuery ref is still needed here to be used with v-model
const searchQuery = ref('')

// --- State for Data Fetching ---
const destinationFacility = ref(null)
const destinationLoading = ref(false)
const destinationError = ref(null)

// --- Map Container Ref ---
const mapContainerRef = ref(null)

// --- Use the Composable ---
const { isRouting, routingError, routeSummary } = useLeafletMap(
  mapContainerRef,
  destinationFacility,
)

// Define mapState based on composable's return values for template use
const mapState = ref({ isRouting, routingError, routeSummary })

// Watch composable state changes to update mapState
watch(isRouting, (val) => (mapState.value.isRouting = val))
watch(routingError, (val) => (mapState.value.routingError = val))
watch(routeSummary, (val) => (mapState.value.routeSummary = val))

// --- Fetch Destination Logic (Remains the same) ---
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
    destinationError.value = error?.message || 'Could not load destination.'
    destinationFacility.value = null
  } finally {
    destinationLoading.value = false
  }
}

// --- Lifecycle & Watchers (Remains the same) ---
onMounted(() => {
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
  // Map initialization handled by composable's onMounted
})

watch(
  () => locationStore.latitude,
  (newLatitude, oldLatitude) => {
    if (newLatitude !== null && !locationStore.isLoading && !locationStore.error) {
      if (oldLatitude === null && !destinationLoading.value && !destinationFacility.value) {
        // Only fetch if lat is new AND no destination yet
        fetchDestinationFacility()
      }
    } else if (newLatitude === null) {
      // Location lost or became null
      destinationFacility.value = null
    }
  },
  { immediate: true },
)

watch(
  () => locationStore.error,
  (newError) => {
    if (newError) {
      destinationError.value = null
      destinationLoading.value = false
      destinationFacility.value = null
    }
  },
)

// Watch for changes in the composable's route summary
watch(
  () => mapState.value.routeSummary,
  (summary) => {
    console.log('Route summary updated:', summary)
  },
)
</script>

<style scoped>
/* Styles specific to HomeView layout, excluding header and search styles */
.main-container {
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
}

/* Search container styles are removed from here */

.status-messages {
  padding: 0 15px 10px 15px; /* Padding around alerts */
  flex-shrink: 0; /* Prevent status messages from shrinking */
}
.status-messages .el-alert {
  margin-top: 8px; /* Space between alerts */
}

.map-main-content {
  padding: 0; /* Remove default padding */
  flex-grow: 1; /* Allow main content to take remaining space */
  position: relative; /* Needed for absolute positioning of overlay */
  overflow: hidden; /* Hide anything that might overflow */
}

.map-container {
  height: 100%; /* Fill the main content area */
  width: 100%;
}

.directions-overlay {
  position: absolute;
  bottom: 20px; /* Position from bottom */
  left: 50%;
  transform: translateX(-50%); /* Center horizontally */
  background-color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 1001; /* Ensure it's above map layers */
  width: fit-content; /* Adjust width to content */
  max-width: 90%; /* Prevent it from being too wide on large screens */
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

/* Global styles for leaflet controls kept or moved */
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
