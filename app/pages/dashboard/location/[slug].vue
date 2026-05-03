<script lang="ts" setup>
import { useMapStore } from "../../../../stores/map";

const route = useRoute();
const { slug } = route.params;
const mapStore = useMapStore();

const { data: location, status, error } = await useFetch(`/api/locations/${slug}`);

effect(() => {
  if (location.value) {
    // 只显示当前地点
    mapStore.mapPoints = [location.value];
  }
});

// 离开页面时恢复所有地点
onBeforeRouteLeave(() => {
  mapStore.restoreAllMapPoints();
  return true;
});
</script>

<template>
  <div class="p-4 min-h-64">
    <div v-if="status === 'pending'">
      <div class="loading" />
    </div>
    <div v-if="location && status !== 'pending'">
      <h2 class="text-xl">
        地点详情页-{{ location.name }}
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
    <div v-if="error && status !== 'pending'">
      <h2 class="text-lg text-error">
        {{ error.statusMessage }}
      </h2>
    </div>
  </div>
</template>

<style>

</style>
