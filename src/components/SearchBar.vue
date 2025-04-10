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

const props = defineProps({
  suggestions: {
    type: Array,
    default: () => [],
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

const emit = defineEmits(['facility-selected'])

const inputValue = ref('')

const querySearch = (queryString, cb) => {
  const query = queryString ? queryString.toLowerCase() : ''
  const results = query ? props.suggestions.filter(createFilter(query)) : props.suggestions
  console.log(`Search Query: "${query}", Found:`, results.length)
  cb(results)
}

const createFilter = (queryString) => {
  return (suggestion) => {
    const nameMatch = suggestion.value.toLowerCase().includes(queryString)
    const addressMatch = suggestion.address.toLowerCase().includes(queryString)
    return nameMatch || addressMatch
  }
}

const handleSelect = (item) => {
  console.log('SearchBar: Selected Item:', item)
  emit('facility-selected', item)
}
</script>

<style scoped>
.search-container {
  padding: 10px 15px;
  background-color: #f8f8f8;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.search-autocomplete {
  width: 100%;
}

.suggestion-item {
  line-height: normal;
  padding: 7px 0;
}
.suggestion-name {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.suggestion-address {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
