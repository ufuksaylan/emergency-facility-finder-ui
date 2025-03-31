// src/composables/useLeafletMap.js
import { ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'
import { useLocationStore } from '@/stores/location'

// --- Environment Variable ---
// Retrieve the OSRM service URL from environment variables
// Ensure you have VITE_OSRM_SERVICE_URL defined in your .env file
const OSRM_SERVICE_URL = import.meta.env.VITE_OSRM_SERVICE_URL

if (!OSRM_SERVICE_URL) {
  console.error(
    'Composable Error: VITE_OSRM_SERVICE_URL is not defined in your environment variables (.env file). Routing will likely fail.',
  )
  // Optionally, you could provide a default fallback, but it's better
  // to ensure the environment variable is set correctly.
  // OSRM_SERVICE_URL = 'DEFAULT_FALLBACK_URL'; // Example fallback
} else {
  console.log('Composable: Using OSRM Service URL:', OSRM_SERVICE_URL)
}

// Default Leaflet Icon configuration (ensure assets are available)
// We configure this once globally if possible, or within the composable
let iconsConfigured = false
async function configureLeafletIcons() {
  if (iconsConfigured) return
  try {
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: (await import('leaflet/dist/images/marker-icon-2x.png')).default,
      iconUrl: (await import('leaflet/dist/images/marker-icon.png')).default,
      shadowUrl: (await import('leaflet/dist/images/marker-shadow.png')).default,
    })
    iconsConfigured = true
    console.log('Composable: Default Leaflet icons configured.')
  } catch (e) {
    console.error('Composable: Error configuring Leaflet default icons:', e)
  }
}

// Define custom icons (optional)
const userIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' class='marker'%3E%3Cpath fill-opacity='.25' d='M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z'/%3E%3Cpath fill='%23007bff' stroke='%23fff' stroke-width='1' d='M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18 15.938 32 15.938 32zM16 6a4 4 0 110 8 4 4 0 010-8z'/%3E%3C/svg%3E`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})
const facilityIcon = L.icon(L.Icon.Default.prototype.options) // Uses default options

export function useLeafletMap(mapContainerRef, destinationRef) {
  // --- Internal State ---
  const mapObject = shallowRef(null)
  const routingControl = shallowRef(null)
  const userMarker = shallowRef(null)
  const destinationMarker = shallowRef(null)
  const isRouting = ref(false)
  const routingError = ref(null)

  // --- Access Location Store ---
  const locationStore = useLocationStore()

  // --- Computed LatLng Refs ---
  const userLatLng = computed(() => {
    if (locationStore.latitude != null && locationStore.longitude != null) {
      return L.latLng(locationStore.latitude, locationStore.longitude)
    }
    return null
  })

  const destinationLatLng = computed(() => {
    const dest = destinationRef.value // Use the ref passed from the component
    if (dest?.latitude != null && dest?.longitude != null) {
      return L.latLng(dest.latitude, dest.longitude)
    }
    return null
  })

  // --- Internal Functions ---

  // Safely removes the current routing control
  function removeRouteControl() {
    if (mapObject.value && routingControl.value) {
      try {
        mapObject.value.removeControl(routingControl.value)
        console.log('Composable: Removed routing control.')
      } catch (error) {
        console.error('Composable: Error removing routing control:', error)
      } finally {
        routingControl.value = null
      }
    } else if (routingControl.value) {
      routingControl.value = null // Clear ref if map doesn't exist
    }
  }

  // Creates and adds the routing control
  function createRoute(startLatLng, endLatLng) {
    if (
      !mapObject.value ||
      !(startLatLng instanceof L.LatLng) ||
      !(endLatLng instanceof L.LatLng) ||
      !OSRM_SERVICE_URL // Check if the URL is available
    ) {
      console.warn(
        'Composable: Skipping route creation - invalid map, LatLng, or missing OSRM_SERVICE_URL.',
      )
      if (!OSRM_SERVICE_URL) {
        routingError.value = 'Routing service URL is not configured.'
      }
      return
    }
    if (isRouting.value) {
      console.warn('Composable: Skipping route creation - already routing.')
      return
    }
    removeRouteControl() // Ensure previous is removed

    console.log(`Composable: Creating route from ${startLatLng} to ${endLatLng}`)
    routingError.value = null
    isRouting.value = true

    const newControl = L.Routing.control({
      waypoints: [startLatLng, endLatLng],
      router: L.Routing.osrmv1({
        // Use the environment variable here
        serviceUrl: OSRM_SERVICE_URL,
      }),
      lineOptions: { styles: [{ color: '#dc3545', opacity: 0.8, weight: 6 }] },
      createMarker: () => null,
      show: true,
      addWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      draggableWaypoints: false,
    })
      .on('routesfound', () => {
        console.log('Composable: Route found.')
        if (routingControl.value === newControl) isRouting.value = false // Check instance before setting state
      })
      .on('routingerror', (e) => {
        console.error('Composable: Routing error:', e.error)
        if (routingControl.value === newControl) {
          // Check instance before setting state
          routingError.value = e.error?.message || 'Could not calculate route.'
          isRouting.value = false
          removeRouteControl() // Attempt to remove the failed control
        }
      })

    newControl.addTo(mapObject.value)
    routingControl.value = newControl // Store reference
  }

  // Updates markers and triggers routing based on current state
  async function updateMapState() {
    if (!mapObject.value) return // Map not ready

    const uLatLng = userLatLng.value
    const dLatLng = destinationLatLng.value
    const destData = destinationRef.value // Get full destination data

    // Update User Marker
    if (uLatLng) {
      if (!userMarker.value) {
        userMarker.value = L.marker(uLatLng, { icon: userIcon })
          .addTo(mapObject.value)
          .bindPopup('Your Location')
        mapObject.value.setView(uLatLng, 14) // Center on user when first found
      } else {
        userMarker.value.setLatLng(uLatLng)
      }
    } else if (userMarker.value) {
      mapObject.value.removeLayer(userMarker.value)
      userMarker.value = null
    }

    // Update Destination Marker
    if (dLatLng && destData) {
      const popupContent = `<b>Destination:</b><br>${destData.name}<br>${destData.address}`
      if (!destinationMarker.value) {
        destinationMarker.value = L.marker(dLatLng, { icon: facilityIcon })
          .addTo(mapObject.value)
          .bindPopup(popupContent)
          .bindTooltip(destData.name)
      } else {
        destinationMarker.value
          .setLatLng(dLatLng)
          .setPopupContent(popupContent)
          .setTooltipContent(destData.name)
      }
    } else if (destinationMarker.value) {
      mapObject.value.removeLayer(destinationMarker.value)
      destinationMarker.value = null
    }

    // Update Route
    if (uLatLng && dLatLng) {
      if (!routingControl.value && !isRouting.value) {
        await nextTick() // Wait a tick before creating
        // Re-validate conditions after tick
        if (
          userLatLng.value === uLatLng &&
          destinationLatLng.value === dLatLng &&
          mapObject.value &&
          !routingControl.value &&
          !isRouting.value
        ) {
          createRoute(uLatLng, dLatLng)
        }
      } // else route exists or is loading
    } else {
      // No user or destination, remove route
      removeRouteControl()
    }
  }

  // --- Lifecycle Hooks ---
  onMounted(async () => {
    if (!mapContainerRef.value) {
      console.error('Composable: Map container ref not available on mount.')
      return
    }
    await configureLeafletIcons() // Ensure icons are ready

    mapObject.value = L.map(mapContainerRef.value, { zoomControl: true }) // Ensure zoom control is added
      .setView([54.6872, 25.2797], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19, // Standard max zoom
    }).addTo(mapObject.value)

    console.log('Composable: Map initialized.')
    updateMapState() // Initial marker/route check
  })

  onBeforeUnmount(() => {
    console.log('Composable: Cleaning up map.')
    removeRouteControl()
    if (mapObject.value) {
      mapObject.value.remove()
      mapObject.value = null
    }
  })

  // Watch for changes in computed LatLng values to update map
  watch([userLatLng, destinationLatLng], updateMapState, { deep: false }) // No need for deep watch on LatLng objects

  // --- Expose Reactive State ---
  // Return only what the component needs to display status
  return {
    isRouting,
    routingError,
  }
}
