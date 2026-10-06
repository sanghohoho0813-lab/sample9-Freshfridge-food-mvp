import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // public/ 의 공용 스크립트(미래AI랩 데모 공통 내비게이션)는 외부 관리 파일이라 검사하지 않는다
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "public/**"] },
];

export default eslintConfig;
