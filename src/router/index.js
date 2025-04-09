// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// --- View Imports ---
// Public Views
import LandingView from '../views/LandingView.vue'
import SearchView from '../views/SearchView.vue'
import EmergencyView from '../views/EmergencyView.vue'
import MapView from '@/views/MapView.vue'

// Admin Views
import AdminLoginView from '../views/AdminLoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue' // Make sure this component exists
import AdminFacilitiesListView from '../views/admin/AdminFacilitiesListView.vue'
import AdminFacilityFormView from '../views/admin/AdminFacilityFormView.vue'
import AdminComplaintDetailView from '@/views/AdminComplaintDetailView.vue'
import AdminComplaintsListView from '@/views/AdminComplaintsListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Public Routes ---
    {
      path: '/',
      name: 'landing',
      component: LandingView, // Component for the root path
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView, // Component for the search page
    },
    {
      path: '/map',
      name: 'MapView', // Name for navigation
      component: MapView, // The new component that hosts MapComponent
    },
    {
      path: '/emergency',
      name: 'emergency',
      component: EmergencyView, // Component for the emergency page
    },

    // --- Admin Routes ---
    {
      path: '/admin/login',
      name: 'adminLogin',
      component: AdminLoginView,
      // Optional: Add meta field if you want to redirect logged-in users away from login
      // meta: { requiresGuest: true } // Needs matching logic in beforeEach guard
    },
    {
      // Parent route for all protected admin sections
      path: '/admin',
      // component: AdminLayout, // Optional: If you have a shared layout component for admin pages
      meta: { requiresAuth: true }, // Apply auth guard to all child routes
      redirect: { name: 'adminDashboard' }, // Optional: redirect '/admin' to '/admin/dashboard'
      children: [
        {
          path: 'dashboard', // Resolves to /admin/dashboard
          name: 'adminDashboard',
          component: AdminDashboardView,
          // meta: { requiresAuth: true } // Inherits from parent
        },
        {
          path: 'facilities', // Resolves to /admin/facilities
          name: 'adminFacilitiesList',
          component: AdminFacilitiesListView,
          // meta: { requiresAuth: true } // Inherits from parent
        },
        {
          path: 'facilities/new', // Resolves to /admin/facilities/new
          name: 'adminFacilityCreate',
          component: AdminFacilityFormView, // Uses the form hosting view
          // meta: { requiresAuth: true } // Inherits from parent
        },
        {
          path: 'facilities/:osm_id/edit', // Resolves to /admin/facilities/123/edit
          name: 'adminFacilityEdit',
          component: AdminFacilityFormView, // Uses the form hosting view
          props: true, // Allows component to receive :osm_id as prop (though useRoute is also used)
          // meta: { requiresAuth: true } // Inherits from parent
        },
        {
          path: 'complaints', // Resolves to /admin/complaints
          name: 'adminComplaintsList',
          component: AdminComplaintsListView,
        },
        {
          path: 'complaints/:id', // Resolves to /admin/complaints/123
          name: 'adminComplaintDetail',
          component: AdminComplaintDetailView,
          props: true, // Pass route param 'id' as a prop
        },
        // Add other admin child routes here (e.g., specialties management)
      ],
    },

    // Optional: Catch-all 404 route (place last)
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('../views/NotFoundView.vue') // Example: Create a NotFoundView component
    // }
  ],
})

// --- Navigation Guard for Admin Routes ---
router.beforeEach((to, from, next) => {
  const isAdminLoggedIn = !!localStorage.getItem('adminAuthToken') // Check if admin token exists

  // Check if the route requires authentication
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  // Optional: Check if the route is only for guests (like login page)
  // const requiresGuest = to.matched.some(record => record.meta.requiresGuest);

  if (requiresAuth && !isAdminLoggedIn) {
    // If route requires auth and user is not logged in, redirect to login
    console.log(
      `Navigation blocked: ${to.fullPath} requires auth, user not logged in. Redirecting to login.`,
    )
    next({ name: 'adminLogin', query: { redirect: to.fullPath } }) // Pass intended destination
  } else {
    /* // Optional: Redirect logged-in users away from guest pages
  else if (requiresGuest && isAdminLoggedIn) {
     // If route is for guests (login) and user IS logged in, redirect to dashboard
     console.log(`Navigation blocked: ${to.path} is for guests, user is logged in. Redirecting to dashboard.`);
     next({ name: 'adminDashboard' });
  } */
    // Otherwise, allow navigation
    next()
  }
})

export default router
