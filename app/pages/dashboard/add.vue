<script lang="ts" setup>
import type { FetchError } from "ofetch";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { nextTick, ref } from "vue";
import { DEFAULT_CENTER } from "~/lib/constants";
import { InsertLocation } from "~/lib/db/schema";
import { extractShortLocationName, formatCoordinate } from "~/lib/location-utils";
import { useMapStore } from "../../../stores/map";

const { $csrfFetch } = useNuxtApp();

const { handleSubmit, errors, meta, setFieldValue, controlledValues } = useForm({
  validationSchema: toTypedSchema(InsertLocation),
  initialValues: {
    name: "",
    description: "",
    long: DEFAULT_CENTER[0],
    lat: DEFAULT_CENTER[1],
  },
});

const router = useRouter();
const loading = ref(false);
const submitted = ref(false);
const errorMessage = ref<string | null>(null);
const mapStore = useMapStore();

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  errorMessage.value = null;

  try {
    await $csrfFetch("/api/location", {
      method: "POST",
      body: values,
    });
    submitted.value = true;
    navigateTo("/dashboard");
  }
  catch (e) {
    const error = e as FetchError;

    // 显示友好的错误信息
    if (error.statusCode === 409) {
      errorMessage.value = error.data?.statusMessage || error.statusMessage || "该地点已存在";
    }
    else if (error.statusCode === 422) {
      errorMessage.value = "请检查输入的数据是否正确";
    }
    else {
      errorMessage.value = "添加地点失败，请稍后重试";
    }
  }
  finally {
    loading.value = false;
  }
});

effect(() => {
  if (mapStore.addedPoint) {
    setFieldValue("long", mapStore.addedPoint.long);
    setFieldValue("lat", mapStore.addedPoint.lat);
  }
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
      long: DEFAULT_CENTER[0],
      lat: DEFAULT_CENTER[1],
    };
  });
});

// 处理搜索结果选择
function handleLocationSelect(location: { lat: number; lon: number; name: string }) {
  // 更新地图标记位置并触发 flyTo（表单字段会通过 effect 自动同步）
  mapStore.setAddedPointLocation(location.lat, location.lon, true);

  // 如果名称字段为空，自动填充搜索结果的名称
  const currentName = controlledValues.value.name;
  if (!currentName) {
    setFieldValue("name", extractShortLocationName(location.name));
  }
}

onBeforeRouteLeave(() => {
  if (!submitted.value && meta.value.dirty) {
    const confirm = window.confirm("你有未保存的更改，确定要离开吗？");
    if (!confirm) {
      return false;
    }
  }
  mapStore.addedPoint = null;
  return true;
});
</script>

<template>
  <div class="container max-w-md mx-auto p-4">
    <div class="my-4">
      <h1 class="text-lg">
        添加地点
      </h1>
      <p class="text-sm">
        添加你旅行过的地点，记录你的旅行足迹
      </p>
    </div>

    <!-- 错误提示 -->
    <div v-if="errorMessage" class="alert alert-error mb-4">
      <Icon name="tabler:alert-circle" size="20" />
      <span>{{ errorMessage }}</span>
    </div>

    <form class="flex flex-col gap-2" @submit.prevent="onSubmit">
      <AppFormField
        label="名称"
        name="name"
        :error="errors.name"
        :disabled="loading"
      />
      <AppFormField
        label="描述"
        name="description"
        :error="errors.description"
        type="textarea"
        :disabled="loading"
      />

      <!-- 地点搜索组件 -->
      <AppLocationSearch @select-location="handleLocationSelect" />

      <div class="bg-base-200 rounded-lg p-4 space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <Icon
            name="tabler:info-circle"
            class="text-info"
            size="20"
          />
          <span class="font-medium">设置地点位置</span>
        </div>
        <ul class="text-sm space-y-1 ml-7">
          <li class="flex items-center gap-1">
            <span>• 拖拽</span>
            <Icon
              name="tabler:map-pin-filled"
              class="text-warning"
              size="16"
            />
            <span>标记到目标位置</span>
          </li>
          <li>• 或双击地图直接定位</li>
        </ul>
        <div class="text-xs text-base-content/60 ml-7">
          当前坐标：{{ formatCoordinate(controlledValues.long as number) }}, {{ formatCoordinate(controlledValues.lat as number) }}
        </div>
      </div>
      <!-- TODO:经纬度表单处理 -->
      <!-- <AppFormField
        label="经度"
        name="long"
        :error="errors.long"
        :disabled="loading"
      />
      <AppFormField
        label="纬度"
        name="lat"
        :error="errors.lat"
        :disabled="loading"
      /> -->
      <div class="flex justify-end gap-2 mt-4">
        <button
          type="button"
          class="btn btn-outline"
          :disabled="loading"
          @click="router.back()"
        >
          取消
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          添加地点
          <span v-if="loading" class="loading loading-ring loading-md" />
          <Icon
            v-else
            name="tabler:circle-plus-filled"
            size="24"
          />
        </button>
      </div>
    </form>
  </div>
</template>
