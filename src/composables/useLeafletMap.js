// src/composables/useLeafletMap.js
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import { useLocationStore } from '@/stores/location'

// --- Environment Variable ---
const OSRM_SERVICE_URL = import.meta.env.VITE_OSRM_SERVICE_URL
if (!OSRM_SERVICE_URL) {
  console.error('Composable Error: VITE_OSRM_SERVICE_URL is not defined. Routing will fail.')
} else {
  console.log('Composable: Using OSRM Service URL:', OSRM_SERVICE_URL)
}

// --- Leaflet Icon Configuration ---
let iconsConfigured = false
async function configureLeafletIcons() {
  if (iconsConfigured) return
  try {
    // Dynamically import assets to avoid build issues if Leaflet isn't used everywhere
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

// Custom user icon
const userIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' class='marker'%3E%3Cpath fill-opacity='.25' d='M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z'/%3E%3Cpath fill='%23007bff' stroke='%23fff' stroke-width='1' d='M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18 15.938 32 15.938 32zM16 6a4 4 0 110 8 4 4 0 010-8z'/%3E%3C/svg%3E`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})
// Use default icon options for facilities
const facilityIcon = L.icon(L.Icon.Default.prototype.options)

// --- Helper Functions ---

/**
 * Manages a Leaflet marker lifecycle (create, update, remove).
 * @param {ShallowRef<L.Marker | null>} markerRef - ShallowRef holding the marker instance.
 * @param {L.LatLng | null} latLng - The new LatLng or null to remove.
 * @param {object} options - Marker options (icon, popupContent, tooltipContent).
 * @param {L.Map} map - The Leaflet map instance.
 * @returns {boolean} - True if the marker was newly created.
 */
function upsertMarker(markerRef, latLng, options, map) {
  let created = false
  if (latLng instanceof L.LatLng) {
    if (!markerRef.value) {
      // Create
      markerRef.value = L.marker(latLng, { icon: options.icon }).addTo(map)
      if (options.popupContent) markerRef.value.bindPopup(options.popupContent)
      if (options.tooltipContent) markerRef.value.bindTooltip(options.tooltipContent)
      created = true
    } else {
      // Update
      markerRef.value.setLatLng(latLng)
      if (options.popupContent) markerRef.value.setPopupContent(options.popupContent)
      if (options.tooltipContent) markerRef.value.setTooltipContent(options.tooltipContent)
    }
  } else if (markerRef.value) {
    // Remove
    map.removeLayer(markerRef.value)
    markerRef.value = null
  }
  return created
}

/**
 * Formats the route summary from OSRM data.
 * @param {object} summary - The route summary object (totalDistance, totalTime).
 * @returns {string | null} - Formatted string or null.
 */
function formatRouteSummary(summary) {
  if (!summary) return null
  const distanceKm = (summary.totalDistance / 1000).toFixed(1)
  const timeMinutes = Math.round(summary.totalTime / 60)
  return `${distanceKm} km, approx. ${timeMinutes} min drive`
}

// --- Composable ---

export function useLeafletMap(mapContainerRef, destinationRef) {
  // --- Internal State ---
  const mapObject = shallowRef(null)
  const routingControl = shallowRef(null)
  const userMarker = shallowRef(null)
  const destinationMarker = shallowRef(null)
  const isRouting = ref(false)
  const routingError = ref(null)
  const routeSummary = ref(null) // <-- New state for summary

  // --- Access Location Store ---
  const locationStore = useLocationStore()

  // --- Computed LatLng Refs ---
  const userLatLng = computed(() =>
    locationStore.latitude != null && locationStore.longitude != null
      ? L.latLng(locationStore.latitude, locationStore.longitude)
      : null,
  )

  const destinationLatLng = computed(() => {
    const dest = destinationRef.value // Use the ref passed from the component
    return dest?.latitude != null && dest?.longitude != null
      ? L.latLng(dest.latitude, dest.longitude)
      : null
  })

  // --- Internal Functions ---

  // Safely removes the current routing control and clears related state
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
      routeSummary.value = null // Clear summary when route is removed
      // Don't reset isRouting here, let the calling context decide
    }
  }

  // Creates and adds the routing control
  function createRoute(startLatLng, endLatLng) {
    // Pre-conditions checked in updateMapState (map exists, latlngs exist)
    if (!OSRM_SERVICE_URL) {
      routingError.value = 'Routing service URL is not configured.'
      isRouting.value = false // Ensure state is updated
      return
    }
    // Avoid creating a new route if one exists or is currently being calculated
    if (routingControl.value || isRouting.value) {
      // console.log('Composable: Skipping route creation - existing route or currently routing.');
      return // Silently return, as this might be called frequently by watchers
    }

    console.log(`Composable: Creating route from ${startLatLng} to ${endLatLng}`)
    routingError.value = null
    isRouting.value = true
    routeSummary.value = null // Clear previous summary

    // Store a reference to the control being created *before* adding it
    // This helps manage state correctly in async event handlers
    const newControl = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      router: L.Routing.osrmv1({ serviceUrl: OSRM_SERVICE_URL }),
      lineOptions: { styles: [{ color: '#dc3545', opacity: 0.8, weight: 6 }] },
      createMarker: () => null, // Use our own markers
      show: true, // Show the itinerary
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true, // Zoom/pan to fit the route
      draggableWaypoints: false,
    })
      .on('routesfound', (e) => {
        // Check if this event belongs to the *current* control instance
        if (routingControl.value === newControl) {
          console.log('Composable: Route found.')
          const routes = e.routes
          if (routes.length > 0) {
            routeSummary.value = formatRouteSummary(routes[0].summary) // <-- Set summary
          }
          isRouting.value = false
        }
      })
      .on('routingerror', (e) => {
        // Check if this event belongs to the *current* control instance
        if (routingControl.value === newControl) {
          console.error('Composable: Routing error:', e.error)
          routingError.value = e.error?.message || 'Could not calculate route.'
          isRouting.value = false
          removeRouteControl() // Clean up the failed control
        }
      })

    // Add to map *after* event listeners are attached
    newControl.addTo(mapObject.value)
    // Store the reference *after* adding to map and attaching listeners
    routingControl.value = newControl
  }

  // Update User Marker state
  function updateUserMarkerState(currentLatLng) {
    const created = upsertMarker(
      userMarker,
      currentLatLng,
      { icon: userIcon, popupContent: 'Your Location' },
      mapObject.value,
    )
    // Center map on user only when the marker is first created
    if (created && currentLatLng) {
      mapObject.value.setView(currentLatLng, 14)
    }
  }

  // Update Destination Marker state
  function updateDestinationMarkerState(currentLatLng, currentDestData) {
    const destOptions = currentDestData
      ? {
          icon: facilityIcon,
          popupContent: `<b>${currentDestData.name || 'Destination'}</b><br>${
            currentDestData.address || 'Address not available'
          }`,
          tooltipContent: currentDestData.name || 'Destination',
        }
      : {} // Empty options if no data
    upsertMarker(destinationMarker, currentLatLng, destOptions, mapObject.value)
  }

  // Update Route state based on current LatLngs
  function updateRouteState(uLatLng, dLatLng) {
    if (uLatLng && dLatLng) {
      // Only create if both points exist
      createRoute(uLatLng, dLatLng)
    } else {
      // Remove route if user or destination is missing
      removeRouteControl()
      isRouting.value = false // Ensure routing stops if points disappear
      routingError.value = null // Clear error if points disappear
    }
  }

  // Main function to update the entire map state
  function updateMapState() {
    if (!mapObject.value) return // Map not ready

    const uLatLng = userLatLng.value
    const dLatLng = destinationLatLng.value
    const destData = destinationRef.value // Get full destination data

    updateUserMarkerState(uLatLng)
    updateDestinationMarkerState(dLatLng, destData)
    updateRouteState(uLatLng, dLatLng)
  }

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    if (!mapContainerRef.value) {
      console.error('Composable: Map container ref not available on mount.')
      return
    }

    await configureLeafletIcons() // Ensure icons are ready

    mapObject.value = L.map(mapContainerRef.value, {
      zoomControl: true, // Keep zoom control enabled
    }).setView([54.6872, 25.2797], 12) // Default view (e.g., Vilnius)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapObject.value)

    console.log('Composable: Map initialized.')

    // Use whenReady to ensure the map container is fully sized and ready
    mapObject.value.whenReady(() => {
      console.log('Composable: Map ready, performing initial state update.')
      updateMapState() // Initial marker/route check
    })
  })

  onBeforeUnmount(() => {
    console.log('Composable: Cleaning up map.')
    removeRouteControl() // Ensure route control is removed first
    if (mapObject.value) {
      mapObject.value.remove()
      mapObject.value = null
    }
    // Clean up markers just in case removeLayer failed during map removal
    userMarker.value = null
    destinationMarker.value = null
  })

  // Watch for changes in computed LatLng values to update map
  // No need for deep watch on primitive computed refs or LatLng objects
  watch([userLatLng, destinationLatLng], updateMapState)

  // Watch destinationRef directly for changes in name/address for popup updates
  watch(destinationRef, updateMapState, { deep: true }) // Need deep watch here

  // --- Expose Reactive State ---
  return {
    isRouting, // Boolean: indicates if routing calculation is in progress
    routingError, // String | null: Stores routing error messages
    routeSummary, // String | null: Formatted route distance and time <-- Exposed
    // mapObject, // Generally avoid exposing the raw map object unless necessary
  }
}
