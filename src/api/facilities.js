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
    return Promise.reject(
      new Error('Location data is not available. Please enable location services.'),
    )
  }

  const paramsToSend = {
    ...filters,
    latitude: locationStore.latitude,
    longitude: locationStore.longitude,
  }

  console.log('API: Sending facility search params:', paramsToSend)
  return apiClient.get('/facilities', { params: paramsToSend })
}

export const getFacilityDetails = (facilityId) => {
  return apiClient.get(`/facilities/${facilityId}`)
}
