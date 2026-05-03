import type { MapPoint } from "~/lib/types";
import { useMapStore } from "./map";
import { useSidebarStore } from "./sidebar";

type LocationResponse = {
  // 添加其他可能的字段
} & MapPoint;

export const useLocationStore = defineStore("useLocationStore", () => {
  const { data, status, refresh } = useFetch<LocationResponse[]>("/api/location", {
    lazy: true,
  });

  const sidebarStore = useSidebarStore();
  const mapStore = useMapStore();

  watchEffect(() => {
    if (data.value && data.value.length > 0) {
      sidebarStore.sidebarItems = data.value.map(location => ({
        id: `location-${location.id}`,
        label: location.name,
        icon: "tabler:map-pin-filled",
        href: "#",
        location,
      }));
      mapStore.mapPoints = data.value;
    }
    sidebarStore.loading = status.value === "pending";
  });
  return {
    locations: data,
    status,
    refresh,
  };
});
