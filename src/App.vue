<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue' // Make sure path is correct
// Import necessary Element Plus layout components
import { ElContainer, ElMain } from 'element-plus'
</script>

<template>
  <el-container direction="vertical" class="app-layout-container">
    <AppHeader />

    <el-main class="app-main-content">
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.app-layout-container {
  min-height: 100vh; /* Ensure the container takes at least full viewport height */
  display: flex;
  flex-direction: column;
  background-color: #ffffff; /* Base background for the app */
}

.app-main-content {
  flex-grow: 1; /* Crucial: Makes the main area expand, pushing the footer down */
  padding: 0; /* Remove default padding. Views should manage their own padding/layout */
  display: flex; /* Allows the view's root element to potentially grow/flex */
  flex-direction: column; /* Stack content within main vertically by default */
  overflow-x: hidden; /* Prevent horizontal scrollbars caused by view content */
  position: relative; /* Needed if views use absolute positioning (like alerts) */
}

/* Global styles affecting body, etc., should be in src/assets/main.css or similar. */
/* AppFooter component has its own scoped styles (including margin-top: auto). */
</style>
