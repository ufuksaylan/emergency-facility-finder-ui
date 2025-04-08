<template>
  <el-container direction="vertical" style="height: calc(100vh - 60px)">
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

    <el-alert
      v-if="locationStore.error && !searchError && !locationStore.isLoading"
      :title="`Location Error: ${locationStore.error}`"
      type="warning"
      show-icon
      :closable="false"
      class="view-alert"
    />
    <el-alert
      v-if="searchError && !isLoading"
      :title="`Search Error: ${searchError}`"
      type="error"
      show-icon
      :closable="false"
      class="view-alert"
    />

    <el-main
      class="list-main-content"
      v-loading="isLoading || locationStore.isLoading"
      element-loading-text="Finding facilities..."
    >
      <div class="facility-list-panel">
        <div
          v-if="(isLoading || locationStore.isLoading) && facilities.length === 0"
          class="panel-placeholder loading-placeholder"
        >
          <el-icon class="is-loading" :size="20"><LoadingIcon /></el-icon>
          <span>Loading...</span>
        </div>

        <div
          v-else-if="(searchError || locationStore.error) && !isLoading && !locationStore.isLoading"
          class="panel-placeholder error-placeholder"
        >
          <el-icon :size="20"><WarningIcon /></el-icon>
          <span>{{ searchError || locationStore.error }}</span>
        </div>

        <div
          v-else-if="
            facilities.length === 0 &&
            !isLoading &&
            !locationStore.isLoading &&
            !searchError &&
            !locationStore.error
          "
          class="panel-placeholder no-results-placeholder"
        >
          <el-icon :size="20"><InfoIcon /></el-icon>
          <span>No facilities found matching your criteria.</span>
        </div>

        <div v-else class="results-list-container">
          <h3>{{ facilities.length }} Result(s)</h3>
          <ul>
            <li
              v-for="facility in facilities"
              :key="facility.id"
              @click="selectAndShowMap(facility)"
              class="facility-list-item"
              tabindex="0"
              @keydown.enter="selectAndShowMap(facility)"
              @keydown.space="selectAndShowMap(facility)"
              role="button"
              aria-label="View facility details and map"
            >
              <strong class="facility-name">{{ facility.name || 'Unnamed Facility' }}</strong
              ><br />
              <small class="facility-address">{{
                formatAddress(facility) || 'Address not available'
              }}</small
              ><br />
              <small class="facility-details">Type: {{ facility.facility_type || 'N/A' }}</small>
              <small class="facility-details" v-if="facility.specialization">
                | Spec: {{ facility.specialization }}</small
              >
              <el-tag
                v-if="facility.has_emergency"
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
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
import { findFacilities } from '@/api/facilities' // Ensure path is correct
import {
  ElContainer,
  ElMain,
  ElInput,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElAlert,
  ElTag,
  ElIcon,
} from 'element-plus'
import {
  Search as SearchIcon,
  Loading as LoadingIcon,
  Warning as WarningIcon,
  InfoFilled as InfoIcon,
} from '@element-plus/icons-vue'

// --- Router & Stores ---
const router = useRouter()
const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

// --- Component State ---
const isLoading = ref(false) // Loading state for facility search specifically
const searchError = ref(null) // Error state for facility search specifically
const facilities = ref([]) // Holds the raw facility data array

// --- Filter State ---
const nameQuery = ref('')
const facilityTypeFilter = ref('')
const specializationFilter = ref('')
const emergencyOnlyFilter = ref(false)

// --- Methods ---

// Fetch Facilities (handles location check internally)
async function fetchAndSetFacilities() {
  // 1. Ensure Location is Available (or wait for it)
  if (!locationStore.hasLocation()) {
    searchError.value = null // Clear previous search errors
    if (!locationStore.isLoading && !locationStore.error) {
      console.log('SearchView: Location needed, attempting fetch...')
      await locationStore.fetchLocation()
    }
    if (!locationStore.hasLocation()) {
      console.warn('SearchView: Cannot fetch facilities - Location unavailable.')
      facilities.value = []
      isLoading.value = false
      return // Stop here if location is still unavailable
    }
  }

  // 2. Fetch Facilities Data
  isLoading.value = true
  searchError.value = null

  try {
    const filters = {
      query: nameQuery.value || undefined,
      facility_type: facilityTypeFilter.value || undefined,
      specialization: specializationFilter.value || undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
    }
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    const response = await findFacilities(filters)

    // Filter out facilities without valid coordinates *before* setting the ref
    const rawFacilities = response.data || []
    facilities.value = rawFacilities.filter(
      (f) => f.location?.latitude != null && f.location?.longitude != null,
    )

    if (facilities.value.length !== rawFacilities.length) {
      console.warn('SearchView: Some facilities hidden due to missing coordinates.')
    }
  } catch (error) {
    console.error('SearchView: Error fetching facilities:', error)
    if (error.response?.data?.error) {
      searchError.value = error.response.data.error
    } else {
      searchError.value = 'Failed to fetch facilities. Please try again.'
    }
    facilities.value = []
  } finally {
    isLoading.value = false
  }
}

// Debounced version for filter inputs
const debouncedFetch = debounce(fetchAndSetFacilities, 400)

// Select Facility: Store raw data and navigate to MapView
function selectAndShowMap(facility) {
  if (!facility) return
  console.log('SearchView: Facility selected:', facility.name)
  // Use the action from your destinationStore to set the RAW data
  destinationStore.setDestination(facility)
  // Navigate to the MapView using its route name
  router.push({ name: 'MapView' })
}

// Format address for display
function formatAddress(facility) {
  return [facility.street, facility.house_number, facility.city].filter(Boolean).join(' ').trim()
}

// --- Lifecycle & Watchers ---

onMounted(async () => {
  destinationStore.clearDestination() // Clear previous selection
  // Attempt location fetch if needed, then fetch facilities
  if (!locationStore.hasLocation() && !locationStore.isLoading) {
    await locationStore.fetchLocation()
  }
  fetchAndSetFacilities() // Fetch facilities (handles location check again)
})

// Watch for filter changes
watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => debouncedFetch(),
  { deep: true },
)

// Watch for location availability/errors
watch(
  () => locationStore.hasLocation(),
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      // Location became available
      console.log('SearchView: Location became available, fetching facilities...')
      fetchAndSetFacilities()
    }
  },
)
watch(
  () => locationStore.error,
  (newError) => {
    if (newError) {
      // Location error occurred
      facilities.value = [] // Clear results
      isLoading.value = false // Stop loading indicator
    }
  },
)
</script>

<style scoped>
/* --- Keep the styles from the previous `SearchListView.vue` example --- */
/* Layout */
.list-main-content {
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  position: relative;
}
/* Filter Bar */
.filter-bar {
  padding: 10px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
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
}
/* Facility List Panel */
.facility-list-panel {
  width: 100%;
  padding: 0;
  overflow-y: hidden;
  background: white;
  color: #303133;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.results-list-container {
  padding: 15px;
  overflow-y: auto;
  flex-grow: 1;
}
.facility-list-panel h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 1.1em;
  padding: 15px 15px 0 15px;
  flex-shrink: 0;
}
.facility-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
/* List item styling */
.facility-list-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.facility-list-item:last-child {
  border-bottom: none;
}
.facility-list-item:hover,
.facility-list-item:focus {
  background-color: #f5f5f5;
  outline: 1px dashed #409eff;
  outline-offset: -1px;
}
.facility-list-item .facility-name {
  font-weight: 600;
  color: #303133;
  display: block;
  margin-bottom: 4px;
}
.facility-list-item .facility-address,
.facility-list-item .facility-details {
  font-size: 0.85em;
  color: #606266;
  line-height: 1.4;
  display: inline-block;
  margin-right: 5px;
}
/* Placeholder styling */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
  color: #909399;
  flex-grow: 1;
}
.panel-placeholder .el-icon {
  margin-bottom: 10px;
  font-size: 24px;
  color: #c0c4cc;
}
.panel-placeholder.error-placeholder span {
  color: #f56c6c;
}
.panel-placeholder.error-placeholder .el-icon {
  color: #f56c6c;
}
.panel-placeholder.loading-placeholder .el-icon {
  color: #409eff;
  animation: rotating 2s linear infinite;
} /* Added loading animation */
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
/* Alert Positioning */
.view-alert {
  margin: 5px 15px;
  flex-shrink: 0;
}
/* Mobile Responsiveness */
@media (max-width: 767px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }
  .filter-bar > .filter-item {
    width: 100% !important;
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  .filter-bar > .filter-checkbox {
    margin-bottom: 0;
  }
  .view-alert {
    margin: 5px 10px;
  }
  .facility-list-item {
    padding: 12px 10px;
  }
  .facility-list-panel h3 {
    padding: 15px 10px 0 10px;
  }
  .results-list-container {
    padding: 10px;
  }
}
/* Loading indicator styling */
:deep(.list-main-content .el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 5;
}
:deep(.list-main-content .el-loading-spinner .path) {
  stroke: #409eff;
}
:deep(.list-main-content .el-loading-text) {
  color: #409eff;
}
</style>
