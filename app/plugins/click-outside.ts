// 扩展 HTMLElement 类型以支持自定义事件处理器
interface HTMLElementWithClickOutside extends HTMLElement {
  clickOutsideEvent?: (event: MouseEvent) => void;
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("click-outside", {
    mounted(el: HTMLElementWithClickOutside, binding) {
      el.clickOutsideEvent = (event: MouseEvent) => {
        // 检查点击是否在元素外部
        if (!(el === event.target || el.contains(event.target as Node))) {
          // 调用绑定的方法
          binding.value(event);
        }
      };
      document.addEventListener("click", el.clickOutsideEvent);
    },
    unmounted(el: HTMLElementWithClickOutside) {
      if (el.clickOutsideEvent) {
        document.removeEventListener("click", el.clickOutsideEvent);
        delete el.clickOutsideEvent;
      }
    },
  });
});
