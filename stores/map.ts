import type { LngLatBounds } from "maplibre-gl";
import type { MapPoint } from "~/lib/types";

export const useMapStore = defineStore("useMapStore", () => {
  const mapPoints = ref<MapPoint[]>([]);
  const selectedPoint = ref<MapPoint | null>(null);
  const shouldFlyTo = ref(true);
  const addedPoint = ref<MapPoint | null>(null);

  function selectPointWithoutFlyTo(point: MapPoint | null) {
    shouldFlyTo.value = false;
    selectedPoint.value = point;
  }

  async function init() {
    const { useMap } = await import("@indoorequal/vue-maplibre-gl");
    const { LngLatBounds } = await import("maplibre-gl");

    const map = useMap();
    let bounds: LngLatBounds | null = null;

    effect(() => {
      const firstPoint = mapPoints.value[0];
      if (!firstPoint)
        return;
      bounds = mapPoints.value.reduce((bounds, point) => {
        return bounds.extend([point.long, point.lat]);
      }, new LngLatBounds(
        [firstPoint.long, firstPoint.lat],
        [firstPoint.long, firstPoint.lat],
      ));
      map.map?.fitBounds(bounds, {
        padding: 50,
        // maxZoom: 15,
      });
    });

    // 监听 addedPoint 的变化，优先级最高
    watch(addedPoint, (newValue, oldValue) => {
      if (newValue && !oldValue) {
        // TODO:调试待删除
        console.log("flyTo addedPoint:", newValue.long, newValue.lat);
        // 使用 setTimeout 确保地图已经完全加载
        setTimeout(() => {
          map.map?.flyTo({
            center: [newValue.long, newValue.lat],
            speed: 0.8,
            zoom: 6,
          });
        }, 100);
      }
    }, {
      immediate: true,
      deep: false, // 不深度监听，只监听引用变化
    });

    // 监听 selectedPoint 的变化
    effect(() => {
      // 如果正在添加点，不执行 selectedPoint 的 flyTo
      if (addedPoint.value)
        return;

      if (selectedPoint.value) {
        if (shouldFlyTo.value) {
          map.map?.flyTo({
            center: [selectedPoint.value.long, selectedPoint.value.lat],
            zoom: 12,
          });
        }
        shouldFlyTo.value = true;
      }
      else if (bounds) {
        map.map?.fitBounds(bounds, {
          padding: 50,
          // maxZoom: 15,
        });
      }
    });
  }

  return {
    mapPoints,
    init,
    selectedPoint,
    selectPointWithoutFlyTo,
    addedPoint,
  };
});
