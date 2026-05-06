import type { LngLatBounds } from "maplibre-gl";
import type { MapPoint } from "~/lib/types";

// 地图动画配置常量
const MAP_ANIMATION = {
  INITIAL_ZOOM: 6,
  SEARCH_ZOOM: 14,
  SELECT_ZOOM: 12,
  INITIAL_SPEED: 0.8,
  SEARCH_SPEED: 1.2,
  PADDING: 50,
  INIT_DELAY: 100,
} as const;

// 临时点的默认 ID
const TEMP_POINT_ID = -1;

export const useMapStore = defineStore("useMapStore", () => {
  const mapPoints = ref<MapPoint[]>([]);
  const allMapPoints = ref<MapPoint[]>([]); // 所有地点的备份（用于详情页恢复）
  const selectedPoint = ref<MapPoint | null>(null);
  const shouldFlyTo = ref(true);
  const addedPoint = ref<MapPoint | null>(null);

  function selectPointWithoutFlyTo(point: MapPoint | null) {
    shouldFlyTo.value = false;
    selectedPoint.value = point;
  }

  // 点击标记时调用（平移+缩放）
  function clickPoint(point: MapPoint | null) {
    shouldFlyTo.value = true;
    selectedPoint.value = point;
  }

  // 设置 addedPoint 位置，可选择是否触发 flyTo 动画
  function setAddedPointLocation(lat: number, long: number, withFlyTo = true) {
    if (addedPoint.value) {
      shouldFlyTo.value = withFlyTo;
      addedPoint.value.lat = lat;
      addedPoint.value.long = long;
    }
  }

  // 设置所有地点（由 locationStore 调用）
  function setAllMapPoints(points: MapPoint[]) {
    allMapPoints.value = points;
    mapPoints.value = points;
  }

  // 恢复所有地点（由详情页调用）
  function restoreAllMapPoints() {
    mapPoints.value = allMapPoints.value;
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
      bounds = mapPoints.value.reduce((acc, point) => {
        return acc.extend([point.long, point.lat]);
      }, new LngLatBounds(
        [firstPoint.long, firstPoint.lat],
        [firstPoint.long, firstPoint.lat],
      ));
      if (bounds) {
        map.map?.fitBounds(bounds, {
          padding: MAP_ANIMATION.PADDING,
          maxZoom: MAP_ANIMATION.SELECT_ZOOM,
        });
      }
    });

    // 监听 addedPoint 的变化，优先级最高
    watch(addedPoint, (newValue, oldValue) => {
      if (newValue && !oldValue) {
        // 首次添加点时飞行到该位置
        setTimeout(() => {
          map.map?.flyTo({
            center: [newValue.long, newValue.lat],
            speed: MAP_ANIMATION.INITIAL_SPEED,
            zoom: MAP_ANIMATION.INITIAL_ZOOM,
          });
        }, MAP_ANIMATION.INIT_DELAY);
      }
    }, {
      immediate: true,
      deep: false,
    });

    // 监听 addedPoint 的坐标变化（用于搜索结果设置位置）
    watch(
      () => addedPoint.value ? [addedPoint.value.lat, addedPoint.value.long] : null,
      (newCoords, oldCoords) => {
        if (!newCoords || !oldCoords || !shouldFlyTo.value)
          return;

        const [newLat, newLong] = newCoords;
        const [oldLat, oldLong] = oldCoords;

        // 只有坐标真正变化时才飞行
        if (newLat !== oldLat || newLong !== oldLong) {
          map.map?.flyTo({
            center: [newLong, newLat],
            speed: MAP_ANIMATION.SEARCH_SPEED,
            zoom: MAP_ANIMATION.SEARCH_ZOOM,
          });
        }
      },
    );

    // 监听 selectedPoint 的变化
    effect(() => {
      // 如果正在添加点，不执行 selectedPoint 的 flyTo
      if (addedPoint.value || !selectedPoint.value || !shouldFlyTo.value)
        return;

      // 点击时：平移+缩放
      map.map?.flyTo({
        center: [selectedPoint.value.long, selectedPoint.value.lat],
        zoom: MAP_ANIMATION.SELECT_ZOOM,
      });
    });
  }

  return {
    mapPoints,
    allMapPoints,
    init,
    selectedPoint,
    selectPointWithoutFlyTo,
    clickPoint,
    addedPoint,
    setAddedPointLocation,
    setAllMapPoints,
    restoreAllMapPoints,
    TEMP_POINT_ID,
  };
});
