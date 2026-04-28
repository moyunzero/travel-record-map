<script lang="ts" setup>
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
</script>

<template>
  <!-- 已登录状态：显示用户下拉菜单 -->
  <div v-if="authStore.user" class="dropdown dropdown-end">
    <div class="avatar avatar-online mr-2">
      <div v-if="authStore.user.image" class="w-8 rounded-full">
        <img :src="authStore.user.image" :alt="authStore.user.name">
      </div>
    </div>
    <div
      tabindex="0"
      role="button"
      class="btn m-1"
    >
      {{ authStore.user.name }}
    </div>
    <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 shadow-lg border border-base-300">
      <li>
        <NuxtLink to="./sign-out" class="text-base-content font-medium ">
          <Icon name="tabler:logout" size="18" />
          退出登录
        </NuxtLink>
      </li>
    </ul>
  </div>
  <!-- 未登录状态：显示登录按钮 -->
  <button
    v-else
    class="btn btn-accent"
    :disabled="authStore.loading"
    @click="authStore.signIn"
  >
    <template v-if="authStore.loading">
      <span class="loading loading-ring loading-md" />
      加载中...
    </template>
    <template v-else>
      使用 GitHub 登录
      <Icon name="tabler:brand-github" size="24" />
    </template>
  </button>
</template>

<style>

</style>
