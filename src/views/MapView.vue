<template>
  <el-container direction="vertical" style="height: calc(100vh - 60px)">
    <el-header class="map-view-header">
      <el-button :icon="BackIcon" @click="goBack" circle aria-label="Back to search list" />
      <h2 v-if="destinationStore.selectedFacility">{{ destinationStore.selectedFacility.name }}</h2>
      <h2 v-else-if="!error">Map View</h2>
      <h2 v-else>Error Loading Facility</h2>
      <div style="width: 32px"></div>
    </el-header>

    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      :closable="false"
      class="view-alert map-error-alert"
    />

    <el-main class="map-main-content">
      <MapComponent v-if="destinationStore.selectedFacility && !error" />

      <div v-else-if="error" class="map-placeholder">
        <span>{{ error }}</span>
      </div>
      <div v-else class="map-placeholder">
        <span>Preparing map...</span>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDestinationStore } from '@/stores/destinationStore'
// Import YOUR MapComponent
import MapComponent from '@/components/MapComponent.vue' // Verify path
import { ElContainer, ElHeader, ElMain, ElButton, ElAlert } from 'element-plus'
import { Back as BackIcon } from '@element-plus/icons-vue'

const router = useRouter()
const destinationStore = useDestinationStore()

const error = ref(null)

function goBack() {
  router.push({ name: 'search' })
}

onMounted(() => {
  error.value = null

  if (!destinationStore.selectedFacility) {
    console.warn('MapView: No valid destination found in store on mount.')
    error.value =
      'No facility selected or facility data is incomplete. Please go back to the search list and select a facility.'
  } else {
    console.log(
      'MapView: Valid destination found, rendering MapComponent for:',
      destinationStore.selectedFacility.name,
    )
  }
})
</script>

<style scoped>
.map-view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  border-bottom: 1px solid #eee;
  background-color: #f8f8f8;
  height: 60px;
  flex-shrink: 0;
}
.map-view-header h2 {
  margin: 0;
  font-size: 1.2em;
  color: #303133;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 10px;
}
.map-main-content {
  padding: 0;
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}
.map-error-alert {
  margin: 10px 15px;
  flex-shrink: 0;
}
.map-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #909399;
  padding: 20px;
}
:deep(.map-component-wrapper) {
  width: 100%;
  height: 100%;
}
@media (max-width: 767px) {
  .map-view-header h2 {
    font-size: 1.1em;
  }
  .map-error-alert {
    margin: 5px 10px;
  }
}
</style>
