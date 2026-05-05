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

// const { data: location, status, error } = await useFetch(`/api/locations/${slug}`);

onMounted(() => {
  locationStore.refreshCurrentLocation();
});

// effect(() => {
//   if (location.value) {
//     // 只显示当前地点
//     mapStore.mapPoints = [location.value];
//   }
// });

// 离开页面时恢复所有地点
onBeforeRouteLeave(() => {
  mapStore.restoreAllMapPoints();
  return true;
});
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
      <h2 class="text-xl">
        {{ location.name }}
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
  </div>
  <NuxtPage v-else />
</template>

<style>

</style>
