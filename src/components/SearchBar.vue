<template>
  <div class="search-container">
    <el-input
      :model-value="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      placeholder="Search for location (feature not implemented)"
      :prefix-icon="Search"
      size="large"
      clearable
    />
  </div>
</template>

<script setup>
import { Search } from '@element-plus/icons-vue'

// Define props to accept the value from the parent (for v-model)
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

// Define emits to notify the parent about changes (for v-model)
defineEmits(['update:modelValue'])

// Note: The actual search *logic* is not implemented here,
// it just handles the input field's state.
</script>

<style scoped>
/* Styles moved from HomeView.vue specific to the search container */
.search-container {
  padding: 10px 15px;
  background-color: #f8f8f8; /* Light background for search */
  border-bottom: 1px solid #eee;
  flex-shrink: 0; /* Prevent search bar from shrinking */
}

/* You could add more specific styles for the input within this component if needed */
/* e.g., .search-container .el-input { ... } */
</style>
