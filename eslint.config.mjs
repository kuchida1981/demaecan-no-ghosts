import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginUserscripts from "eslint-plugin-userscripts";
import pluginImportX from "eslint-plugin-import-x";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: ["demaecan-no-ghosts.user.js", "dist/*", "src/global.d.ts"],
  },
  // Global settings
  {
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.greasemonkey,
        __APP_VERSION__: "readonly",
        __IS_UNSTABLE__: "readonly",
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "import-x": pluginImportX,
    },
    settings: {
      "import-x/resolver": {
        "typescript": {
          "alwaysTryTypes": true,
          "project": "./tsconfig.json"
        }
      }
    },
  },
  // JavaScript rules
  {
    files: ["**/*.js", "**/*.mjs"],
    ...pluginJs.configs.recommended,
  },
  // TypeScript rules
  ...tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ["**/*.ts"],
  })),
  // UserScript rules (specific file)
  {
    files: ["src/header.js", "src/header.ts"],
    plugins: {
      userscripts: pluginUserscripts,
    },
    rules: {
      ...pluginUserscripts.configs.recommended.rules,
      "userscripts/filename-user": "off", // header.js/ts name allowed
    }
  },
  // Custom rules
  {
    files: ["**/*.ts"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-console": "off",
      "complexity": ["error", 10],
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "eqeqeq": ["error", "always", { "null": "ignore" }],

      "@typescript-eslint/unbound-method": "error",
      "@typescript-eslint/no-confusing-void-expression": ["error", { "ignoreArrowShorthand": true }],
      "@typescript-eslint/no-unnecessary-condition": "error",

      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-deprecated": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/no-misused-spread": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/require-await": "off"
    }
  },
  // Layered architecture dependency enforcement
  {
    files: ["src/**/*.ts"],
    rules: {
      "import-x/no-restricted-paths": ["error", {
        "basePath": import.meta.dirname,
        "zones": [
          // logic.ts must not import from any other layers except shared (types.ts, etc.)
          {
            "target": "./src/logic.ts",
            "from": "./src",
            "except": ["./types.ts", "./test/mocks/**/*"],
            "message": "Logic layer must not depend on other layers (pure functions only)."
          },
          // store.ts can only depend on logic and shared
          {
            "target": "./src/store.ts",
            "from": "./src",
            "except": ["./logic.ts", "./types.ts", "./test/mocks/**/*"],
            "message": "Store layer can only depend on Logic and Shared layers."
          },
          // adapters can only depend on logic, store and shared
          {
            "target": "./src/adapters",
            "from": "./src",
            "except": ["./logic.ts", "./store.ts", "./types.ts", "./test/mocks/**/*", "./adapters/**/*"],
            "message": "Adapters can only depend on Logic, Store, and Shared layers."
          },
          // UI components can only depend on shared and logic (should be autonomous)
          {
            "target": "./src/ui",
            "from": "./src",
            "except": ["./logic.ts", "./types.ts", "./ui/utils.ts", "./ui/styles.ts", "./test/mocks/**/*", "./ui/**/*"],
            "message": "UI components should only depend on Shared/UI Utilities (autonomous components)."
          }
        ]
      }]
    }
  },
  // Test files: relaxed rules
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/unbound-method": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "import-x/no-restricted-paths": "off"
    }
  }
];
