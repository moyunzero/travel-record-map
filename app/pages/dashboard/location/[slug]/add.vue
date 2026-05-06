<script lang="ts" setup>
import { useLocationStore } from "../../../../../stores/locations";

const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();

const submitted = ref(false);
const locationLogFormRef = ref<InstanceType<typeof LocationLogForm> | null>(null);

// 获取当前地点信息
const { currentLocation, currentLocationStatus: status } = storeToRefs(locationStore);

// 确保数据已加载
onMounted(async () => {
  if (!currentLocation.value) {
    await locationStore.refreshCurrentLocation();
  }
});

// 构建 API URL
const apiUrl = computed(() => `/api/locations/${route.params.slug}/log`);

// 地图标记坐标（使用地点的坐标作为初始位置）
const mapCoordinates = computed(() => {
  if (!currentLocation.value)
    return null;
  return {
    lat: currentLocation.value.lat,
    long: currentLocation.value.long,
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
  // 刷新当前地点数据以显示新添加的日志
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

    <!-- 表单内容 -->
    <template v-else-if="currentLocation">
      <div class="my-4">
        <h1 class="text-lg">
          添加日志
        </h1>
        <p class="text-sm">
          记录你在这个地点的旅行经历
        </p>
      </div>

      <LocationLogForm
        ref="locationLogFormRef"
        mode="add"
        :api-url="apiUrl"
        :initial-lat="currentLocation.lat"
        :initial-long="currentLocation.long"
        submit-button-text="添加日志"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </template>
  </div>
</template>
