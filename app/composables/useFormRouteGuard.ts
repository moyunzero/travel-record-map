/**
 * 表单路由守卫 Composable
 * 在用户尝试离开页面时，如果表单有未保存的更改，则提示确认
 */
export function useFormRouteGuard(options: {
  /**
   * 表单 ref，需要包含 meta 属性
   */
  formRef: Ref<{ meta?: { dirty?: boolean } } | null>;
  /**
   * 是否已提交成功（提交成功后不再提示）
   */
  submitted: Ref<boolean>;
  /**
   * 自定义确认消息
   */
  confirmMessage?: string;
  /**
   * 离开前的清理函数
   */
  onLeave?: () => void;
}) {
  const {
    formRef,
    submitted,
    confirmMessage = "你有未保存的更改，确定要离开吗？",
    onLeave,
  } = options;

  onBeforeRouteLeave(() => {
    // 如果已提交或表单未修改，直接放行
    if (submitted.value || !formRef.value?.meta?.dirty) {
      onLeave?.();
      return true;
    }

    // 提示用户确认
    const shouldLeave = window.confirm(confirmMessage);
    
    if (shouldLeave) {
      onLeave?.();
      return true;
    }

    return false;
  });
}
