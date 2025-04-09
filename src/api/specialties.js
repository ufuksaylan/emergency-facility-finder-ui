// src/api/facilities.js
import apiClient from './client'

// /**
//  * Searches for specialties.
export const findSpecialties = () => {
  return apiClient.get('/specialties')
}
