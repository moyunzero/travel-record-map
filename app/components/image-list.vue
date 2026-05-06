<script lang="ts" setup>
import type { SelectLocationLogImage } from "~/lib/db/schema";

const props = defineProps<{
  images: SelectLocationLogImage[];
}>();

const selectedImage = ref<string | null>(null);

// 预签名 URL 缓存：key → signed URL
const signedUrlMap = ref<Record<string, string>>({});
const loadingUrls = ref(false);

async function fetchSignedUrls(images: SelectLocationLogImage[]) {
  if (!images.length)
    return;

  // 只请求还没有缓存的 key
  const missing = images.map(i => i.key).filter(k => !signedUrlMap.value[k]);
  if (!missing.length)
    return;

  const { $csrfFetch } = useNuxtApp();
  loadingUrls.value = true;
  try {
    const results = await $csrfFetch<{ key: string; url: string }[]>("/api/images/sign", {
      method: "POST",
      body: { keys: missing },
    });
    for (const { key, url } of results) {
      signedUrlMap.value[key] = url;
    }
  }
  catch (e) {
    console.error("获取图片签名 URL 失败", e);
  }
  finally {
    loadingUrls.value = false;
  }
}

function getImageUrl(image: SelectLocationLogImage): string {
  return signedUrlMap.value[image.key] || "";
}

function showImage(image: SelectLocationLogImage) {
  const url = getImageUrl(image);
  if (url)
    selectedImage.value = url;
}

function closeGallery() {
  selectedImage.value = null;
}

// 监听 images 变化，自动获取签名 URL
watch(() => props.images, (images) => {
  fetchSignedUrls(images);
}, { immediate: true });
</script>

<template>
  <div class="flex gap-4 overflow-x-auto pb-4">
    <div
      v-for="image in images"
      :key="image.id"
      class="group relative w-64 shrink-0"
    >
      <!-- 图片容器 -->
      <div class="relative aspect-[4/3] overflow-hidden rounded-lg bg-base-300 shadow-md transition-all duration-300 hover:shadow-xl">
        <!-- 加载中占位 -->
        <div v-if="!getImageUrl(image)" class="size-full flex items-center justify-center">
          <div class="loading loading-sm" />
        </div>
        <img
          v-else
          class="size-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          :src="getImageUrl(image)"
          :alt="image.key"
          @click="showImage(image)"
        >

        <!-- 悬停时显示的操作层 -->
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div class="flex gap-2">
            <!-- 查看按钮 -->
            <button
              class="btn btn-circle btn-sm bg-white/90 hover:bg-white border-none text-base-content"
              @click="showImage(image)"
            >
              <Icon name="tabler:eye" size="20" />
            </button>

            <!-- 删除按钮插槽 -->
            <div class="flex items-center">
              <slot :image name="card-bottom" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div
      v-if="selectedImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      @click="closeGallery"
    >
      <button
        class="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/20"
        @click.stop="closeGallery"
      >
        <Icon name="tabler:x" size="24" />
      </button>
      <img
        :src="selectedImage"
        class="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
        alt="预览图片"
        @click.stop
      >
    </div>
  </div>
</template>
