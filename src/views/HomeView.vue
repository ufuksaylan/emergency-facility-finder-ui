// src/views/HomeView.vue - Conceptual Changes
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
import { findFacilities } from '@/api/facilities' // Use the updated API function
import AppHeader from '@/components/AppHeader.vue'
import MapComponent from '@/components/MapComponent.vue'
// Import filter components if you create separate ones, or add controls here

const props = defineProps({
  searchType: {
    type: String,
    default: 'general', // Default if no type is passed
  },
})

const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

const isLoading = ref(false)
const searchError = ref(null)
const facilities = ref([]) // Store multiple results
const currentFilters = ref({}) // Store active filters

// Example Filter State
const facilityTypeFilter = ref('') // e.g., 'hospital', 'clinic'
const specializationFilter = ref('') // e.g., 'cardiology', 'orthopedics'
const emergencyOnlyFilter = ref(false)
const nameQuery = ref('')

// Function to fetch facilities based on current state
async function fetchAndSetFacilities() {
  if (!locationStore.hasLocation()) {
    // Maybe trigger location fetch again or show message
    searchError.value = 'Please enable location services.'
    return
  }

  isLoading.value = true
  searchError.value = null
  facilities.value = [] // Clear previous results

  try {
    const filters = {
      ...currentFilters.value, // Base filters
      query: nameQuery.value || undefined, // Add name search
      facility_type: facilityTypeFilter.value || undefined,
      specialization: specializationFilter.value || undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
    }
    // Remove undefined filters before sending
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    const response = await findFacilities(filters)
    facilities.value = response.data // Assuming backend returns an array of facilities

    // --- LOGIC CHANGE: Instead of auto-directing to nearest ---
    // Now you have a list in `facilities.value`.
    // You need to display these (e.g., on the map, in a list).
    // The user will select one, and *then* you set the destination.
    // For emergency, you might still highlight/pre-select the closest *open* one.

    if (props.searchType === 'emergency' && facilities.value.length > 0) {
      // Add logic here to find the *closest* emergency facility from the results
      // This requires distance calculation, potentially done on backend or frontend
      // For now, just log, let user select from map/list
      console.log('Emergency search results:', facilities.value)
      // Maybe pre-select the first one for convenience?
      // handleFacilitySelect(facilities.value[0]);
    }
  } catch (error) {
    console.error('Error fetching facilities:', error)
    searchError.value = error.message || 'Failed to fetch facilities.'
    facilities.value = []
  } finally {
    isLoading.value = false
  }
}

// Function called when a user selects a facility from the map or a list
function handleFacilitySelect(facility) {
  console.log('Facility selected by user:', facility)
  destinationStore.setDestination(facility) // Set it in the store
}

// Watch for location changes to re-fetch if needed
watch(
  () => [locationStore.latitude, locationStore.longitude],
  (newVal, oldVal) => {
    if (
      newVal[0] !== null &&
      newVal[1] !== null &&
      (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1])
    ) {
      console.log('Location updated, re-fetching facilities...')
      fetchAndSetFacilities()
    }
  },
  { immediate: false },
) // Don't run immediately, wait for mount

// Watch for filter changes to re-fetch
watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => {
    // Debounce this in a real app
    fetchAndSetFacilities()
  },
  { deep: true },
)

onMounted(async () => {
  // Set initial filters based on searchType
  if (props.searchType === 'emergency') {
    emergencyOnlyFilter.value = true
    currentFilters.value = { has_emergency: true } // Set initial filter
  } else {
    // Reset filters for other types
    emergencyOnlyFilter.value = false
    currentFilters.value = {}
  }

  if (!locationStore.hasLocation()) {
    try {
      await locationStore.fetchLocation() // Fetch location if not already available
      // fetchAndSetFacilities will be triggered by the location watch
    } catch {
      searchError.value = locationStore.error || 'Could not get location.'
    }
  } else {
    // Location already exists, fetch facilities immediately
    fetchAndSetFacilities()
  }
})

// --- Add computed properties or methods to format facilities for display ---
const facilityMarkers = computed(() => {
  return facilities.value
    .map((f) => ({
      id: f.id,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
      name: f.name,
      address: [f.street, f.house_number, f.city].filter(Boolean).join(' ').trim(),
      // Add other relevant info for popups/list
      facility_type: f.facility_type,
      opening_hours: f.opening_hours, // Display this nicely
      has_emergency: f.has_emergency,
      specialization: f.specialization,
      raw: f, // Keep raw data if needed when marker is clicked
    }))
    .filter((f) => f.latitude != null && f.longitude != null) // Filter out invalid locations
})
</script>

<template>
  <el-container direction="vertical" style="height: 100vh">
    <AppHeader />

    <div class="filter-bar" v-if="props.searchType !== 'emergency'"></div>

    <el-main style="padding: 0; display: flex; flex-grow: 1; overflow: hidden">
      <div class="facility-list-panel" v-if="facilityMarkers.length > 0 && !isLoading">
        <h3>Results</h3>
        <ul>
          <li
            v-for="facility in facilityMarkers"
            :key="facility.id"
            @click="handleFacilitySelect(facility.raw)"
            class="facility-list-item"
          >
            <strong class="facility-name">{{ facility.name }}</strong
            ><br />
            <small class="facility-address">{{ facility.address }}</small
            ><br />
            <small class="facility-details">Type: {{ facility.facility_type }}</small>
            <small class="facility-details" v-if="facility.specialization">
              | Specialization: {{ facility.specialization }}</small
            >
          </li>
        </ul>
      </div>

      <div class="map-area" v-loading="isLoading || locationStore.isLoading">
        <MapComponent :markers="facilityMarkers" @marker-click="handleFacilitySelect" />
      </div>
    </el-main>
  </el-container>
</template>

<style scoped>
.filter-bar {
  padding: 10px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}
.el-main {
  display: flex; /* Use flexbox for layout */
}
.facility-list-panel {
  width: 300px; /* Adjust width as needed */
  flex-shrink: 0;
  border-right: 1px solid #eee;
  padding: 15px;
  overflow-y: auto;
  background: white;
}
.facility-list-panel h3 {
  margin-bottom: 10px;
}
.facility-list-panel ul {
  list-style: none;
  padding: 0;
}
.facility-list-panel li {
  padding: 10px;
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
}
.facility-list-panel li:hover {
  background-color: #f9f9f9;
}

.map-area {
  flex-grow: 1; /* Map takes remaining space */
  position: relative; /* Needed for overlays inside MapComponent */
}

.facility-list-panel {
  width: 300px; /* Adjust width as needed */
  flex-shrink: 0;
  border-right: 1px solid #eee;
  padding: 15px;
  overflow-y: auto;
  background: white;
  color: #303133; /* Default darker text for the panel if needed */
}

.facility-list-panel h3 {
  margin-bottom: 10px;
  color: #303133; /* Darker heading */
}

.facility-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0; /* Remove default ul margin */
}

/* Target the list item */
.facility-list-item {
  /* Use the class added in the template */
  padding: 12px 5px; /* Adjust padding */
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
  transition: background-color 0.2s ease; /* Smooth hover effect */
}

.facility-list-item:hover {
  background-color: #f5f5f5; /* Slightly darker hover */
}

/* Target the specific text elements within the list item */
.facility-list-item .facility-name {
  font-weight: 600; /* Make name slightly bolder */
  color: #303133; /* Element Plus Default Text Color (Dark) */
  display: block; /* Ensure it takes its own line if needed */
  margin-bottom: 4px;
}

.facility-list-item .facility-address,
.facility-list-item .facility-details {
  font-size: 0.85em; /* Keep address/details slightly smaller */
  color: #606266; /* Element Plus Secondary Text Color (Slightly Lighter Dark) */
  line-height: 1.4; /* Improve readability for smaller text */
  display: inline-block; /* Keep details on the same line if possible */
  margin-right: 5px; /* Add space between details */
}

/* Optional: If you want address and details even darker */

.facility-list-item .facility-address,
.facility-list-item .facility-details {
  color: #303133;
}

.map-area {
  flex-grow: 1; /* Map takes remaining space */
  position: relative; /* Needed for overlays inside MapComponent */
}
/* Adjust MapComponent styles if necessary */
</style>
