<script lang="ts" setup>
import type { FetchError } from "ofetch";
import { z } from "zod";
import { DEFAULT_CENTER } from "~/lib/constants";
import { InsertLocationLog, type SelectLocationLog } from "~/lib/db/schema/location-log";

// Props 定义
interface Props {
  mode?: "add" | "edit";
  locationLog?: SelectLocationLog | null;
  submitButtonText?: string;
  showCancel?: boolean;
  apiUrl: string; // API 端点 URL
  initialLat?: number; // 初始纬度
  initialLong?: number; // 初始经度
}

// Emits 定义
interface Emits {
  (e: "submit", values: { name: string; description?: string; long: number; lat: number; startAt: number; endAt: number }): void;
  (e: "cancel"): void;
  (e: "success"): void;
  (e: "error", error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "add",
  locationLog: null,
  submitButtonText: "添加日志",
  showCancel: true,
});

const emit = defineEmits<Emits>();

const { $csrfFetch } = useNuxtApp();
const baseFormRef = ref<InstanceType<typeof LocationBaseForm> | null>(null);

// 日期/时间戳转换函数
const convertDateToTimestamp = (dateString: string): number => {
  // 将日期字符串转换为当天 00:00:00 的时间戳（毫秒）
  return new Date(dateString + "T00:00:00").getTime();
};

const convertTimestampToDate = (timestamp: number): string => {
  // 将时间戳转换为 YYYY-MM-DD 格式
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 扩展的验证 Schema（使用日期字符串）
const LocationLogFormSchema = InsertLocationLog.omit({
  startAt: true,
  endAt: true,
}).extend({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式必须为 YYYY-MM-DD"),
}).refine(
  data => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "结束日期不能早于开始日期",
    path: ["endDate"],
  },
);

// 初始化表单值
const initializeValues = () => {
  if (props.mode === "edit" && props.locationLog) {
    return {
      name: props.locationLog.name,
      description: props.locationLog.description || "",
      long: props.locationLog.long,
      lat: props.locationLog.lat,
      startDate: convertTimestampToDate(props.locationLog.startAt),
      endDate: convertTimestampToDate(props.locationLog.endAt),
    };
  }

  // 添加模式：使用传入的初始坐标或默认坐标
  const today = new Date().toISOString().split("T")[0];
  return {
    name: "",
    description: "",
    long: props.initialLong ?? DEFAULT_CENTER[0],
    lat: props.initialLat ?? DEFAULT_CENTER[1],
    startDate: today,
    endDate: today,
  };
};

// 处理提交：将日期转换为时间戳并调用 API
const handleSubmit = async (values: any) => {
  if (!baseFormRef.value) return;
  
  baseFormRef.value.setLoading(true);
  baseFormRef.value.setErrorMessage(null);

  const submitData = {
    name: values.name,
    description: values.description,
    long: values.long,
    lat: values.lat,
    startAt: convertDateToTimestamp(values.startDate),
    endAt: convertDateToTimestamp(values.endDate),
  };

  try {
    const method = props.mode === "edit" ? "PUT" : "POST";
    await $csrfFetch(props.apiUrl, {
      method,
      body: submitData,
    });

    emit("success");
    emit("submit", submitData);
  }
  catch (e) {
    const error = e as FetchError;

    // 显示友好的错误信息
    let message = "操作失败，请稍后重试";

    if (error.statusCode === 404) {
      message = error.data?.statusMessage || error.statusMessage || "资源不存在";
    }
    else if (error.statusCode === 422) {
      message = "请检查输入的数据是否正确";
    }

    baseFormRef.value.setErrorMessage(message);
    emit("error", message);
  }
  finally {
    baseFormRef.value.setLoading(false);
  }
};

// 暴露表单状态给父组件
defineExpose({
  meta: computed(() => baseFormRef.value?.meta),
  loading: computed(() => baseFormRef.value?.loading),
  errorMessage: computed(() => baseFormRef.value?.errorMessage),
});
</script>

<template>
  <LocationBaseForm
    v-if="mode === 'add' || locationLog"
    :key="mode === 'edit' && locationLog ? `edit-${locationLog.id}` : 'add'"
    ref="baseFormRef"
    :mode="mode"
    :validation-schema="LocationLogFormSchema"
    :initial-values="initializeValues()"
    api-url=""
    :submit-button-text="submitButtonText"
    :show-cancel="showCancel"
    :show-location-search="false"
    coordinate-label="设置日志位置"
    @submit="handleSubmit"
    @cancel="emit('cancel')"
  >
    <!-- 在名称和描述之后插入日期字段 -->
    <template #fields-after="{ errors, loading: formLoading }">
      <AppFormField
        label="开始日期"
        name="startDate"
        type="date"
        :error="errors.startDate"
        :disabled="formLoading"
      />
      <AppFormField
        label="结束日期"
        name="endDate"
        type="date"
        :error="errors.endDate"
        :disabled="formLoading"
      />
    </template>
  </LocationBaseForm>
</template>
