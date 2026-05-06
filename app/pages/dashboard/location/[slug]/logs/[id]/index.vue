<script lang="ts" setup>
import type { MapPoint } from "~/lib/types";
import { useLocationStore } from "../../../../../../../stores/locations";
import { useMapStore } from "../../../../../../../stores/map";

const route = useRoute();
const router = useRouter();
const mapStore = useMapStore();
const locationStore = useLocationStore();

const {
  currentLocation: location,
  currentLocationStatus: status,
  currentLocationError: error,
} = storeToRefs(locationStore);

// 当前日志
const currentLog = computed(() => {
  if (!location.value?.locationLogs)
    return null;
  const logId = Number(route.params.id);
  return location.value.locationLogs.find(log => log.id === logId) || null;
});

onMounted(() => {
  locationStore.refreshCurrentLocation();
});

// 计算地图标记（该地点的所有日志）
const mapPoints = computed<MapPoint[]>(() => {
  if (!location.value?.locationLogs)
    return [];

  return location.value.locationLogs.map(l => ({
    id: l.id,
    name: l.name,
    description: l.description || "",
    lat: l.lat,
    long: l.long,
    slug: `${l.id}`,
    to: {
      name: "dashboard-location-slug-logs-id",
      params: { slug: route.params.slug, id: l.id },
    },
    toLabel: "查看",
  }));
});

// 计算选中的标记（当前日志）
const selectedMapPoint = computed<MapPoint | null>(() => {
  const log = currentLog.value;
  if (!log)
    return null;

  return {
    id: log.id,
    name: log.name,
    description: log.description || "",
    lat: log.lat,
    long: log.long,
    slug: `${log.id}`,
    to: {
      name: "dashboard-location-slug-logs-id",
      params: { slug: route.params.slug, id: log.id },
    },
    toLabel: "查看",
  };
});

// 使用查看模式的地图标记管理
useViewMapPoints(mapPoints, {
  selectedPoint: selectedMapPoint,
  routeName: "dashboard-location-slug-logs-id",
});

// 离开页面时的清理已由 useViewMapPoints 处理
// onBeforeRouteLeave 已在 composable 中实现

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// 格式化日期范围
function formatDateRange(startAt: number, endAt: number): string {
  return `${formatDate(startAt)} - ${formatDate(endAt)}`;
}

// 返回地点详情
function backToLocation() {
  router.push({
    name: "dashboard-location-slug",
    params: { slug: route.params.slug },
  });
}

// 跳转到图片管理页面
function goToManageImages() {
  router.push({
    name: "dashboard-location-slug-logs-id-images",
    params: { slug: route.params.slug, id: route.params.id },
  });
}
</script>

<template>
  <div class="p-4 min-h-64 shrink-0">
    <!-- 加载状态 -->
    <div v-if="status === 'pending'" class="flex justify-center py-8">
      <span class="loading loading-ring loading-lg" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error && status !== 'pending'" class="flex flex-col gap-4">
      <div role="alert" class="alert alert-error">
        <Icon name="tabler:alert-circle" size="24" />
        <span>{{ error.statusMessage || '日志不存在' }}</span>
      </div>
      <p class="text-sm text-base-content/70">
        您访问的日志不存在或已被删除。请返回查看其他日志。
      </p>
      <button class="btn btn-primary w-32" @click="backToLocation">
        <Icon name="tabler:arrow-left" size="20" />
        返回地点
      </button>
    </div>

    <!-- 日志详情 -->
    <div v-else-if="currentLog && location && status !== 'pending'">
      <!-- 返回按钮 -->
      <button
        class="btn btn-ghost btn-sm mb-4 gap-2 -ml-2"
        @click="backToLocation"
      >
        <Icon name="tabler:arrow-left" size="20" />
        返回
      </button>

      <!-- 日志标题和描述 - 限制最大宽度 -->
      <div class="max-w-4xl">
        <!-- 日志标题 -->
        <div class="mb-6">
          <h2 class="text-3xl font-bold mb-3">
            {{ currentLog.name }}
          </h2>
          <div class="flex items-center gap-2 text-base text-base-content/70">
            <Icon name="tabler:calendar" size="18" />
            <span>{{ formatDateRange(currentLog.startAt, currentLog.endAt) }}</span>
          </div>
        </div>

        <!-- 日志描述 -->
        <div v-if="currentLog.description" class="mb-8">
          <p class="text-base leading-relaxed text-base-content/90 whitespace-pre-wrap">
            {{ currentLog.description }}
          </p>
        </div>
      </div>

      <!-- 图片展示区域（仅在有图片时显示） -->
      <div v-if="currentLog.images && currentLog.images.length > 0" class="mb-8">
        <div class="flex items-center gap-2.5 mb-4">
          <h3 class="text-lg font-semibold flex items-center gap-2">
            <Icon name="tabler:photo" size="20" />
            图片 ({{ currentLog.images.length }})
          </h3>
          <button
            class="btn btn-sm btn-ghost gap-2"
            @click="goToManageImages"
          >
            <Icon name="tabler:settings" size="16" />
            管理
          </button>
        </div>
        <ImageList :images="currentLog.images" />
      </div>
    </div>
  </div>
</template>
