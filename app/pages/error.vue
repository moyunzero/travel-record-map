<template>
    <div class="card bg-base-300 container text-center mt-4 min-h-100 mx-auto flex flex-col items-center justify-center">
        <div role="alert" class="alert alert-error min-w-1/2 text-center">
            <span>Error! {{ error }}</span>
        </div>
        <NuxtLink to="/" class="btn btn-primary mt-4">
            返回首页
            <Icon name="tabler:home" size="32" />
        </NuxtLink>
    </div>
</template>

<script lang="ts" setup>
const route = useRoute();
const error = route.query.error || '未知错误';
</script>


<style>

</style>