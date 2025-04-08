<template>
  <el-container direction="vertical" class="landing-container">
    <AppHeader />

    <div class="landing-hero">
      <h1>Medical Facility Finder - Vilnius</h1>
      <p class="tagline">Your guide to the right medical help, right when you need it.</p>
    </div>

    <el-main class="landing-main">
      <el-row :gutter="20" justify="center">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card shadow="hover" class="choice-card emergency-card">
            <div class="card-content">
              <el-icon :size="40" class="card-icon"><FirstAidKit /></el-icon>
              <h2>Emergency Care</h2>
              <p>Find the nearest open emergency room now.</p>
            </div>
            <el-button type="danger" size="large" @click="goToFinder('emergency')" :icon="Pointer">
              Find Emergency Room
            </el-button>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-card shadow="hover" class="choice-card specific-card">
            <div class="card-content">
              <el-icon :size="40" class="card-icon"><Search /></el-icon>
              <h2>Find Specific Service</h2>
              <p>Search for hospitals, clinics, or specialists by need.</p>
            </div>
            <el-button type="primary" size="large" @click="goToFinder('specific')" :icon="Search">
              Search Facilities
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </el-main>

    <AppFooter />
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue' // Import the AppHeader
import { FirstAidKit, Pointer, Search } from '@element-plus/icons-vue' // Keep these imports for cards
import AppFooter from '@/components/AppFooter.vue'

const router = useRouter()

function goToFinder(searchType) {
  if (searchType === 'emergency') {
    router.push({ name: 'emergency' })
  } else {
    router.push({ name: 'search' })
  }
}
</script>

<style scoped>
/* Styles from previous LandingView, adjusted for the new structure */

.landing-container {
  min-height: 100vh;
  /* text-align is handled by specific sections now */
  /* background-color: #f8f9fa; */
  display: flex;
  flex-direction: column;
}

/* NEW: Styles for the Landing Page Hero Section */
.landing-hero {
  background: linear-gradient(135deg, #00796b 0%, #004d40 100%); /* Teal gradient */
  color: white;
  padding: 50px 20px; /* Adjust padding */
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* Prevent shrinking */
}

.landing-hero h1 {
  margin-bottom: 10px;
  font-weight: 800;
  font-size: 2.4em; /* Make title prominent */
}

.landing-hero .tagline {
  font-size: 1.15em;
  color: #e0f2f1;
  margin-top: 0;
}
/* --- End Hero Section Styles --- */

/* Main content area adjustments */
.landing-main {
  padding: 50px 20px; /* Adjust top/bottom padding as needed */
  flex-grow: 1; /* Allow main content to take available space */
  text-align: center; /* Center the row */
}

/* Card styles remain the same */
.choice-card {
  margin-bottom: 30px;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  background-color: #fff;
  padding: 25px;
  text-align: center; /* Ensure card text is centered */
}

.choice-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-icon {
  margin-bottom: 15px;
  color: #00796b;
}
.emergency-card .card-icon {
  color: #f56c6c;
}

.choice-card h2 {
  margin-bottom: 15px;
  font-weight: 700;
  color: #333;
}

.choice-card p {
  margin-bottom: 25px;
  color: #555;
  line-height: 1.6;
}

/* Button styles remain the same */
.el-button {
  border-radius: 20px;
  padding: 12px 24px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
}

.el-button .el-icon {
  margin-right: 8px;
}

.el-button--primary {
  background-color: #00796b;
  border-color: #00796b;
}
.el-button--primary:hover {
  background-color: #004d40;
  border-color: #004d40;
}

/* Footer styles remain the same */
.landing-footer {
  margin-top: auto;
  padding: 20px;
  color: #909399;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  width: 100%;
  text-align: center;
}
.landing-footer p {
  margin: 5px 0;
  font-size: 0.9em;
}
.landing-footer a {
  color: #00796b;
  text-decoration: none;
}
.landing-footer a:hover {
  text-decoration: underline;
}

/* REMOVE the old .landing-header style block if it still exists */
/*
.landing-header { ... } <--- DELETE THIS WHOLE BLOCK
*/
</style>
