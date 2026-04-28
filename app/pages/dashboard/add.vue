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

const onSubmit = handleSubmit(async (values) => {
  try {
    loading.value = true;
    const inserted = await $csrfFetch("/api/location", {
      method: "POST",
      body: values,
    });
    submitted.value = true;
    navigateTo("/dashboard");
  }
  catch (e) {
    const error = e as FetchError;
    console.error("添加地点失败", error.statusMessage);
    return;
  }

  loading.value = false;
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

function onBeforeRouteLeave(arg0: () => boolean) {
  throw new Error("Function not implemented.");
}
