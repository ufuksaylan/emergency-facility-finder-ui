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
// No additional script logic needed for this static header
// If navigation logic were added, import { useRouter } from 'vue-router'
</script>

<style scoped>
.app-header {
  /* Modern Look: White background, subtle shadow */
  background-color: #ffffff;
  color: #303133; /* Darker text for contrast */
  height: 60px; /* Standard header height */
  line-height: 60px; /* Vertically align text */
  padding: 0 20px; /* Standard padding */
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.06); /* Subtle shadow */
  border-bottom: 1px solid #e4e7ed; /* Light border */
  flex-shrink: 0; /* Prevent shrinking in flex layouts */
  position: sticky; /* Keep header visible on scroll */
  top: 0;
  z-index: 1000; /* Ensure header stays on top */
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-title-link {
  display: inline-flex; /* Align logo and title */
  align-items: center;
  text-decoration: none; /* Remove underline from link */
  color: inherit; /* Use header text color */
}

.logo-placeholder {
  height: 35px; /* Adjust size as needed */
  width: 35px;
  margin-right: 10px;
  /* background-color: #00796B; /* Placeholder color - replace with actual logo */
  /* border-radius: 50%; /* Example: circular logo */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00796b; /* Theme color for SVG */
  /* If using an image, remove background/color/border-radius */
}
.logo-placeholder svg {
  height: 25px;
  width: 25px;
}

.header-title {
  font-weight: 700; /* Bold title */
  font-size: 1.2em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-right {
  text-align: right; /* Align content to the right */
}

.emergency-call-link {
  display: inline-flex; /* Align button and number */
  align-items: center;
  text-decoration: none; /* Remove underline from tel link */
  color: inherit; /* Inherit text color */
}

/* Keep the emergency button visually distinct */
.emergency-call-link .el-button {
  margin-right: 8px; /* Space between button and number */
  /* Solid danger button contrasts well with white bg */
}

.header-emergency-number {
  font-weight: bold;
  font-size: 1.15em;
  color: #f56c6c; /* Match Element Plus danger color */
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  /* Tablets and below */
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
  /* Smaller mobile phones */
  .app-header {
    padding: 0 10px;
  }
  .header-title {
    /* Option 1: Slightly smaller title */
    font-size: 1em;
    /* Option 2: Hide title, show only logo */
    /* display: none; */
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
    /* Make button smaller on tiny screens */
    --el-button-size: var(--el-button-size-small);
    margin-right: 5px;
  }
  .header-emergency-number {
    font-size: 1em;
  }
}
</style>
