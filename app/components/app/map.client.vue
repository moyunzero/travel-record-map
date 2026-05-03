<script lang="ts" setup>
import type { LngLat } from "maplibre-gl";
import { DEFAULT_CENTER } from "~/lib/constants";
import { useMapStore } from "../../../stores/map";

const colorMode = useColorMode();
const style = computed(() => {
  return colorMode.value === "dark" ? "./styles/dark.json" : "https://tiles.openfreemap.org/styles/liberty";
});
const zoom = 10;
const mapStore = useMapStore();

// 使用固定的初始中心，不随 addedPoint 变化
const initialCenter = ref(DEFAULT_CENTER);

function updateAddedPoint(location: LngLat) {
  if (mapStore.addedPoint) {
    mapStore.addedPoint.lat = location.lat;
    mapStore.addedPoint.long = location.lng;
  }
}

function onDoubleClick(event: any) {
  // 阻止默认的双击放大行为
  event.event?.preventDefault();

  // nuxt-maplibre wraps the MapLibre event in event.event
  const lngLat = event.event?.lngLat;
  if (mapStore.addedPoint && lngLat) {
    mapStore.addedPoint.lat = lngLat.lat;
    mapStore.addedPoint.long = lngLat.lng;
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
    :zoom="zoom"
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
            'tooltip-open': mapStore.selectedPoint === point,
          }"
          @mouseenter="mapStore.selectPointWithoutFlyTo(point)"
          @mouseleave="mapStore.selectPointWithoutFlyTo(null)"
        >
          <Icon
            name="tabler:map-pin-filled"
            size="24"
            :class="mapStore.selectedPoint === point ? 'text-accent' : 'text-secondary' "
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
      </MglPopup>
    </MglMarker>
  </MglMap>
</template>
