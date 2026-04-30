<script lang="ts" setup>
const { data, status } = await useFetch("/api/location", {
  lazy: true,
});
</script>

<template>
  <div class="p-4">
    <h2 class="text-2xl">
      打卡地点
    </h2>
    <div v-if="status === 'pending'">
      <span class="loading loading-ring loading-md" />
    </div>
    <div v-else-if="data && data.length > 0" class="flex flex-wrap mt-4 gap-4">
      <!-- TODO:描述过长会溢出卡片，待处理 -->
      <div
        v-for="location in data"
        :key="location.id"
        class="card card-compact bg-base-300 w-72 h-40"
      >
        <div class="card-body">
          <h3 class="text-xl">
            {{ location.name }}
          </h3>
          <p>{{ location.description }}</p>
          <!-- <div class="card-actions justify-end">
                    <NuxtLink
                      class="btn btn-primary"
                      :to="`/dashboard/${location.id}`"
                    >
                      查看详情
                      <Icon name="tabler:eye" size="24"/>
                    </NuxtLink>
                </div> -->
        </div>
      </div>
    </div>
    <div v-else class="flex flex-col gap-2 mt-4">
      <p>
        记录每一个去过的美好角落
      </p>
      <NuxtLink
        class="btn btn-primary w-40"
        to="/dashboard/add"
      >
        添加专属地点
        <Icon name="tabler:circle-plus-filled" size="24" />
      </NuxtLink>
    </div>
  </div>
</template>

<style>

</style>
