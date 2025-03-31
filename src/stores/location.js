import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useLocationStore = defineStore('location', () => {
  const latitude = ref(null)
  const longitude = ref(null)
  const accuracy = ref(null)
  const error = ref(null)
  const isLoading = ref(false)

  function fetchLocation() {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by this browser.'
      console.error(error.value) // Log error
      return
    }

    if (isLoading.value) {
      console.log('Location request already in progress.')
      return
    }

    console.log('Requesting user location...') // Log initiation
    isLoading.value = true
    error.value = null // Clear previous errors

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude.value = position.coords.latitude
        longitude.value = position.coords.longitude
        accuracy.value = position.coords.accuracy
        isLoading.value = false

        console.log('Location obtained successfully:', {
          latitude: latitude.value,
          longitude: longitude.value,
          accuracy: accuracy.value,
        })
      },
      (err) => {
        isLoading.value = false
        switch (err.code) {
          case err.PERMISSION_DENIED:
            error.value = 'User denied the request for Geolocation.'
            break
          case err.POSITION_UNAVAILABLE:
            error.value = 'Location information is unavailable.'
            break
          case err.TIMEOUT:
            error.value = 'The request to get user location timed out.'
            break
          default: // Handles UNKNOWN_ERROR and any others
            error.value = 'An unknown error occurred while fetching location.'
            break
        }
        console.error(`Error getting location: ${error.value} (Code: ${err.code})`)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const hasLocation = () => latitude.value !== null && longitude.value !== null

  return {
    latitude,
    longitude,
    accuracy,
    error,
    isLoading,
    fetchLocation,
    hasLocation,
  }
})
