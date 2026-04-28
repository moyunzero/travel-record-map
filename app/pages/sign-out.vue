<script lang="ts" setup>
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  authStore.signOut();
  navigateTo("/");
});
</script>

<template>
  <div class="card bg-base-300 container text-center mt-4 min-h-100 mx-auto flex flex-col items-center justify-center">
    <span class="loading loading-ring loading-xl" />
  </div>
</template>
