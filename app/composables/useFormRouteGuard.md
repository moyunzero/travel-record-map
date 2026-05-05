# useFormRouteGuard Composable

可复用的表单路由守卫 composable，用于在用户尝试离开页面时提示未保存的更改。

## 为什么需要这个 Composable？

### 问题：路由守卫应该放在哪里？

在开发表单组件时，我们面临一个设计决策：

❌ **不推荐：在表单组件内部处理路由守卫**

```vue
<!-- LocationForm.vue -->
<script setup>
// 在组件内部使用 onBeforeRouteLeave
onBeforeRouteLeave(() => {
  if (meta.value.dirty) {
    return window.confirm("确定要离开吗？");
  }
});
</script>
```

**问题：**
1. 违反单一职责原则（组件应该只关注表单逻辑）
2. 降低可复用性（在 Modal/Drawer 中使用会出问题）
3. 缺乏灵活性（不同页面可能有不同的离开逻辑）
4. `onBeforeRouteLeave` 只能在路由组件中使用

✅ **推荐：使用 Composable 在页面级别处理**

```vue
<!-- pages/add.vue -->
<script setup>
const formRef = ref(null);
const submitted = ref(false);

useFormRouteGuard({
  formRef,
  submitted,
  onLeave: () => {
    // 页面特定的清理逻辑
  },
});
</script>
```

**优势：**
- ✅ 职责清晰：页面处理路由，组件处理表单
- ✅ 高度可复用：组件可以在任何场景使用
- ✅ 灵活配置：每个页面可以自定义行为
- ✅ 符合 Vue Router 设计理念

## API

### 参数

```typescript
interface UseFormRouteGuardOptions {
  /**
   * 表单 ref，需要包含 meta 属性
   * meta.dirty 用于判断表单是否有未保存的更改
   */
  formRef: Ref<{ meta?: { dirty?: boolean } } | null>;
  
  /**
   * 是否已提交成功
   * 提交成功后不再提示用户
   */
  submitted: Ref<boolean>;
  
  /**
   * 自定义确认消息
   * @default "你有未保存的更改，确定要离开吗？"
   */
  confirmMessage?: string;
  
  /**
   * 离开前的清理函数
   * 在用户确认离开后执行
   */
  onLeave?: () => void;
}
```

### 返回值

无返回值（内部使用 `onBeforeRouteLeave` 注册守卫）

## 使用示例

### 基础使用

```vue
<script setup>
const formRef = ref(null);
const submitted = ref(false);

useFormRouteGuard({
  formRef,
  submitted,
});

function handleSuccess() {
  submitted.value = true;
  navigateTo("/dashboard");
}
</script>

<template>
  <LocationForm
    ref="formRef"
    @success="handleSuccess"
  />
</template>
```

### 带清理逻辑

```vue
<script setup>
import { useMapStore } from "~/stores/map";

const formRef = ref(null);
const submitted = ref(false);
const mapStore = useMapStore();

useFormRouteGuard({
  formRef,
  submitted,
  onLeave: () => {
    // 清理地图状态
    mapStore.addedPoint = null;
  },
});
</script>
```

### 自定义确认消息

```vue
<script setup>
const formRef = ref(null);
const submitted = ref(false);

useFormRouteGuard({
  formRef,
  submitted,
  confirmMessage: "表单数据将会丢失，确定要离开吗？",
});
</script>
```

### 完整示例（添加地点页面）

```vue
<script setup>
import { DEFAULT_CENTER } from "~/lib/constants";
import { useMapStore } from "~/stores/map";

const router = useRouter();
const mapStore = useMapStore();
const submitted = ref(false);
const locationFormRef = ref(null);

// 路由守卫
useFormRouteGuard({
  formRef: locationFormRef,
  submitted,
  confirmMessage: "你有未保存的更改，确定要离开吗？",
  onLeave: () => {
    mapStore.addedPoint = null;
  },
});

// 初始化地图标记
onMounted(() => {
  mapStore.selectedPoint = null;
  
  nextTick(() => {
    mapStore.addedPoint = {
      id: mapStore.TEMP_POINT_ID,
      name: "增加地点",
      description: "",
      long: DEFAULT_CENTER[0],
      lat: DEFAULT_CENTER[1],
    };
  });
});

function handleSuccess() {
  submitted.value = true;
  navigateTo("/dashboard");
}

function handleCancel() {
  router.back();
}
</script>

<template>
  <div class="container max-w-md mx-auto p-4">
    <div class="my-4">
      <h1 class="text-lg">添加地点</h1>
      <p class="text-sm">添加你旅行过的地点，记录你的旅行足迹</p>
    </div>

    <LocationForm
      ref="locationFormRef"
      mode="add"
      submit-button-text="添加地点"
      @success="handleSuccess"
      @cancel="handleCancel"
    />
  </div>
</template>
```

## 工作原理

1. **监听路由离开事件**：使用 `onBeforeRouteLeave` 注册守卫
2. **检查表单状态**：
   - 如果 `submitted.value === true`，直接放行
   - 如果 `formRef.value.meta.dirty === false`，直接放行
   - 否则，弹出确认对话框
3. **执行清理逻辑**：用户确认离开后，执行 `onLeave` 回调
4. **返回结果**：返回 `true` 允许离开，返回 `false` 阻止离开

## 设计原则

### 1. 单一职责原则（SRP）

- **表单组件**：只负责表单的渲染、验证、提交
- **页面组件**：负责路由逻辑、状态管理、业务流程
- **Composable**：提供可复用的路由守卫逻辑

### 2. 开闭原则（OCP）

- 对扩展开放：可以通过 `onLeave` 添加自定义清理逻辑
- 对修改封闭：核心逻辑封装在 composable 中

### 3. 依赖倒置原则（DIP）

- 组件不依赖具体的路由实现
- 通过 ref 和事件进行松耦合

## 最佳实践

### ✅ 推荐

```vue
<!-- 页面组件 -->
<script setup>
const formRef = ref(null);
const submitted = ref(false);

useFormRouteGuard({ formRef, submitted });
</script>

<template>
  <MyForm ref="formRef" @success="submitted = true" />
</template>
```

### ❌ 不推荐

```vue
<!-- 表单组件 -->
<script setup>
// 不要在表单组件内部使用路由守卫
onBeforeRouteLeave(() => {
  // ...
});
</script>
```

## 相关资源

- [Vue Router - Navigation Guards](https://router.vuejs.org/guide/advanced/navigation-guards.html)
- [Vue 3 Composables](https://vuejs.org/guide/reusability/composables.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

## 类型定义

```typescript
export function useFormRouteGuard(options: {
  formRef: Ref<{ meta?: { dirty?: boolean } } | null>;
  submitted: Ref<boolean>;
  confirmMessage?: string;
  onLeave?: () => void;
}): void
```
