<script lang="ts" setup>
import { ref } from "vue";
import { useLocationStore } from "../../stores/locations";
import { useMapStore } from "../../stores/map";
import { useSidebarStore } from "../../stores/sidebar";

const isSidebarOpen = ref(true);
const sidebarStore = useSidebarStore();
const route = useRoute();
const locationStore = useLocationStore();
const mapStore = useMapStore();

onMounted(() => {
  isSidebarOpen.value = localStorage.getItem("isSidebarOpen") === "true";
  if (route.path !== "/dashboard") {
    locationStore.refresh();
  }
});

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value;
  localStorage.setItem("isSidebarOpen", isSidebarOpen.value.toString());
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
          key="static-dashboard"
          :show-label="isSidebarOpen"
          label="地点位置"
          icon="tabler:map"
          href="/dashboard"
        />
        <SidebarButton
          key="static-add"
          :show-label="isSidebarOpen"
          label="添加地点"
          icon="tabler:circle-plus-filled"
          href="/dashboard/add"
        />
        <div v-if="sidebarStore.loading || sidebarStore.sidebarItems.length" class="divider" />

        <div v-if="sidebarStore.loading" class="px-4">
          <div class="skeleton h-4 w-full" />
        </div>

        <div v-if="sidebarStore.sidebarItems.length && !sidebarStore.loading" class="flex flex-col ">
          <SidebarButton
            v-for="item in sidebarStore.sidebarItems"
            :key="`sidebar-${item.id}`"
            :show-label="isSidebarOpen"
            :label="item.label"
            :icon="item.icon"
            :href="item.href"
            :icon-color="mapStore.selectedPoint === item.location ? 'text-accent' : undefined"
            @mouseenter="mapStore.selectedPoint = item.location ?? null"
            @mouseleave="mapStore.selectedPoint = null"
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
    <div class="flex-1 overflow-auto">
      <div class="flex flex-col size-full">
        <NuxtPage />
        <AppMap class="flex-1" />
      </div>
    </div>
  </div>
</template>
