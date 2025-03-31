<template>
  <div class="home">
    <h1>Emergency Facility Routing</h1>

    <p v-if="locationStore.isLoading && !locationStore.latitude">Getting your location...</p>
    <p v-if="locationStore.error && !locationStore.latitude" style="color: orange">
      Location Error: {{ locationStore.error }}. Cannot determine destination.
    </p>
    <p v-if="destinationLoading">Finding destination facility...</p>
    <p v-if="destinationError" style="color: red">
      Destination Finding Error: {{ destinationError }}
    </p>
    <p v-if="mapState.isRouting">Calculating route...</p>
    <p v-if="mapState.routingError" style="color: red">
      Routing Error: {{ mapState.routingError }}
    </p>

    <div
      ref="mapContainerRef"
      style="height: 600px; width: 100%; margin-top: 15px; border: 1px solid #ccc"
    ></div>

    <p
      v-if="
        !destinationFacility &&
        locationStore.latitude &&
        !destinationLoading &&
        !destinationError &&
        !locationStore.error
      "
    >
      Location found. Waiting for destination data...
    </p>
    <p v-if="!locationStore.latitude && !locationStore.error && !destinationLoading">
      Waiting for location permission and data...
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
// Removed MapComponent import
import { useLocationStore } from '@/stores/location'
import { findFacilities } from '@/api/facilities'
import { useLeafletMap } from '@/composables/useLeafletMap' // Import the composable

const locationStore = useLocationStore()

// --- State for Data Fetching ---
const destinationFacility = ref(null) // Holds the *data* fetched from API
const destinationLoading = ref(false)
const destinationError = ref(null)

// --- Map Container Ref ---
const mapContainerRef = ref(null) // Ref for the map div in the template

// --- Use the Composable ---
// Pass the map container ref and the reactive destination data ref
// The composable returns reactive state related to map operations
const mapState = useLeafletMap(mapContainerRef, destinationFacility)

// --- Fetch Destination Logic (Remains mostly the same) ---
async function fetchDestinationFacility() {
  if (destinationLoading.value || !locationStore.latitude) return
  destinationLoading.value = true
  destinationError.value = null
  // Don't clear destinationFacility here immediately, let watcher handle removal if location lost
  console.log('HomeView: Fetching destination facility...')

  try {
    const response = await findFacilities({ has_emergency: true })
    console.log('HomeView: API Response:', response)

    if (response?.data?.[0]) {
      const firstFacility = response.data[0]
      // Format the object that will be watched by the composable
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
        // Include any other fields needed for popups/tooltips if not already covered
      }
      if (formattedDestination.latitude == null || formattedDestination.longitude == null) {
        throw new Error('Destination coordinates missing in API response.')
      }
      destinationFacility.value = formattedDestination // Update the ref -> composable will react
      console.log('HomeView: Destination data ref updated:', destinationFacility.value)
    } else {
      throw new Error('No suitable facilities found.')
    }
  } catch (error) {
    console.error('HomeView: Failed fetch/process destination:', error)
    destinationError.value = error?.message || 'Could not load destination.'
    destinationFacility.value = null // Clear destination on error
  } finally {
    destinationLoading.value = false
  }
}

// --- Lifecycle & Watchers (Simplified in HomeView) ---
onMounted(() => {
  // Trigger initial location fetch if needed
  if (!locationStore.latitude && !locationStore.isLoading && !locationStore.error) {
    locationStore.fetchLocation()
  }
  // Map initialization is handled by the composable's onMounted
})

// Watch for location becoming available to fetch destination
watch(
  () => locationStore.latitude,
  (newLatitude, oldLatitude) => {
    if (newLatitude !== null && !locationStore.isLoading && !locationStore.error) {
      // Only fetch if latitude is newly available and destination isn't already loading
      if (oldLatitude === null && !destinationLoading.value) {
        fetchDestinationFacility()
      }
    } else if (newLatitude === null && oldLatitude !== null) {
      // Location lost
      destinationFacility.value = null // Clear destination data -> composable will react
      destinationError.value = 'Location lost.'
    }
  },
  { immediate: true }, // Check initial state
)

// Watch for location error to update UI
watch(
  () => locationStore.error,
  (newError) => {
    if (newError) {
      destinationError.value = `Cannot find destination: ${newError}`
      destinationLoading.value = false
      destinationFacility.value = null // Clear destination if location fails
    }
  },
)
</script>

<style scoped>
.home {
  padding: 15px;
}
p {
  margin-bottom: 8px;
}

.leaflet-routing-container {
  color: #000000; /* Black */
  /* Or a dark gray: color: #333333; */
}
/* Ensure map container has a size */
/* div[ref="mapContainerRef"] { height: 600px; width: 100%; ... } */
</style>
