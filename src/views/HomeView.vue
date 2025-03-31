<template>
  <el-container class="main-container">
    <el-header class="app-header">
      <el-row justify="space-between" align="middle" style="height: 100%">
        <el-col :span="12">
          <span class="header-title">Find Hospitals now</span>
        </el-col>
        <el-col :span="4" style="text-align: right">
          <el-button type="danger" :icon="PhoneFilled" circle plain />
          <span class="header-911">911</span>
        </el-col>
      </el-row>
    </el-header>

    <div class="search-container">
      <el-input
        v-model="searchQuery"
        placeholder="Search for location (feature not implemented)"
        :prefix-icon="Search"
        size="large"
        clearable
      />
    </div>

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
// Import used icons (even if registered globally, good for clarity)
import { Search, PhoneFilled, Van } from '@element-plus/icons-vue'

const locationStore = useLocationStore()
const searchQuery = ref('') // For the search input

// --- State for Data Fetching ---
const destinationFacility = ref(null)
const destinationLoading = ref(false)
const destinationError = ref(null)

// --- Map Container Ref ---
const mapContainerRef = ref(null)

// --- Use the Composable ---
const mapState = useLeafletMap(mapContainerRef, destinationFacility)

// --- Fetch Destination Logic (Keep your existing logic) ---
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

// --- Lifecycle & Watchers (Keep your existing logic) ---
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
      // Don't set destinationError here, let locationStore.error handle it
    }
  },
  { immediate: true },
)

watch(
  () => locationStore.error,
  (newError) => {
    if (newError) {
      // Update a general error state if needed, or rely on the specific alert binding
      destinationError.value = null // Clear destination specific error if location fails first
      destinationLoading.value = false
      destinationFacility.value = null
    }
  },
)

// Watch for changes in the composable's route summary
watch(
  () => mapState.routeSummary,
  (summary) => {
    console.log('Route summary updated:', summary)
  },
)
</script>

<style scoped>
.main-container {
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: #d9534f; /* Red color */
  color: white;
  line-height: 60px; /* Adjust as needed */
  height: 60px; /* Fixed header height */
  flex-shrink: 0; /* Prevent header from shrinking */
}

.header-title {
  font-weight: bold;
  font-size: 1.2em;
  margin-left: 15px; /* Add some padding */
}

.header-911 {
  font-weight: bold;
  margin-left: 5px; /* Space between icon and text */
  margin-right: 15px;
}
/* Ensure 911 button icon is white */
.app-header .el-button.is-plain {
  --el-button-text-color: white;
  --el-button-border-color: white;
}
.app-header .el-button.is-plain:hover {
  --el-button-hover-text-color: white;
  --el-button-hover-border-color: white;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
}

.search-container {
  padding: 10px 15px;
  background-color: #f8f8f8; /* Light background for search */
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Prevent search bar from shrinking */
}

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

/* Ensure Leaflet controls are styled correctly if needed */
:global(.leaflet-routing-container) {
  color: #333; /* Example: Dark text for routing instructions */
}

/* Style leaflet controls (optional) */
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
