<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style scoped>
/*
  Styles removed.
  The layout is now primarily handled by individual view components (like HomeView.vue using Element Plus)
  and global styles (src/assets/main.css, Element Plus CSS).
  Add styles here only if they need to apply universally to the RouterView container itself across ALL views.
*/

/* Example: If you needed the container App.vue provides to have a specific background */
/*
:global(body) {
  margin: 0; // Often set in main.css or base.css already
}

:host { // Style the App.vue component itself
  display: block; // Ensure it behaves like a block element
  min-height: 100vh; // Example: make sure App covers full viewport height
}
*/
</style>
