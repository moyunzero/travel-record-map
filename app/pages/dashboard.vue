<script lang="ts" setup>
import { CURRENT_LOCATION_PAGES, EDIT_PAGES, LOCATION_PAGES, LOG_DETAIL_PAGES } from "~/lib/constants";
import { isPointSelected } from "~/utils/map-point";
import { useLocationStore } from "../../stores/locations";
import { useMapStore } from "../../stores/map";
import { useSidebarStore } from "../../stores/sidebar";

const SIDEBAR_STORAGE_KEY = "isSidebarOpen";

const isSidebarOpen = ref(true);
const sidebarStore = useSidebarStore();
const route = useRoute();
const locationStore = useLocationStore();
const mapStore = useMapStore();

const { currentLocation } = storeToRefs(locationStore);

function updateSidebarItems(routeName: string | null | undefined) {
  const currentRouteName = routeName || "";

  if (LOCATION_PAGES.has(currentRouteName)) {
    // 位置地点页面（dashboard 和 dashboard-add）
    sidebarStore.sidebarTopItems = [
      {
        id: "static-dashboard",
        label: "位置地点",
        href: "/dashboard",
        icon: "tabler:map",
      },
      {
        id: "static-dashboard-add",
        label: "添加地点",
        href: "/dashboard/add",
        icon: "tabler:circle-plus-filled",
      },
    ];
  }
  else if (LOG_DETAIL_PAGES.has(currentRouteName)) {
    // 日志详情页面（查看、编辑日志）
    const slug = route.params.slug as string;
    const logId = route.params.id as string;

    // 优先从 locations 列表中查找
    const location = locationStore.locations?.find(loc => loc.slug === slug)
      || currentLocation.value;

    sidebarStore.sidebarTopItems = [
      {
        id: "static-dashboard-back-to-location",
        label: `返回 "${location?.name || "地点"}"`,
        to: {
          name: "dashboard-location-slug",
          params: { slug },
        },
        icon: "tabler:arrow-left",
      },
      {
        id: "static-dashboard-log-view",
        label: "查看日志",
        to: {
          name: "dashboard-location-slug-logs-id",
          params: { slug, id: logId },
        },
        icon: "tabler:eye",
      },
      {
        id: "static-dashboard-log-edit",
        label: "编辑日志",
        to: {
          name: "dashboard-location-slug-logs-id-edit",
          params: { slug, id: logId },
        },
        icon: "tabler:edit",
      },
      {
        id: "static-dashboard-log-images",
        label: "管理图片",
        to: {
          name: "dashboard-location-slug-logs-id-images",
          params: { slug, id: logId },
        },
        icon: "tabler:photo",
      },
    ];
  }
  else if (CURRENT_LOCATION_PAGES.has(currentRouteName)) {
    // 当前地点详情页面（查看、编辑、添加日志）
    // 如果地点加载出错，只显示返回按钮
    if (locationStore.currentLocationError) {
      sidebarStore.sidebarTopItems = [
        {
          id: "static-dashboard-back",
          label: "返回",
          href: "/dashboard",
          icon: "tabler:arrow-left",
        },
      ];
    }
    else {
      // 优先从 locations 列表中查找，避免等待 currentLocation 异步加载
      const slug = route.params.slug as string;
      const location = locationStore.locations?.find(loc => loc.slug === slug)
        || currentLocation.value;

      sidebarStore.sidebarTopItems = [
        {
          id: "static-dashboard-back",
          label: "返回",
          href: "/dashboard",
          icon: "tabler:arrow-left",
        },
        {
          id: "static-dashboard-log",
          label: location?.name || "查看日志",
          to: {
            name: "dashboard-location-slug",
            params: {
              slug,
            },
          },
          icon: "tabler:map",
        },
        {
          id: "static-dashboard-log-edit",
          label: "编辑地点",
          to: {
            name: "dashboard-location-slug-edit",
            params: {
              slug,
            },
          },
          icon: "tabler:map-pin-cog",
        },
        {
          id: "static-dashboard-log-add",
          label: "添加日志",
          to: {
            name: "dashboard-location-slug-add",
            params: {
              slug,
            },
          },
          icon: "tabler:circle-plus-filled",
        },
      ];
    }
  }
}

watch(
  [() => route.name, currentLocation, () => locationStore.locations, () => locationStore.currentLocationError],
  ([name]) => {
    updateSidebarItems(name as string);

    // 如果在日志详情页面，显示该地点的所有日志
    // 注意：只在日志详情页面时设置侧边栏项目，其他页面由 locationStore 的 watchEffect 管理
    if (LOG_DETAIL_PAGES.has(name as string) && currentLocation.value?.locationLogs) {
      const slug = route.params.slug as string;
      const currentLogId = Number(route.params.id);

      sidebarStore.sidebarItems = currentLocation.value.locationLogs.map(log => ({
        id: `log-${log.id}`,
        label: log.name,
        icon: currentLogId === log.id ? "tabler:map-pin-filled" : "tabler:map-pin",
        to: {
          name: "dashboard-location-slug-logs-id",
          params: { slug, id: log.id },
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
    }
    // 不要在这里设置为空数组，让 locationStore 的 watchEffect 管理其他页面的侧边栏
  },
  { immediate: true },
);

onMounted(() => {
  isSidebarOpen.value = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
  if (route.path !== "/dashboard") {
    locationStore.refreshLocations();
  }
});

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
  localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarOpen.value));
}
</script>

<template>
  <div class="flex-1 flex">
    <!-- 折叠区域 -->
    <div
      class="bg-base-100 transition-all duration-300 ease-in-out shrink-0"
      :class="{
        'w-64': isSidebarOpen,
        'w-16': !isSidebarOpen,
      }"
    >
      <div
        class="flex p-2 hover:cursor-pointer hover:bg-base-300"
        :class="{ 'justify-center': !isSidebarOpen, 'justify-end': isSidebarOpen }"
        @click="toggleSidebar"
      >
        <Icon
          v-if="isSidebarOpen"
          name="tabler:chevron-left"
          size="32"
        />
        <Icon
          v-else
          name="tabler:chevron-right"
          size="32"
        />
      </div>
      <div class="flex flex-col">
        <SidebarButton
          v-for="item in sidebarStore.sidebarTopItems"
          :key="item.id"
          :show-label="isSidebarOpen"
          :label="item.label"
          :icon="item.icon"
          :href="item.href"
          :to="item.to"
        />
        <!-- <SidebarButton
          key="static-add"
          :show-label="isSidebarOpen"
          label="添加地点"
          icon="tabler:circle-plus-filled"
          href="/dashboard/add"
        /> -->
        <div v-if="sidebarStore.loading || sidebarStore.sidebarItems.length" class="divider" />

        <div v-if="sidebarStore.loading" class="px-4">
          <div class="skeleton h-4 w-full" />
        </div>

        <div v-if="sidebarStore.sidebarItems.length && !sidebarStore.loading" class="flex flex-col">
          <SidebarButton
            v-for="item in sidebarStore.sidebarItems"
            :key="`sidebar-${item.id}`"
            :show-label="isSidebarOpen"
            :label="item.label"
            :icon="item.icon"
            :to="item.to"
            :icon-color="isPointSelected(item.mapPoint, mapStore.selectedPoint) ? 'text-accent' : undefined"
            @click="mapStore.clickPoint(item.mapPoint ?? null)"
          />
        </div>

        <div class="divider" />
        <SidebarButton
          key="static-logout"
          :show-label="isSidebarOpen"
          label="退出登录"
          icon="tabler:logout"
          href="/sign-out"
        />
      </div>
    </div>
    <!-- 主内容区域 -->
    <div class="flex-1 overflow-auto bg-base-200">
      <div class="flex size-full" :class="{ 'flex-col': !EDIT_PAGES.has(route.name?.toString() || '') }">
        <NuxtPage />
        <AppMap class="flex-1" />
      </div>
    </div>
  </div>
</template>
