import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '../views/LandingView.vue'
import SearchView from '../views/SearchView.vue'
import EmergencyView from '../views/EmergencyView.vue'
import MapView from '@/views/MapView.vue'

import AdminLoginView from '../views/AdminLoginView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminFacilitiesListView from '../views/admin/AdminFacilitiesListView.vue'
import AdminFacilityFormView from '../views/admin/AdminFacilityFormView.vue'
import AdminComplaintDetailView from '@/views/AdminComplaintDetailView.vue'
import AdminComplaintsListView from '@/views/AdminComplaintsListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/map',
      name: 'MapView',
      component: MapView,
    },
    {
      path: '/emergency',
      name: 'emergency',
      component: EmergencyView,
    },

    {
      path: '/admin/login',
      name: 'adminLogin',
      component: AdminLoginView,
    },
    {
      path: '/admin',
      meta: { requiresAuth: true },
      redirect: { name: 'adminDashboard' },
      children: [
        {
          path: 'dashboard',
          name: 'adminDashboard',
          component: AdminDashboardView,
        },
        {
          path: 'facilities',
          name: 'adminFacilitiesList',
          component: AdminFacilitiesListView,
        },
        {
          path: 'facilities/new',
          name: 'adminFacilityCreate',
          component: AdminFacilityFormView,
        },
        {
          path: 'facilities/:osm_id/edit',
          name: 'adminFacilityEdit',
          component: AdminFacilityFormView,
          props: true,
        },
        {
          path: 'complaints',
          name: 'adminComplaintsList',
          component: AdminComplaintsListView,
        },
        {
          path: 'complaints/:id',
          name: 'adminComplaintDetail',
          component: AdminComplaintDetailView,
          props: true,
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isAdminLoggedIn = !!localStorage.getItem('adminAuthToken')

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !isAdminLoggedIn) {
    console.log(
      `Navigation blocked: ${to.fullPath} requires auth, user not logged in. Redirecting to login.`,
    )
    next({ name: 'adminLogin', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
