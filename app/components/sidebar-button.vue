
<script lang="ts" setup>
const props = defineProps<{
    label: string;
    icon: string;
    href: string;
    showLabel: boolean;
}>();

const route = useRoute();
const enableTooltip = ref(!props.showLabel);

// 监听 showLabel 变化，添加延迟以避免折叠时误触发 tooltip
watch(() => props.showLabel, (newVal) => {
    if (newVal) {
        // 展开时立即禁用 tooltip（因为文字会显示）
        enableTooltip.value = false;
    } else {
        // 折叠时延迟启用 tooltip，等待动画完成
        setTimeout(() => {
            enableTooltip.value = true;
        }, 300); // 与 transition duration 一致
    }
});

</script>
<template>
    <div class="tooltip-right" :data-tip="enableTooltip ? props.label : undefined" :class="{ tooltip: enableTooltip }">
        <NuxtLink 
            :to="props.href" 
            :class="{ 'bg-base-200': route.path === props.href, 'justify-center': !showLabel ,'justify-start': showLabel }" 
            class="flex gap-2 p-2 hover:bg-base-300 rounded hover:cursor-pointer transition-all duration-300"
        >
            <Icon :name="props.icon" size="24" class="flex-shrink-0" />
            <span 
                v-show="props.showLabel" 
                class="whitespace-nowrap overflow-hidden transition-opacity duration-300"
                :class="{ 'opacity-0': !showLabel, 'opacity-100': showLabel }"
            >{{ props.label }}</span>
        </NuxtLink>
    </div>
</template>