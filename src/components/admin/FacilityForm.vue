<template>
  <el-form
    ref="formRef"
    :model="formData"
    label-position="top"
    @submit.prevent="handleSubmit"
    v-loading="isLoading"
    element-loading-text="Saving facility..."
  >
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12">
        <el-form-item label="OSM ID" :required="!isEditMode">
          <el-input-number
            v-model="formData.osm_id"
            :controls="false"
            :disabled="isEditMode"
            placeholder="OpenStreetMap ID (required for new)"
            style="width: 100%"
          />
          <small v-if="isEditMode">OSM ID cannot be changed after creation.</small>
        </el-form-item>

        <el-form-item label="Name" required>
          <el-input v-model="formData.name" placeholder="Facility Name" />
        </el-form-item>

        <el-form-item label="Facility Type" required>
          <el-select v-model="formData.facility_type" placeholder="Select type" style="width: 100%">
            <el-option label="Hospital" value="hospital" />
            <el-option label="Clinic" value="clinic" />
            <el-option label="Polyclinic" value="polyclinic" />
            <el-option label="Dentist" value="dentist" />
            <el-option label="Pharmacy" value="pharmacy" />
            <el-option label="Doctors" value="doctors" />
            <el-option label="Rehabilitation" value="rehabilitation" />
            <el-option label="Laboratory" value="laboratory" />
            <el-option label="Blood Donation" value="blood_donation" />
            <el-option label="Alternative" value="alternative" />
            <el-option label="Optometrist" value="optometrist" />
            <el-option label="Other" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="Street">
          <el-input v-model="formData.street" placeholder="Street Name" />
        </el-form-item>

        <el-form-item label="House Number">
          <el-input v-model="formData.house_number" placeholder="e.g., 3, 15A" />
        </el-form-item>

        <el-form-item label="City">
          <el-input v-model="formData.city" placeholder="City Name" />
        </el-form-item>

        <el-form-item label="Postcode">
          <el-input v-model="formData.postcode" placeholder="e.g., LT-01118" />
        </el-form-item>

        <el-form-item label="Opening Hours">
          <el-input
            v-model="formData.opening_hours"
            type="textarea"
            :rows="2"
            placeholder="e.g., Mo-Fr 08:00-17:00; Sa 09:00-12:00"
          />
        </el-form-item>
      </el-col>

      <el-col :xs="24" :sm="12">
        <el-form-item label="Phone">
          <el-input v-model="formData.phone" type="tel" placeholder="+370 ..." />
        </el-form-item>

        <el-form-item label="Website">
          <el-input v-model="formData.website" type="url" placeholder="https://..." />
        </el-form-item>

        <el-form-item label="Email">
          <el-input v-model="formData.email" type="email" placeholder="info@..." />
        </el-form-item>

        <el-form-item label="Specialization (General Description)">
          <el-input
            v-model="formData.specialization"
            placeholder="e.g., Multidisciplinary Outpatient Care"
          />
        </el-form-item>

        <el-form-item label="Specific Specialties">
          <el-select
            v-model="formData.specialty_ids"
            multiple
            filterable
            placeholder="Select specific specialties"
            style="width: 100%"
          >
            <el-option
              v-for="spec in availableSpecialties"
              :key="spec.id"
              :label="spec.name"
              :value="spec.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Latitude">
          <el-input
            v-model="formData.latitude"
            type="text"
            placeholder="e.g., 54.6828 (Text Input)"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="Longitude">
          <el-input
            v-model="formData.longitude"
            type="text"
            placeholder="e.g., 25.2800 (Text Input)"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Options">
          <el-checkbox
            v-model="formData.wheelchair_accessible"
            label="Wheelchair Accessible"
            border
          />
          <el-checkbox
            v-model="formData.has_emergency"
            label="Has Emergency Dept."
            border
            style="margin-left: 10px"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      style="margin-top: 15px"
    />

    <el-form-item style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px">
      <el-button type="primary" native-type="submit" :loading="isLoading">
        {{ isEditMode ? 'Update Facility' : 'Create Facility' }}
      </el-button>
      <el-button @click="handleCancel" :disabled="isLoading">Cancel</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import apiClient from '@/api/client' // Adjust path if needed
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElButton,
  ElAlert,
  ElRow,
  ElCol,
  ElInputNumber, // ElInputNumber still used for OSM ID
} from 'element-plus'

// --- Props ---
const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  availableSpecialties: {
    type: Array,
    required: true,
    default: () => [],
  },
})

const emit = defineEmits(['submit-success', 'cancel'])

const formRef = ref(null)
const isLoading = ref(false)
const error = ref(null)

const formData = reactive({
  osm_id: null,
  name: '',
  facility_type: '',
  street: '',
  house_number: '',
  city: '',
  postcode: '',
  opening_hours: '',
  phone: '',
  website: '',
  email: '',
  wheelchair_accessible: false,
  has_emergency: false,
  specialization: '',
  latitude: null,
  longitude: null,
  specialty_ids: [],
})

const isEditMode = computed(() => !!props.initialData?.osm_id)

const populateForm = (data) => {
  if (data) {
    Object.keys(formData).forEach((key) => {
      if (key === 'latitude' || key === 'longitude') return

      if (data[key] !== undefined && data[key] !== null) {
        if (key === 'specialty_ids' && Array.isArray(data.specialties)) {
          formData.specialty_ids = data.specialties.map((spec) => spec.id)
        } else {
          formData[key] = data[key]
        }
      } else {
        if (typeof formData[key] === 'boolean') formData[key] = false
        else if (Array.isArray(formData[key])) formData[key] = []
        else if (typeof formData[key] === 'number') formData[key] = null
        else formData[key] = ''
      }
    })

    formData.wheelchair_accessible = !!data.wheelchair_accessible
    formData.has_emergency = !!data.has_emergency

    let parsedLat = null
    let parsedLon = null

    if (typeof data.location === 'string' && data.location.startsWith('POINT')) {
      const match = data.location.match(/POINT\s?\(\s*(-?\d+(\.\d+)?)\s+(-?\d+(\.\d+)?)\s*\)/)
      if (match && match.length >= 4) {
        parsedLon = parseFloat(match[1])
        parsedLat = parseFloat(match[3])
        console.log('Populate: Parsed WKT location:', parsedLat, parsedLon)
      } else {
        console.warn('Populate: Could not parse WKT location string:', data.location)
      }
    } else if (
      data.location?.coordinates &&
      Array.isArray(data.location.coordinates) &&
      data.location.coordinates.length === 2
    ) {
      parsedLon = data.location.coordinates[0]
      parsedLat = data.location.coordinates[1]
      console.log('Populate: Using coordinates array location:', parsedLat, parsedLon)
    } else if (data.latitude !== undefined && data.longitude !== undefined) {
      parsedLat = data.latitude ?? null
      parsedLon = data.longitude ?? null
      console.log('Populate: Using direct lat/lon fields:', parsedLat, parsedLon)
    } else {
      console.warn('Populate: No location data found in expected formats.')
    }

    formData.latitude = parsedLat !== null ? String(parsedLat) : ''
    formData.longitude = parsedLon !== null ? String(parsedLon) : ''
  } else {
    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === 'boolean') formData[key] = false
      else if (Array.isArray(formData[key])) formData[key] = []
      else if (key === 'latitude' || key === 'longitude')
        formData[key] = '' // Reset lat/lon to empty string for text input
      else if (typeof formData[key] === 'number') formData[key] = null
      else formData[key] = ''
    })
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  error.value = null
  if (!isEditMode.value && !formData.osm_id) {
    error.value = 'OSM ID is required to create a new facility.'
    isLoading.value = false
    return
  }

  const corePayload = { ...formData }
  delete corePayload.specialty_ids

  const payload = {
    facility: {
      ...corePayload,

      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      ...(formData.specialty_ids?.length > 0 && { specialty_ids: formData.specialty_ids }),
    },
  }

  if (isEditMode.value) {
    delete payload.facility.osm_id
  }

  console.log('Submitting Payload:', JSON.stringify(payload, null, 2))

  try {
    let response
    if (isEditMode.value) {
      const facilityOsmId = props.initialData.osm_id
      response = await apiClient.put(`/admin/facilities/${facilityOsmId}`, payload)
    } else {
      response = await apiClient.post('/admin/facilities', payload)
    }
    console.log('Save successful:', response.data)
    emit('submit-success', response.data)
  } catch (err) {
    console.error('Save failed:', err.response || err.message || err)
    let errorMessage = 'An unexpected error occurred. Please try again.'
    if (err.response?.data?.errors) {
      errorMessage = err.response.data.errors.join('; ')
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error
    } else if (err.message) {
      errorMessage = err.message
    }
    error.value = errorMessage
    console.error('Detailed Error:', err.response?.data || err)
    isLoading.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
}

watch(
  () => props.initialData,
  (newData) => {
    populateForm(newData)
  },
  { immediate: true, deep: true },
)
</script>

<style scoped>
.el-form-item {
  margin-bottom: 18px;
}
.el-checkbox.is-bordered {
  margin-right: 10px;
}
small {
  display: block;
  color: #909399;
  font-size: 0.8em;
  line-height: 1.2;
}
</style>
