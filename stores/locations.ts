import { useSidebarStore } from "./sidebar";

export const useLocationStore = defineStore("useLocationStore", () => {
  const { data, status, refresh } = useFetch("/api/location", {
    lazy: true,
  });

  const sidebarStore = useSidebarStore();

  watchEffect(() => {
    if (data.value && data.value.length > 0) {
      sidebarStore.sidebarItems = data.value.map((location: any) => ({
        id: `location-${location.id}`,
        label: location.name,
        icon: "tabler:map-pin-filled",
        href: "#",
      }));
    }
    sidebarStore.loading = status.value === "pending";
  });
  return {
    locations: data,
    status,
    refresh,
  };
});
