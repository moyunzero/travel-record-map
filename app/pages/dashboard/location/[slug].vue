<script lang="ts" setup>
import type { MapPoint } from "~/lib/types";
import { isPointSelected } from "~/utils/map-point";
import { useLocationStore } from "../../../../stores/locations";
import { useMapStore } from "../../../../stores/map";

const route = useRoute();
const mapStore = useMapStore();
const locationStore = useLocationStore();
const {
  currentLocation: location,
  currentLocationStatus: status,
  currentLocationError: error,
} = storeToRefs(locationStore);

const isOpen = ref(false);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);

// 日志删除相关状态
const isLogDeleteDialogOpen = ref(false);
const isDeletingLog = ref(false);
const deleteLogError = ref<string | null>(null);
const logToDelete = ref<number | null>(null);

// 选中的日志（用于高亮）
const selectedLog = ref<MapPoint | null>(null);

const { $csrfFetch } = useNuxtApp();
const router = useRouter();

onMounted(() => {
  locationStore.refreshCurrentLocation();
});

// 计算地图标记
const mapPoints = computed<MapPoint[]>(() => {
  if (!location.value)
    return [];

  if (location.value.locationLogs && location.value.locationLogs.length > 0) {
    // 如果有日志，显示日志的位置标记
    return location.value.locationLogs.map(log => ({
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
    }));
  }
  else {
    // 如果没有日志，显示地点本身的位置标记
    return [{
      id: location.value.id,
      name: location.value.name,
      description: location.value.description || "",
      lat: location.value.lat,
      long: location.value.long,
      slug: location.value.slug,
      to: {
        name: "dashboard-location-slug",
        params: { slug: location.value.slug },
      },
      toLabel: "查看",
    }];
  }
});

// 使用查看模式的地图标记管理
useViewMapPoints(mapPoints, {
  routeName: "dashboard-location-slug",
});

// 离开页面时的清理已由 useViewMapPoints 处理
// onBeforeRouteLeave 已在 composable 中实现

function openDialog() {
  isOpen.value = true;
  deleteError.value = null;
  (document.activeElement as HTMLAnchorElement).blur();
}

async function confirmDelete() {
  if (isDeleting.value)
    return;
  isOpen.value = false;

  isDeleting.value = true;
  deleteError.value = null;

  try {
    await $csrfFetch(`/api/locations/${route.params.slug}`, {
      method: "DELETE",
    });

    // 删除成功后刷新地点列表并导航回仪表板
    await locationStore.refreshLocations();
    await router.push("/dashboard");
  }
  catch (error: any) {
    // 处理错误
    const message = error.statusCode === 404
      ? "地点不存在或已被删除"
      : "删除失败，请稍后重试";

    deleteError.value = message;
    console.error("删除地点失败:", error);
  }
  finally {
    isDeleting.value = false;
  }
}

// 打开删除日志对话框
function openLogDeleteDialog(logId: number) {
  logToDelete.value = logId;
  isLogDeleteDialogOpen.value = true;
  deleteLogError.value = null;
  (document.activeElement as HTMLAnchorElement).blur();
}

// 确认删除日志
async function confirmLogDelete() {
  if (isDeletingLog.value || !logToDelete.value)
    return;

  isDeletingLog.value = true;
  deleteLogError.value = null;

  try {
    await $csrfFetch(`/api/locations/${route.params.slug}/logs/${logToDelete.value}`, {
      method: "DELETE",
    });

    // 删除成功后刷新当前地点数据
    await locationStore.refreshCurrentLocation();

    // 关闭对话框
    isLogDeleteDialogOpen.value = false;
    logToDelete.value = null;
  }
  catch (error: any) {
    // 处理错误
    const message = error.statusCode === 404
      ? "日志不存在或已被删除"
      : "删除失败，请稍后重试";

    deleteLogError.value = message;
    console.error("删除日志失败:", error);
  }
  finally {
    isDeletingLog.value = false;
  }
}

// 关闭删除日志对话框
function closeLogDeleteDialog() {
  if (!isDeletingLog.value) {
    isLogDeleteDialogOpen.value = false;
    logToDelete.value = null;
    deleteLogError.value = null;
  }
}

// 鼠标悬停日志时高亮
function handleLogHover(log: any) {
  selectedLog.value = {
    id: log.id,
    name: log.name,
    description: log.description || "",
    lat: log.lat,
    long: log.long,
    slug: `${log.id}`,
  };
  mapStore.selectedPoint = selectedLog.value;
}

// 鼠标离开日志时取消高亮
function handleLogLeave() {
  selectedLog.value = null;
  mapStore.selectedPoint = null;
}

// 监听地图选中点的变化，同步到 selectedLog
watch(() => mapStore.selectedPoint, (newPoint) => {
  if (newPoint && location.value?.locationLogs) {
    // 检查选中的点是否是日志
    const matchedLog = location.value.locationLogs.find(log =>
      log.id === newPoint.id && log.lat === newPoint.lat && log.long === newPoint.long,
    );
    if (matchedLog) {
      selectedLog.value = {
        id: matchedLog.id,
        name: matchedLog.name,
        description: matchedLog.description || "",
        lat: matchedLog.lat,
        long: matchedLog.long,
        slug: `${matchedLog.id}`,
      };
    }
    else {
      selectedLog.value = null;
    }
  }
  else {
    selectedLog.value = null;
  }
});

// 格式化日期
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
</script>

<template>
  <div v-if="route.name === 'dashboard-location-slug'" class="p-4 min-h-64 shrink-0">
    <div v-if="status === 'pending'">
      <span class="loading loading-ring loading-md" />
    </div>
    <div v-if="error && status !== 'pending'" class="flex flex-col gap-4">
      <div role="alert" class="alert alert-error">
        <Icon name="tabler:alert-circle" size="24" />
        <span>{{ error.statusMessage || '地点不存在' }}</span>
      </div>
      <p class="text-sm text-base-content/70">
        您访问的地点不存在或已被删除。请返回查看其他地点。
      </p>
    </div>
    <div v-if="location && status !== 'pending'">
      <!-- 地点标题和操作 -->
      <div class="flex items-start justify-between mb-2">
        <div class="flex-1">
          <h2 class="text-2xl font-bold">
            {{ location.name }}
          </h2>
          <p class="text-sm text-base-content/70 mt-1">
            {{ location.description }}
          </p>
        </div>
        <div class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-sm btn-circle"
          >
            <Icon size="20" name="tabler:dots-vertical" />
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow">
            <li>
              <NuxtLink :to="{ name: 'dashboard-location-slug-edit', params: { slug: route.params.slug } }">
                <Icon name="tabler:edit" size="16" />
                编辑地点
              </NuxtLink>
            </li>
            <li>
              <a @click="openDialog">
                <Icon name="tabler:trash-x-filled" size="16" />
                删除地点
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- 日志列表标题 -->
      <div class="flex items-center justify-between mt-6 mb-4">
        <h3 class="text-xl font-semibold">
          旅行日志
        </h3>
        <NuxtLink
          class="btn btn-primary btn-sm"
          :to="{ name: 'dashboard-location-slug-add', params: { slug: route.params.slug } }"
        >
          <Icon name="tabler:map-pin-plus" size="20" />
          添加日志
        </NuxtLink>
      </div>

      <!-- 日志卡片列表（横向滚动） -->
      <div v-if="location.locationLogs.length > 0" class="flex flex-nowrap gap-4 overflow-x-auto pb-2">
        <div
          v-for="log in location.locationLogs"
          :key="log.id"
          class="bg-base-300 rounded-2xl w-56 shrink-0 p-4 border-2 hover:cursor-pointer hover:bg-base-200 transition-colors duration-300 relative"
          :class="{
            'border-accent': isPointSelected(log, selectedLog),
            'border-transparent': !isPointSelected(log, selectedLog),
          }"
          @mouseenter="handleLogHover(log)"
          @mouseleave="handleLogLeave"
          @click="router.push({
            name: 'dashboard-location-slug-logs-id',
            params: { slug: route.params.slug, id: log.id },
          })"
        >
          <!-- 日志内容 -->
          <div class="mb-2">
            <p class="font-bold text-base truncate mb-1">
              {{ log.name }}
            </p>
            <div class="flex items-center gap-1 text-xs text-base-content/60 mb-2">
              <Icon name="tabler:calendar" size="14" />
              <span>{{ formatDate(log.startAt) }}</span>
              <span>-</span>
              <span>{{ formatDate(log.endAt) }}</span>
            </div>
            <p v-if="log.description" class="text-sm text-base-content/70 line-clamp-3">
              {{ log.description }}
            </p>
          </div>

          <!-- 操作按钮 -->
          <div class="absolute top-2 right-2" @click.stop>
            <div class="dropdown dropdown-end">
              <div
                tabindex="0"
                role="button"
                class="btn btn-ghost btn-xs btn-circle"
              >
                <Icon size="14" name="tabler:dots-vertical" />
              </div>
              <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-10 w-32 p-2 shadow">
                <li>
                  <NuxtLink
                    :to="{
                      name: 'dashboard-location-slug-logs-id-edit',
                      params: { slug: route.params.slug, id: log.id },
                    }"
                    class="text-xs"
                  >
                    <Icon name="tabler:edit" size="14" />
                    编辑
                  </NuxtLink>
                </li>
                <li>
                  <a class="text-xs" @click="openLogDeleteDialog(log.id)">
                    <Icon name="tabler:trash-x-filled" size="14" />
                    删除
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col gap-2 mt-4">
        <p class="text-base-content/70">
          还没有旅行日志，开始记录你的旅行经历吧
        </p>
        <NuxtLink
          class="btn btn-primary w-40"
          :to="{ name: 'dashboard-location-slug-add', params: { slug: route.params.slug } }"
        >
          添加日志
          <Icon name="tabler:circle-plus-filled" size="24" />
        </NuxtLink>
      </div>
    </div>

    <!-- 删除地点对话框 -->
    <AppDialog
      title="你确定吗？"
      description="这将会删除该地址及其相关日志"
      confirm-label="确认"
      confirm-class="btn-error"
      :is-open="isOpen"
      :is-loading="isDeleting"
      :error="deleteError"
      @on-closed="isOpen = false"
      @on-confirmed="confirmDelete"
    />

    <!-- 删除日志对话框 -->
    <AppDialog
      title="删除日志"
      description="确定要删除这条旅行日志吗？此操作无法撤销。"
      confirm-label="删除"
      confirm-class="btn-error"
      :is-open="isLogDeleteDialogOpen"
      :is-loading="isDeletingLog"
      :error="deleteLogError"
      @on-closed="closeLogDeleteDialog"
      @on-confirmed="confirmLogDelete"
    />
  </div>
  <NuxtPage v-else />
</template>

<style>

</style>
