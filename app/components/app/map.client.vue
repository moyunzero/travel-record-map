<script lang="ts" setup>
const colorMode = useColorMode();
const style = computed(() => {
  return colorMode.value === "dark" ? "./styles/dark.json" : "https://tiles.openfreemap.org/styles/liberty";
});
const center = [116.38, 39.90];
const zoom = 10;
</script>

<template>
  <MglMap
    :map-style="style"
    :center="center"
    :zoom="zoom"
  >
    <MglNavigationControl />
  </MglMap>
</template>
