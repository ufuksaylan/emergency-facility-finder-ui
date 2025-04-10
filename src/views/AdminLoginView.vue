<template>
  <el-container direction="vertical" class="login-container">
    <el-header class="login-header">
      <h1>Admin Login</h1>
    </el-header>
    <el-main class="login-main">
      <el-card class="login-card" shadow="hover">
        <el-form :model="loginForm" label-position="top" @submit.prevent="handleLogin">
          <el-form-item label="Email">
            <el-input
              v-model="loginForm.email"
              placeholder="Enter your email address"
              :prefix-icon="UserIcon"
              clearable
            />
          </el-form-item>
          <el-form-item label="Password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Enter your password"
              :prefix-icon="LockIcon"
              show-password
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isLoading" style="width: 100%">
              Login
            </el-button>
          </el-form-item>
          <el-alert
            v-if="loginError"
            :title="loginError"
            type="error"
            show-icon
            :closable="false"
            class="error-alert"
          />
        </el-form>
      </el-card>
    </el-main>
  </el-container>
</template>

<script setup>
// Removed ref (no longer needed for validation)
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import apiClient from '@/api/client'
import {
  ElContainer,
  ElHeader,
  ElMain,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElAlert,
} from 'element-plus'
import { User as UserIcon, Lock as LockIcon } from '@element-plus/icons-vue'

const router = useRouter()
const isLoading = ref(false)
const loginError = ref(null)

const loginForm = reactive({
  email: '',
  password: '',
})

const handleLogin = async () => {
  isLoading.value = true
  loginError.value = null

  try {
    const response = await apiClient.post('/admin/login', {
      email: loginForm.email,
      password: loginForm.password,
    })

    const token = response.data?.token
    const user = response.data?.user
    const expiry = response.data?.exp

    if (token) {
      console.log('Login successful, token received:', token)
      console.log('User info:', user)
      console.log('Token expiry timestamp:', expiry)

      localStorage.setItem('adminAuthToken', token)
      if (user) {
        localStorage.setItem('adminUser', JSON.stringify(user))
      }
      router.push({ name: 'adminDashboard' })
    } else {
      loginError.value = 'Login successful, but no authentication token received.'
      console.error('API response missing token:', response.data)

      localStorage.removeItem('adminAuthToken')
      localStorage.removeItem('adminUser')
    }
  } catch (error) {
    console.error('Login failed:', error.response || error.message || error)
    if (error.response?.data?.message) {
      loginError.value = error.response.data.message
    } else if (error.response?.status === 401) {
      loginError.value = 'Invalid email or password.'
    } else if (error.response?.status === 400) {
      loginError.value = 'Invalid request. Please check your input.'
    } else {
      loginError.value = 'An error occurred during login. Please try again.'
    }
    localStorage.removeItem('adminAuthToken')
    localStorage.removeItem('adminUser')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: #f4f4f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-header {
  background-color: #409eff;
  color: white;
  text-align: center;
  padding: 15px 0;
  width: 100%;
  position: absolute;
  top: 0;
}

.login-main {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding-top: 80px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.el-form-item {
  margin-bottom: 20px;
}

.error-alert {
  margin-top: 15px;
}
</style>
