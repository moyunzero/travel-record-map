<script lang="ts" setup>
import { useLocationStore } from "../../../../../stores/locations";
import { useMapStore } from "../../../../../stores/map";

const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();
const mapStore = useMapStore();

const { currentLocation: location, currentLocationStatus: status, currentLocationError: error } = storeToRefs(locationStore);

const submitted = ref(false);
const locationFormRef = ref<InstanceType<typeof LocationForm> | null>(null);

// 确保数据已加载（如果从其他页面直接访问编辑页）
onMounted(async () => {
  if (!location.value) {
    await locationStore.refreshCurrentLocation();
  }
});

// 监听数据加载完成后的错误处理
watchEffect(() => {
  // 只在加载完成后检查错误
  if (status.value === "success" && !location.value) {
    // 地点不存在，跳转回 dashboard
    navigateTo("/dashboard");
  }
});

// 使用表单路由守卫
useFormRouteGuard({
  formRef: locationFormRef,
  submitted,
  onLeave: () => {
    mapStore.addedPoint = null;
  },
});

// 设置地图标记（当数据加载完成后）
watch(location, (newLocation) => {
  if (newLocation) {
    // 清理之前的选中状态
    mapStore.selectedPoint = null;

    // 设置编辑模式的地图标记
    nextTick(() => {
      mapStore.addedPoint = { ...newLocation };
    });
  }
}, { immediate: true });

function handleSuccess() {
  submitted.value = true;
  // 刷新地点数据
  locationStore.refreshLocations();
  locationStore.refreshCurrentLocation();
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
        <h3 class="font-bold">加载失败</h3>
        <div class="text-sm">{{ error.statusMessage || "无法加载地点信息" }}</div>
      </div>
    </div>

    <!-- 编辑表单 -->
    <template v-else-if="location">
      <LocationForm
        ref="locationFormRef"
        mode="edit"
        :location="location"
        submit-button-text="保存修改"
        @success="handleSuccess"
        @cancel="handleCancel"
      />
    </template>
  </div>
</template>
