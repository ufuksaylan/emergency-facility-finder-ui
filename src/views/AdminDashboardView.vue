<template>
  <div class="admin-dashboard">
    <el-row :gutter="20" align="middle" class="dashboard-header">
      <el-col :span="18">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {{ adminIdentifier || 'Admin' }}!</p>
      </el-col>
      <el-col :span="6" style="text-align: right">
        <el-dropdown @command="handleCommand">
          <span class="el-dropdown-link">
            <el-avatar :icon="UserFilledIcon" size="small" />
            {{ adminIdentifier || 'Admin' }}
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout" divided :icon="SwitchButtonIcon">
                Logout
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-col>
    </el-row>

    <el-divider />

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><OfficeBuilding /></el-icon> Manage Facilities</span
              >
            </div>
          </template>
          <p>View, add, edit, or remove healthcare facilities.</p>
          <el-button type="primary" plain @click="goToFacilities" :icon="ListIcon">
            Go to Facilities
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="dashboard-card">
          <template #header>
            <div class="card-header">
              <span
                ><el-icon><Comment /></el-icon> Manage Complaints</span
              >
            </div>
          </template>
          <p>Review and manage user-submitted complaints or feedback.</p>
          <el-button type="primary" plain @click="goToComplaints" :icon="TicketsIcon">
            Go to Complaints
          </el-button>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElRow,
  ElCol,
  ElCard,
  ElButton,
  ElDivider,
  ElIcon,
  ElAvatar,
  ElDropdown,
  ElDropdownMenu,
  ElDropdownItem,
} from 'element-plus'
import {
  UserFilled as UserFilledIcon,
  OfficeBuilding,
  Comment,
  List as ListIcon,
  Tickets as TicketsIcon,
  SwitchButton as SwitchButtonIcon,
  ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const userInfo = ref(null)

onMounted(() => {
  const storedUser = localStorage.getItem('adminUser')
  if (storedUser) {
    try {
      userInfo.value = JSON.parse(storedUser)
      console.log('Loaded user info:', userInfo.value)
    } catch (e) {
      console.error('Error parsing stored user info', e)
      userInfo.value = null
    }
  }
})

const adminIdentifier = computed(() => {
  if (!userInfo.value) return null
  return userInfo.value.username || userInfo.value.email || userInfo.value.name || null
})

const logout = () => {
  console.log('Logging out admin...')
  localStorage.removeItem('adminAuthToken')
  localStorage.removeItem('adminUser')
  router.push({ name: 'adminLogin' })
}

const goToFacilities = () => {
  router.push({ name: 'adminFacilitiesList' })
}

const goToComplaints = () => {
  router.push({ name: 'adminComplaintsList' })
}

const handleCommand = (command) => {
  if (command === 'logout') {
    logout()
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 25px;
}

.dashboard-header {
  margin-bottom: 15px;
}

.dashboard-header h1 {
  margin: 0 0 5px 0;
  font-size: 1.8em;
  color: #303133;
}

.dashboard-header p {
  color: #606266;
  margin: 0;
}

.dashboard-card {
  margin-bottom: 20px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dashboard-card .el-card__header {
  padding: 10px 15px;
  background-color: #f8f9fa;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: bold;
  color: #409eff;
}

.card-header .el-icon {
  margin-right: 8px;
  font-size: 1.2em;
}

.dashboard-card p {
  font-size: 0.95em;
  color: #606266;
  margin-bottom: 15px;
}

.dashboard-card .el-button {
  margin-top: auto;
}

.el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
  outline: none;
}
.el-dropdown-link .el-avatar {
  margin-right: 8px;
}
.el-icon--right {
  margin-left: 5px;
}

@media (max-width: 767px) {
  .el-col-xs-24 {
    width: 100%;
  }
}

pre {
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.85em;
  color: #333;
}
</style>
