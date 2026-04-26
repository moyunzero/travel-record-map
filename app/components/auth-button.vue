<script lang="ts" setup>
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
</script>

<template>
  <button class="btn btn-accent" @click="authStore.signIn" :disabled="authStore.loading">
    使用 GitHub 登录
    <span v-if="authStore.loading" class="loading loading-ring loading-md"></span>
    <Icon v-else name="tabler:brand-github" size="24" />
  </button>
</template>

<style>

</style>
