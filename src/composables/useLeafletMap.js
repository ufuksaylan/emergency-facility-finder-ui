import { shallowRef, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css'
import 'leaflet-routing-machine'

import { useLocationStore } from '@/stores/location'
import { useMapSettingsStore } from '@/stores/mapSettings'
import { useDestinationStore } from '@/stores/destinationStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const OSRM_SERVICE_URL = API_BASE_URL ? `${API_BASE_URL}/route/v1` : null

if (!OSRM_SERVICE_URL) {
  console.error('Composable Error: VITE_OSRM_SERVICE_URL is not defined. Routing will fail.')
} else {
  console.log('Composable: Using OSRM Service URL:', OSRM_SERVICE_URL)
}

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

const userIcon = L.icon({
  iconUrl: `data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' class='marker'%3E%3Cpath fill-opacity='.25' d='M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z'/%3E%3Cpath fill='%23007bff' stroke='%23fff' stroke-width='1' d='M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18 15.938 32 15.938 32zM16 6a4 4 0 110 8 4 4 0 010-8z'/%3E%3C/svg%3E`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})
const facilityIcon = L.icon(L.Icon.Default.prototype.options)

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
 * @param {string} mode - The current travel mode ('driving' or 'foot').
 * @returns {string | null} - Formatted string or null.
 */
function formatRouteSummary(summary, mode) {
  if (!summary) return null
  const distanceKm = (summary.totalDistance / 1000).toFixed(1)
  const timeMinutes = Math.round(summary.totalTime / 60)
  const modeText = mode === 'driving' ? 'drive' : 'walk'
  return `${distanceKm} km, approx. ${timeMinutes} min ${modeText}`
}

// --- Composable ---
// Now takes destinationRef (the computed ref from destinationStore)
export function useLeafletMap(mapContainerRef, destinationRef) {
  // --- Internal State ---
  const mapObject = shallowRef(null)
  const routingControl = shallowRef(null)
  const userMarker = shallowRef(null)
  const destinationMarker = shallowRef(null)
  // REMOVED: Local isRouting, routingError, routeSummary refs

  // --- Access Stores ---
  const locationStore = useLocationStore()
  const mapSettingsStore = useMapSettingsStore()
  const destinationStore = useDestinationStore() // <-- Instantiate Destination Store

  // --- Computed LatLng Refs ---
  const userLatLng = computed(() =>
    locationStore.latitude != null && locationStore.longitude != null
      ? L.latLng(locationStore.latitude, locationStore.longitude)
      : null,
  )

  // Use the destinationRef passed in (which should come from destinationStore.selectedFacility)
  const destinationLatLng = computed(() => {
    const dest = destinationRef.value // Already the computed { lat, lng, ... } object
    return dest?.latitude != null && dest?.longitude != null
      ? L.latLng(dest.latitude, dest.longitude)
      : null
  })

  function removeRouteControl() {
    if (routingControl.value) {
      if (mapObject.value) {
        try {
          const control = routingControl.value
          if (control._container && control._container.parentNode) {
            console.log('Composable: Removing routing control.')
            mapObject.value.removeControl(control)
          } else {
            console.log('Composable: Control already detached, just cleaning up reference.')
          }
        } catch (error) {
          console.error('Composable: Error removing routing control:', error)
        }
      }
      routingControl.value = null
      // Update store: clear routing state
      destinationStore.setRoutingState({ routing: false, error: null, summary: null })
    }
  }

  function createRoute(startLatLng, endLatLng) {
    if (!OSRM_SERVICE_URL) {
      destinationStore.setRoutingState({
        routing: false,
        error: 'Routing service URL is not configured.',
      })
      return
    }
    if (!mapObject.value || !mapObject.value._loaded) {
      console.log('Composable: Map not ready yet, deferring route creation')
      setTimeout(() => {
        if (
          mapObject.value &&
          mapObject.value._loaded &&
          userLatLng.value &&
          destinationLatLng.value
        ) {
          createRoute(userLatLng.value, destinationLatLng.value)
        }
      }, 200)
      return
    }

    removeRouteControl()

    const currentMode = mapSettingsStore.selectedTravelMode
    console.log(
      `Composable: Creating route from ${startLatLng} to ${endLatLng} using mode: ${currentMode}`,
    )
    destinationStore.setRoutingState({ routing: true, error: null, summary: null })

    const osrmOptions = {
      serviceUrl: OSRM_SERVICE_URL,
      profile: currentMode === 'driving' ? 'driving' : 'foot',
    }
    console.log('Composable: OSRM options:', osrmOptions)

    try {
      const newControl = L.Routing.control({
        waypoints: [startLatLng, endLatLng],
        router: L.Routing.osrmv1(osrmOptions),
        lineOptions: { styles: [{ color: '#dc3545', opacity: 0.8, weight: 6 }] },
        createMarker: () => null,
        show: true,
        addWaypoints: false,
        routeWhileDragging: false,
        fitSelectedRoutes: true,
        draggableWaypoints: false,
      })
        .on('routesfound', (e) => {
          if (routingControl.value === newControl) {
            console.log('Composable: Route found.')
            const routes = e.routes
            let summaryText = null
            if (routes.length > 0) {
              summaryText = formatRouteSummary(routes[0].summary, currentMode)
            }
            destinationStore.setRoutingState({ routing: false, summary: summaryText })
          }
        })
        .on('routingerror', (e) => {
          if (routingControl.value === newControl) {
            console.error('Composable: Routing error:', e.error)
            const errorMsg =
              `Could not calculate ${currentMode} route. ${e.error?.message || ''}`.trim()
            destinationStore.setRoutingState({ routing: false, error: errorMsg })
          }
        })

      routingControl.value = newControl

      if (mapObject.value && mapObject.value._loaded) {
        newControl.addTo(mapObject.value)
      } else {
        console.error('Composable: Map not available when adding control')
        routingControl.value = null
        destinationStore.setRoutingState({
          routing: false,
          error: 'Map unavailable during route setup.',
        })
      }
    } catch (error) {
      console.error('Composable: Error creating routing control:', error)
      const errorMsg = 'Failed to create route: ' + (error.message || '')
      destinationStore.setRoutingState({ routing: false, error: errorMsg })
      routingControl.value = null
    }
  }

  function updateUserMarkerState(currentLatLng) {
    const created = upsertMarker(
      userMarker,
      currentLatLng,
      { icon: userIcon, popupContent: 'Your Location' },
      mapObject.value,
    )
    if (created && currentLatLng) {
      if (!routingControl.value || !routingControl.value.getWaypoints().some((wp) => wp.latLng)) {
        mapObject.value.setView(currentLatLng, 14)
      }
    }
  }

  function updateDestinationMarkerState(currentLatLng, currentDestData) {
    const destOptions = currentDestData
      ? {
          icon: facilityIcon,
          popupContent: `<b>${currentDestData.name || 'Destination'}</b><br>${currentDestData.address || 'Address not available'}`,
          tooltipContent: currentDestData.name || 'Destination',
        }
      : {}
    upsertMarker(destinationMarker, currentLatLng, destOptions, mapObject.value)
  }

  function updateRouteState(uLatLng, dLatLng) {
    if (window._routeUpdateTimeout) {
      clearTimeout(window._routeUpdateTimeout)
    }

    window._routeUpdateTimeout = setTimeout(() => {
      if (uLatLng && dLatLng) {
        if (destinationRef.value) {
          createRoute(uLatLng, dLatLng)
        } else {
          console.log('Composable: Destination data missing, removing route.')
          removeRouteControl()
        }
      } else {
        removeRouteControl()
      }
    }, 150)
  }

  function updateMapState() {
    if (!mapObject.value) return

    const uLatLng = userLatLng.value
    const dLatLng = destinationLatLng.value
    const destData = destinationRef.value

    updateUserMarkerState(uLatLng)
    updateDestinationMarkerState(dLatLng, destData)
    updateRouteState(uLatLng, dLatLng)
  }

  onMounted(async () => {
    if (!mapContainerRef.value) {
      console.error('Composable: Map container ref not available on mount.')
      return
    }
    await configureLeafletIcons()

    try {
      mapObject.value = L.map(mapContainerRef.value, {
        zoomControl: true,
      }).setView([54.6872, 25.2797], 12)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapObject.value)

      console.log('Composable: Map initialized.')

      mapObject.value.whenReady(() => {
        console.log('Composable: Map ready, performing initial state update.')
        updateMapState()
      })
    } catch (error) {
      console.error('Composable: Error initializing map:', error)
      destinationStore.setRoutingState({ error: 'Map initialization failed.' })
    }
  })

  onBeforeUnmount(() => {
    console.log('Composable: Cleaning up map.')
    if (window._routeUpdateTimeout) {
      clearTimeout(window._routeUpdateTimeout)
    }
    if (window._modeChangeTimeout) {
      clearTimeout(window._modeChangeTimeout)
    }

    removeRouteControl()

    if (mapObject.value) {
      mapObject.value.remove()
      mapObject.value = null
    }
    userMarker.value = null
    destinationMarker.value = null
  })

  watch([userLatLng, destinationRef], updateMapState, { deep: true })

  watch(
    () => mapSettingsStore.selectedTravelMode,
    (newMode, oldMode) => {
      if (newMode !== oldMode && mapObject.value) {
        console.log('Composable: Travel mode changed in store to:', newMode)
        if (userLatLng.value && destinationRef.value) {
          if (window._modeChangeTimeout) {
            clearTimeout(window._modeChangeTimeout)
          }
          window._modeChangeTimeout = setTimeout(() => {
            if (userLatLng.value && destinationRef.value) {
              updateMapState()
            }
          }, 150)
        }
      }
    },
  )

  return {}
}
