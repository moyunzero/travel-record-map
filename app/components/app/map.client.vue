<script lang="ts" setup>
import type { LngLat } from "maplibre-gl";
import { DEFAULT_CENTER } from "~/lib/constants";
import { isPointSelected } from "~/utils/map-point";
import { useMapStore } from "../../../stores/map";

const MAP_ZOOM = 10;

const colorMode = useColorMode();
const mapStore = useMapStore();

const style = computed(() => {
  return colorMode.value === "dark"
    ? "./styles/dark.json"
    : "https://tiles.openfreemap.org/styles/liberty";
});

// 使用固定的初始中心，不随 addedPoint 变化
const initialCenter = ref<[number, number]>(DEFAULT_CENTER);

function updateAddedPoint(location: LngLat) {
  // 拖拽时不触发 flyTo
  mapStore.setAddedPointLocation(location.lat, location.lng, false);
}

function onDoubleClick(event: any) {
  // 阻止默认的双击放大行为
  event.event?.preventDefault();

  // nuxt-maplibre wraps the MapLibre event in event.event
  const lngLat = event.event?.lngLat;
  if (lngLat) {
    // 双击时不触发 flyTo，只更新位置
    mapStore.setAddedPointLocation(lngLat.lat, lngLat.lng, false);
  }
}

onMounted(() => {
  mapStore.init();
});
</script>

<template>
  <MglMap
    :map-style="style"
    :center="initialCenter"
    :zoom="MAP_ZOOM"
    @map:dblclick="onDoubleClick"
  >
    <MglNavigationControl />
    <MglMarker
      v-if="mapStore.addedPoint"
      :coordinates="[mapStore.addedPoint.long, mapStore.addedPoint.lat]"
      :draggable="true"
      @update:coordinates="updateAddedPoint"
    >
      <template #marker>
        <div
          class="tooltip tooltip-top hover:cursor-pointer"
          data-tip="移动到打卡地点"
        >
          <Icon
            name="tabler:map-pin-filled"
            size="32"
            class="text-warning"
          />
        </div>
      </template>
    </MglMarker>
    <MglMarker
      v-for="point in mapStore.mapPoints"
      :key="point.id"
      :coordinates="[point.long, point.lat]"
    >
      <template #marker>
        <div
          class="tooltip tooltip-top hover:cursor-pointer"
          :data-tip="point.name "
          :class="{
            'tooltip-open': isPointSelected(point, mapStore.selectedPoint),
          }"
          @click="mapStore.clickPoint(point)"
        >
          <Icon
            name="tabler:map-pin-filled"
            size="24"
            :class="isPointSelected(point, mapStore.selectedPoint) ? 'text-accent' : 'text-secondary'"
          />
        </div>
      </template>
      <MglPopup>
        <h3 class="text-xl">
          {{ point.name }}
        </h3>
        <p v-if="point.description">
          {{ point.description }}
        </p>
        <div class="flex justify-end mt-4">
          <NuxtLink
            v-if="point.to"
            :to="point.to"
            class="btn btn-sm btn-outline"
          >
            {{ point.toLabel }}
          </NuxtLink>
        </div>
      </MglPopup>
    </MglMarker>
  </MglMap>
</template>
