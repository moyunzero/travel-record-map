import type { SidebarItem } from "./sidebar";
import type { MapPoint } from "~/lib/types";
import { useMapStore } from "./map";
import { useSidebarStore } from "./sidebar";

interface LocationResponse extends MapPoint {
  // 添加其他可能的字段
}

export const useLocationStore = defineStore("useLocationStore", () => {
  const { data, status, refresh } = useFetch<LocationResponse[]>("/api/location", {
    lazy: true,
  });

  const sidebarStore = useSidebarStore();
  const mapStore = useMapStore();

  watchEffect(() => {
    if (data.value && data.value.length > 0) {
      const mapPoints: MapPoint[] = [];
      const sidebarItems: SidebarItem[] = [];

      data.value.forEach((location) => {
        const mapPoint = createMapPointFromLocation(location);
        sidebarItems.push({
          id: `location-${location.id}`,
          label: location.name,
          icon: "tabler:map-pin-filled",
          to: { name: "dashboard-location-slug", params: { slug: location.slug } },
          mapPoint,
        });
        mapPoints.push(mapPoint);
      });

      sidebarStore.sidebarItems = sidebarItems;
      mapStore.setAllMapPoints(mapPoints);
    }
    sidebarStore.loading = status.value === "pending";
  });
  return {
    locations: data,
    status,
    refresh,
  };
});
