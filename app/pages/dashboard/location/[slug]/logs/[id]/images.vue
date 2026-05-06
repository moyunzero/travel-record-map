<script lang="ts" setup>
import type { SelectLocationLogImage } from "~/lib/db/schema";
import { FetchError } from "ofetch";
import { useLocationStore } from "../../../../../../../stores/locations";

const route = useRoute();
const router = useRouter();
const locationStore = useLocationStore();

// 从 store 获取当前地点数据
const {
  currentLocation,
  currentLocationStatus,
} = storeToRefs(locationStore);

// 计算当前日志
const locationLog = computed(() => {
  if (!currentLocation.value?.locationLogs)
    return null;
  const logId = Number(route.params.id);
  return currentLocation.value.locationLogs.find(log => log.id === logId) || null;
});

const { $csrfFetch } = useNuxtApp();

const image = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const imageInput = useTemplateRef("imageInput");
const isOpen = ref(false);
const isDeleting = ref(false);
const deletingImage = ref<SelectLocationLogImage | null>(null);

// 初始化时加载数据
onMounted(() => {
  locationStore.refreshCurrentLocation();
});

// 获取错误消息的辅助函数
function getFetchErrorMessage(error: FetchError): string {
  return error.statusMessage || error.message || "未知错误";
}

function onDialogClose() {
  deletingImage.value = null;
  isOpen.value = false;
}

function deleteImage(image: SelectLocationLogImage) {
  deletingImage.value = image;
  isOpen.value = true;
}

async function confirmDelete() {
  if (!deletingImage.value) {
    return;
  }
  isOpen.value = false;
  try {
    isDeleting.value = true;
    errorMessage.value = "";

    // 调用删除API
    await $fetch(`/api/locations/${route.params.slug}/logs/${route.params.id}/images/${deletingImage.value.id}`, {
      method: "DELETE",
    });

    // 刷新当前地点数据
    await locationStore.refreshCurrentLocation();
  }
  catch (e) {
    const error = e as FetchError;
    errorMessage.value = getFetchErrorMessage(error);
  }
  finally {
    isDeleting.value = false;
    deletingImage.value = null;
  }
}

function selectImage(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    image.value = file;
    previewUrl.value = URL.createObjectURL(file);
  }
}

async function getChecksum(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

async function uploadImage() {
  if (!image.value || !previewUrl.value)
    return;

  loading.value = true;
  errorMessage.value = "";

  const previewImage = new Image();
  previewImage.addEventListener("load", async () => {
    try {
      const width = Math.min(1000, previewImage.width);
      const resized = await createImageBitmap(previewImage, {
        resizeWidth: width,
      });
      const canvas = new OffscreenCanvas(width, resized.height);
      canvas.getContext("bitmaprenderer")?.transferFromImageBitmap(resized);
      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: 0.9,
      });

      const checksum = await getChecksum(blob);

      // 第一步：获取签名URL
      const { fields, key, url } = await $csrfFetch(`/api/locations/${route.params.slug}/logs/${route.params.id}/sign-image`, {
        method: "POST",
        body: {
          contentLength: blob.size,
          checksum,
        },
      });

      // 第二步：上传到S3
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", blob);

      await $fetch(url, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "image/jpeg",
          "x-amz-checksum-sha256": checksum,
        },
      });

      // 第三步：保存图片记录到数据库
      await $csrfFetch(`/api/locations/${route.params.slug}/logs/${route.params.id}/images`, {
        method: "POST",
        body: {
          key,
        },
      });

      // 刷新当前地点数据
      await locationStore.refreshCurrentLocation();

      // 重置表单
      image.value = null;
      previewUrl.value = null;
      if (imageInput.value) {
        imageInput.value.value = "";
      }
    }
    catch (e) {
      if (e instanceof FetchError) {
        errorMessage.value = getFetchErrorMessage(e);
      }
      else if (e instanceof Error) {
        errorMessage.value = e.message;
      }
      else {
        errorMessage.value = "未知错误";
      }
    }
    finally {
      loading.value = false;
    }
  });

  previewImage.addEventListener("error", () => {
    errorMessage.value = "图片加载失败";
    loading.value = false;
  });

  previewImage.src = previewUrl.value;
}

// 返回日志详情
function backToLog() {
  router.push({
    name: "dashboard-location-slug-logs-id",
    params: { slug: route.params.slug, id: route.params.id },
  });
}
</script>

<template>
  <div class="m-4">
    <h2 class="mb-4">
      管理 "{{ locationLog?.name || "Loading..." }}" 的图片
    </h2>
    <div class="flex">
      <div class="flex gap-2 flex-col w-72 shrink-0">
        <div class="bg-gray-500 h-28 w-full flex justify-center items-center p-1 relative">
          <p v-if="!previewUrl" class="text-center text-white">
            选择一张图片
          </p>
          <img
            v-else
            :src="previewUrl"
            class="h-full object-cover"
            alt="upload preview"
          >
          <div v-if="loading || errorMessage" class="size-full absolute flex justify-center items-center bg-black opacity-50">
            <div v-if="loading" class="loading loading-lg" />
            <div v-else-if="errorMessage" class="error">
              {{ errorMessage }}
            </div>
          </div>
        </div>
        <input
          ref="imageInput"
          type="file"
          class="file-input"
          :disabled="loading"
          @change="selectImage"
        >
        <button
          class="btn btn-primary"
          :disabled="!image || loading"
          @click="uploadImage"
        >
          上传
          <Icon name="tabler:photo-share" size="24" />
        </button>
      </div>
      <ImageList class="ml-2" :images="locationLog?.images || []">
        <template #card-bottom="{ image: item }">
          <button
            :disabled="deletingImage === item && isDeleting"
            class="btn btn-circle btn-sm bg-error/90 hover:bg-error border-none text-white"
            @click.stop="deleteImage(item)"
          >
            <div v-if="deletingImage === item && isDeleting" class="loading loading-xs" />
            <Icon
              v-else
              name="tabler:trash"
              size="20"
            />
          </button>
        </template>
      </ImageList>
    </div>
    <AppDialog
      title="确认删除？"
      description="删除图片后无法恢复。确定要删除这张图片吗？"
      confirm-label="确认删除"
      confirm-class="btn-error"
      :is-open="isOpen"
      @on-closed="onDialogClose"
      @on-confirmed="confirmDelete"
    />
  </div>
</template>
