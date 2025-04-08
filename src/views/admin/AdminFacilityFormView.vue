<template>
  <div class="admin-form-view">
    <el-page-header @back="goBack" :content="pageTitle" />

    <el-card class="form-card" v-loading="isLoadingInitialData">
      <div v-if="loadingError" class="error-message">
        <el-alert
          :title="`Error loading data: ${loadingError}`"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
      <FacilityForm
        v-else-if="specialtiesLoaded && initialDataLoaded"
        :initial-data="facilityData"
        :available-specialties="availableSpecialties"
        @submit-success="handleSuccess"
        @cancel="goBack"
      />
      <div v-else>
        <p>Loading form data...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAdminFacility, getAdminSpecialties } from '@/api/adminApi'
import FacilityForm from '@/components/admin/FacilityForm.vue' // Adjust path if needed
import { ElPageHeader, ElCard, ElAlert } from 'element-plus'
import { ElMessage } from 'element-plus' // For success/error messages

const route = useRoute()
const router = useRouter()

const facilityData = ref(null) // Holds data for editing
const availableSpecialties = ref([])
const isLoadingInitialData = ref(false)
const loadingError = ref(null)

// Track loading state for different async operations
const specialtiesLoaded = ref(false)
const initialDataLoaded = ref(false) // True immediately for create mode, true after fetch for edit mode

// Determine mode and title based on route params
const isEditMode = computed(() => !!route.params.osm_id)
const pageTitle = computed(() =>
  isEditMode.value ? `Edit Facility (OSM ID: ${route.params.osm_id})` : 'Create New Facility',
)

const loadInitialData = async () => {
  isLoadingInitialData.value = true
  loadingError.value = null
  specialtiesLoaded.value = false // Reset loading flags
  initialDataLoaded.value = !isEditMode.value // Initial data considered loaded if creating

  // Fetch specialties first (needed for both modes)
  try {
    const specResponse = await getAdminSpecialties()
    availableSpecialties.value = specResponse.data
    specialtiesLoaded.value = true // Mark specialties as loaded
    console.log('Specialties loaded:', availableSpecialties.value)
  } catch (err) {
    console.error('Failed to load specialties:', err)
    loadingError.value = err.response?.data?.error || err.message || 'Failed to load specialties'
    isLoadingInitialData.value = false // Stop loading on critical error
    return // Stop further execution if specialties fail
  }

  // If in edit mode, fetch the specific facility
  if (isEditMode.value) {
    try {
      const osmId = route.params.osm_id
      const facilityResponse = await getAdminFacility(osmId)
      facilityData.value = facilityResponse.data // Store fetched data
      initialDataLoaded.value = true // Mark facility data as loaded
      console.log('Facility data loaded for editing:', facilityData.value)
    } catch (err) {
      console.error(`Failed to load facility ${route.params.osm_id}:`, err)
      loadingError.value =
        err.response?.data?.error || err.message || 'Failed to load facility data'
      // Decide if you still want to show the form with specialties only, or fail completely
      // Failing completely might be safer if facility data is crucial
      initialDataLoaded.value = false // Explicitly mark as not loaded on error
    }
  }
  // No else needed, initialDataLoaded is already true for create mode

  isLoadingInitialData.value = false // Loading finished
}

const handleSuccess = (savedFacility) => {
  ElMessage({
    message: `Facility '${savedFacility.name}' ${isEditMode.value ? 'updated' : 'created'} successfully.`,
    type: 'success',
  })
  router.push({ name: 'adminFacilitiesList' }) // Go back to the list view
}

const goBack = () => {
  router.push({ name: 'adminFacilitiesList' }) // Or use router.go(-1)
}

onMounted(() => {
  loadInitialData()
})
</script>

<style scoped>
.admin-form-view {
  padding: 20px;
}
.el-page-header {
  margin-bottom: 20px;
}
.form-card {
  margin-top: 20px;
}
.error-message {
  padding: 20px;
}
</style>
