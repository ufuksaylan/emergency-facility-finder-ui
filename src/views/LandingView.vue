<template>
  <el-container direction="vertical" class="landing-container">
    <el-header class="landing-header">
      <h1>Medical Facility Finder - Vilnius</h1>
      <p class="tagline">Your guide to the right medical help, right when you need it.</p>
    </el-header>

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

    <el-footer class="landing-footer">
      <p>© {{ new Date().getFullYear() }} Medical Facility Finder Vilnius. All rights reserved.</p>
    </el-footer>
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
/* Import Google Font (Example: Nunito) - Add this ideally in your main CSS/SCSS file or index.html */
/* @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800&display=swap'); */

.landing-container {
  min-height: 100vh;
  text-align: center;
  /* background-color: #f8f9fa; /* Light background for contrast */
  /* font-family: 'Nunito', sans-serif; /* Apply custom font */
  display: flex; /* Use flex for footer placement */
  flex-direction: column; /* Stack elements vertically */
}

.landing-header {
  /* Example Gradient - adjust colors as needed */
  background: linear-gradient(135deg, #00796b 0%, #004d40 100%); /* Teal gradient */
  color: white;
  padding: 40px 20px; /* More padding */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.landing-header h1 {
  margin-bottom: 10px;
  font-weight: 800; /* Bolder heading */
}

.tagline {
  font-size: 1.1em;
  color: #e0f2f1; /* Lighter color for tagline */
  margin-top: 0;
}

.landing-main {
  padding: 60px 20px; /* More vertical padding */
  flex-grow: 1; /* Allow main content to take available space */
}

.choice-card {
  margin-bottom: 30px; /* More spacing between cards if stacked */
  min-height: 280px; /* Increased height to accommodate icons/spacing */
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Pushes button to bottom */
  border: 1px solid #e0e0e0; /* Subtle border */
  border-radius: 8px; /* Slightly rounded corners */
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease; /* Smooth transition */
  background-color: #fff; /* Ensure card background is white */
  padding: 25px;
}

.choice-card:hover {
  transform: translateY(-5px); /* Lift effect on hover */
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15); /* Enhanced shadow on hover */
}

.card-content {
  flex-grow: 1; /* Allow content to fill space */
  display: flex;
  flex-direction: column;
  align-items: center; /* Center icon and text */
}

.card-icon {
  margin-bottom: 15px;
  color: #00796b; /* Use primary color for icon */
}
/* Specific icon color for emergency */
.emergency-card .card-icon {
  color: #f56c6c; /* Element Plus danger color */
}

.choice-card h2 {
  margin-bottom: 15px;
  font-weight: 700;
  color: #333;
}

.choice-card p {
  margin-bottom: 25px; /* More space before button */
  color: #555;
  line-height: 1.6;
}

/* Custom button styles */
.el-button {
  border-radius: 20px; /* Rounded buttons */
  padding: 12px 24px; /* Adjust padding */
  font-weight: bold;
  /* Ensure icons in buttons are vertically aligned */
  display: inline-flex;
  align-items: center;
}

.el-button .el-icon {
  margin-right: 8px; /* Space between icon and text */
}

/* Primary Button (Adjust color to match palette) */
.el-button--primary {
  background-color: #00796b; /* Match primary color */
  border-color: #00796b;
}
.el-button--primary:hover {
  background-color: #004d40; /* Darker shade on hover */
  border-color: #004d40;
}

/* Keep danger button prominent */
.el-button--danger {
  /* Use Element Plus default or customize */
}

.landing-footer {
  margin-top: auto; /* Pushes footer to the bottom if content is short */
  padding: 20px;
  color: #909399;
  background-color: #f5f5f5; /* Light background for footer */
  border-top: 1px solid #e0e0e0;
  width: 100%;
}
.landing-footer p {
  margin: 5px 0;
  font-size: 0.9em;
}
.landing-footer a {
  color: #00796b; /* Use primary color for links */
  text-decoration: none;
}
.landing-footer a:hover {
  text-decoration: underline;
}
</style>
