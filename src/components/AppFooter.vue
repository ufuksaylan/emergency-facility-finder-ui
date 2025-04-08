// src/components/AppFooter.vue
<template>
  <el-footer class="app-footer">
    <el-row :gutter="30" justify="space-between" align="top">
      <el-col :xs="24" :sm="14" :md="15" class="footer-info">
        <p>
          <strong>Thesis Project: Web-based Medical Facility Routing System for Vilnius</strong
          ><br />
          <small>
            This application helps users find and navigate to suitable medical facilities in
            Vilnius, considering needs, availability, and real-time conditions. Developed as part of
            a thesis project.
          </small>
        </p>
        <p class="contact-info">
          Developer:
          <a href="mailto:ufuk.saylan@vilniustech.stud.lt">ufuk.saylan@vilniustech.stud.lt</a>
        </p>
        <p class="copyright">
          © {{ new Date().getFullYear() }} Medical Facility Finder Vilnius. All rights reserved.
        </p>
      </el-col>

      <el-col :xs="24" :sm="10" :md="9" class="footer-links-uni">
        <div class="github-links">
          <strong>Source Code:</strong>
          <p>
            <el-icon><Link /></el-icon>
            <a
              href="https://github.com/ufuksaylan/emergency-facility-finder-ui"
              target="_blank"
              rel="noopener noreferrer"
              >Frontend (UI) on GitHub</a
            >
          </p>
          <p>
            <el-icon><Link /></el-icon>
            <a
              href="https://github.com/ufuksaylan/emergency-facility-finder"
              target="_blank"
              rel="noopener noreferrer"
              >Backend on GitHub</a
            >
          </p>
        </div>

        <div class="university-info">
          <strong>Affiliation:</strong>
          <div class="uni-details">
            <div class="uni-logo-placeholder">
              <span title="Vilnius Tech Logo Placeholder">VT</span>
            </div>
            <span>Vilnius Tech</span>
          </div>
        </div>
      </el-col>
    </el-row>
  </el-footer>
</template>

<script setup>
// Import icons used in the template (if not globally registered)
import { Link } from '@element-plus/icons-vue'
</script>

<style scoped>
.app-footer {
  background-color: #f8f9fa; /* Light gray background */
  color: #6c757d; /* Softer text color */
  padding: 30px 20px; /* Decent padding */
  border-top: 1px solid #e7e7e7; /* Subtle top border */
  line-height: 1.6;
  font-size: 0.85em; /* Slightly smaller base font size for footer */
  margin-top: auto; /* Push footer to bottom in flex container */
}

.footer-info p,
.footer-links-uni p,
.footer-links-uni div {
  margin-bottom: 10px; /* Spacing between paragraphs/sections */
}

.footer-info strong,
.footer-links-uni strong {
  color: #495057; /* Slightly darker color for headings */
  display: block;
  margin-bottom: 5px;
}

.footer-info small {
  color: #888; /* Even lighter color for the description */
}

.copyright {
  margin-top: 15px; /* More space above copyright */
  font-size: 0.9em;
  color: #adb5bd; /* Lighter color for copyright */
}

.contact-info a,
.github-links a {
  color: #007bff; /* Standard link blue, or use your theme color e.g. #00796B */
  text-decoration: none;
  transition: color 0.2s ease;
}
.contact-info a:hover,
.github-links a:hover {
  color: #0056b3; /* Darker blue on hover, or adjust for your theme */
  text-decoration: underline;
}

.github-links .el-icon {
  vertical-align: middle; /* Align icon with text */
  margin-right: 5px;
  color: #6c757d;
}

.footer-links-uni {
  text-align: left; /* Default alignment */
}

.university-info {
  margin-top: 15px; /* Space above uni info */
}

.uni-details {
  display: flex;
  align-items: center; /* Vertically align logo and text */
}

.uni-logo-placeholder {
  width: 35px;
  height: 35px;
  background-color: #dee2e6; /* Placeholder background */
  color: #495057; /* Placeholder text color */
  border-radius: 4px; /* Slightly rounded corners */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: bold;
  font-size: 0.9em;
  flex-shrink: 0; /* Prevent shrinking */
}
.uni-logo-placeholder img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.university-info span {
  color: #495057;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .app-footer {
    text-align: center; /* Center text on smaller screens */
  }
  .footer-links-uni {
    text-align: center; /* Center right column content too */
    margin-top: 20px; /* Add space when columns stack */
  }
  .uni-details {
    justify-content: center; /* Center logo + text block */
  }
  .github-links p {
    justify-content: center; /* Center links */
    display: flex;
    align-items: center;
  }
}
</style>
