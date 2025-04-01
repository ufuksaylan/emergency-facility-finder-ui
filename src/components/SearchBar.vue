<template>
  <div class="search-container">
    <el-autocomplete
      v-model="inputValue"
      :fetch-suggestions="querySearch"
      :placeholder="placeholder"
      :prefix-icon="Search"
      :trigger-on-focus="true"
      :disabled="disabled"
      clearable
      size="large"
      @select="handleSelect"
      class="search-autocomplete"
      fit-input-width
      placement="bottom-start"
      value-key="value"
      :debounce="300"
    >
      <template #default="{ item }">
        <div class="suggestion-item">
          <div class="suggestion-name">{{ item.value }}</div>
          <div class="suggestion-address">{{ item.address }}</div>
        </div>
      </template>
    </el-autocomplete>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'

// --- Props ---
const props = defineProps({
  suggestions: {
    type: Array,
    default: () => [], // Default to an empty array of {value, address, facilityData}
  },
  placeholder: {
    type: String,
    default: 'Search...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

// --- Emits ---
// Emit an event when a facility is actually selected from the list
const emit = defineEmits(['facility-selected'])

// --- Local State ---
// Local state for the input field's text.
const inputValue = ref('')

// --- Methods ---

// Method for el-autocomplete to fetch suggestions
const querySearch = (queryString, cb) => {
  const query = queryString ? queryString.toLowerCase() : ''
  const results = query ? props.suggestions.filter(createFilter(query)) : props.suggestions // Show all if query is empty (on focus)

  console.log(`Search Query: "${query}", Found:`, results.length)
  cb(results) // Pass the filtered results back to el-autocomplete
}

// Helper function for filtering suggestions based on input query (case-insensitive)
const createFilter = (queryString) => {
  return (suggestion) => {
    // Check if name (value) or address contains the query string
    const nameMatch = suggestion.value.toLowerCase().includes(queryString)
    const addressMatch = suggestion.address.toLowerCase().includes(queryString)
    return nameMatch || addressMatch
  }
}

// Method called when a suggestion is selected from the dropdown
const handleSelect = (item) => {
  console.log('SearchBar: Selected Item:', item)
  // Emit the full selected facility data object to the parent
  emit('facility-selected', item) // item is the suggestion object {value, address, facilityData}

  // Optional: Clear input after selection?
  // inputValue.value = '';
}
</script>

<style scoped>
/* Styles specific to the search container */
.search-container {
  padding: 10px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.search-autocomplete {
  width: 100%; /* Make autocomplete take full width */
}

/* Styles for custom suggestion items */
.suggestion-item {
  line-height: normal;
  padding: 7px 0; /* Adjust padding if needed */
}
.suggestion-name {
  font-size: 14px;
  color: #333; /* Darker text for name */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Prevent long names breaking layout */
}
.suggestion-address {
  font-size: 12px;
  color: #888; /* Lighter text for address */
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Prevent long addresses breaking layout */
}
</style>
