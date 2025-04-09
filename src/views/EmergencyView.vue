<template>
  <el-container direction="vertical" style="height: 80vh">
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

/* Add these rules inside your <style scoped> block */

@media (max-width: 600px) {
  /* Apply styles for screens 600px wide or less */

  .selected-er-info {
    /* Dock to bottom edge instead of centering */
    left: 10px; /* Space from left edge */
    right: 10px; /* Space from right edge */
    bottom: 10px; /* Space from bottom edge */
    transform: none; /* Remove the horizontal centering */
    width: auto; /* Let left/right define width */
    max-width: none; /* Not needed when using left/right */

    /* Reduce padding for smaller screens */
    padding: 10px 15px;

    /* Ensure padding is included in width calculation */
    box-sizing: border-box;

    /* Optional: Align text left might look better when docked */
    text-align: left;
  }

  .selected-er-info h3 {
    /* Reduce heading font size */
    font-size: 1em; /* Adjust as needed (e.g., 0.95em) */
    margin-bottom: 4px; /* Slightly adjust spacing */
  }

  .selected-er-info p {
    /* Reduce paragraph font size */
    font-size: 0.85em; /* Adjust as needed (e.g., 0.8em, 13px) */
    margin-top: 2px;
    margin-bottom: 2px;
  }

  .selected-er-info .route-summary {
    /* Ensure route summary also uses smaller base size if needed */
    font-size: 0.85em; /* Match paragraph size or make slightly larger */
    margin-top: 6px; /* Adjust spacing */
  }

  /* If you have the alert inside, maybe reduce its font too */
  .selected-er-info .el-alert {
    padding: 5px 8px; /* Make alert padding smaller */
    font-size: 0.8em; /* Make alert text smaller */
  }
  .selected-er-info .el-alert__title {
    font-size: 1em; /* Alert title relative to alert font-size */
  }
  .selected-er-info .el-alert__icon {
    /* Adjust icon size if needed, might require targeting deeper */
    width: 14px;
    font-size: 14px;
  }
} /* End of media query */
</style>
