// src/composables/useLeafletMap.js
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'

// --- Pinia Store Imports ---
import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings' // Import the map settings store
// (Optional: import { storeToRefs } from 'pinia' if you prefer reactive refs)

// --- Environment Variable ---
const OSRM_SERVICE_URL = import.meta.env.VITE_OSRM_SERVICE_URL
if (!OSRM_SERVICE_URL) {
  console.error('Composable Error: VITE_OSRM_SERVICE_URL is not defined. Routing will fail.')
} else {
  console.log('Composable: Using OSRM Service URL:', OSRM_SERVICE_URL)
}

// --- Leaflet Icon Configuration (remains the same) ---
let iconsConfigured = false
async function configureLeafletIcons() {
  if (iconsConfigured) return
  try {
    const iconRetinaUrl = (await import('leaflet/dist/images/marker-icon-2x.png')).default
    const iconUrl = (await import('leaflet/dist/images/marker-icon.png')).default
    const shadowUrl = (await import('leaflet/dist/images/marker-shadow.png')).default

    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })
    iconsConfigured = true
    console.log('Composable: Default Leaflet icons configured.')
  } catch (e) {
    console.error('Composable: Error configuring Leaflet default icons:', e)
  }
}

// --- Custom Icons (remains the same) ---
const userIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' class='marker'%3E%3Cpath fill-opacity='.25' d='M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z'/%3E%3Cpath fill='%23007bff' stroke='%23fff' stroke-width='1' d='M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18 15.938 32 15.938 32zM16 6a4 4 0 110 8 4 4 0 010-8z'/%3E%3C/svg%3E`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})
const facilityIcon = L.icon(L.Icon.Default.prototype.options)

// --- Helper Functions ---

// upsertMarker (remains the same)
function upsertMarker(markerRef, latLng, options, map) {
  let created = false
  if (latLng instanceof L.LatLng) {
    if (!markerRef.value) {
      markerRef.value = L.marker(latLng, { icon: options.icon }).addTo(map)
      if (options.popupContent) markerRef.value.bindPopup(options.popupContent)
      if (options.tooltipContent) markerRef.value.bindTooltip(options.tooltipContent)
      created = true
    } else {
      markerRef.value.setLatLng(latLng)
      if (options.popupContent) markerRef.value.setPopupContent(options.popupContent)
      if (options.tooltipContent) markerRef.value.setTooltipContent(options.tooltipContent)
    }
  } else if (markerRef.value) {
    map.removeLayer(markerRef.value)
    markerRef.value = null
  }
  return created
}

/**
 * Formats the route summary from OSRM data.
 * @param {object} summary - The route summary object (totalDistance, totalTime).
 * @param {string} mode - The current travel mode ('driving' or 'foot'). // <-- Added mode
 * @returns {string | null} - Formatted string or null.
 */
function formatRouteSummary(summary, mode) {
  // <-- Added mode parameter
  if (!summary) return null
  const distanceKm = (summary.totalDistance / 1000).toFixed(1)
  const timeMinutes = Math.round(summary.totalTime / 60)
  // --- UPDATED: Use mode in the text ---
  const modeText = mode === 'driving' ? 'drive' : 'walk'
  return `${distanceKm} km, approx. ${timeMinutes} min ${modeText}`
}

// --- Composable ---
// --- UPDATED: Removed travelModeRef parameter ---
export function useLeafletMap(mapContainerRef, destinationRef) {
  // --- Internal State ---
  const mapObject = shallowRef(null)
  const routingControl = shallowRef(null)
  const userMarker = shallowRef(null)
  const destinationMarker = shallowRef(null)
  const isRouting = ref(false)
  const routingError = ref(null)
  const routeSummary = ref(null)

  // --- Access Stores ---
  const locationStore = useLocationStore()
  const mapSettingsStore = useMapSettingsStore() // Instantiate map settings store
  // Optional: const { selectedTravelMode } = storeToRefs(mapSettingsStore)

  // --- Computed LatLng Refs (remains the same) ---
  const userLatLng = computed(() =>
    locationStore.latitude != null && locationStore.longitude != null
      ? L.latLng(locationStore.latitude, locationStore.longitude)
      : null,
  )

  const destinationLatLng = computed(() => {
    const dest = destinationRef.value
    return dest?.latitude != null && dest?.longitude != null
      ? L.latLng(dest.latitude, dest.longitude)
      : null
  })

  // --- Internal Functions ---

  // removeRouteControl (remains the same, ensures summary is cleared)
  function removeRouteControl() {
    if (routingControl.value) {
      if (mapObject.value) {
        try {
          mapObject.value.removeControl(routingControl.value)
          console.log('Composable: Removed routing control.')
        } catch (error) {
          console.error('Composable: Error removing routing control:', error)
        }
      }
      routingControl.value = null
      routeSummary.value = null // Clear summary
      // isRouting is typically managed by the caller (createRoute)
    }
  }

  // --- UPDATED: createRoute uses store state and removes old route first ---
  function createRoute(startLatLng, endLatLng) {
    if (!OSRM_SERVICE_URL) {
      routingError.value = 'Routing service URL is not configured.'
      isRouting.value = false
      return
    }

    // --- Remove existing route before creating a new one ---
    removeRouteControl()

    // --- Get current mode from the store ---
    const currentMode = mapSettingsStore.selectedTravelMode
    console.log(
      `Composable: Creating route from ${startLatLng} to ${endLatLng} using mode: ${currentMode}`,
    )
    routingError.value = null
    isRouting.value = true // Set routing status
    routeSummary.value = null // Clear previous summary

    // --- Configure OSRM options based on mode ---
    const osrmOptions = {
      serviceUrl: OSRM_SERVICE_URL,
      // Map UI mode to OSRM profile name (adjust if your OSRM uses 'car'/'foot')
      profile: currentMode === 'driving' ? 'driving' : 'foot',
    }
    console.log('Composable: OSRM options:', osrmOptions)

    // Store a reference to the control being created
    const newControl = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      router: L.Routing.osrmv1(osrmOptions), // Use configured options
      lineOptions: { styles: [{ color: '#dc3545', opacity: 0.8, weight: 6 }] },
      createMarker: () => null,
      show: true,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      draggableWaypoints: false,
    })
      .on('routesfound', (e) => {
        // Check if this event belongs to the *current* control instance
        if (routingControl.value === newControl) {
          console.log('Composable: Route found.')
          const routes = e.routes
          if (routes.length > 0) {
            // --- Pass currentMode to formatRouteSummary ---
            routeSummary.value = formatRouteSummary(routes[0].summary, currentMode)
          }
          isRouting.value = false // Clear routing status
        }
      })
      .on('routingerror', (e) => {
        // Check if this event belongs to the *current* control instance
        if (routingControl.value === newControl) {
          console.error('Composable: Routing error:', e.error)
          // --- Include mode in error message ---
          routingError.value =
            `Could not calculate ${currentMode} route. ${e.error?.message || ''}`.trim()
          isRouting.value = false // Clear routing status
          removeRouteControl() // Clean up the failed control (already happens, but good practice)
        }
      })

    // Add to map and store reference
    newControl.addTo(mapObject.value)
    routingControl.value = newControl
  }

  // updateUserMarkerState (remains the same)
  function updateUserMarkerState(currentLatLng) {
    const created = upsertMarker(
      userMarker,
      currentLatLng,
      { icon: userIcon, popupContent: 'Your Location' },
      mapObject.value,
    )
    if (created && currentLatLng) {
      mapObject.value.setView(currentLatLng, 14)
    }
  }

  // updateDestinationMarkerState (remains the same)
  function updateDestinationMarkerState(currentLatLng, currentDestData) {
    const destOptions = currentDestData
      ? {
          icon: facilityIcon,
          popupContent: `<b>${currentDestData.name || 'Destination'}</b><br>${
            currentDestData.address || 'Address not available'
          }`,
          tooltipContent: currentDestData.name || 'Destination',
        }
      : {}
    upsertMarker(destinationMarker, currentLatLng, destOptions, mapObject.value)
  }

  // updateRouteState (logic remains same, calls updated createRoute)
  function updateRouteState(uLatLng, dLatLng) {
    if (uLatLng && dLatLng) {
      createRoute(uLatLng, dLatLng) // Will use current mode from store
    } else {
      removeRouteControl()
      isRouting.value = false // Stop routing if points disappear
      routingError.value = null // Clear error if points disappear
    }
  }

  // updateMapState (remains the same)
  function updateMapState() {
    if (!mapObject.value) return

    const uLatLng = userLatLng.value
    const dLatLng = destinationLatLng.value
    const destData = destinationRef.value

    updateUserMarkerState(uLatLng)
    updateDestinationMarkerState(dLatLng, destData)
    updateRouteState(uLatLng, dLatLng)
  }

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    // (remains the same)
    if (!mapContainerRef.value) {
      console.error('Composable: Map container ref not available on mount.')
      return
    }
    await configureLeafletIcons()
    mapObject.value = L.map(mapContainerRef.value, {
      zoomControl: true,
    }).setView([54.6872, 25.2797], 12) // Vilnius center

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapObject.value)

    console.log('Composable: Map initialized.')
    mapObject.value.whenReady(() => {
      console.log('Composable: Map ready, performing initial state update.')
      updateMapState()
    })
  })

  onBeforeUnmount(() => {
    // (remains the same)
    console.log('Composable: Cleaning up map.')
    removeRouteControl()
    if (mapObject.value) {
      mapObject.value.remove()
      mapObject.value = null
    }
    userMarker.value = null
    destinationMarker.value = null
  })

  // --- Watchers ---

  // Watch LatLng changes (remains the same)
  watch([userLatLng, destinationLatLng], updateMapState)

  // Watch destinationRef for popup data (remains the same)
  watch(destinationRef, updateMapState, { deep: true })

  // --- NEW: Watch selectedTravelMode from the store ---
  watch(
    () => mapSettingsStore.selectedTravelMode,
    (newMode, oldMode) => {
      if (newMode !== oldMode) {
        console.log('Composable: Travel mode changed in store to:', newMode)
        // Only recalculate route if we actually have points to route between
        if (userLatLng.value && destinationLatLng.value) {
          // updateMapState will handle removing the old route and creating the new one
          updateMapState()
        }
      }
    },
  )

  // --- Expose Reactive State (remains the same) ---
  return {
    isRouting,
    routingError,
    routeSummary,
  }
}
