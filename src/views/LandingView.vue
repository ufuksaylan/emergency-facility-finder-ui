<template>
  <div class="landing-view-content">
    <div class="landing-hero">
      <h1>Medical Facility Finder - Vilnius</h1>
      <p class="tagline">Your guide to the right medical help, right when you need it.</p>
    </div>

    <div class="landing-cards-area">
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
              <el-icon :size="40" class="card-icon"><SearchIconComponent /></el-icon>
              <h2>Find Specific Service</h2>
              <p>Search for hospitals or clinics by need.</p>
            </div>
            <el-button
              type="primary"
              size="large"
              @click="goToFinder('specific')"
              :icon="SearchIconComponent"
            >
              Search Facilities
            </el-button>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
// Removed imports: AppHeader, AppFooter, ElContainer, ElMain
import { useRouter } from 'vue-router'
import { ElRow, ElCol, ElCard, ElIcon, ElButton } from 'element-plus' // Keep components used HERE
import { FirstAidKit, Pointer, Search as SearchIconComponent } from '@element-plus/icons-vue'
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
/* Styles ONLY for LandingView's unique content */
.landing-view-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1; /* Allow this view to potentially fill the main area */
  /* background-color: #f8f9fa; /* Optional: background specific to landing page content */
}

/* Keep hero styles */
.landing-hero {
  background: linear-gradient(135deg, #00796b 0%, #004d40 100%);
  color: white;
  padding: 50px 20px;
  text-align: center;
  flex-shrink: 0; /* Don't let hero shrink */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.landing-hero h1 {
  margin-bottom: 10px;
  font-weight: 800;
  font-size: 2.4em;
}
.landing-hero .tagline {
  font-size: 1.15em;
  color: #e0f2f1;
  margin-top: 0;
}

/* Keep styles for the cards area */
.landing-cards-area {
  padding: 50px 20px; /* Restore padding for the cards area */
  flex-grow: 1; /* Allow cards area to expand */
  text-align: center;
}

/* Keep card styles (unchanged from your provided snippet) */
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
  text-align: center;
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

/* REMOVE styles for .landing-container, .landing-main, .landing-footer */
</style>
