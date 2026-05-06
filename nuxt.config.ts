import tailwindcss from "@tailwindcss/vite";
import "./app/lib/env";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["./app/assets/css/main.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxtjs/color-mode",
    "@pinia/nuxt",
    "@vee-validate/nuxt",
    "nuxt-csurf",
    "nuxt-maplibre",
  ],
  eslint: {
    config: {
      standalone: false,
    },
  },
  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
    optimizeDeps: {
      include: [
        "@vue/devtools-core",
        "@vue/devtools-kit",
        "maplibre-gl",
      ],
    },
    server: {
      watch: {
        ignored: ["./docker-data/*"],
      },
    },
  },
  colorMode: {
    dataValue: "theme",
  },
  // 配置路由规则，禁用 better-auth 路由的 CSRF 保护
  // better-auth 有自己的 CSRF 保护机制
  routeRules: {
    "/api/auth/**": {
      // @ts-expect-error - nuxt-csurf 模块的类型定义不完整
      csurf: false,
    },
  },
  // 运行时配置
  runtimeConfig: {
    public: {
      s3BucketUrl: process.env.S3_ENDPOINT ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}` : "",
    },
  },
});
