<template>
  <el-header class="app-header">
    <el-row justify="space-between" align="middle" style="height: 100%">
      <el-col :xs="14" :sm="12" :md="10" class="header-left">
        <router-link to="/" class="logo-title-link">
          <div class="logo-placeholder">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="currentColor">
              <path
                d="M50,10A40,40,0,1,0,90,50,40,40,0,0,0,50,10Zm25,45H60v15a5,5,0,0,1-10,0V55H35a5,5,0,0,1,0-10H50V30a5,5,0,0,1,10,0V45H75a5,5,0,0,1,0,10Z"
              />
            </svg>
          </div>
          <span class="header-title">Medical Finder Vilnius</span>
        </router-link>
      </el-col>

      <el-col :xs="10" :sm="12" :md="14" class="header-right">
        <a href="tel:112" class="emergency-call-link">
          <el-button type="danger" :icon="PhoneFilled" circle />
          <span class="header-emergency-number">112</span>
        </a>
      </el-col>
    </el-row>
  </el-header>
</template>

<script setup>
import { PhoneFilled } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-header {
  background-color: #ffffff;
  color: #303133;
  height: 60px;
  line-height: 60px;
  padding: 0 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-title-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.logo-placeholder {
  height: 35px;
  width: 35px;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00796b;
}
.logo-placeholder svg {
  height: 25px;
  width: 25px;
}

.header-title {
  font-weight: 700;
  font-size: 1.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  text-align: right;
}

.emergency-call-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
}

.emergency-call-link .el-button {
  margin-right: 8px;
}

.header-emergency-number {
  font-weight: bold;
  font-size: 1.15em;
  color: #f56c6c;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 15px;
  }
  .header-title {
    font-size: 1.1em;
  }
  .header-emergency-number {
    font-size: 1.1em;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 10px;
  }
  .header-title {
    font-size: 1em;
  }
  .logo-placeholder {
    height: 30px;
    width: 30px;
    margin-right: 8px;
  }
  .logo-placeholder svg {
    height: 20px;
    width: 20px;
  }
  .emergency-call-link .el-button {
    --el-button-size: var(--el-button-size-small);
    margin-right: 5px;
  }
  .header-emergency-number {
    font-size: 1em;
  }
}
</style>
