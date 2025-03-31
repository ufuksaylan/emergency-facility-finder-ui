import apiClient from './client'
import { useLocationStore } from '@/stores/location'

/**
 * Searches for facilities, requiring latitude/longitude from the location store.
 * Automatically injects store's lat/lon, overriding any passed in filters.
 * Rejects if location is not available in the store.
 *
 * @param {object} filters - Filter criteria (e.g., facility_type, city, etc.).
 * @returns {Promise} Axios promise resolving with facilities, or rejecting if location is missing.
 */
export const findFacilities = (filters = {}) => {
  const locationStore = useLocationStore()

  // Reject immediately if location is not available
  if (locationStore.latitude === null || locationStore.longitude === null) {
    console.error('API: Location data missing in store. Aborting findFacilities call.')
    return Promise.reject(new Error('Location data is not available in the store.'))
  }

  // Prepare parameters, always using store's location
  const paramsToSend = {
    ...filters, // Include other filters passed by the caller
    latitude: locationStore.latitude,
    longitude: locationStore.longitude,
  }

  console.log('API: Sending facility search params:', paramsToSend)
  return apiClient.get('/facilities', { params: paramsToSend })
}

/**
 * Gets details for a specific facility by ID.
 * Assumes a backend endpoint like GET /facilities/{id}.
 *
 * @param {string|number} facilityId - The ID of the facility.
 * @returns {Promise} Axios promise for the API request.
 */
export const getFacilityDetails = (facilityId) => {
  return apiClient.get(`/facilities/${facilityId}`)
}
