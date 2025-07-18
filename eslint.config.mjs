import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// 定義要忽略的文件和目錄
const ignores = {
  ignores: ["**/node_modules/**", ".next/**", "src/generated/**/*"],
};

const eslintConfig = [
  // 首先添加忽略配置
  ignores,
  // 然後是其他配置
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
