<template>
  <el-header class="app-header">
    <el-row justify="space-between" align="middle" style="height: 100%">
      <el-col :span="12">
        <span class="header-title">Find Hospitals now</span>
      </el-col>
      <el-col :span="4" style="text-align: right">
        <el-button type="danger" :icon="PhoneFilled" circle plain />
        <span class="header-911">112</span>
      </el-col>
    </el-row>
  </el-header>
</template>

<script setup>
// Import only the icons needed for this specific component
import { PhoneFilled } from '@element-plus/icons-vue'

// This component currently doesn't need props or emits
</script>

<style scoped>
/* Styles moved from HomeView.vue specific to the header */
.app-header {
  background-color: #d9534f; /* Red color */
  color: white;
  line-height: 60px; /* Adjust as needed */
  height: 60px; /* Fixed header height */
  flex-shrink: 0; /* Prevent header from shrinking */
  /* Add padding directly to header instead of margins on children */
  padding: 0 15px;
}

.header-title {
  font-weight: bold;
  font-size: 1.2em;
  /* margin-left removed, handled by parent padding */
}

.header-911 {
  font-weight: bold;
  margin-left: 5px; /* Space between icon and text */
  /* margin-right removed, handled by parent padding */
}

/* Ensure 911 button icon is white */
.app-header .el-button.is-plain {
  --el-button-text-color: white;
  --el-button-border-color: white;
}
.app-header .el-button.is-plain:hover {
  --el-button-hover-text-color: white;
  --el-button-hover-border-color: white;
  --el-button-hover-bg-color: rgba(255, 255, 255, 0.1);
}
</style>
