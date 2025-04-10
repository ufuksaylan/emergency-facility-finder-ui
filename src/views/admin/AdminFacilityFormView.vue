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
import FacilityForm from '@/components/admin/FacilityForm.vue'
import { ElPageHeader, ElCard, ElAlert } from 'element-plus'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

const facilityData = ref(null)
const availableSpecialties = ref([])
const isLoadingInitialData = ref(false)
const loadingError = ref(null)

const specialtiesLoaded = ref(false)
const initialDataLoaded = ref(false)

const isEditMode = computed(() => !!route.params.osm_id)
const pageTitle = computed(() =>
  isEditMode.value ? `Edit Facility (OSM ID: ${route.params.osm_id})` : 'Create New Facility',
)

const loadInitialData = async () => {
  isLoadingInitialData.value = true
  loadingError.value = null
  specialtiesLoaded.value = false
  initialDataLoaded.value = !isEditMode.value

  try {
    const specResponse = await getAdminSpecialties()
    availableSpecialties.value = specResponse.data
    specialtiesLoaded.value = true
    console.log('Specialties loaded:', availableSpecialties.value)
  } catch (err) {
    console.error('Failed to load specialties:', err)
    loadingError.value = err.response?.data?.error || err.message || 'Failed to load specialties'
    isLoadingInitialData.value = false
    return
  }

  if (isEditMode.value) {
    try {
      const osmId = route.params.osm_id
      const facilityResponse = await getAdminFacility(osmId)
      facilityData.value = facilityResponse.data
      initialDataLoaded.value = true
      console.log('Facility data loaded for editing:', facilityData.value)
    } catch (err) {
      console.error(`Failed to load facility ${route.params.osm_id}:`, err)
      loadingError.value =
        err.response?.data?.error || err.message || 'Failed to load facility data'

      initialDataLoaded.value = false
    }
  }

  isLoadingInitialData.value = false
}

const handleSuccess = (savedFacility) => {
  ElMessage({
    message: `Facility '${savedFacility.name}' ${isEditMode.value ? 'updated' : 'created'} successfully.`,
    type: 'success',
  })
  router.push({ name: 'adminFacilitiesList' })
}

const goBack = () => {
  router.push({ name: 'adminFacilitiesList' })
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
