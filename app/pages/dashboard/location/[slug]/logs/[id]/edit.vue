<script lang="ts" setup>
import type { SelectLocationLog } from "~/lib/db/schema/location-log";
import { useLocationStore } from "../../../../../../../stores/locations";

const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();

const submitted = ref(false);
const locationLogFormRef = ref<InstanceType<typeof LocationLogForm> | null>(null);

// 获取日志数据
const { data: locationLog, status, error } = await useFetch<SelectLocationLog>(
  `/api/locations/${route.params.slug}/logs/${route.params.id}`,
);

// 构建 API URL
const apiUrl = computed(() => `/api/locations/${route.params.slug}/logs/${route.params.id}`);

// 监听数据加载完成后的错误处理
watchEffect(() => {
  // 只在加载完成后检查错误
  if (status.value === "success" && !locationLog.value) {
    // 日志不存在，跳转回地点详情页
    navigateTo(`/dashboard/location/${route.params.slug}`);
  }
});

// 地图标记坐标（使用日志的坐标）
const mapCoordinates = computed(() => {
  if (!locationLog.value)
    return null;
  return {
    lat: locationLog.value.lat,
    long: locationLog.value.long,
  };
});

// 使用编辑地图标记管理
useEditMapPoint(mapCoordinates);

// 使用表单路由守卫
useFormRouteGuard({
  formRef: locationLogFormRef,
  submitted,
});

async function handleSuccess() {
  submitted.value = true;
  // 刷新当前地点数据以显示更新后的日志
  await locationStore.refreshCurrentLocation();
  // 返回地点详情页
  navigateTo(`/dashboard/location/${route.params.slug}`);
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <div class="shrink-0 w-full max-w-md p-4 overflow-auto">
    <!-- 加载状态 -->
    <div v-if="status === 'pending'" class="flex items-center justify-center min-h-64">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="alert alert-error">
      <Icon name="tabler:alert-circle" size="20" />
      <div>
        <h3 class="font-bold">
          加载失败
        </h3>
        <div class="text-sm">
          {{ error.statusMessage || "无法加载日志信息" }}
        </div>
      </div>
    </div>

    <!-- 编辑表单 -->
    <template v-else-if="locationLog">
      <div class="my-4">
        <h1 class="text-lg">
          编辑日志
        </h1>
        <p class="text-sm">
          修改你的旅行日志信息
        </p>
      </div>

      <LocationLogForm
        ref="locationLogFormRef"
        mode="edit"
        :location-log="locationLog"
        :api-url="apiUrl"
        submit-button-text="保存修改"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </template>
  </div>
</template>
