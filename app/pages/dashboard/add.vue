<script lang="ts" setup>
import type { FetchError } from "ofetch";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { ref } from "vue";
import { InsertLocation } from "~/lib/db/schema";

const { $csrfFetch } = useNuxtApp();

const { handleSubmit, errors, meta } = useForm({
  validationSchema: toTypedSchema(InsertLocation),
});

const router = useRouter();
const loading = ref(false);
const submitted = ref(false);
const errorMessage = ref<string | null>(null);

const onSubmit = handleSubmit(async (values) => {
  try {
    loading.value = true;
    errorMessage.value = null;
    const inserted = await $csrfFetch("/api/location", {
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

onBeforeRouteLeave(() => {
  if (!submitted.value && meta.value.dirty) {
    const confirm = window.confirm("你有未保存的更改，确定要离开吗？");
    if (!confirm) {
      return false;
    }
  }
  return true;
});
</script>

<template>
  <div class="container max-w-md mx-auto">
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
      <!-- TODO:经纬度表单处理 -->
      <AppFormField
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
      />
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
