<template>
  <el-container direction="vertical" style="height: 100vh">
    <AppHeader />

    <el-main
      style="padding: 0; position: relative"
      v-loading="isLoading || locationStore.isLoading"
    >
      <el-alert
        v-if="searchError || locationStore.error"
        :title="searchError || locationStore.error"
        type="error"
        show-icon
        :closable="false"
        class="view-alert"
      />

      <MapComponent @marker-click="handleMarkerClick" :markers="facilityMarkers" />

      <transition name="el-fade-in">
        <div class="selected-er-info" v-if="selectedEmergencyFacility">
          <h3>Nearest Emergency: {{ selectedEmergencyFacility.name }}</h3>
          <p>{{ selectedEmergencyFacility.address }}</p>
          <p
            v-if="destinationStore.routeSummary && !destinationStore.routingError"
            class="route-summary"
          >
            {{ destinationStore.routeSummary }}
          </p>
          <el-alert
            v-if="destinationStore.routingError"
            :title="destinationStore.routingError"
            type="warning"
            :closable="false"
          />
        </div>
      </transition>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
import { findFacilities } from '@/api/facilities'
import AppHeader from '@/components/AppHeader.vue'
import MapComponent from '@/components/MapComponent.vue'
import { ElContainer, ElMain, ElAlert } from 'element-plus' // Import used components

const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

const isLoading = ref(false)
const searchError = ref(null)
const facilities = ref([]) // Raw results from API
const selectedEmergencyFacility = ref(null) // Store the chosen ER locally if needed for display

// Function to fetch ERs
async function findEmergencyFacilities() {
  if (!locationStore.hasLocation()) {
    searchError.value = 'Please enable location services.'
    return
  }
  isLoading.value = true
  searchError.value = null
  facilities.value = []
  destinationStore.clearDestination() // Clear previous destination
  selectedEmergencyFacility.value = null

  try {
    // Always fetch facilities marked with `has_emergency` and sorted by distance (backend responsibility)
    const response = await findFacilities({ has_emergency: true })
    facilities.value = response.data

    if (facilities.value.length > 0) {
      // --- Auto-select the NEAREST one (assuming backend sorts by distance) ---
      const nearestER = facilities.value[0]
      selectedEmergencyFacility.value = {
        // Format for local display if needed
        id: nearestER.id,
        name: nearestER.name,
        address:
          [nearestER.street, nearestER.house_number, nearestER.city]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Address unavailable',
        // Add other details if you want to display them
      }
      console.log('Auto-selecting nearest ER:', nearestER)
      destinationStore.setDestination(nearestER) // Set it for routing in the map composable
    } else {
      searchError.value = 'No emergency facilities found nearby.'
    }
  } catch (error) {
    console.error('Error fetching emergency facilities:', error)
    searchError.value = error.message || 'Failed to fetch emergency facilities.'
    facilities.value = []
  } finally {
    isLoading.value = false
  }
}

// Handle clicks on markers (optional, as we auto-select)
function handleMarkerClick(facilityData) {
  console.log('Marker clicked (Emergency View):', facilityData)
  // If you allow selecting other ERs from the map:
  // const clickedFacility = facilities.value.find(f => f.id === facilityData.id);
  // if (clickedFacility) {
  //    destinationStore.setDestination(clickedFacility);
  //    selectedEmergencyFacility.value = { ... }; // Update local display
  // }
}

// Computed property to format facilities for the map component markers
const facilityMarkers = computed(() => {
  return facilities.value
    .map((f) => ({
      id: f.id,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
      name: f.name,
      address: [f.street, f.house_number, f.city].filter(Boolean).join(' ').trim(),
      isEmergency: f.has_emergency, // Pass flag for potential icon change
      raw: f, // Keep raw data if needed when marker is clicked
    }))
    .filter((f) => f.latitude != null && f.longitude != null)
})

onMounted(async () => {
  destinationStore.clearDestination() // Ensure no stale destination
  if (!locationStore.hasLocation()) {
    try {
      await locationStore.fetchLocation()
      // Now location should be available, trigger the search
      if (locationStore.hasLocation()) {
        findEmergencyFacilities()
      } else {
        searchError.value = locationStore.error || 'Could not get location.'
      }
    } catch {
      searchError.value = locationStore.error || 'Could not get location.'
    }
  } else {
    findEmergencyFacilities() // Location already exists
  }
})

// Watch for location changes if the user moves significantly (optional)
watch(
  () => [locationStore.latitude, locationStore.longitude],
  (newVal, oldVal) => {
    if (
      newVal[0] !== null &&
      newVal[1] !== null &&
      (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1])
    ) {
      console.log('Location updated, re-finding nearest ER...')
      findEmergencyFacilities() // Re-run the search
    }
  },
  { immediate: false },
)
</script>

<style scoped>
.el-main {
  padding: 0;
  position: relative; /* Needed for absolute positioning of overlays */
  display: flex; /* Ensure map grows */
  flex-grow: 1;
}

.view-alert {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002; /* Above map controls */
  width: auto;
  max-width: 80%;
}

.selected-er-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.95);
  padding: 15px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001; /* Above map layers */
  width: fit-content;
  max-width: 90%;
  text-align: center;
}
.selected-er-info h3 {
  margin: 0 0 5px 0;
  font-size: 1.1em;
  color: #303133;
}
.selected-er-info p {
  margin: 3px 0;
  color: #606266;
  font-size: 0.9em;
}
.selected-er-info .route-summary {
  font-weight: bold;
  color: #1f1f1f; /* Darker color for summary */
  margin-top: 8px;
}

/* Ensure map component takes full space */
:deep(.map-component-wrapper),
:deep(.map-container) {
  width: 100%;
  height: 100%;
}
</style>
