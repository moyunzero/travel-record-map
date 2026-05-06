import type { SidebarItem } from "./sidebar";
import type { SelectLocationWithLog } from "~/lib/db/schema";
import type { MapPoint } from "~/lib/types";
import { CURRENT_LOCATION_PAGES, LOCATION_PAGES, LOG_DETAIL_PAGES } from "~/lib/constants";
import { useMapStore } from "./map";
import { useSidebarStore } from "./sidebar";

type LocationResponse = {
  // 添加其他可能的字段
} & MapPoint;

// const listLocationsInSidebar = new Set(["dashboard", "dashboard-add"]);

// const listCurrentLocationInSidebar = new Set(["dashboard-location-slug", "dashboard-location-slug-edit", "dashboard-location-slug-add"]);

export const useLocationStore = defineStore("useLocationStore", () => {
  const route = useRoute();
  const { data: locations, status: locationStatus, refresh: refreshLocations } = useFetch<LocationResponse[]>("/api/location", {
    lazy: true,
  });

  const locationUrlWithSlug = computed(() => `/api/locations/${route.params.slug}`);

  const { data: currentLocation, status: currentLocationStatus, error: currentLocationError, refresh: refreshCurrentLocation } = useFetch<SelectLocationWithLog>(locationUrlWithSlug, {
    lazy: true,
    immediate: false,
  });

  const sidebarStore = useSidebarStore();
  const mapStore = useMapStore();

  watchEffect(() => {
    if (locations.value && locations.value.length > 0 && LOCATION_PAGES.has(route.name?.toString() || null)) {
      const mapPoints: MapPoint[] = [];
      const sidebarItems: SidebarItem[] = [];

      locations.value.forEach((location) => {
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
    else if (currentLocation.value && CURRENT_LOCATION_PAGES.has(route.name?.toString() || "")) {
      // 在地点详情页显示日志列表（但不包括日志详情页面，因为那里由 dashboard.vue 管理）
      const isLogDetailPage = LOG_DETAIL_PAGES.has(route.name?.toString() || "");

      if (!isLogDetailPage && currentLocation.value.locationLogs && currentLocation.value.locationLogs.length > 0) {
        const sidebarItems: SidebarItem[] = currentLocation.value.locationLogs.map(log => ({
          id: `log-${log.id}`,
          label: log.name,
          icon: "tabler:map-pin-filled",
          to: {
            name: "dashboard-location-slug-logs-id-edit",
            params: { slug: route.params.slug, id: log.id },
          },
          mapPoint: {
            id: log.id,
            name: log.name,
            description: log.description || "",
            lat: log.lat,
            long: log.long,
            slug: `${log.id}`,
          },
        }));

        sidebarStore.sidebarItems = sidebarItems;
      }
      else if (!isLogDetailPage) {
        // 没有日志时清空侧边栏项目（但不在日志详情页面清空）
        sidebarStore.sidebarItems = [];
      }

      // 地图点在地点详情页面组件中设置
    }
    sidebarStore.loading = locationStatus.value === "pending";
  });
  return {
    locations,
    locationStatus,
    refreshLocations,
    currentLocation,
    currentLocationStatus,
    refreshCurrentLocation,
    currentLocationError,
  };
});
