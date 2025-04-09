<template>
  <el-container direction="vertical" style="height: calc(100vh - 60px)">
    <div class="filter-bar">
      <el-input
        v-model="nameQuery"
        placeholder="Search by name..."
        clearable
        :prefix-icon="SearchIcon"
        class="filter-item filter-input"
        aria-label="Search facilities by name"
      />
      <el-select
        v-model="facilityTypeFilter"
        placeholder="Facility Type"
        clearable
        class="filter-item filter-select"
        aria-label="Filter by facility type"
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
        placeholder="Specialization(s)"
        clearable
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="2"
        class="filter-item filter-select specialization-select"
        aria-label="Filter by specialization"
        :loading="specialtiesLoading"
        loading-text="Loading specialties..."
      >
        <el-option
          v-for="spec in allSpecialties"
          :key="spec.id"
          :label="spec.label"
          :value="spec.name"
        />
        <template #empty v-if="specialtiesError">
          <p class="specialty-error-text">Could not load specialties: {{ specialtiesError }}</p>
        </template>
      </el-select>
      <el-checkbox
        v-model="emergencyOnlyFilter"
        label="Has Emergency Dept."
        size="large"
        class="filter-item filter-checkbox"
        aria-label="Filter facilities with emergency departments"
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
      v-if="specialtiesError && !specialtiesLoading"
      :title="`Specialty Load Error: ${specialtiesError}`"
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
          v-if="
            (isLoading || locationStore.isLoading) &&
            facilities.length === 0 &&
            !searchError &&
            !locationStore.error
          "
          class="panel-placeholder loading-placeholder"
        >
          <el-icon class="is-loading" :size="20"><LoadingIcon /></el-icon>
          <span>Loading facilities...</span>
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
              class="facility-list-item"
              tabindex="0"
              role="listitem"
              :aria-label="`Facility: ${facility.name || 'Unnamed Facility'}. Use the Directions button for map view.`"
            >
              <div class="item-content">
                <div class="item-details">
                  <strong class="facility-name">{{ facility.name || 'Unnamed Facility' }}</strong>
                  <el-tag
                    v-if="facility.has_emergency"
                    type="danger"
                    size="small"
                    effect="light"
                    class="emergency-tag"
                    >ER</el-tag
                  >

                  <div class="facility-info">
                    <span class="info-item address-info">
                      <el-icon><LocationIcon /></el-icon>
                      {{ formatAddress(facility) || 'Address not available' }}
                    </span>
                    <span class="info-item type-info">
                      <el-icon><OfficeBuildingIcon /></el-icon>
                      {{
                        facility.facility_type ? facility.facility_type.replace(/_/g, ' ') : 'N/A'
                      }}
                    </span>
                    <a
                      v-if="facility.website"
                      :href="facility.website"
                      target="_blank"
                      rel="noopener noreferrer"
                      @click.stop
                      class="info-item link-item"
                    >
                      <el-icon><LinkIcon /></el-icon>
                      Website
                    </a>
                    <a
                      v-if="facility.phone"
                      :href="'tel:' + facility.phone"
                      @click.stop
                      class="info-item link-item"
                    >
                      <el-icon><PhoneIcon /></el-icon>
                      {{ facility.phone }}
                    </a>
                    <a
                      v-if="facility.email"
                      :href="'mailto:' + facility.email"
                      @click.stop
                      class="info-item link-item"
                    >
                      <el-icon><MessageIcon /></el-icon>
                      {{ facility.email }}
                    </a>
                  </div>

                  <div
                    class="specialties-container"
                    v-if="facility.specialties && facility.specialties.length > 0"
                  >
                    <el-tag
                      v-for="(specName, index) in facility.specialties.slice(0, 5)"
                      :key="index"
                      size="small"
                      type="info"
                      effect="plain"
                      class="specialty-tag"
                    >
                      {{ getSpecialtyLabel(specName) }}
                    </el-tag>
                    <el-tag
                      v-if="facility.specialties.length > 5"
                      size="small"
                      type="info"
                      effect="plain"
                      class="specialty-tag"
                    >
                      +{{ facility.specialties.length - 5 }} more
                    </el-tag>
                  </div>
                </div>

                <div class="item-actions">
                  <el-button
                    type="primary"
                    :icon="PositionIcon"
                    size="small"
                    @click.stop="selectAndShowMap(facility)"
                    plain
                  >
                    Directions
                  </el-button>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
// Corrected import paths assumed based on project structure
import { findFacilities } from '@/api/facilities'
import { findSpecialties } from '@/api/specialties' // Import the new API function
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
  ElButton, // Import ElButton explicitly
} from 'element-plus'
import {
  Search as SearchIcon,
  Loading as LoadingIcon,
  Warning as WarningIcon,
  InfoFilled as InfoIcon,
  Location as LocationIcon, // For address
  OfficeBuilding as OfficeBuildingIcon, // For type
  Link as LinkIcon, // For website
  Phone as PhoneIcon, // For phone
  Message as MessageIcon, // For email
  Position as PositionIcon, // Add icon for Directions button
} from '@element-plus/icons-vue'

// --- Router & Stores ---
const router = useRouter()
const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

// --- Component State ---
const isLoading = ref(false) // Loading state for facility search
const searchError = ref(null) // Error state for facility search
const facilities = ref([]) // Holds the raw facility data array

const specialtiesLoading = ref(false)
const specialtiesError = ref(null)
const allSpecialties = ref([]) // Holds the fetched specialties {id, name, label}

// --- Filter State ---
const nameQuery = ref('')
const facilityTypeFilter = ref('')
const specializationFilter = ref([]) // Changed to array for multiple selections
const emergencyOnlyFilter = ref(false)

// --- Methods ---

// Fetch Specialties
async function fetchSpecialties() {
  specialtiesLoading.value = true
  specialtiesError.value = null
  try {
    const response = await findSpecialties()
    allSpecialties.value = response.data || []
    // Sort specialties alphabetically by label for better UX
    allSpecialties.value.sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('SearchView: Error fetching specialties:', error)
    specialtiesError.value = error.response?.data?.error || 'Failed to load specialties list.'
    allSpecialties.value = []
  } finally {
    specialtiesLoading.value = false
  }
}

// Computed property to map specialty names to IDs for efficient lookup
const specialtyNameToIdMap = computed(() => {
  return allSpecialties.value.reduce((map, spec) => {
    map[spec.name] = spec.id
    return map
  }, {})
})

// Fetch Facilities - Sends specialty IDs now
async function fetchAndSetFacilities() {
  // 1. Ensure Location is Available (remains the same)
  if (!locationStore.hasLocation()) {
    searchError.value = null
    if (!locationStore.isLoading && !locationStore.error) {
      console.log('SearchView: Location needed, attempting fetch...')
      await locationStore.fetchLocation()
    }
    if (!locationStore.hasLocation()) {
      console.warn('SearchView: Cannot fetch facilities - Location unavailable.')
      facilities.value = []
      isLoading.value = false
      return
    }
  }

  // 2. Fetch Facilities Data
  isLoading.value = true
  searchError.value = null

  try {
    // Map selected names to IDs
    const selectedSpecialtyIds = specializationFilter.value
      .map((name) => specialtyNameToIdMap.value[name]) // Get ID for each selected name
      .filter((id) => id !== undefined) // Filter out any potential undefined IDs (safety)

    const filters = {
      query: nameQuery.value || undefined,
      facility_type: facilityTypeFilter.value || undefined,
      // Use the array of IDs, joined by comma
      specializations: selectedSpecialtyIds.length > 0 ? selectedSpecialtyIds.join(',') : undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
    }

    // Remove undefined keys
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    console.log('Fetching facilities with filters (IDs):', filters) // Updated log message

    const response = await findFacilities(filters)

    // Process response (remains the same)
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

// Select Facility (Now only called by the button)
function selectAndShowMap(facility) {
  if (!facility) return
  console.log('SearchView: Facility selected via button:', facility.name)
  destinationStore.setDestination(facility)
  router.push({ name: 'MapView' })
}

// Format address
function formatAddress(facility) {
  // Combine parts that exist, filtering out null/empty strings
  return [facility.street, facility.house_number, facility.city, facility.postcode]
    .filter(Boolean)
    .join(' ')
    .trim()
}

// Helper to get specialty label from name (for display in tags)
const specialtyMap = computed(() => {
  return allSpecialties.value.reduce((map, spec) => {
    map[spec.name] = spec.label
    return map
  }, {})
})

function getSpecialtyLabel(specName) {
  // Handle potential case where specName might be an object if API changes
  const name = typeof specName === 'object' && specName !== null ? specName.name : specName
  return specialtyMap.value[name] || name // Fallback to name if label not found
}

// --- Lifecycle & Watchers ---

onMounted(async () => {
  destinationStore.clearDestination()
  await fetchSpecialties() // Fetch specialties first

  // Then handle location and facilities
  if (!locationStore.hasLocation() && !locationStore.isLoading) {
    await locationStore.fetchLocation() // Await location fetch if needed
  }
  // Only fetch facilities if specialties loaded successfully OR if no specialties are needed for the initial load
  if (!specialtiesError.value) {
    fetchAndSetFacilities() // Fetch initial facilities
  } else {
    console.warn('SearchView: Did not fetch initial facilities due to specialty loading error.')
    // Optionally set an error message or leave the list empty
  }
})

// Watch for filter changes
watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => {
    // Only trigger fetch if specialties have loaded without error
    if (!specialtiesLoading.value && !specialtiesError.value) {
      debouncedFetch()
    } else if (specialtiesError.value) {
      console.warn('SearchView: Skipping facility fetch due to specialty loading error.')
      facilities.value = [] // Clear results if filters change while specialties are errored
      searchError.value = 'Cannot filter facilities because the specialty list failed to load.'
    }
  },
  { deep: true },
)

// Watch for location availability/errors
watch(
  () => locationStore.hasLocation(),
  (newVal, oldVal) => {
    // Fetch facilities when location becomes available, but only if specialties are okay
    if (newVal && !oldVal && !specialtiesLoading.value && !specialtiesError.value) {
      console.log('SearchView: Location became available, fetching facilities...')
      fetchAndSetFacilities()
    } else if (newVal && !oldVal && specialtiesError.value) {
      console.warn(
        'SearchView: Location became available, but skipping facility fetch due to specialty loading error.',
      )
      facilities.value = []
      searchError.value = 'Cannot fetch facilities because the specialty list failed to load.'
    }
  },
)
watch(
  () => locationStore.error,
  (newError) => {
    if (newError) {
      facilities.value = []
      isLoading.value = false
    }
  },
)

// Watch for specialty loading errors to clear facility results
watch(
  () => specialtiesError.value,
  (newError) => {
    if (newError) {
      facilities.value = []
      isLoading.value = false
      // Optionally set searchError to inform the user in the main panel too
      searchError.value = `Cannot search facilities: ${newError}`
    } else {
      // If error is cleared, maybe refetch facilities?
      if (!isLoading.value && locationStore.hasLocation()) {
        fetchAndSetFacilities()
      }
    }
  },
)
</script>

<style scoped>
/* Layout */
.list-main-content {
  padding: 0;
  flex-grow: 1;
  overflow: hidden; /* Important for child overflow */
  display: flex;
  position: relative; /* For absolute positioning of loading mask */
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
  gap: 10px; /* Space between items */
}
.filter-item {
  /* Base styling for filter items */
}
.filter-input {
  width: 200px; /* Adjust as needed */
}
.filter-select {
  width: 180px; /* Adjust as needed */
}
/* Adjust width specifically for the multi-select specialty */
.specialization-select {
  width: 250px; /* Give more space */
}
.filter-checkbox {
  margin-left: 5px; /* Align checkbox better */
}

/* Facility List Panel */
.facility-list-panel {
  width: 100%;
  padding: 0; /* Remove padding here, add to container below */
  overflow-y: hidden; /* Hide scrollbar here */
  background: white;
  color: #303133;
  height: 100%; /* Fill the main content area */
  display: flex; /* Use flexbox for layout */
  flex-direction: column; /* Stack children vertically */
}

/* Container for the list itself to handle scrolling */
.results-list-container {
  padding: 0 15px 15px 15px; /* Padding around the list */
  overflow-y: auto; /* Enable vertical scrolling *here* */
  flex-grow: 1; /* Allow this container to grow and fill space */
}

.facility-list-panel h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 1.1em;
  padding: 15px 15px 0 15px; /* Padding only top/sides for the header */
  flex-shrink: 0; /* Prevent header from shrinking */
  border-bottom: 1px solid #eee; /* Add separator below header */
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
  /* cursor: pointer; REMOVED */
  transition: background-color 0.2s ease;
}
.facility-list-item:last-child {
  border-bottom: none;
}
.facility-list-item:hover,
.facility-list-item:focus {
  background-color: #f0faff; /* Lighter blue hover */
  outline: 1px dashed #409eff;
  outline-offset: -1px;
}

/* Wrapper for content inside li */
.item-content {
  display: flex;
  justify-content: space-between; /* Push details and actions apart */
  align-items: flex-start; /* Align items to the top */
  gap: 15px; /* Space between details and button */
}

/* Container for all the text details */
.item-details {
  flex-grow: 1; /* Allow details to take available space */
  min-width: 0; /* Prevent flex item overflow issues */
}

/* Container for the action button(s) */
.item-actions {
  flex-shrink: 0; /* Prevent button area from shrinking */
  padding-top: 2px; /* Align button roughly with the top line of text */
}

/* Adjustments to existing styles */
.facility-name {
  font-weight: 600;
  color: #303133;
  display: inline-block;
  margin-bottom: 6px;
  margin-right: 8px;
}

.emergency-tag {
  vertical-align: middle;
}

.facility-info {
  font-size: 0.9em;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px; /* Row and column gap */
}

.info-item {
  display: inline-flex; /* Use inline-flex for icon alignment */
  align-items: center; /* Vertically center icon and text */
  white-space: nowrap; /* Prevent wrapping within an item initially */
}

.info-item .el-icon {
  margin-right: 4px; /* Space between icon and text */
  font-size: 1.1em; /* Slightly larger icon */
  color: #909399; /* Subdued icon color */
}

.address-info {
  white-space: normal; /* Allow address to wrap */
}

/* Make tel: and mailto: links look consistent */
.link-item {
  color: #409eff; /* Use Element Plus primary color for links */
  text-decoration: none;
  cursor: pointer; /* Ensure pointer cursor */
}
.link-item:hover {
  text-decoration: underline;
}
/* Specific styling for non-website links if needed */
a[href^='tel:'],
a[href^='mailto:'] {
  color: #606266; /* Match surrounding text color */
}
a[href^='tel:']:hover,
a[href^='mailto:']:hover {
  color: #409eff; /* Highlight on hover */
  text-decoration: underline;
}

/* Specialties */
.specialties-container {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px; /* Space between tags */
}
.specialty-tag {
  /* Optional: Add specific styling if needed */
}

/* Placeholder styling */
.panel-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%; /* Ensure it takes full height */
  padding: 20px;
  text-align: center;
  color: #909399;
  flex-grow: 1; /* Allow placeholder to fill space */
}
.panel-placeholder .el-icon {
  margin-bottom: 10px;
  font-size: 24px; /* Consistent icon size */
  color: #c0c4cc; /* Default placeholder icon color */
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
}
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
/* Specialty list specific error */
.specialty-error-text {
  padding: 10px;
  color: #f56c6c;
  text-align: center;
  font-size: 0.9em;
}

/* Alert Positioning */
.view-alert {
  margin: 5px 15px; /* Consistent margin */
  flex-shrink: 0; /* Prevent alerts from shrinking */
}

/* Mobile Responsiveness */
@media (max-width: 767px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    padding: 10px;
  }
  .filter-bar > .filter-item {
    width: 100% !important; /* Make filters full width */
    margin-right: 0 !important;
    margin-bottom: 10px;
  }
  .filter-bar > .filter-checkbox {
    margin-bottom: 0;
    margin-left: 0;
  }
  .view-alert {
    margin: 5px 10px;
  }
  .facility-list-item {
    padding: 12px 10px;
  }
  .facility-list-panel h3 {
    padding: 15px 10px 10px 10px; /* Adjusted padding */
  }
  .results-list-container {
    padding: 0 10px 10px 10px; /* Adjusted padding */
  }
  .facility-info {
    font-size: 0.85em; /* Slightly smaller text on mobile */
    line-height: 1.5;
    gap: 3px 8px;
  }
  .info-item {
    /* Allow wrapping by default on smaller screens if needed */
    /* white-space: normal; */
  }
  .item-content {
    flex-direction: column; /* Stack details and actions vertically */
    gap: 10px; /* Space between details and button */
    align-items: stretch; /* Stretch items to full width */
  }
  .item-actions {
    padding-top: 0; /* Remove top padding */
    align-self: flex-end; /* Align button to the right */
  }
}

/* Loading indicator styling */
:deep(.list-main-content .el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 5; /* Ensure it's above content */
}
:deep(.list-main-content .el-loading-spinner .path) {
  stroke: #409eff;
}
:deep(.list-main-content .el-loading-text) {
  color: #409eff;
}
</style>
