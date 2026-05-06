<script lang="ts" setup generic="T extends Record<string, any>">
import type { FetchError } from "ofetch";
import type { ZodSchema } from "zod";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { extractShortLocationName, formatCoordinate } from "~/lib/location-utils";
import { useMapStore } from "../../stores/map";

type Props = {
  mode?: "add" | "edit";
  validationSchema: ZodSchema<T>; // 验证 schema
  initialValues: T; // 初始值
  apiUrl: string; // API 端点 URL
  submitButtonText?: string;
  showCancel?: boolean;
  showLocationSearch?: boolean; // 是否显示地点搜索
  coordinateLabel?: string; // 坐标提示文本
};

type Emits = {
  (e: "submit", values: T): void;
  (e: "cancel"): void;
  (e: "success"): void;
  (e: "error", error: string): void;
};

const props = withDefaults(defineProps<Props>(), {
  mode: "add",
  submitButtonText: "提交",
  showCancel: true,
  showLocationSearch: false,
  coordinateLabel: "设置位置",
});

const emit = defineEmits<Emits>();

const { $csrfFetch } = useNuxtApp();
const mapStore = useMapStore();

const { handleSubmit, errors, meta, setFieldValue, controlledValues } = useForm({
  validationSchema: toTypedSchema(props.validationSchema),
  initialValues: props.initialValues,
});

const loading = ref(false);
const errorMessage = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  loading.value = true;
  errorMessage.value = null;

  try {
    // If apiUrl is provided, make the API call
    if (props.apiUrl) {
      const method = props.mode === "edit" ? "PUT" : "POST";
      await $csrfFetch(props.apiUrl, {
        method,
        body: values,
      });

      emit("success");
    }

    // Always emit submit event (parent can handle API call if apiUrl is empty)
    emit("submit", values);
  }
  catch (e) {
    const error = e as FetchError;

    // 显示友好的错误信息
    let message = "操作失败，请稍后重试";

    if (error.statusCode === 409) {
      message = error.data?.statusMessage || error.statusMessage || "该资源已存在";
    }
    else if (error.statusCode === 422) {
      message = "请检查输入的数据是否正确";
    }
    else if (error.statusCode === 404) {
      message = "资源不存在";
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
    // 只在坐标真正改变时才更新字段，避免触发不必要的 dirty 状态
    const currentLong = controlledValues.value.long;
    const currentLat = controlledValues.value.lat;

    if (currentLong !== mapStore.addedPoint.long) {
      setFieldValue("long", mapStore.addedPoint.long);
    }
    if (currentLat !== mapStore.addedPoint.lat) {
      setFieldValue("lat", mapStore.addedPoint.lat);
    }
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

// 暴露表单状态和方法给父组件
defineExpose({
  meta,
  loading,
  errorMessage,
  errors,
  controlledValues,
  setFieldValue,
  setLoading: (value: boolean) => { loading.value = value; },
  setErrorMessage: (value: string | null) => { errorMessage.value = value; },
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
      <!-- 自定义字段插槽（在默认字段之前） -->
      <slot
        name="fields-before"
        :errors="errors"
        :loading="loading"
      />

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

      <!-- 自定义字段插槽（在默认字段之后） -->
      <slot
        name="fields-after"
        :errors="errors"
        :loading="loading"
      />

      <!-- 地点搜索组件（可选） -->
      <AppLocationSearch v-if="showLocationSearch" @select-location="handleLocationSelect" />

      <div class="bg-base-200 rounded-lg p-4 space-y-2">
        <div class="flex items-center gap-2 text-sm">
          <Icon
            name="tabler:info-circle"
            class="text-info"
            size="20"
          />
          <span class="font-medium">{{ coordinateLabel }}</span>
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
