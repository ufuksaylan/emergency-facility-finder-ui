// src/components/AppHeader.vue
<template>
  <el-header class="app-header">
    <el-row justify="space-between" align="middle" style="height: 100%">
      <el-col :xs="16" :sm="14" :md="12">
        <span class="header-title">Medical Finder Vilnius</span>
      </el-col>
      <el-col :xs="8" :sm="10" :md="12" class="emergency-call">
        <el-button type="danger" :icon="PhoneFilled" circle plain />
        <span class="header-911">112</span>
      </el-col>
    </el-row>
  </el-header>
</template>

<script setup>
import { PhoneFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-header {
  background-color: #d9534f; /* Red color */
  color: white;
  line-height: 60px;
  height: 60px;
  flex-shrink: 0;
  padding: 0 10px; /* Slightly reduce padding for smaller screens */
}

.header-title {
  font-weight: bold;
  font-size: 1.1em; /* Slightly adjust font size */
  white-space: nowrap; /* Prevent wrapping if possible */
  overflow: hidden;
  text-overflow: ellipsis;
}

.emergency-call {
  text-align: right; /* Keep content aligned right */
  display: flex; /* Use flex to align button and text */
  align-items: center;
  justify-content: flex-end; /* Push content to the right */
}

.header-911 {
  font-weight: bold;
  margin-left: 5px;
}

/* Specific mobile adjustments using media queries */
@media (max-width: 480px) {
  /* Target smaller phones */
  .app-header {
    padding: 0 8px; /* Further reduce padding */
  }
  .header-title {
    font-size: 1em; /* Smaller title */
  }
  .emergency-call .el-button {
    /* Optionally make button smaller */
    --el-button-size: var(--el-button-size-small);
  }
  .header-911 {
    font-size: 0.95em; /* Slightly smaller number */
    margin-left: 3px;
  }
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
