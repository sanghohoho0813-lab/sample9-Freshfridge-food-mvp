import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    // 날짜 계산이 시간대에 따라 달라지지 않도록 서비스 기준 시간대로 고정
    env: { TZ: "Asia/Seoul" },
  },
});
