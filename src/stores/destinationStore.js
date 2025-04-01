// src/stores/destinationStore.js
import { ref, computed } from 'vue' // Import computed
import { defineStore } from 'pinia'

export const useDestinationStore = defineStore('destination', () => {
  // --- State ---
  // Raw facility data as selected/fetched
  const _selectedFacilityData = ref(null)

  // Routing/Map related state
  const isRouting = ref(false)
  const routingError = ref(null)
  const routeSummary = ref(null)

  // --- Getters (Computed Properties) ---
  // Provides the formatted destination object needed by the map composable/component
  const selectedFacility = computed(() => {
    const facility = _selectedFacilityData.value
    if (!facility) return null

    // Ensure it has coordinates before returning
    if (facility.location?.latitude == null || facility.location?.longitude == null) {
      console.warn('DestinationStore: Selected facility in store lacks coordinates.', facility)
      // Return null or a partial object? Returning null is safer for map.
      return null
    }

    return {
      id: facility.id,
      name: facility.name || 'Selected Destination',
      address:
        [facility.street, facility.house_number, facility.city].filter(Boolean).join(' ').trim() ||
        'Address not available',
      latitude: facility.location.latitude,
      longitude: facility.location.longitude,
    }
  })

  // --- Actions ---

  /**
   * Sets the destination facility. Expects the raw facility object from API/Search.
   * @param {object | null} facility - The raw facility data object or null.
   */
  function setDestination(facility) {
    // Store the raw data
    _selectedFacilityData.value = facility

    if (facility) {
      console.log('DestinationStore: Raw destination data set', _selectedFacilityData.value)
      // Coordinates check happens in the `selectedFacility` computed getter
    } else {
      console.log('DestinationStore: Destination cleared')
    }

    // Reset routing state whenever the destination fundamentally changes
    isRouting.value = false
    routingError.value = null
    routeSummary.value = null
  }

  // Alias for clarity
  function clearDestination() {
    setDestination(null)
  }

  /**
   * Updates the routing state.
   * @param {object} options
   * @param {boolean} [options.routing] - Is routing in progress?
   * @param {string | null} [options.error] - Routing error message.
   * @param {string | null} [options.summary] - Route summary text.
   */
  function setRoutingState({ routing, error, summary }) {
    // Only update if the value is provided
    if (routing !== undefined) isRouting.value = routing
    if (error !== undefined) routingError.value = error
    if (summary !== undefined) routeSummary.value = summary
    console.log('DestinationStore: Routing state updated', {
      routing: isRouting.value,
      error: routingError.value,
      summary: routeSummary.value,
    })
  }

  return {
    // State (Expose computed/raw as needed)
    selectedFacility, // The formatted object for map/UI
    _selectedFacilityData, // Expose raw data if needed elsewhere
    isRouting,
    routingError,
    routeSummary,

    // Actions
    setDestination,
    clearDestination,
    setRoutingState,
  }
})
