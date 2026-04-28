import antfu from "@antfu/eslint-config";

// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

// TODO: add tailwindcss plugin

export default withNuxt(antfu({
  type: "app",
  vue: true,
  typescript: true,
  formatters: true,
  stylistic: {
    indent: 2,
    semi: true,
    quotes: "double",
  },
  ignores: [".pnpm-store/**", "app/lib/db/migrations/**", "*.md"],
}, {
  rules: {
    "vue/max-attributes-per-line": ["error", {
      singleline: {
        max: 2,
      },
      multiline: {
        max: 1,
      },
    }],
    "ts/no-redeclare": "off",
    "ts/consistent-type-definitions": ["error", "type"],
    "no-console": ["warn"],
    "antfu/no-top-level-await": ["off"],
    "node/prefer-global/process": ["off"],
    "node/no-process-env": ["error"],
    "unicorn/filename-case": ["error", {
      case: "kebabCase",
      ignore: ["README.md"],
    }],
  },
}, {
  files: ["app/lib/env.ts", "app/lib/try-parse-env.ts"],
  rules: {
    "node/no-process-env": "off",
  },
}));
