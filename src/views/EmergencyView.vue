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
import { ElContainer, ElMain, ElAlert } from 'element-plus'

const locationStore = useLocationStore()
const destinationStore = useDestinationStore()

const isLoading = ref(false)
const searchError = ref(null)
const facilities = ref([])
const selectedEmergencyFacility = ref(null)

async function findEmergencyFacilities() {
  if (!locationStore.hasLocation()) {
    searchError.value = 'Please enable location services.'
    return
  }
  isLoading.value = true
  searchError.value = null
  facilities.value = []
  destinationStore.clearDestination()
  selectedEmergencyFacility.value = null

  try {
    const response = await findFacilities({ has_emergency: true })
    facilities.value = response.data

    if (facilities.value.length > 0) {
      const nearestER = facilities.value[0]
      selectedEmergencyFacility.value = {
        id: nearestER.id,
        name: nearestER.name,
        address:
          [nearestER.street, nearestER.house_number, nearestER.city]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Address unavailable',
      }
      console.log('Auto-selecting nearest ER:', nearestER)
      destinationStore.setDestination(nearestER)
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

function handleMarkerClick(facilityData) {
  console.log('Marker clicked (Emergency View):', facilityData)
}

const facilityMarkers = computed(() => {
  return facilities.value
    .map((f) => ({
      id: f.id,
      latitude: f.location?.latitude,
      longitude: f.location?.longitude,
      name: f.name,
      address: [f.street, f.house_number, f.city].filter(Boolean).join(' ').trim(),
      isEmergency: f.has_emergency,
      raw: f,
    }))
    .filter((f) => f.latitude != null && f.longitude != null)
})

onMounted(async () => {
  destinationStore.clearDestination()
  if (!locationStore.hasLocation()) {
    try {
      await locationStore.fetchLocation()
      if (locationStore.hasLocation()) {
        findEmergencyFacilities()
      } else {
        searchError.value = locationStore.error || 'Could not get location.'
      }
    } catch {
      searchError.value = locationStore.error || 'Could not get location.'
    }
  } else {
    findEmergencyFacilities()
  }
})

watch(
  () => [locationStore.latitude, locationStore.longitude],
  (newVal, oldVal) => {
    if (
      newVal[0] !== null &&
      newVal[1] !== null &&
      (newVal[0] !== oldVal[0] || newVal[1] !== oldVal[1])
    ) {
      console.log('Location updated, re-finding nearest ER...')
      findEmergencyFacilities()
    }
  },
  { immediate: false },
)
</script>

<style scoped>
.el-main {
  padding: 0;
  position: relative;
  display: flex;
  flex-grow: 1;
}

.view-alert {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002;
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
  color: #1f1f1f;
  margin-top: 8px;
}

:deep(.map-component-wrapper),
:deep(.map-container) {
  width: 100%;
  height: 100%;
}

@media (max-width: 600px) {
  .selected-er-info {
    left: 10px;
    right: 10px;
    bottom: 10px;
    transform: none;
    width: auto;
    max-width: none;

    padding: 10px 15px;

    box-sizing: border-box;

    text-align: left;
  }

  .selected-er-info h3 {
    font-size: 1em;
    margin-bottom: 4px;
  }

  .selected-er-info p {
    font-size: 0.85em;
    margin-top: 2px;
    margin-bottom: 2px;
  }

  .selected-er-info .route-summary {
    font-size: 0.85em;
    margin-top: 6px;
  }

  .selected-er-info .el-alert {
    padding: 5px 8px;
    font-size: 0.8em;
  }
  .selected-er-info .el-alert__title {
    font-size: 1em;
  }
  .selected-er-info .el-alert__icon {
    width: 14px;
    font-size: 14px;
  }
}
</style>
