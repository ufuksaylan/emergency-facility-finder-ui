// src/views/HomeView.vue - Conceptual Changes
<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useLocationStore } from '@/stores/location'
import { useDestinationStore } from '@/stores/destinationStore'
import { findFacilities } from '@/api/facilities'
import AppHeader from '@/components/AppHeader.vue'
import MapComponent from '@/components/MapComponent.vue'

const props = defineProps({
  searchType: {
    type: String,
    default: 'general',
  },
})

const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

const isLoading = ref(false)
const searchError = ref(null)
const facilities = ref([])
const currentFilters = ref({})

const facilityTypeFilter = ref('')
const specializationFilter = ref('')
const emergencyOnlyFilter = ref(false)
const nameQuery = ref('')

async function fetchAndSetFacilities() {
  if (!locationStore.hasLocation()) {
    searchError.value = 'Please enable location services.'
    return
  }

  isLoading.value = true
  searchError.value = null
  facilities.value = []

  try {
    const filters = {
      ...currentFilters.value,
      query: nameQuery.value || undefined,
      facility_type: facilityTypeFilter.value || undefined,
      specialization: specializationFilter.value || undefined,
      has_emergency: emergencyOnlyFilter.value ? true : undefined,
    }
    Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key])

    const response = await findFacilities(filters)
    facilities.value = response.data

    if (props.searchType === 'emergency' && facilities.value.length > 0) {
      console.log('Emergency search results:', facilities.value)
    }
  } catch (error) {
    console.error('Error fetching facilities:', error)
    searchError.value = error.message || 'Failed to fetch facilities.'
    facilities.value = []
  } finally {
    isLoading.value = false
  }
}

function handleFacilitySelect(facility) {
  console.log('Facility selected by user:', facility)
  destinationStore.setDestination(facility)
}

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
)

watch(
  [nameQuery, facilityTypeFilter, specializationFilter, emergencyOnlyFilter],
  () => {
    fetchAndSetFacilities()
  },
  { deep: true },
)

onMounted(async () => {
  if (props.searchType === 'emergency') {
    emergencyOnlyFilter.value = true
    currentFilters.value = { has_emergency: true }
  } else {
    emergencyOnlyFilter.value = false
    currentFilters.value = {}
  }

  if (!locationStore.hasLocation()) {
    try {
      await locationStore.fetchLocation()
    } catch {
      searchError.value = locationStore.error || 'Could not get location.'
    }
  } else {
    fetchAndSetFacilities()
  }
})

const facilityMarkers = computed(() => {
  return facilities.value
    .map((f) => ({
      id: f.id,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
      name: f.name,
      address: [f.street, f.house_number, f.city].filter(Boolean).join(' ').trim(),
      facility_type: f.facility_type,
      opening_hours: f.opening_hours,
      has_emergency: f.has_emergency,
      specialization: f.specialization,
      raw: f,
    }))
    .filter((f) => f.latitude != null && f.longitude != null)
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
  display: flex;
}
.facility-list-panel {
  width: 300px;
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
  flex-grow: 1;
  position: relative;
}

.facility-list-panel {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #eee;
  padding: 15px;
  overflow-y: auto;
  background: white;
  color: #303133;
}

.facility-list-panel h3 {
  margin-bottom: 10px;
  color: #303133;
}

.facility-list-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.facility-list-item {
  padding: 12px 5px;
  border-bottom: 1px solid #f4f4f4;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.facility-list-item:hover {
  background-color: #f5f5f5;
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

.facility-list-item .facility-address,
.facility-list-item .facility-details {
  color: #303133;
}

.map-area {
  flex-grow: 1;
  position: relative;
}
</style>
