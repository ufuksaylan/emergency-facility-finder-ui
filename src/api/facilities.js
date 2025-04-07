// src/api/facilities.js
import apiClient from './client'
import { useLocationStore } from '@/stores/location'

/**
 * Searches for facilities based on location and various criteria.
 * Rejects if location is not available in the store.
 *
 * @param {object} filters - Filter criteria (e.g., facility_type, has_emergency, specialization, query (for name search)).
 * @returns {Promise} Axios promise resolving with facilities.
 */
export const findFacilities = (filters = {}) => {
  const locationStore = useLocationStore()

  if (locationStore.latitude === null || locationStore.longitude === null) {
    console.error('API: Location data missing in store. Aborting findFacilities call.')
    // Consider asking the user to enable location instead of rejecting silently
    return Promise.reject(
      new Error('Location data is not available. Please enable location services.'),
    )
  }

  // Prepare parameters, always using store's location
  const paramsToSend = {
    // Include any filters passed by the caller
    ...filters,
    // Always include location for proximity sorting/filtering on the backend
    latitude: locationStore.latitude,
    longitude: locationStore.longitude,
    // Add a parameter for the backend to maybe filter by currently open (requires backend logic)
    // only_open_now: filters.only_open_now || false, // Example
  }

  console.log('API: Sending facility search params:', paramsToSend)
  // Ensure your backend API at GET /facilities can handle these parameters
  return apiClient.get('/facilities', { params: paramsToSend })
}

// getFacilityDetails remains the same
export const getFacilityDetails = (facilityId) => {
  return apiClient.get(`/facilities/${facilityId}`)
}
