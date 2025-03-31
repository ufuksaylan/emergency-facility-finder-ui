<template>
  <div class="home">
    <h1>Emergency Facility Finder</h1>
    <p>Checking location... (Check console for details)</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useLocationStore } from '@/stores/location' // Import the store

// Get an instance of the location store
const locationStore = useLocationStore()

// When the component mounts, call the action in the store
onMounted(() => {
  locationStore.fetchLocation()
})

// No local state or methods needed for location handling in this component anymore
</script>

<style scoped>
/* Keep or remove styles as needed - styles related to location display/button are gone */
.home {
  padding: 20px;
}
</style>
