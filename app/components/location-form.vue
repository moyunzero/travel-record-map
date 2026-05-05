<script lang="ts" setup>
import type { FetchError } from "ofetch";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { DEFAULT_CENTER } from "~/lib/constants";
import { InsertLocation, type SelectLocation } from "~/lib/db/schema";
import { extractShortLocationName, formatCoordinate } from "~/lib/location-utils";
import { useMapStore } from "../../stores/map";

interface Props {
  mode?: "add" | "edit";
  location?: SelectLocation | null; // 直接传入完整的 location 对象
  submitButtonText?: string;
  showCancel?: boolean;
}

interface Emits {
  (e: "submit", values: { name: string; description?: string; long: number; lat: number }): void;
  (e: "cancel"): void;
  (e: "success"): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "add",
  location: null,
  submitButtonText: "添加地点",
  showCancel: true,
});

const emit = defineEmits<Emits>();
const route = useRoute();

const { $csrfFetch } = useNuxtApp();
const mapStore = useMapStore();

const { handleSubmit, errors, meta, setFieldValue, controlledValues } = useForm({
  validationSchema: toTypedSchema(InsertLocation),
  initialValues: {
    name: props.location?.name || "",
    description: props.location?.description || "",
    long: props.location?.long || DEFAULT_CENTER[0],
    lat: props.location?.lat || DEFAULT_CENTER[1],
  },
});

const loading = ref(false);
const errorMessage = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  errorMessage.value = null;

  try {
    if (props.mode === "edit") {
      // 编辑模式：使用 PUT 方法更新
      if (!props.location?.id) {
        throw new Error("编辑模式下必须提供 location 对象");
      }
      
      await $csrfFetch(`/api/locations/${route.params.slug}`, {
        method: "PUT",
        body: values,
      });
    }
    else {
      // 添加模式：使用 POST 方法创建
      await $csrfFetch("/api/location", {
        method: "POST",
        body: values,
      });
    }

    emit("success");
    emit("submit", values);
  }
  catch (e) {
    const error = e as FetchError;

    // 显示友好的错误信息
    let message = "操作失败，请稍后重试";

    if (error.statusCode === 409) {
      message = error.data?.statusMessage || error.statusMessage || "该地点已存在";
    }
    else if (error.statusCode === 422) {
      message = "请检查输入的数据是否正确";
    }
    else if (error.statusCode === 404) {
      message = "地点不存在";
    }

    errorMessage.value = message;
    emit("error", message);
  }
  finally {
    loading.value = false;
  }
});

// 同步地图标记位置到表单
effect(() => {
  if (mapStore.addedPoint) {
    setFieldValue("long", mapStore.addedPoint.long);
    setFieldValue("lat", mapStore.addedPoint.lat);
  }
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

function handleCancel() {
  emit("cancel");
}

// 暴露表单状态给父组件
defineExpose({
  meta,
  loading,
  errorMessage,
});
</script>

<template>
  <div>
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

      <div class="flex justify-end gap-2 mt-4">
        <button
          v-if="showCancel"
          type="button"
          class="btn btn-outline"
          :disabled="loading"
          @click="handleCancel"
        >
          取消
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="loading"
        >
          {{ submitButtonText }}
          <span v-if="loading" class="loading loading-ring loading-md" />
          <Icon
            v-else
            :name="mode === 'edit' ? 'tabler:edit' : 'tabler:circle-plus-filled'"
            size="24"
          />
        </button>
      </div>
    </form>
  </div>
</template>
