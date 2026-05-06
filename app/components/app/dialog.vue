<script lang="ts" setup>
import { useTemplateRef } from "vue";

const props = withDefaults(defineProps<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass: "btn-warning" | "btn-error" | "btn-accent" | "btn-primary";
  isLoading?: boolean;
  error?: string | null;
}>(), {
  isLoading: false,
  error: null,
});

const emit = defineEmits<{
  onClosed: [];
  onConfirmed: [];
}>();

const dialog = useTemplateRef("dialog");

function onClose() {
  if (props.isLoading)
    return; // 防止加载时关闭
  emit("onClosed");
}

onMounted(() => {
  dialog.value?.addEventListener("close", onClose);
});

onUnmounted(() => {
  dialog.value?.removeEventListener("close", onClose);
});
</script>

<template>
  <dialog
    ref="dialog"
    class="modal"
    :open="props.isOpen"
  >
    <div class="modal-box">
      <h3 class="text-lg font-bold">
        {{ title }}
      </h3>
      <p class="py-4">
        {{ description }}
      </p>

      <!-- 错误提示 -->
      <div v-if="error" class="alert alert-error mb-4">
        <Icon name="tabler:alert-circle" size="20" />
        <span>{{ error }}</span>
      </div>

      <div class="flex justify-end gap-2">
        <button
          class="btn btn-outline"
          :disabled="isLoading"
          @click="onClose"
        >
          取消
        </button>
        <button
          class="btn"
          :class="confirmClass"
          :disabled="isLoading"
          @click="emit('onConfirmed')"
        >
          {{ confirmLabel }}
          <span v-if="isLoading" class="loading loading-ring loading-md" />
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button :disabled="isLoading">
        close
      </button>
    </form>
  </dialog>
</template>
