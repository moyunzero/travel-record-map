<script lang="ts" setup>
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <div v-if="!authStore.loading && authStore.user" class="dropdown dropdown-end">
    <div class="avatar avatar-online mr-2">
      <div v-if="authStore.user.image" class="w-8 rounded-full">
        <img :src="authStore.user.image" :alt="authStore.user.name" />
      </div>
    </div>
    <div tabindex="0" role="button" class="btn m-1">
      {{ authStore.user.name }}
    </div>
    <ul tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-1 w-32 p-2 shadow-lg border border-base-300">
      <li><NuxtLink to="./sign-out" class="text-base-content font-medium ">
        <Icon name="tabler:logout" size="18" />
        退出登录
      </NuxtLink></li>
    </ul>
  </div>  
  <button v-else class="btn btn-accent" @click="authStore.signIn" :disabled="authStore.loading">
    使用 GitHub 登录
    <span v-if="authStore.loading" class="loading loading-ring loading-md"></span>
    <Icon v-else name="tabler:brand-github" size="24" />
  </button>
</template>

<style>

</style>
