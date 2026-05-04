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
  <div class="p-4 min-h-64">
    <h2 class="text-2xl">
      打卡地点
    </h2>
    <div v-if="status === 'pending'">
      <span class="loading loading-ring loading-md" />
    </div>
    <div v-else-if="locations && locations.length > 0" class="flex flex-no-wrap mt-4 gap-4 overflow-auto">
      <!-- TODO:描述过长会溢出卡片，待处理 -->
      <NuxtLink
        v-for="location in locations"
        :key="location.id"
        class="card card-compact bg-base-300 w-72 h-40 border-2  mb-2 shrink-0 hover:cursor-pointer hover:bg-base-200 transition-colors duration-300"
        :class="{
          'border-accent': isPointSelected(location, mapStore.selectedPoint),
          'border-transparent': !isPointSelected(location, mapStore.selectedPoint),
        }"
        :to="{ name: 'dashboard-location-slug', params: { slug: location.slug } }"
        @mouseenter="mapStore.selectedPoint = location"
        @mouseleave="mapStore.selectedPoint = null"
      >
        <div class="card-body">
          <h3 class="text-xl">
            {{ location.name }}
          </h3>
          <p>{{ location.description }}</p>
        </div>
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

<style>

</style>
