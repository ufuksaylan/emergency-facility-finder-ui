<script setup>
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { ElContainer, ElMain } from 'element-plus'
</script>

<template>
  <el-container direction="vertical" class="app-layout-container">
    <AppHeader />

    <el-main class="app-main-content">
      <RouterView />
    </el-main>
  </el-container>
</template>

<style scoped>
.app-layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.app-main-content {
  flex-grow: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  position: relative;
}
</style>
