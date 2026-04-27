<script lang="ts" setup>
import { ref } from 'vue';

const isSidebarOpen = ref(true);

onMounted(()=>{
    isSidebarOpen.value = localStorage.getItem('isSidebarOpen') === 'true';
})

function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value;
    localStorage.setItem('isSidebarOpen', isSidebarOpen.value.toString());
}

</script>

<template>
    <div class="flex-1 flex">
        <!-- 折叠区域 -->
        <div class="bg-base-100 transition-all duration-300 ease-in-out" :class="{
            'w-64': isSidebarOpen,
            'w-16': !isSidebarOpen
        }">
            <div 
                class="flex p-2
                hover:cursor-pointer hover:bg-base-300" 
                @click="toggleSidebar"
                :class="{ 'justify-center': !isSidebarOpen, 'justify-end': isSidebarOpen }"
            >
                <Icon v-if="isSidebarOpen" name="tabler:chevron-left" size="32" />
                <Icon v-else name="tabler:chevron-right" size="32" />
            </div>
            <div class="flex flex-col">
                <SidebarButton :showLabel="isSidebarOpen" label="地点位置" icon="tabler:map" href="/dashboard" />
                <SidebarButton :showLabel="isSidebarOpen" label="添加地点" icon="tabler:circle-plus-filled" href="/dashboard/add"/>
                <div class="divider" />
                <SidebarButton :showLabel="isSidebarOpen" label="退出登录" icon="tabler:logout" href="/sign-out" />
            </div>
        </div>
        <!-- 主内容区域 -->
        <div class="flex-1">

        </div>
    </div>
</template>

