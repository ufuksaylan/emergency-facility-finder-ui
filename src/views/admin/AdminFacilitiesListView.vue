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
import { getAdminFacilities } from '@/api/adminApi'
import { ElTable, ElTableColumn, ElButton, ElCard, ElAlert, ElTag, ElTooltip } from 'element-plus'
import { Plus as PlusIcon, Edit as EditIcon } from '@element-plus/icons-vue'

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
    facilities.value = []
  } finally {
    isLoading.value = false
  }
}

const handleRowClick = (row) => {
  if (row.osm_id) {
    router.push({ name: 'adminFacilityEdit', params: { osm_id: row.osm_id } })
  }
}

const goToEditForm = (osmId) => {
  router.push({ name: 'adminFacilityEdit', params: { osm_id: osmId } })
}

const goToCreateForm = () => {
  router.push({ name: 'adminFacilityCreate' })
}

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
