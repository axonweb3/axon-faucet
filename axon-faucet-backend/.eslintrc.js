module.exports = {
  env: {
    node: true,
    es2020: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "airbnb-base",
    "plugin:sonarjs/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  plugins: ["sonarjs", "@typescript-eslint", "import"],
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
    requireConfigFile: false,
  },
  rules: {
    indent: [
      "error",
      2,
    ],
    "linebreak-style": [
      "error",
      "unix",
    ],
    quotes: [
      "error",
      "double",
    ],
    semi: [
      "error",
      "always",
    ],
    "no-console": "off",
    camelcase: "off",
    "import/no-unresolved": "error",
    "import/extensions": ["error", "ignorePackages", { ts: "never" }],
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": "error",
    "max-classes-per-file": "off",
  },
  settings: {
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx"],
    },
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: ".",
      },
    },
  },
};
