import type { SidebarItem } from "./sidebar";
import type { SelectLocationWithLog } from "~/lib/db/schema";
import type { MapPoint } from "~/lib/types";
import { useMapStore } from "./map";
import { useSidebarStore } from "./sidebar";
import { CURRENT_LOCATION_PAGES, LOCATION_PAGES } from "~/lib/constants";

interface LocationResponse extends MapPoint {
  // 添加其他可能的字段
}

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
      sidebarStore.sidebarItems = [];
      mapStore.mapPoints = [currentLocation.value];
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
