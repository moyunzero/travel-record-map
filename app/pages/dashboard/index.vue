<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { isPointSelected } from "~/utils/map-point";
import { useLocationStore } from "../../../stores/locations";
import { useMapStore } from "../../../stores/map";

const locationStore = useLocationStore();
const { locations, locationStatus: status } = storeToRefs(locationStore);

const mapStore = useMapStore();

onMounted(() => {
  locationStore.refreshLocations();
});
</script>

<template>
  <div class="p-4 shrink-0">
    <h2 class="text-2xl">
      打卡地点
    </h2>
    <div v-if="status === 'pending'">
      <span class="loading loading-ring loading-md" />
    </div>
    <div v-else-if="locations && locations.length > 0" class="flex flex-nowrap mt-4 gap-4 overflow-x-auto pb-2">
      <NuxtLink
        v-for="location in locations"
        :key="location.id"
        class="bg-base-300 rounded-2xl w-56 shrink-0 p-4 border-2 hover:cursor-pointer hover:bg-base-200 transition-colors duration-300"
        :class="{
          'border-accent': isPointSelected(location, mapStore.selectedPoint),
          'border-transparent': !isPointSelected(location, mapStore.selectedPoint),
        }"
        :to="{ name: 'dashboard-location-slug', params: { slug: location.slug } }"
        @mouseenter="mapStore.selectedPoint = location"
        @mouseleave="mapStore.selectedPoint = null"
      >
        <p class="font-bold text-base truncate mb-2">
          {{ location.name }}
        </p>
        <p class="text-sm text-base-content/70 line-clamp-3">
          {{ location.description }}
        </p>
      </NuxtLink>
    </div>
    <div v-else class="flex flex-col gap-2 mt-4">
      <p>
        记录每一个去过的美好角落
      </p>
      <NuxtLink
        class="btn btn-primary w-40"
        to="/dashboard/add"
      >
        添加专属地点
        <Icon name="tabler:circle-plus-filled" size="24" />
      </NuxtLink>
    </div>
  </div>
</template>
