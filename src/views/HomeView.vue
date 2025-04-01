<script setup>
import { ref, onMounted, watch } from 'vue'
import { useLocationStore } from '@/stores/location'
import { findFacilities } from '@/api/facilities'
import { useLeafletMap } from '@/composables/useLeafletMap'
import AppHeader from '@/components/AppHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import { Van } from '@element-plus/icons-vue'
import { ElNotification, ElMessage } from 'element-plus' // Keep imports

const locationStore = useLocationStore()
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

// --- Fetch Destination Logic ---
async function fetchDestinationFacility() {
  if (destinationLoading.value || !locationStore.latitude) return
  destinationLoading.value = true
  destinationError.value = null
  console.log('HomeView: Fetching destination facility...')

  try {
    // --- REMOVED Loading Message ---
    // ElMessage({ message: 'Finding destination facility...', type: 'info', duration: 1500 });

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
      // --- REMOVED Success Message ---
      // ElMessage.success('Destination found.')
    } else {
      throw new Error('No suitable facilities found.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    const errorMessage = error?.message || 'Could not load destination.'
    destinationError.value = errorMessage
    destinationFacility.value = null // Clear destination on error
    // --- KEEP Error Notification ---
    ElNotification({
      title: 'Destination Finding Error',
      message: errorMessage,
      type: 'error',
      duration: 0, // Keep open until manually closed
    })
    // --- End Error Notification ---
  } finally {
    destinationLoading.value = false
  }
}

// --- Lifecycle & Watchers ---

onMounted(() => {
  // Attempt to get location on mount
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    // --- REMOVED Initial Waiting Message ---
    // ElMessage({ message: 'Waiting for location permission and data...', type: 'info', duration: 3000 });
    locationStore.fetchLocation()
  }
  // Map initialization is handled within the useLeafletMap composable
})

// --- Watchers for Notifications/Messages ---

// --- REMOVED Watcher for Location Loading Status ---
// watch(() => locationStore.isLoading, (loading) => { ... });

// Watch Location Errors - KEEP
watch(
  () => locationStore.error,
  (error) => {
    if (error && !locationStore.latitude) {
      // Only show if location hasn't been acquired
      // --- KEEP Error Notification ---
      ElNotification({
        title: 'Location Error',
        message: `${error}. Cannot determine destination.`,
        type: 'warning', // Use warning as it might be recoverable by user action
        duration: 0, // Keep open until closed
      })
      // Clear destination state if location fails
      destinationError.value = null
      destinationLoading.value = false
      destinationFacility.value = null
    }
  },
)

// Watch Location Success (Latitude becomes available) - Actions only, no message
watch(
  () => locationStore.latitude,
  (newLatitude, oldLatitude) => {
    // Only trigger actions when latitude is *newly* available
    if (
      newLatitude !== null &&
      oldLatitude === null &&
      !locationStore.isLoading &&
      !locationStore.error
    ) {
      // --- REMOVED Success Message ---
      // ElMessage.success('Location found.');

      // Fetch destination if not already loading/found
      if (!destinationLoading.value && !destinationFacility.value) {
        fetchDestinationFacility()
      }
    } else if (newLatitude === null && oldLatitude !== null) {
      // Location lost
      destinationFacility.value = null // Clear destination if location is lost
      // Optionally, add a persistent warning if location is lost *after* being acquired
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

// Watch Routing Status - KEEP loading message for this potentially longer step
watch(isRouting, (routing) => {
  if (routing && !routingError.value) {
    // Check routingError ref directly
    // --- KEEP Loading Message ---
    ElMessage({
      message: 'Calculating route...',
      type: 'info',
      duration: 3000, // Give it a bit longer duration or until replaced
    })
  }
})

// Watch Routing Errors - KEEP
watch(routingError, (error) => {
  if (error) {
    // --- KEEP Error Notification ---
    ElNotification({
      title: 'Routing Error',
      message: error, // Assumes error is a string message from the composable
      type: 'error',
      duration: 0, // Keep open until closed
    })
  }
})

// Watch for changes in the route summary - Add success message here
watch(routeSummary, (summary, oldSummary) => {
  // Trigger success only when summary newly appears
  if (summary !== null && oldSummary === null && !routingError.value) {
    console.log('HomeView: Route summary updated:', summary)
    // --- KEEP Brief Success Message ---
    // Close any "Calculating route..." message first
    ElMessage.closeAll('info') // Close only info messages
    ElMessage({
      message: 'Route calculated.',
      type: 'success',
      duration: 2000, // Show briefly
    })
  }
})
</script>

<template>
  <el-container class="main-container">
    <AppHeader />

    <SearchBar v-model="searchQuery" />

    <el-main class="map-main-content">
      <div ref="mapContainerRef" class="map-container"></div>

      <transition name="el-fade-in">
        <div class="directions-overlay" v-if="routeSummary && !routingError">
          <el-icon :size="24" style="margin-right: 8px"><Van /></el-icon>
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
/* Styles specific to HomeView layout, excluding header and search styles */
.main-container {
  height: 100vh; /* Full viewport height */
  display: flex;
  flex-direction: column;
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

/* Global styles for leaflet controls kept */
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
