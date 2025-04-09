// src/api/adminApi.js
import apiClient from './client' // Assuming your configured axios instance

// --- Facilities ---

/**
 * Fetches all facilities for the admin list.
 * @returns {Promise} Axios promise resolving with an array of facilities.
 */
export const getAdminFacilities = () => {
  // Assuming the index action includes specialties as shown in the controller
  return apiClient.get('/admin/facilities')
}

/**
 * Fetches a single facility by its OSM ID for editing.
 * @param {string|number} osmId - The OSM ID of the facility.
 * @returns {Promise} Axios promise resolving with the facility data.
 */
export const getAdminFacility = (osmId) => {
  return apiClient.get(`/admin/facilities/${osmId}`)
}

/**
 * Creates a new facility.
 * @param {object} facilityData - The facility data payload (nested under 'facility' key).
 * @returns {Promise} Axios promise resolving with the created facility data.
 */
export const createAdminFacility = (facilityData) => {
  return apiClient.post('/admin/facilities', facilityData) // Payload should already be { facility: { ... } }
}

/**
 * Updates an existing facility.
 * @param {string|number} osmId - The OSM ID of the facility to update.
 * @param {object} facilityData - The facility data payload (nested under 'facility' key).
 * @returns {Promise} Axios promise resolving with the updated facility data.
 */
export const updateAdminFacility = (osmId, facilityData) => {
  return apiClient.put(`/admin/facilities/${osmId}`, facilityData) // Payload should already be { facility: { ... } }
}

/**
 * Deletes a facility by its OSM ID.
 * @param {string|number} osmId - The OSM ID of the facility to delete.
 * @returns {Promise} Axios promise resolving with no content on success.
 */
export const deleteAdminFacility = (osmId) => {
  return apiClient.delete(`/admin/facilities/${osmId}`)
}

// --- Specialties ---

/**
 * Fetches all available specialties for selection.
 * @returns {Promise} Axios promise resolving with an array of specialties.
 */
export const getAdminSpecialties = () => {
  // NOTE: Your controller code had a small typo (@facilities = Specialty...).
  // Assuming the backend correctly returns specialties from this endpoint.
  return apiClient.get('/admin/specialties')
}

// --- Complaints (NEW) ---

/**
 * Fetches all complaints for the admin list.
 * @returns {Promise} Axios promise resolving with an array of complaints.
 */
export const getAdminComplaints = () => {
  return apiClient.get('/admin/complaints')
}

/**
 * Fetches a single complaint by its ID.
 * @param {string|number} id - The ID of the complaint.
 * @returns {Promise} Axios promise resolving with the complaint data.
 */
export const getAdminComplaint = (id) => {
  return apiClient.get(`/admin/complaints/${id}`)
}

/**
 * Updates an existing complaint (status and resolution notes).
 * @param {string|number} id - The ID of the complaint to update.
 * @param {object} complaintData - The update data { status, resolution_notes }.
 * @returns {Promise} Axios promise resolving with the updated complaint data.
 */
export const updateAdminComplaint = (id, complaintData) => {
  // Backend expects { complaint: { status: '...', resolution_notes: '...' } }
  return apiClient.patch(`/admin/complaints/${id}`, { complaint: complaintData })
}

/**
 * Deletes a complaint by its ID.
 * @param {string|number} id - The ID of the complaint to delete.
 * @returns {Promise} Axios promise resolving with no content on success.
 */
export const deleteAdminComplaint = (id) => {
  return apiClient.delete(`/admin/complaints/${id}`)
}
