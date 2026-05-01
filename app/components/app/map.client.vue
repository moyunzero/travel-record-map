<script lang="ts" setup>
import { useMapStore } from "../../../stores/map";

const colorMode = useColorMode();
const style = computed(() => {
  return colorMode.value === "dark" ? "./styles/dark.json" : "https://tiles.openfreemap.org/styles/liberty";
});
const center = [116.38, 39.90];
const zoom = 10;
const mapStore = useMapStore();

onMounted(() => {
  mapStore.init();
});
</script>

<template>
  <MglMap
    :map-style="style"
    :center="center"
    :zoom="zoom"
  >
    <MglNavigationControl />
    <MglMarker
      v-for="point in mapStore.mapPoints"
      :key="point.id"
      :coordinates="[point.long, point.lat]"
    >
      <template #marker>
        <div class="tooltip tooltip-top" :data-tip="point.label">
          <Icon
            name="tabler:map-pin-filled"
            size="24"
            class="text-primary"
          />
        </div>
      </template>
    </MglMarker>
  </MglMap>
</template>
