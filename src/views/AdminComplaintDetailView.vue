<template>
  <div class="admin-detail-view">
    <el-page-header @back="goBack" :content="pageTitle" />

    <el-card class="detail-card" v-loading="isLoading">
      <div v-if="error" class="error-message">
        <el-alert
          :title="`Error loading complaint: ${error}`"
          type="error"
          show-icon
          :closable="false"
        />
        <el-button @click="loadComplaint" style="margin-top: 10px">Retry</el-button>
      </div>

      <el-form v-else-if="complaint" ref="formRef" :model="formData" label-position="top">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Complaint ID">
              <p>{{ complaint.id }}</p>
            </el-form-item>

            <el-form-item label="Related Facility" v-if="complaint.facility?.osm_id">
              <div class="facility-link-container">
                <p class="facility-name" v-if="complaint.facility.name">
                  {{ complaint.facility.name }} (OSM ID: {{ complaint.facility.osm_id }})
                </p>
                <p class="facility-name" v-else>OSM ID: {{ complaint.facility.osm_id }}</p>
                <el-button
                  type="primary"
                  :icon="EditIcon"
                  plain
                  size="small"
                  @click="goToEditFacility"
                  >Edit Facility</el-button
                >
              </div>
            </el-form-item>

            <el-form-item label="Submitted At">
              <p>{{ formatDateTime(complaint.created_at) }}</p>
            </el-form-item>

            <el-form-item label="Complaint Description">
              <el-input
                type="textarea"
                :value="complaint.description || 'No description provided.'"
                :rows="8"
                readonly
                class="read-only-textarea"
              />
            </el-form-item>

            <el-form-item label="Resolved At">
              <p>
                {{ complaint.resolved_at ? formatDateTime(complaint.resolved_at) : 'Not Resolved' }}
              </p>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Current Status">
              <el-tag :type="getStatusTagType(complaint.status)" size="large">
                {{ complaint.status || 'N/A' }}
              </el-tag>
            </el-form-item>

            <el-form-item label="Update Status" prop="status">
              <el-select v-model="formData.status" placeholder="Select new status">
                <el-option label="New" value="new"></el-option>
                <el-option label="Open" value="open"></el-option>
                <el-option label="In Progress" value="in_progress"></el-option>
                <el-option label="Resolved" value="resolved"></el-option>
                <el-option label="Rejected" value="rejected"></el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="Resolution Notes" prop="resolution_notes">
              <el-input
                type="textarea"
                v-model="formData.resolution_notes"
                :rows="6"
                placeholder="Add notes about the resolution or rejection..."
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider />

        <div class="form-actions">
          <el-button @click="goBack">Cancel</el-button>
          <el-button type="danger" :icon="DeleteIcon" @click="handleDelete" :loading="isDeleting">
            Delete Complaint
          </el-button>
          <el-button type="primary" @click="handleSave" :loading="isSaving">
            Save Changes
          </el-button>
        </div>
      </el-form>
      <div v-else>
        <p>Loading complaint details...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getAdminComplaint, updateAdminComplaint, deleteAdminComplaint } from '@/api/adminApi'
import {
  ElPageHeader,
  ElCard,
  ElAlert,
  ElForm,
  ElFormItem,
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElRow,
  ElCol,
  ElDivider,
  ElTag,
  ElMessage,
  ElMessageBox,
} from 'element-plus'
import { Delete as DeleteIcon, Edit as EditIcon } from '@element-plus/icons-vue'

const props = defineProps({
  id: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()

const complaint = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)
const error = ref(null)

const formData = reactive({
  status: '',
  resolution_notes: '',
})

const pageTitle = computed(() =>
  complaint.value ? `Complaint Details (ID: ${complaint.value.id})` : 'Complaint Details',
)

const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return ''
  try {
    return new Intl.DateTimeFormat('lt-LT', {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
    }).format(new Date(dateTimeString))
  } catch {
    return dateTimeString
  }
}

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

const loadComplaint = async () => {
  isLoading.value = true
  error.value = null
  complaint.value = null
  try {
    const response = await getAdminComplaint(props.id)
    complaint.value = response.data

    formData.status = complaint.value.status || ''
    formData.resolution_notes = complaint.value.resolution_notes || ''
  } catch (err) {
    console.error(`Failed to load complaint ${props.id}:`, err)
    error.value = err.response?.data?.error || err.message || 'Failed to load complaint data'
    if (err.response?.status === 404) {
      error.value = `Complaint with ID ${props.id} not found.`
    }
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  isSaving.value = true
  error.value = null
  try {
    const updateData = {
      status: formData.status,
      resolution_notes: formData.resolution_notes,
    }
    const response = await updateAdminComplaint(props.id, updateData)
    complaint.value = response.data

    formData.status = complaint.value.status || ''
    formData.resolution_notes = complaint.value.resolution_notes || ''
    ElMessage({ message: 'Complaint updated successfully.', type: 'success' })
  } catch (err) {
    console.error('Failed to update complaint:', err)
    const errorMsg =
      err.response?.data?.errors?.join(', ') ||
      err.response?.data?.error ||
      err.message ||
      'Failed to update complaint'
    error.value = errorMsg
    ElMessage({ message: `Update failed: ${errorMsg}`, type: 'error', duration: 5000 })
  } finally {
    isSaving.value = false
  }
}

// Handle deleting the complaint
const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this complaint? This action cannot be undone.',
      'Confirm Deletion',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' },
    )
    isDeleting.value = true
    error.value = null
    await deleteAdminComplaint(props.id)
    ElMessage({ type: 'success', message: 'Complaint deleted successfully' })
    goBack()
  } catch (action) {
    if (action !== 'cancel') {
      console.error('Failed to delete complaint:', action)
      const errorMsg =
        action.response?.data?.errors?.join(', ') ||
        action.response?.data?.error ||
        action.message ||
        'Failed to delete complaint'
      error.value = errorMsg
      ElMessage({ type: 'error', message: `Deletion failed: ${errorMsg}`, duration: 5000 })
      isDeleting.value = false
    } else {
      ElMessage({ type: 'info', message: 'Deletion cancelled' })
    }
  }
}

const goBack = () => {
  router.push({ name: 'adminComplaintsList' })
}

const goToEditFacility = () => {
  const facilityOsmId = complaint.value?.facility?.osm_id

  if (facilityOsmId) {
    router.push({ name: 'adminFacilityEdit', params: { osm_id: facilityOsmId } })
  } else {
    console.warn(
      'Cannot navigate to edit facility: facility OSM ID is missing from complaint data.',
    )
    ElMessage({ type: 'warning', message: 'Facility details not found for this complaint.' })
  }
}

onMounted(() => {
  loadComplaint()
})
</script>

<style scoped>
.admin-detail-view {
  padding: 20px;
}
.el-page-header {
  margin-bottom: 20px;
}
.detail-card {
  margin-top: 20px;
}
.error-message {
  padding: 20px;
  text-align: center;
}
.el-form p {
  margin: 0;
  line-height: 32px;
  color: var(--el-text-color-regular);
  word-break: break-word;
  padding: 0 11px;
}
.el-form-item {
  margin-bottom: 18px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.el-col {
  margin-bottom: 10px;
}

.read-only-textarea :deep(.el-textarea__inner) {
  cursor: default;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  box-shadow: none;
}

.facility-link-container {
  display: flex;
  align-items: center;
  gap: 15px;
  line-height: 32px;
  padding: 0 11px;
  flex-wrap: wrap;
}

.facility-link-container .facility-name {
  margin: 0;
  padding: 0;
  flex-grow: 1;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
  word-break: break-word;
}

.facility-link-container .el-button {
  flex-shrink: 0;
}
</style>
