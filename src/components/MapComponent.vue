<template>
  <div style="height: 600px; width: 100%">
    <l-map
      ref="mapRef"
      :zoom="mapConfig.zoom"
      :center="mapConfig.center"
      :use-global-leaflet="false"
      @ready="onMapReady"
    >
      <l-tile-layer :url="mapConfig.tileUrl" :attribution="mapConfig.attribution"></l-tile-layer>

      <l-marker v-if="userLatLng" :lat-lng="userLatLng" :icon="userIcon">
        <l-popup>Your Location</l-popup>
      </l-marker>

      <l-marker v-if="destinationLatLng" :lat-lng="destinationLatLng" :icon="facilityIcon">
        <l-popup>
          <b>Destination:</b><br />{{ destination.name }}<br />{{ destination.address }}
        </l-popup>
        <l-tooltip>{{ destination.name }}</l-tooltip>
      </l-marker>
    </l-map>
    <div v-if="routingError" style="color: red; padding-top: 10px">
      Routing Error: {{ routingError }}
    </div>
    <div v-if="isRouting" style="padding-top: 10px">Calculating route...</div>
  </div>
</template>

<script setup>
// Import nextTick and onBeforeUnmount
import { ref, computed, shallowRef, watchEffect, nextTick, onBeforeUnmount } from 'vue'

// Import Leaflet and Vue-Leaflet components
import 'leaflet/dist/leaflet.css'
import * as L from 'leaflet'
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet'

// Import Routing Machine
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'

// Import Pinia store for user location
import { useLocationStore } from '@/stores/location'

// --- Props ---
const props = defineProps({
  destination: {
    type: Object,
    required: true,
  },
})

// --- Leaflet Map Configuration ---
const mapConfig = ref({
  zoom: 12,
  center: [54.6872, 25.2797], // Vilnius center
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
})
const mapRef = shallowRef(null)
// Use shallowRef for Leaflet objects to prevent deep reactivity issues
const mapObject = shallowRef(null)
const routingControl = shallowRef(null)
const routingError = ref(null)
const isRouting = ref(false)

// --- Location Store ---
const locationStore = useLocationStore()
const userLatLng = computed(() => {
  // Ensure we return null if lat/lon are missing, otherwise create L.latLng
  if (locationStore.latitude != null && locationStore.longitude != null) {
    return L.latLng(locationStore.latitude, locationStore.longitude)
  }
  return null
})

// --- Destination Coords ---
const destinationLatLng = computed(() => {
  // Ensure we return null if lat/lon are missing, otherwise create L.latLng
  if (props.destination?.latitude != null && props.destination?.longitude != null) {
    return L.latLng(props.destination.latitude, props.destination.longitude)
  }
  return null
})

// --- Icons (using default Leaflet icons) ---
// Configuration moved inside onMounted to ensure it runs reliably
// const userIcon = ... (Keep your icon definitions)
// const facilityIcon = ...

// --- Routing Logic ---
function createRoute(startLatLng, endLatLng) {
  // Extra check: Ensure mapObject is still valid before proceeding
  if (!mapObject.value) {
    console.error('Map object invalid when trying to create route.')
    routingError.value = 'Map instance lost.'
    isRouting.value = false
    return
  }
  // Extra check: Ensure start/end points are valid Leaflet LatLng objects
  if (!(startLatLng instanceof L.LatLng) || !(endLatLng instanceof L.LatLng)) {
    console.error('Invalid LatLng provided for routing.', { startLatLng, endLatLng })
    routingError.value = 'Invalid start or end coordinates for routing.'
    isRouting.value = false
    return
  }

  // Remove previous route robustly
  removeRouteControl() // Use helper function

  console.log(`Creating route from ${startLatLng} to ${endLatLng}`)
  routingError.value = null
  isRouting.value = true

  // Create new routing control instance
  const newControl = L.Routing.control({
    waypoints: [startLatLng, endLatLng],
    routeWhileDragging: false,
    show: true,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true,
    lineOptions: {
      styles: [{ color: '#dc3545', opacity: 0.8, weight: 6 }],
    },
    router: L.Routing.osrmv1({
      serviceUrl: 'https://router.project-osrm.org/route/v1',
    }),
    // Crucial: Ensure this prevents default markers which might cause bounds issues
    createMarker: function () {
      return null
    },
  })
    .on('routesfound', function (e) {
      console.log('Route found:', e.routes[0])
      isRouting.value = false
    })
    .on('routingerror', function (e) {
      console.error('Routing error:', e.error)
      routingError.value = e.error?.message || 'Could not calculate route.'
      isRouting.value = false
      // Attempt to clean up the control instance on error
      removeRouteControl()
    })

  // Add to map and store reference
  newControl.addTo(mapObject.value)
  routingControl.value = newControl // Store the reference *after* adding successfully
}

// Helper function to safely remove the routing control
function removeRouteControl() {
  // Check both map object and control instance are valid
  if (mapObject.value && routingControl.value) {
    try {
      mapObject.value.removeControl(routingControl.value)
      console.log('Removed existing routing control.')
    } catch (error) {
      // Catch potential errors during removal (e.g., if map state is weird)
      console.error('Error removing routing control:', error)
    } finally {
      routingControl.value = null // Always clear the reference
    }
  } else if (routingControl.value) {
    // If control exists but map doesn't, just clear reference
    routingControl.value = null
  }
}

// --- Map Ready Callback ---
async function onMapReady(leafletMapObject) {
  console.log('Leaflet map object is ready.')
  mapObject.value = leafletMapObject

  // Configure default icons *after* map is ready and Leaflet is loaded
  try {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: (await import('leaflet/dist/images/marker-icon-2x.png')).default,
      iconUrl: (await import('leaflet/dist/images/marker-icon.png')).default,
      shadowUrl: (await import('leaflet/dist/images/marker-shadow.png')).default,
    })
    console.log('Default Leaflet icons configured.')
  } catch (e) {
    console.error('Error configuring Leaflet default icons:', e)
  }

  // The watchEffect will handle initial route creation if conditions are met
}

// --- Watcher for Automatic Routing ---
watchEffect(async (onCleanup) => {
  const currentUserLatLng = userLatLng.value
  const currentDestinationLatLng = destinationLatLng.value
  const currentMapObject = mapObject.value

  if (currentUserLatLng && currentDestinationLatLng && currentMapObject) {
    // --- Defer execution to allow DOM/Map updates ---
    await nextTick()
    // Re-check conditions after nextTick, as state could change rapidly
    if (
      userLatLng.value === currentUserLatLng &&
      destinationLatLng.value === currentDestinationLatLng &&
      mapObject.value === currentMapObject && // Ensure map hasn't been destroyed
      !routingControl.value &&
      !isRouting.value
    ) {
      // Only route if not already present/loading

      console.log('watchEffect: Conditions met. Attempting to create route.')
      createRoute(currentUserLatLng, currentDestinationLatLng)
    } else {
      console.log(
        'watchEffect: Conditions met initially, but changed after nextTick or route already exists/loading. Skipping route creation.',
      )
    }
  } else {
    // Conditions not met, ensure any existing route is removed
    if (routingControl.value) {
      console.log('watchEffect: Conditions no longer met. Removing route.')
      removeRouteControl() // Use helper
    }
  }

  // Cleanup function for the watcher
  onCleanup(() => {
    console.log(
      'watchEffect cleanup: Ensuring route control is removed if component state changes.',
    )
    // This cleanup runs if the dependencies of watchEffect change *before*
    // the component unmounts. We also have onBeforeUnmount for final cleanup.
    removeRouteControl()
  })
})

// --- Lifecycle Hooks ---
onBeforeUnmount(() => {
  console.log('MapComponent onBeforeUnmount: Cleaning up routing control and map reference.')
  // Explicitly remove routing control before component unmounts
  removeRouteControl()
  // Nullify map object reference
  mapObject.value = null
})

// Keep your icon definitions (userIcon, facilityIcon) as computed properties
// Ensure paths are correct if using custom image files. For simplicity, defaults are configured in onMapReady now.
const userIcon = computed(() =>
  L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' class='marker'%3E%3Cpath fill-opacity='.25' d='M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z'/%3E%3Cpath fill='%23007bff' stroke='%23fff' stroke-width='1' d='M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18 15.938 32 15.938 32zM16 6a4 4 0 110 8 4 4 0 010-8z'/%3E%3C/svg%3E`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
)
const facilityIcon = computed(() => {
  // Return default icon instance using configured paths (needs L.Icon.Default configured first)
  return L.icon(L.Icon.Default.prototype.options)
})
</script>

<style>
/* Keep routing machine styles */
.leaflet-routing-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  max-height: 400px;
  overflow-y: auto;
}
.leaflet-popup-content-wrapper {
  width: auto !important;
  min-width: 150px;
}
</style>
