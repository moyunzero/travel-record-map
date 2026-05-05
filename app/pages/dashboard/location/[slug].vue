<script lang="ts" setup>
import { useLocationStore } from "../../../../stores/locations";
import { useMapStore } from "../../../../stores/map";

const route = useRoute();
const mapStore = useMapStore();
const locationStore = useLocationStore();
const {
  currentLocation: location,
  currentLocationStatus: status,
  currentLocationError: error,
} = storeToRefs(locationStore);

const isOpen = ref(false);
const isDeleting = ref(false);
const deleteError = ref<string | null>(null);

const { $csrfFetch } = useNuxtApp();
const router = useRouter();

onMounted(() => {
  locationStore.refreshCurrentLocation();
});

// 离开页面时恢复所有地点
onBeforeRouteLeave(() => {
  mapStore.restoreAllMapPoints();
  return true;
});

function openDialog() {
  isOpen.value = true;
  deleteError.value = null;
  (document.activeElement as HTMLAnchorElement).blur()

}

async function confirmDelete() {
  if (isDeleting.value) return;
  isOpen.value = false;

  isDeleting.value = true;
  deleteError.value = null;

  try {
    await $csrfFetch(`/api/locations/${route.params.slug}`, {
      method: "DELETE",
    });

    // 删除成功后刷新地点列表并导航回仪表板
    await locationStore.refreshLocations();
    await router.push("/dashboard");
  }
  catch (error: any) {
    // 处理错误
    const message = error.statusCode === 404
      ? "地点不存在或已被删除"
      : "删除失败，请稍后重试";
    
    deleteError.value = message;
    console.error("删除地点失败:", error);
  }
  finally {
    isDeleting.value = false;
  }
}

</script>

<template>
  <div v-if="route.name === 'dashboard-location-slug'" class="p-4 min-h-64">
    <div v-if="status === 'pending'">
      <div class="loading" />
    </div>
    <div v-if="error && status !== 'pending'" class="flex flex-col gap-4">
      <div role="alert" class="alert alert-error">
        <Icon name="tabler:alert-circle" size="24" />
        <span>{{ error.statusMessage || '地点不存在' }}</span>
      </div>
      <p class="text-sm text-base-content/70">
        您访问的地点不存在或已被删除。请返回查看其他地点。
      </p>
    </div>
    <div v-if="location && status !== 'pending'">
      <!-- TODO:居中 -->
      <h2 class="text-xl">
        {{ location.name }}
        <div class="dropdown dropdown-bottom">
          <div tabindex="0" role="button" class="btn m-1 btn-sm p-0">
            <Icon size="16" name="tabler:dots-vertical" />
          </div>
          <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li><NuxtLink @click="openDialog">
              <Icon name="tabler:trash-x-filled" size="16" />
               删除
            </NuxtLink></li>
            <li><NuxtLink :to="{name: 'dashboard-location-slug-edit',params: {slug}}">
              <Icon name="tabler:map-pin-cog" size="16" />
               编辑
            </NuxtLink></li>
          </ul>
        </div>
      </h2>
      <p class="text-sm">
        {{ location.description }}
      </p>
      <div v-if="!location.locationLogs.length" class="text-lg mt-4 ">
        <p class="text-sm italic">
          开始记录你的旅行日志
        </p>
      </div>
      <button class="btn btn-primary mt-2">
        添加日志
        <Icon name="tabler:map-pin-plus" size="24" />
      </button>
    </div>
    <AppDialog  
      title="你确定吗？"
      description="这将会删除该地址及其相关日志"
      confirm-label="确认"
      confirm-class="btn-error"
      :is-open="isOpen"
      :is-loading="isDeleting"
      :error="deleteError"
      @on-closed="isOpen = false" 
      @on-confirmed="confirmDelete"
    />
  </div>
  <NuxtPage v-else />
</template>

<style>

</style>
