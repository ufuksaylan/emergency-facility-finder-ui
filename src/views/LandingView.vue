<template>
  <el-container direction="vertical" class="landing-container">
    <el-header class="landing-header">
      <h1>Medical Facility Finder - Vilnius</h1>
    </el-header>
    <el-main class="landing-main">
      <el-row :gutter="20" justify="center">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card shadow="hover" class="choice-card">
            <h2>Emergency Care</h2>
            <p>Find the nearest open emergency room now.</p>
            <el-button type="danger" size="large" @click="goToFinder('emergency')">
              Find Emergency Room
            </el-button>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-card shadow="hover" class="choice-card">
            <h2>Find Specific Service</h2>
            <p>Search for hospitals, clinics, or specialists.</p>
            <el-button type="primary" size="large" @click="goToFinder('specific')">
              Search Facilities
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
    <el-footer class="landing-footer"> </el-footer>
  </el-container>
</template>

<script setup>
// src/views/LandingView.vue - <script setup> section
import { useRouter } from 'vue-router'

const router = useRouter()

function goToFinder(searchType) {
  if (searchType === 'emergency') {
    // Navigate to the dedicated emergency view route
    router.push({ name: 'emergency' })
  } else {
    // Navigate to the dedicated search view route
    router.push({ name: 'search' })
  }
}
</script>

<style scoped>
.landing-container {
  min-height: 100vh;
  text-align: center;
}
.landing-header {
  background-color: #409eff; /* Example color */
  color: white;
  padding: 20px;
}
.landing-main {
  padding: 40px 20px;
}
.choice-card {
  margin-bottom: 20px;
  min-height: 200px; /* Adjust as needed */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.choice-card h2 {
  margin-bottom: 15px;
}
.choice-card p {
  margin-bottom: 20px;
  flex-grow: 1;
}
.landing-footer {
  margin-top: 40px;
  padding: 10px;
  color: #909399;
}
</style>
