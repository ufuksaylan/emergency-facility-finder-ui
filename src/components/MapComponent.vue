// src/components/MapComponent.vue
<script setup>
import { ref, watch, computed, toRef } from 'vue'
import { storeToRefs } from 'pinia'
import { ElIcon, ElLink } from 'element-plus'
import { Van, Promotion } from '@element-plus/icons-vue' // Assuming Promotion is used for walk

// Import the composable and stores
import { useLeafletMap } from '@/composables/useLeafletMap'
import { useMapSettingsStore } from '@/stores/mapSettings'
// Location store might be implicitly used by the composable, but not directly needed here

// --- Props ---
const props = defineProps({
  destinationFacility: {
    type: Object, // Expecting the formatted facility object or null
    default: null,
  },
  // Expose map state back up if needed by parent for things like notifications
  // Using 'update:...' pattern allows v-model:is-routing etc. in parent if desired
  isRouting: {
    type: Boolean,
    default: false,
  },
  routingError: {
    type: String,
    default: null,
  },
  routeSummary: {
    type: String,
    default: null,
  },
})

// --- Emits (for v-model pattern if used) ---
const emit = defineEmits(['update:isRouting', 'update:routingError', 'update:routeSummary'])

// --- Store Instantiation ---
const mapSettingsStore = useMapSettingsStore()
const { selectedTravelMode } = storeToRefs(mapSettingsStore)

// --- Local Component State ---
const mapContainerRef = ref(null)

// --- Use the Map Composable ---
// Pass the destinationFacility prop as a reactive ref using toRef
const destinationRef = toRef(props, 'destinationFacility')
const {
  isRouting: composableIsRouting,
  routingError: composableRoutingError,
  routeSummary: composableRouteSummary,
} = useLeafletMap(mapContainerRef, destinationRef)

// --- Computed Properties ---
// Determine the icon based on the selected travel mode from the store
const currentModeIcon = computed(() => {
  // Replace 'Promotion' with a better icon like Bicycle or a custom SVG if available
  return selectedTravelMode.value === 'driving' ? Van : Promotion
})

// --- Watchers to update parent via emits (if using v-model pattern) ---
// These watchers synchronize the composable's state back to the parent component
// if the parent needs to react to these changes (e.g., for notifications).
watch(composableIsRouting, (newValue) => {
  emit('update:isRouting', newValue)
})

watch(composableRoutingError, (newValue) => {
  emit('update:routingError', newValue)
})

watch(composableRouteSummary, (newValue) => {
  emit('update:routeSummary', newValue)
})

// --- Lifecycle Hooks ---
// onMounted is handled *within* the useLeafletMap composable now.
// No specific onMounted logic needed here unless you want to do something *after*
// the map itself is mounted by the composable.
</script>

<template>
  <div class="map-component-wrapper">
    <div ref="mapContainerRef" class="map-container"></div>

    <transition name="el-fade-in">
      <div class="directions-overlay" v-if="composableRouteSummary && !composableRoutingError">
        <el-icon :size="24" style="margin-right: 8px">
          <component :is="currentModeIcon" />
        </el-icon>
        <div class="directions-text">
          <span>ER is {{ composableRouteSummary }}</span>
          <el-link type="primary" :underline="false">Tap here for directions</el-link>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
/* Styles specific to the MapComponent layout and elements */
.map-component-wrapper {
  height: 100%;
  width: 100%;
  position: relative; /* Needed for absolute positioning of overlay */
  overflow: hidden; /* Prevent map content spilling if dimensions are odd */
}

.map-container {
  height: 100%;
  width: 100%;
  background-color: #e0e0e0; /* Placeholder background */
}

/* Styles moved from HomeView for the overlay */
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
  z-index: 1001; /* Above map layers */
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

/* Global Leaflet control styles should remain in main.css or App.vue */
/* Styles specific to leaflet controls can stay global if needed */
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
