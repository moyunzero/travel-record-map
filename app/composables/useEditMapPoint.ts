import type { Ref } from "vue";
import { useMapStore } from "../../stores/map";

/**
 * 编辑模式下的地图标记管理
 * 用于编辑地点、添加日志、编辑日志等页面
 *
 * @param coordinates - 坐标的响应式引用 { lat: number, long: number }
 * @param options - 配置选项
 * @returns 地图状态管理对象
 */
export function useEditMapPoint(
  coordinates: Ref<{ lat: number; long: number } | null>,
  options: {
    /** 是否在离开时恢复所有地图点（默认 false） */
    restoreOnLeave?: boolean;
  } = {},
) {
  const mapStore = useMapStore();
  const { restoreOnLeave = false } = options;

  // 监听坐标变化，更新地图标记
  watch(
    coordinates,
    (newCoords) => {
      if (newCoords) {
        // 清空其他标记，只显示当前编辑的标记
        mapStore.mapPoints = [];
        mapStore.selectedPoint = null;

        // 使用 nextTick 确保 DOM 更新后再设置标记
        nextTick(() => {
          mapStore.addedPoint = {
            lat: newCoords.lat,
            long: newCoords.long,
          };
        });
      }
    },
    { immediate: true },
  );

  // 清理函数：离开页面时调用
  const cleanup = () => {
    mapStore.addedPoint = null;
    if (restoreOnLeave) {
      mapStore.restoreAllMapPoints();
    }
  };

  // 页面卸载时自动清理
  onBeforeUnmount(() => {
    cleanup();
  });

  // 路由离开时自动清理
  onBeforeRouteLeave(() => {
    cleanup();
    return true;
  });

  return {
    cleanup,
  };
}
