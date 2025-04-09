<template>
  <div class="admin-list-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <h1>Manage Complaints</h1>
        </div>
      </template>

      <el-alert
        v-if="error"
        :title="`Error loading complaints: ${error}`"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 15px"
      />

      <el-table
        :data="complaints"
        v-loading="isLoading"
        style="width: 100%"
        stripe
        border
        @row-click="handleRowClick"
        empty-text="No complaints found."
        class="complaints-table"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="status" label="Status" width="120" sortable>
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)" disable-transitions>
              {{ scope.row.status || 'N/A' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Submitted" width="180" sortable>
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="resolved_at" label="Resolved" width="180" sortable>
          <template #default="scope">
            {{ scope.row.resolved_at ? formatDateTime(scope.row.resolved_at) : 'Pending' }}
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="100" align="center">
          <template #default="scope">
            <el-tooltip content="View Details / Edit" placement="top">
              <el-button
                type="primary"
                :icon="ViewIcon"
                circle
                plain
                size="small"
                @click.stop="goToDetailView(scope.row.id)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminComplaints } from '@/api/adminApi' // Adjust path if needed
import { ElTable, ElTableColumn, ElButton, ElCard, ElAlert, ElTag, ElTooltip } from 'element-plus'
import { View as ViewIcon } from '@element-plus/icons-vue' // Import needed icons

const router = useRouter()
const complaints = ref([])
const isLoading = ref(false)
const error = ref(null)

// Helper function to format dates (adjust format as needed)
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' }).format(
      new Date(dateTimeString),
    )
  } catch {
    return dateTimeString // Fallback
  }
}

// Helper for status tag colors
const getStatusTagType = (status) => {
  switch (status?.toLowerCase()) {
    case 'new':
    case 'open':
      return 'warning'
    case 'in_progress':
      return 'primary'
    case 'resolved':
      return 'success'
    case 'rejected':
      return 'info'
    default:
      return 'info'
  }
}

const fetchComplaints = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await getAdminComplaints()
    // --- IMPORTANT ---
    // Check the actual structure of the response.data
    // If your backend doesn't include nested user info etc.,
    // adjust the table columns accordingly.
    complaints.value = response.data
  } catch (err) {
    console.error('Failed to fetch complaints:', err)
    error.value = err.response?.data?.error || err.message || 'Unknown error'
    complaints.value = [] // Clear data on error
  } finally {
    isLoading.value = false
  }
}

// Navigate to detail view when row is clicked
const handleRowClick = (row) => {
  if (row.id) {
    router.push({ name: 'adminComplaintDetail', params: { id: row.id } })
  }
}

// Navigate to detail view via button
const goToDetailView = (id) => {
  router.push({ name: 'adminComplaintDetail', params: { id: id } })
}

onMounted(() => {
  fetchComplaints()
})
</script>

<style scoped>
.admin-list-view {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header h1 {
  margin: 0;
  font-size: 1.5em;
}
.complaints-table :deep(.el-table__row) {
  cursor: pointer;
}
.el-table :deep(th.el-table__cell) {
  background-color: #f5f7fa;
}
</style>
