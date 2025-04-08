// src/views/AdminDashboardView.vue
<template>
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome, Admin!</p>
    <p>Stored User Info:</p>
    <pre>{{ userInfo }}</pre>

    <el-button type="warning" @click="logout">Logout</el-button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'

const router = useRouter()
const userInfo = ref(null)

onMounted(() => {
  // Retrieve user info stored during login
  const storedUser = localStorage.getItem('adminUser')
  if (storedUser) {
    try {
      userInfo.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Error parsing stored user info', e)
    }
  }
})

const logout = () => {
  console.log('Logging out admin...')
  localStorage.removeItem('adminAuthToken')
  localStorage.removeItem('adminUser')
  // localStorage.removeItem('adminTokenExp'); // If you stored expiry
  router.push({ name: 'adminLogin' }) // Redirect back to login
}
</script>

<style scoped>
div {
  padding: 20px;
}
pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
}
</style>
