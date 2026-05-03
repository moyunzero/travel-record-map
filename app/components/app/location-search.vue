<script lang="ts" setup>
import { useDebounceFn } from "@vueuse/core";
import { ref, watch } from "vue";
import { extractShortLocationName } from "~/lib/location-utils";

const emit = defineEmits<{
  selectLocation: [{ lat: number; lon: number; name: string }];
}>();

// 搜索配置常量
const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 500,
  MAX_RESULTS: 5,
  API_URL: "https://nominatim.openstreetmap.org/search",
  USER_AGENT: "TravelRecordMap/1.0",
  LANGUAGE: "zh-CN,zh",
} as const;

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

const searchQuery = ref("");
const searchResults = ref<SearchResult[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const showResults = ref(false);

// 使用 Nominatim API 进行地理编码搜索
async function searchLocation(query: string) {
  if (!query || query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    searchResults.value = [];
    return;
  }

  try {
    loading.value = true;
    error.value = null;

    const response = await fetch(
      `${SEARCH_CONFIG.API_URL}?${new URLSearchParams({
        "q": query,
        "format": "json",
        "addressdetails": "1",
        "limit": String(SEARCH_CONFIG.MAX_RESULTS),
        "accept-language": SEARCH_CONFIG.LANGUAGE,
      })}`,
      {
        headers: {
          "User-Agent": SEARCH_CONFIG.USER_AGENT,
        },
      },
    );

    if (!response.ok) {
      throw new Error("搜索失败");
    }

    const data = await response.json();
    searchResults.value = data;
    showResults.value = true;
  }
  catch (e) {
    error.value = "搜索失败，请稍后重试";
    console.error("Location search error:", e);
  }
  finally {
    loading.value = false;
  }
}

// 防抖搜索，避免频繁请求
const debouncedSearch = useDebounceFn(
  (query: string) => searchLocation(query),
  SEARCH_CONFIG.DEBOUNCE_DELAY,
);

watch(searchQuery, (newQuery) => {
  if (newQuery.trim().length >= SEARCH_CONFIG.MIN_QUERY_LENGTH) {
    debouncedSearch(newQuery);
  }
  else {
    searchResults.value = [];
    showResults.value = false;
  }
});

function selectResult(result: SearchResult) {
  emit("selectLocation", {
    lat: Number.parseFloat(result.lat),
    lon: Number.parseFloat(result.lon),
    name: result.display_name,
  });
  clearSearch();
}

function clearSearch() {
  searchQuery.value = "";
  searchResults.value = [];
  showResults.value = false;
  error.value = null;
}

// 点击外部关闭结果列表
function handleClickOutside() {
  if (showResults.value) {
    showResults.value = false;
  }
}
</script>

<template>
  <div v-click-outside="handleClickOutside" class="relative">
    <!-- 搜索输入框 -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-medium mb-2">搜索地点</span>
      </label>
      <div class="relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="输入地点名称搜索..."
          class="input input-bordered w-full pr-20"
          @focus="showResults = searchResults.length > 0"
        >
        <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            v-if="searchQuery"
            type="button"
            class="btn btn-ghost btn-xs btn-circle"
            @click="clearSearch"
          >
            <Icon name="tabler:x" size="16" />
          </button>
          <Icon
            v-if="loading"
            name="tabler:loader-2"
            size="20"
            class="animate-spin text-primary"
          />
          <Icon
            v-else
            name="tabler:search"
            size="20"
            class="text-base-content/50"
          />
        </div>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="alert alert-error mt-2 text-sm">
      <Icon name="tabler:alert-circle" size="16" />
      <span>{{ error }}</span>
    </div>

    <!-- 搜索结果列表 -->
    <div
      v-if="showResults && searchResults.length > 0"
      class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
    >
      <ul class="menu p-2">
        <li v-for="result in searchResults" :key="result.place_id">
          <button
            type="button"
            class="flex items-start gap-2 text-left"
            @click="selectResult(result)"
          >
            <Icon
              name="tabler:map-pin"
              size="20"
              class="text-primary flex-shrink-0 mt-0.5"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate">
                {{ extractShortLocationName(result.display_name) }}
              </div>
              <div class="text-xs text-base-content/60 line-clamp-2">
                {{ result.display_name }}
              </div>
            </div>
            <Icon
              name="tabler:chevron-right"
              size="16"
              class="text-base-content/30 flex-shrink-0"
            />
          </button>
        </li>
      </ul>
    </div>

    <!-- 无结果提示 -->
    <div
      v-if="showResults && !loading && searchQuery && searchResults.length === 0"
      class="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 text-center text-sm text-base-content/60"
    >
      <Icon
        name="tabler:search-off"
        size="24"
        class="mx-auto mb-2 opacity-50"
      />
      <p>未找到相关地点</p>
    </div>
  </div>
</template>
