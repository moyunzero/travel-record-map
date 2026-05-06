<script lang="ts" setup>
import { DEFAULT_CENTER } from "~/lib/constants";
import { InsertLocation } from "~/lib/db/schema";
import { useMapStore } from "../../../stores/map";

const router = useRouter();
const mapStore = useMapStore();
const submitted = ref(false);
const locationFormRef = ref<{ meta: any } | null>(null);

// 使用表单路由守卫
useFormRouteGuard({
  formRef: locationFormRef,
  submitted,
  onLeave: () => {
    mapStore.addedPoint = null;
  },
});

onMounted(() => {
  // 清理之前的选中状态，避免影响 flyTo
  mapStore.selectedPoint = null;

  // 使用 nextTick 确保在 DOM 更新后设置 addedPoint
  nextTick(() => {
    mapStore.addedPoint = {
      id: mapStore.TEMP_POINT_ID,
      name: "增加地点",
      description: "",
      lat: DEFAULT_CENTER[1],
      long: DEFAULT_CENTER[0],
    };
  });
});

function handleSuccess() {
  submitted.value = true;
  navigateTo("/dashboard");
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <div class="shrink-0 w-full max-w-md p-4 overflow-auto">
    <div class="my-4">
      <h1 class="text-lg">
        添加地点
      </h1>
      <p class="text-sm">
        添加你旅行过的地点，记录你的旅行足迹
      </p>
    </div>

    <LocationBaseForm
      ref="locationFormRef"
      mode="add"
      :validation-schema="InsertLocation"
      :initial-values="{
        name: '',
        description: '',
        long: DEFAULT_CENTER[0],
        lat: DEFAULT_CENTER[1],
      }"
      api-url="/api/location"
      submit-button-text="添加地点"
      :show-location-search="true"
      coordinate-label="设置地点位置"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>
