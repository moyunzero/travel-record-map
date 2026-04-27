<script lang="ts" setup>
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
await authStore.init();

</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppNavBar />
    <main>
      <slot />
    </main>
  </div>
</template>
