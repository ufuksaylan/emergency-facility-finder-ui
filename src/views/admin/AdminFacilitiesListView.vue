<template>
  <div class="admin-list-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <h1>Manage Facilities</h1>
          <el-button type="primary" :icon="PlusIcon" @click="goToCreateForm">
            Add New Facility
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="error"
        :title="`Error loading facilities: ${error}`"
        type="error"
        show-icon
        :closable="false"
        style="margin-bottom: 15px"
      />

      <el-table
        :data="facilities"
        v-loading="isLoading"
        style="width: 100%"
        stripe
        border
        @row-click="handleRowClick"
        empty-text="No facilities found."
        class="facilities-table"
      >
        <el-table-column prop="osm_id" label="OSM ID" width="140" sortable />
        <el-table-column prop="name" label="Name" sortable show-overflow-tooltip />
        <el-table-column prop="facility_type" label="Type" width="150" sortable />
        <el-table-column prop="city" label="City" width="180" sortable />
        <el-table-column label="Emergency" width="110" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.has_emergency ? 'success' : 'info'" disable-transitions>
              {{ scope.row.has_emergency ? 'Yes' : 'No' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Wheelchair" width="110" align="center">
          <template #default="scope">
            <el-tag
              :type="scope.row.wheelchair_accessible ? 'success' : 'info'"
              disable-transitions
            >
              {{ scope.row.wheelchair_accessible ? 'Yes' : 'No' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="Actions" width="100" align="center">
          <template #default="scope">
            <el-tooltip content="Edit Facility" placement="top">
              <el-button
                type="primary"
                :icon="EditIcon"
                circle
                plain
                size="small"
                @click.stop="goToEditForm(scope.row.osm_id)"
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
import { getAdminFacilities } from '@/api/adminApi' // Use the new API file
import { ElTable, ElTableColumn, ElButton, ElCard, ElAlert, ElTag, ElTooltip } from 'element-plus'
import { Plus as PlusIcon, Edit as EditIcon } from '@element-plus/icons-vue'
// Optional: Import message/confirm dialogs if implementing delete
// import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const facilities = ref([])
const isLoading = ref(false)
const error = ref(null)

const fetchFacilities = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await getAdminFacilities()
    facilities.value = response.data
  } catch (err) {
    console.error('Failed to fetch facilities:', err)
    error.value = err.response?.data?.error || err.message || 'Unknown error'
    facilities.value = [] // Clear data on error
  } finally {
    isLoading.value = false
  }
}

// Navigate to edit form when row is clicked
const handleRowClick = (row) => {
  if (row.osm_id) {
    router.push({ name: 'adminFacilityEdit', params: { osm_id: row.osm_id } })
  }
}

// Navigate to edit form via button
const goToEditForm = (osmId) => {
  router.push({ name: 'adminFacilityEdit', params: { osm_id: osmId } })
}

// Navigate to create form
const goToCreateForm = () => {
  router.push({ name: 'adminFacilityCreate' })
}

// Optional: Delete Handler (Requires confirmation dialog)
/*
const handleDelete = async (osmId) => {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete this facility? This action cannot be undone.',
      'Confirm Deletion',
      {
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        type: 'warning',
      }
    );

    // User confirmed
    isLoading.value = true; // Optional: show loading state on table/button
    await deleteAdminFacility(osmId); // Assuming you add deleteAdminFacility to adminApi.js
    ElMessage({ type: 'success', message: 'Facility deleted successfully' });
    fetchFacilities(); // Refresh the list
  } catch (action) {
    if (action === 'cancel') {
      ElMessage({ type: 'info', message: 'Deletion cancelled' });
    } else {
      // Handle API deletion error
      console.error("Failed to delete facility:", action); // Log the actual error if it's not 'cancel'
       ElMessage({ type: 'error', message: action.response?.data?.errors?.join(', ') || 'Failed to delete facility' });
       isLoading.value = false; // Ensure loading stops on error
    }
  }
};
*/

onMounted(() => {
  fetchFacilities()
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
.facilities-table :deep(.el-table__row) {
  cursor: pointer;
}
.el-table :deep(th.el-table__cell) {
  background-color: #f5f7fa;
}
</style>
