<template>
  <div class="hero bg-base-200 container mx-auto mt-4">
    <div class="hero-content text-center min-h-96">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          旅行记录
        </h1>
        <p class="py-6">
          记录你的旅行足迹，分享你的旅行故事。
        </p>
        <AuthButton v-if="!authStore.user" />
        <NuxtLink v-else to="/dashboard" class="btn btn-primary">
          查看我的旅行记录 
        </NuxtLink> 
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();

</script>
