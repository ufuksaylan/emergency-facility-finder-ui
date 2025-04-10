import apiClient from './client'

/**
 * Submits a new complaint for a specific facility.
 * @param {number|string} facilityId - The ID of the facility.
 * @param {string} description - The description of the complaint.
 * @returns {Promise<object>} - The response data from the API (the created complaint).
 */
export function submitComplaint(facilityId, description) {
  if (!facilityId || !description) {
    return Promise.reject(new Error('Facility ID and description are required.'))
  }

  const payload = {
    complaint: {
      description: description,
    },
  }

  // Use the existing apiClient. The backend /facilities/:id/complaints endpoint
  // should ignore any Authorization header if present.
  return apiClient.post(`/facilities/${facilityId}/complaints`, payload)
}
