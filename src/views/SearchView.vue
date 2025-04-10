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
                  <div>
                    <strong class="facility-name">{{ facility.name || 'Unnamed Facility' }}</strong>
                    <el-tag
                      v-if="facility.has_emergency"
                      type="danger"
                      size="small"
                      effect="light"
                      class="emergency-tag"
                      >ER</el-tag
                    >
                  </div>

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

                  <div class="report-issue-container">
                    <el-button
                      type="warning"
                      link
                      size="small"
                      @click.stop="handleReportIssueClick(facility)"
                      class="report-button"
                      :icon="WarningIcon"
                    >
                      Report Issue
                    </el-button>
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

    <el-dialog
      v-model="reportDialogVisible"
      :title="`Report Issue for: ${reportingFacility?.name || 'Facility'}`"
      width="500px"
      :before-close="cancelReport"
      append-to-body
      draggable
      destroy-on-close
    >
      <el-alert
        v-if="reportError"
        :title="reportError"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 15px"
      />
      <el-form @submit.prevent="submitReport" v-loading="reportLoading">
        <el-form-item label="Issue Description" required :error="descriptionError">
          <el-input
            v-model="complaintDescription"
            type="textarea"
            :rows="4"
            placeholder="Please describe the incorrect or missing information..."
            maxlength="500"
            show-word-limit
            aria-label="Issue description"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelReport" :disabled="reportLoading">Cancel</el-button>
          <el-button
            type="primary"
            @click="submitReport"
            :loading="reportLoading"
            :disabled="!complaintDescription.trim()"
          >
            Submit Report
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { debounce } from 'lodash-es'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
import { findFacilities } from '@/api/facilities'
import { findSpecialties } from '@/api/specialties'
import { submitComplaint } from '@/api/complaints'

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
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessage,
} from 'element-plus'
import {
  Search as SearchIcon,
  Loading as LoadingIcon,
  Warning as WarningIcon,
  InfoFilled as InfoIcon,
  Location as LocationIcon,
  OfficeBuilding as OfficeBuildingIcon,
  Link as LinkIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Position as PositionIcon,
} from '@element-plus/icons-vue'

// --- Router & Stores ---
const router = useRouter()
const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

const isLoading = ref(false)
const searchError = ref(null)
const facilities = ref([])

const specialtiesLoading = ref(false)
const specialtiesError = ref(null)
const allSpecialties = ref([])
const nameQuery = ref('')
const facilityTypeFilter = ref('')
const specializationFilter = ref([])
const emergencyOnlyFilter = ref(false)

const reportDialogVisible = ref(false)
const reportingFacility = ref(null)
const complaintDescription = ref('')
const reportLoading = ref(false)
const reportError = ref(null)
const descriptionError = ref(null)

async function fetchSpecialties() {
  specialtiesLoading.value = true
  specialtiesError.value = null
  try {
    const response = await findSpecialties()
    allSpecialties.value = response.data || []
    allSpecialties.value.sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('SearchView: Error fetching specialties:', error)
    specialtiesError.value = error.response?.data?.error || 'Failed to load specialties list.'
    allSpecialties.value = []
  } finally {
    specialtiesLoading.value = false
  }
}

const specialtyNameToIdMap = computed(() => {
  return allSpecialties.value.reduce((map, spec) => {
    map[spec.name] = spec.id
    return map
  }, {})
})

async function fetchAndSetFacilities() {
  if (!locationStore.hasLocation()) {
    searchError.value = null
    if (!locationStore.isLoading && !locationStore.error) {
      await locationStore.fetchLocation()
    }
    if (!locationStore.hasLocation()) {
      console.warn('SearchView: Cannot fetch facilities - Location unavailable.')
      facilities.value = []
      isLoading.value = false
      return
    }
  }

  isLoading.value = true
  searchError.value = null

  try {
    const selectedSpecialtyIds = specializationFilter.value
      .map((name) => specialtyNameToIdMap.value[name])
      .filter((id) => id !== undefined)

    const filters = {
      query: nameQuery.value || undefined,
      facility_type: facilityTypeFilter.value || undefined,
      specializations: selectedSpecialtyIds.length > 0 ? selectedSpecialtyIds.join(',') : undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
    }

    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    console.log('Fetching facilities with filters:', filters)

    const response = await findFacilities(filters)

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

const debouncedFetch = debounce(fetchAndSetFacilities, 400)

function selectAndShowMap(facility) {
  if (!facility) return
  console.log('SearchView: Facility selected via button:', facility.name)
  destinationStore.setDestination(facility)
  router.push({ name: 'MapView' })
}

function formatAddress(facility) {
  return [facility.street, facility.house_number, facility.city, facility.postcode]
    .filter(Boolean)
    .join(' ')
    .trim()
}

const specialtyMap = computed(() => {
  return allSpecialties.value.reduce((map, spec) => {
    map[spec.name] = spec.label
    return map
  }, {})
})

function getSpecialtyLabel(specName) {
  const name = typeof specName === 'object' && specName !== null ? specName.name : specName
  return specialtyMap.value[name] || name
}

function handleReportIssueClick(facility) {
  console.log('Report issue clicked for:', facility.name)
  reportingFacility.value = facility
  complaintDescription.value = ''
  reportError.value = null
  descriptionError.value = null
  reportDialogVisible.value = true
}

function cancelReport() {
  reportDialogVisible.value = false
  setTimeout(() => {
    reportingFacility.value = null
    complaintDescription.value = ''
    reportError.value = null
    descriptionError.value = null
  }, 300)
}

async function submitReport() {
  // Basic client-side validation
  const descTrimmed = complaintDescription.value.trim()
  if (!descTrimmed) {
    descriptionError.value = 'Description cannot be empty.'
    return
  }
  if (descTrimmed.length < 10) {
    descriptionError.value = 'Please provide at least 10 characters.'
    return
  }
  descriptionError.value = null

  if (!reportingFacility.value || !reportingFacility.value.id) {
    reportError.value = 'Cannot submit report: Facility data is missing.'
    return
  }

  reportLoading.value = true
  reportError.value = null

  try {
    await submitComplaint(reportingFacility.value.id, descTrimmed)

    reportDialogVisible.value = false
    ElMessage({
      message: 'Thank you! Your report has been submitted.',
      type: 'success',
      duration: 4000,
    })
    reportingFacility.value = null
    complaintDescription.value = ''
  } catch (error) {
    console.error('Error submitting complaint:', error)
    const backendError = error.response?.data?.errors?.join(', ') || error.response?.data?.error
    const errorMessage = `Failed to submit report: ${backendError || error.message || 'Unknown error'}`
    reportError.value = errorMessage
    ElMessage({
      message: `Error: ${backendError || error.message || 'Could not submit report.'}`,
      type: 'error',
      duration: 5000,
    })
  } finally {
    reportLoading.value = false
  }
}

onMounted(async () => {
  destinationStore.clearDestination()
  await fetchSpecialties()

  if (!locationStore.hasLocation() && !locationStore.isLoading) {
    await locationStore.fetchLocation()
  }
  if (!specialtiesError.value) {
    fetchAndSetFacilities()
  } else {
    console.warn('SearchView: Did not fetch initial facilities due to specialty loading error.')
  }
})

watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => {
    if (!specialtiesLoading.value && !specialtiesError.value) {
      debouncedFetch()
    } else if (specialtiesError.value) {
      console.warn('SearchView: Skipping facility fetch due to specialty loading error.')
      facilities.value = []
      searchError.value = 'Cannot filter facilities because the specialty list failed to load.'
    }
  },
  { deep: true },
)

watch(
  () => locationStore.hasLocation(),
  (newVal, oldVal) => {
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

watch(
  () => specialtiesError.value,
  (newError) => {
    if (newError) {
      facilities.value = []
      isLoading.value = false
      searchError.value = `Cannot search facilities: ${newError}`
    } else {
      if (!isLoading.value && locationStore.hasLocation()) {
        fetchAndSetFacilities()
      }
    }
  },
)
</script>

<style scoped>
.list-main-content {
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  position: relative;
}
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
.specialization-select {
  width: 250px;
}
.filter-checkbox {
  margin-left: 5px;
}

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
  padding: 0 15px 15px 15px;
  overflow-y: auto;
  flex-grow: 1;
}

.facility-list-panel h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 1.1em;
  padding: 15px 15px 0 15px;
  flex-shrink: 0;
  border-bottom: 1px solid #eee;
}
.facility-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.facility-list-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f4f4f4;
  transition: background-color 0.2s ease;
}
.facility-list-item:last-child {
  border-bottom: none;
}
.facility-list-item:hover,
.facility-list-item:focus {
  background-color: #f0faff;
  outline: 1px dashed #409eff;
  outline-offset: -1px;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.item-details {
  flex-grow: 1;
  min-width: 0;
}

.item-actions {
  flex-shrink: 0;
  padding-top: 2px;
}

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
  gap: 4px 10px;
}

.info-item {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.info-item .el-icon {
  margin-right: 4px;
  font-size: 1.1em;
  color: #909399;
}

.address-info {
  white-space: normal;
}

.link-item {
  color: #409eff;
  text-decoration: none;
  cursor: pointer;
}
.link-item:hover {
  text-decoration: underline;
}
a[href^='tel:'],
a[href^='mailto:'] {
  color: #606266;
}
a[href^='tel:']:hover,
a[href^='mailto:']:hover {
  color: #409eff;
  text-decoration: underline;
}

/* Specialties */
.specialties-container {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.specialty-tag {
}

.report-issue-container {
  margin-top: 8px;
  text-align: right;
}
.report-button.el-button--small {
  padding: 2px 5px;
  font-size: 0.8em;
  height: auto;
}
.report-button .el-icon {
  margin-right: 3px;
}

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
}
@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.specialty-error-text {
  padding: 10px;
  color: #f56c6c;
  text-align: center;
  font-size: 0.9em;
}

.view-alert {
  margin: 5px 15px;
  flex-shrink: 0;
}

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
    margin-left: 0;
  }
  .view-alert {
    margin: 5px 10px;
  }
  .facility-list-item {
    padding: 12px 10px;
  }
  .facility-list-panel h3 {
    padding: 15px 10px 10px 10px;
  }
  .results-list-container {
    padding: 0 10px 10px 10px;
  }
  .facility-info {
    font-size: 0.85em;
    line-height: 1.5;
    gap: 3px 8px;
  }
  .item-content {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  .item-actions {
    padding-top: 0;
    align-self: flex-end;
  }
  .report-issue-container {
    text-align: left;
    margin-top: 10px;
  }
  :deep(.el-dialog) {
    width: 90% !important;
  }
}

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
