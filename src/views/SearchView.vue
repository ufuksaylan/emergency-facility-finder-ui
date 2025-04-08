<template>
  <el-container direction="vertical" style="height: 80vh">
    <div class="filter-bar">
      <el-input
        v-model="nameQuery"
        placeholder="Search by name..."
        clearable
        :prefix-icon="SearchIcon"
        class="filter-item filter-input"
      />
      <el-select
        v-model="facilityTypeFilter"
        placeholder="Facility Type"
        clearable
        class="filter-item filter-select"
      >
        <el-option label="Alternative" value="alternative"></el-option>
        <el-option label="Blood Donation" value="blood_donation"></el-option>
        <el-option label="Clinic" value="clinic"></el-option>
        <el-option label="Dentist" value="dentist"></el-option>
        <el-option label="Doctors" value="doctors"></el-option>
        <el-option label="Hospital" value="hospital"></el-option>
        <el-option label="Laboratory" value="laboratory"></el-option>
        <el-option label="Optometrist" value="optometrist"></el-option>
        <el-option label="Pharmacy" value="pharmacy"></el-option>
        <el-option label="Rehabilitation" value="rehabilitation"></el-option>
      </el-select>
      <el-select
        v-model="specializationFilter"
        placeholder="Specialization"
        clearable
        class="filter-item filter-select"
      >
        <el-option label="Cardiology" value="cardiology"></el-option>
        <el-option label="Orthopedics" value="orthopedics"></el-option>
        <el-option label="Trauma" value="trauma"></el-option>
        <el-option label="Dentistry" value="dentistry"></el-option>
        <el-option label="General Practice" value="general"></el-option>
      </el-select>
      <el-checkbox
        v-model="emergencyOnlyFilter"
        label="Has Emergency Dept."
        size="large"
        class="filter-item filter-checkbox"
      />
    </div>

    <el-button
      v-if="isMobileView"
      :icon="mobileListVisible ? MapIcon : ListIcon"
      circle
      class="list-toggle-button"
      type="primary"
      @click="toggleMobileList"
      size="large"
      aria-label="Toggle facility list"
    />

    <el-main class="main-content">
      <div
        class="facility-list-panel"
        :class="{ 'is-mobile-overlay': isMobileView, 'is-visible': mobileListVisible }"
        v-show="!isMobileView || mobileListVisible"
      >
        <el-button
          v-if="isMobileView"
          @click="mobileListVisible = false"
          circle
          class="close-list-button"
          :icon="CloseIcon"
          aria-label="Close facility list"
        />

        <div v-if="isLoading" class="panel-placeholder loading-placeholder">
          <el-icon class="is-loading" :size="20"><LoadingIcon /></el-icon>
          <span>Loading...</span>
        </div>
        <div v-else-if="searchError && !isLoading" class="panel-placeholder error-placeholder">
          <el-icon :size="20"><WarningIcon /></el-icon>
          <span>{{ searchError }}</span>
        </div>
        <div
          v-else-if="facilities.length === 0 && !isLoading"
          class="panel-placeholder no-results-placeholder"
        >
          <el-icon :size="20"><InfoIcon /></el-icon>
          <span>No facilities found matching your criteria.</span>
        </div>
        <div v-else class="results-list-container">
          <h3>{{ facilityMarkers.length }} Result(s)</h3>
          <ul>
            <li
              v-for="facility in facilityMarkers"
              :key="facility.id"
              @click="handleFacilitySelect(facility.raw)"
              class="facility-list-item"
            >
              <strong class="facility-name">{{ facility.name || 'Unnamed Facility' }}</strong
              ><br />
              <small class="facility-address">{{
                facility.address || 'Address not available'
              }}</small
              ><br />
              <small class="facility-details">Type: {{ facility.facility_type || 'N/A' }}</small>
              <small class="facility-details" v-if="facility.specialization">
                | Spec: {{ facility.specialization }}</small
              >
              <el-tag
                v-if="facility.isEmergency"
                type="danger"
                size="small"
                effect="light"
                style="margin-left: 5px"
                >ER</el-tag
              >
            </li>
          </ul>
        </div>
      </div>

      <div
        class="map-area"
        v-loading="isLoading || locationStore.isLoading"
        element-loading-text="Finding facilities..."
      >
        <MapComponent :markers="facilityMarkers" @marker-click="handleMarkerClick" />
        <el-alert
          v-if="locationStore.error && !searchError"
          :title="locationStore.error"
          type="error"
          show-icon
          :closable="false"
          class="view-alert"
        />
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
// Vue & Utils
import { ref, onMounted, watch, computed } from 'vue'
import { useWindowSize } from '@vueuse/core' // Responsive utility
import { debounce } from 'lodash-es' // Debounce utility

// Pinia Stores
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'

// API
import { findFacilities } from '@/api/facilities'

// Components
import MapComponent from '@/components/MapComponent.vue'

// Element Plus UI
import {
  ElContainer,
  ElMain,
  ElInput,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElAlert,
  ElTag,
  ElButton,
  ElIcon,
} from 'element-plus'

// Element Plus Icons
import {
  Search as SearchIcon,
  List as ListIcon,
  MapLocation as MapIcon,
  Close as CloseIcon,
  Loading as LoadingIcon,
  Warning as WarningIcon,
  InfoFilled as InfoIcon, // Changed InfoIcon for potentially better visibility
} from '@element-plus/icons-vue'

// --- State ---

// Stores
const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

// Component State
const isLoading = ref(false)
const searchError = ref(null) // For API/search errors
const facilities = ref([]) // Raw API results

// Filter State
const facilityTypeFilter = ref('')
const specializationFilter = ref('')
const emergencyOnlyFilter = ref(false)
const nameQuery = ref('')

// Responsive State
const { width: windowWidth } = useWindowSize()
const isMobileView = computed(() => windowWidth.value < 768) // Breakpoint for mobile layout
const mobileListVisible = ref(false) // Control list visibility on mobile

// --- Methods ---

// Fetching Logic
async function fetchAndSetFacilities() {
  // Ensure location is available before fetching
  if (!locationStore.hasLocation()) {
    searchError.value = 'Your location is needed to find facilities.'
    // Attempt to fetch location if missing
    if (!locationStore.isLoading) {
      try {
        await locationStore.fetchLocation()
        // If successful, location watch will trigger fetch, otherwise error is set
        if (!locationStore.hasLocation()) {
          // Check again after fetch attempt
          searchError.value = locationStore.error || 'Could not get location.'
          return // Stop if location still not available
        }
      } catch {
        searchError.value = locationStore.error || 'Could not get location.'
        return // Stop if fetch fails
      }
    } else {
      // Location fetch is already in progress, wait for it to finish
      // The watcher on location will trigger this function again
      return
    }
  }

  isLoading.value = true
  searchError.value = null // Clear previous errors on new fetch

  try {
    const filters = {
      query: nameQuery.value || undefined,
      facility_type: facilityTypeFilter.value || undefined,
      specialization: specializationFilter.value || undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
      // Add other potential filters here (e.g., wheelchair)
    }
    // Remove undefined filters to keep query clean
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    // Call API (includes latitude/longitude from store)
    const response = await findFacilities(filters)
    facilities.value = response.data || [] // Ensure it's an array
  } catch (error) {
    console.error('Error fetching facilities:', error)
    // Handle specific error messages if possible
    if (error.response?.data?.error) {
      searchError.value = error.response.data.error
    } else if (error.message?.includes('Location data')) {
      // Catch specific location error from API wrapper
      searchError.value = error.message
    } else {
      searchError.value = 'Failed to fetch facilities. Please try again.'
    }
    facilities.value = [] // Clear facilities on error
  } finally {
    isLoading.value = false
  }
}

// Debounced version for filter inputs to avoid excessive API calls
const debouncedFetch = debounce(fetchAndSetFacilities, 400)

// Selection Logic
function handleFacilitySelect(facility) {
  if (!facility) return
  console.log('Facility selected by user (Search View):', facility)
  destinationStore.setDestination(facility) // Set in store for map routing
  // Hide list automatically on mobile after selection
  if (isMobileView.value) {
    mobileListVisible.value = false
  }
}

// Map Marker Click Logic
function handleMarkerClick(facilityData) {
  if (!facilityData?.raw) return
  console.log('Marker clicked (Search View):', facilityData)
  handleFacilitySelect(facilityData.raw) // Reuse selection logic
}

// Mobile List Toggle
function toggleMobileList() {
  mobileListVisible.value = !mobileListVisible.value
}

// --- Computed Properties ---

// Format facilities for MapComponent markers prop
const facilityMarkers = computed(() => {
  return facilities.value
    .map((f) => ({
      id: f.id,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
      name: f.name,
      address: [f.street, f.house_number, f.city].filter(Boolean).join(' ').trim(),
      facility_type: f.facility_type,
      specialization: f.specialization,
      isEmergency: f.has_emergency, // Pass flag for potential icon change/tag
      raw: f, // Include raw data for selection handling
    }))
    .filter((f) => f.latitude != null && f.longitude != null) // Ensure valid coordinates
})

// --- Lifecycle Hooks & Watchers ---

onMounted(async () => {
  destinationStore.clearDestination() // Clear any stale destination on view load
  // Attempt to get location and perform initial fetch
  if (!locationStore.hasLocation() && !locationStore.isLoading) {
    await locationStore.fetchLocation() // Await initial location fetch
  }
  // Fetch facilities only if location becomes available
  if (locationStore.hasLocation()) {
    fetchAndSetFacilities()
  } else {
    // Error is likely already set by fetchLocation failure
    searchError.value = locationStore.error || 'Location is required to search.'
  }
})

// Watch for filter changes to re-fetch (use debounced version)
watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => {
    debouncedFetch()
  },
  { deep: true },
) // Deep watch needed for objects/arrays if filters become complex

// Watch for location changes (e.g., user grants permission later or moves)
watch(
  () => [locationStore.latitude, locationStore.longitude],
  (newVal, oldVal) => {
    // Check if location became available or changed significantly
    const locationBecameAvailable = oldVal[0] === null && newVal[0] !== null
    const locationChanged =
      newVal[0] !== null && (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1])

    if (locationBecameAvailable || locationChanged) {
      console.log('Location updated, re-fetching facilities...')
      fetchAndSetFacilities() // Re-fetch with current filters
    }
  },
  { immediate: false },
) // Don't run immediately on mount

// Watch mobile state to ensure list isn't stuck open if resizing
watch(isMobileView, (isMobile) => {
  if (!isMobile) {
    mobileListVisible.value = false // Reset state if resizing to desktop
  }
})
</script>

<style scoped>
/* --- Layout --- */
.main-content {
  display: flex;
  padding: 0;
  flex-grow: 1;
  overflow: hidden; /* Crucial for scroll containment */
  position: relative; /* For absolute positioning children */
}

/* --- Filter Bar --- */
.filter-bar {
  padding: 10px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap; /* Allow wrapping */
  gap: 10px; /* Space between items */
}
.filter-item {
}
.filter-input {
  width: 200px;
}
.filter-select {
  width: 180px;
}
.filter-checkbox {
  margin-right: 10px;
} /* Adjust spacing */

/* --- Facility List Panel (Desktop Default) --- */
.facility-list-panel {
  width: 320px; /* Slightly wider default */
  flex-shrink: 0;
  border-right: 1px solid #eee;
  padding: 0; /* Remove padding, handle internally */
  overflow-y: hidden; /* Hide overflow, use internal scroll */
  background: white;
  color: #303133;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column; /* Stack header and list */
  transition: transform 0.3s ease-in-out;
}

.results-list-container {
  padding: 15px; /* Padding for the actual list */
  overflow-y: auto; /* Enable scrolling ONLY for the list */
  flex-grow: 1; /* Allow list to take remaining space */
}

.facility-list-panel h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 1.1em;
  padding: 15px 15px 0 15px; /* Padding for header only */
  flex-shrink: 0; /* Prevent header from shrinking */
}

.facility-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* List item styling (with darker text) */
.facility-list-item {
  padding: 12px 0; /* Vertical padding */
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.facility-list-item:last-child {
  border-bottom: none;
}
.facility-list-item:hover {
  background-color: #f5f5f5;
}
.facility-list-item .facility-name {
  font-weight: 600;
  color: #303133; /* Darker name */
  display: block;
  margin-bottom: 4px;
}
.facility-list-item .facility-address,
.facility-list-item .facility-details {
  font-size: 0.85em;
  color: #606266; /* Darker details */
  line-height: 1.4;
  display: inline-block;
  margin-right: 5px;
}

/* Placeholder styling within panel */
.panel-placeholder {
  display: flex;
  flex-direction: column; /* Stack icon and text */
  align-items: center;
  justify-content: center;
  height: 100%; /* Take full panel height */
  padding: 20px;
  text-align: center;
  color: #909399;
  flex-grow: 1; /* Ensure it fills space */
}
.panel-placeholder .el-icon {
  margin-bottom: 10px; /* Space between icon and text */
  font-size: 24px; /* Larger icon */
  color: #c0c4cc; /* Lighter icon color */
}
.panel-placeholder.error-placeholder span {
  color: #f56c6c; /* Red text for errors */
}
.panel-placeholder.error-placeholder .el-icon {
  color: #f56c6c;
}

/* --- Map Area --- */
.map-area {
  flex-grow: 1;
  position: relative;
  height: 100%;
  background-color: #e0e0e0; /* Placeholder bg */
}

/* Ensure map component takes full space */
:deep(.map-component-wrapper),
:deep(.map-container) {
  width: 100%;
  height: 100%;
}

/* --- Mobile Responsiveness --- */

/* Filter Bar on Mobile */
@media (max-width: 767px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }
  .filter-bar > .filter-item {
    width: 100% !important; /* Force full width */
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  .filter-bar > .filter-checkbox {
    margin-bottom: 0;
  }
}

/* List Panel on Mobile (Overlay) */
@media (max-width: 767px) {
  .facility-list-panel.is-mobile-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 90%;
    max-width: 320px;
    height: 100%;
    z-index: 1010;
    border-right: 1px solid #ccc;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
    transform: translateX(-100%); /* Hidden */
    padding-top: 45px; /* Space for close button */
    overflow-y: hidden; /* Contain scrolling inside */
  }
  .facility-list-panel.is-mobile-overlay.is-visible {
    transform: translateX(0); /* Slide in */
  }
  .map-area {
    width: 100%; /* Map takes full width */
    flex-grow: 1;
  }
}

/* --- Buttons & Alerts --- */

/* Mobile List Toggle Button */
.list-toggle-button {
  position: absolute;
  top: 10px; /* Adjust position */
  left: 10px;
  z-index: 1005;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* Mobile List Close Button */
.close-list-button {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 1011;
}

/* Alert Positioning */
.view-alert {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002; /* Below toggle button, above map controls */
  width: auto;
  max-width: 80%;
}

/* Loading indicator styling for map */
:deep(.map-area .el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.7); /* Slightly transparent */
}
:deep(.map-area .el-loading-spinner .path) {
  stroke: #d9534f; /* Match header color */
}
:deep(.map-area .el-loading-text) {
  color: #d9534f;
}
</style>
