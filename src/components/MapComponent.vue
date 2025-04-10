<script setup>
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { ElIcon } from 'element-plus'
import { Van, Promotion } from '@element-plus/icons-vue'

import { useLeafletMap } from '@/composables/useLeafletMap'
import { useMapSettingsStore } from '@/stores/mapSettings'
import { useDestinationStore } from '@/stores/destinationStore'

const mapSettingsStore = useMapSettingsStore()
const destinationStore = useDestinationStore()

const { selectedTravelMode } = storeToRefs(mapSettingsStore)
const { selectedFacility, isRouting, routingError, routeSummary } = storeToRefs(destinationStore)

const mapContainerRef = ref(null)

useLeafletMap(mapContainerRef, selectedFacility)

const currentModeIcon = computed(() => {
  return selectedTravelMode.value === 'driving' ? Van : Promotion
})
</script>

<template>
  <div class="map-component-wrapper">
    <div ref="mapContainerRef" class="map-container"></div>

    <transition name="el-fade-in">
      <div class="directions-overlay" v-if="routeSummary && !routingError">
        <el-icon :size="24" style="margin-right: 8px">
          <component :is="currentModeIcon" />
        </el-icon>
        <div class="directions-text">
          <span style="color: black">ER is {{ routeSummary }}</span>
          <!-- <el-link type="primary" :underline="false">Tap here for directions</el-link> -->
        </div>
      </div>
    </transition>

    <transition name="el-fade-in">
      <div v-if="routingError" class="routing-error-overlay">⚠️ {{ routingError }}</div>
    </transition>
    <transition name="el-fade-in">
      <div v-if="isRouting" class="routing-loading-overlay">Calculating Route...</div>
    </transition>
  </div>
</template>

<style scoped>
.map-component-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.map-container {
  height: 100%;
  width: 100%;
  background-color: #e0e0e0;
}

.directions-overlay {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 1001;
  width: fit-content;
  max-width: 90%;
}

.directions-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.directions-text span {
  font-weight: bold;
  margin-bottom: 2px;
}

.directions-text .el-link {
  font-weight: normal;
}

.routing-error-overlay,
.routing-loading-overlay {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 15px;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
  z-index: 1001;
  text-align: center;
  max-width: 80%;
  font-size: 0.9em;
}
.routing-error-overlay {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
.routing-loading-overlay {
  background-color: #e2e3e5;
  color: #383d41;
  border: 1px solid #d6d8db;
}

:global(.leaflet-control-zoom a),
:global(.leaflet-control-locate a) {
  border: 1px solid #ccc !important;
  background-color: white !important;
  color: #333 !important;
}
:global(.leaflet-control-zoom a:hover),
:global(.leaflet-control-locate a:hover) {
  background-color: #f4f4f4 !important;
}
</style>
