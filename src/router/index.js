// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import EmergencyView from '../views/EmergencyView.vue' // <-- New View
import SearchView from '../views/SearchView.vue' // <-- New View (was HomeView conceptually)

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/emergency', // Route for the emergency flow
      name: 'emergency',
      component: EmergencyView,
    },
    {
      path: '/search', // Route for the detailed search flow
      name: 'search',
      component: SearchView,
    },
    // Remove the old '/find' route if it existed
  ],
})

export default router
