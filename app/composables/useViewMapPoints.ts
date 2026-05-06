import type { Ref } from "vue";
import type { MapPoint } from "~/lib/types";
import { useMapStore } from "../../stores/map";

/**
 * 查看模式下的地图标记管理
 * 用于地点详情、日志详情等查看页面
 *
 * @param mapPoints - 地图标记数组的响应式引用
 * @param options - 配置选项
 */
export function useViewMapPoints(
  mapPoints: Ref<MapPoint[]>,
  options: {
    /** 选中的标记（可选） */
    selectedPoint?: Ref<MapPoint | null>;
    /** 路由名称，用于监听路由返回 */
    routeName?: string;
  } = {},
) {
  const mapStore = useMapStore();
  const route = useRoute();
  const { selectedPoint, routeName } = options;

  // 设置地图标记的函数
  function setupMapPoints() {
    if (mapPoints.value.length > 0) {
      mapStore.mapPoints = mapPoints.value;

      // 如果有选中的标记，设置它
      if (selectedPoint?.value) {
        mapStore.selectedPoint = selectedPoint.value;
      }
    }
  }

  // 监听标记数据变化
  watch(mapPoints, () => {
    setupMapPoints();
  }, { immediate: true, deep: true });

  // 监听选中标记变化
  if (selectedPoint) {
    watch(selectedPoint, (newPoint) => {
      mapStore.selectedPoint = newPoint;
    });
  }

  // 监听路由变化，当返回到当前页面时重新设置地图标记
  if (routeName) {
    watch(() => route.name, (newRouteName) => {
      if (newRouteName === routeName) {
        // 从子路由返回时，重新设置地图标记
        nextTick(() => {
          setupMapPoints();
        });
      }
    });
  }

  // 离开页面时清理
  onBeforeRouteLeave(() => {
    mapStore.restoreAllMapPoints();
    mapStore.selectedPoint = null;
    return true;
  });

  return {
    setupMapPoints,
  };
}
