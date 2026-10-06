import type { MetadataRoute } from "next";

/** 홈 화면에 추가했을 때의 앱 정보 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FreshFridge — 냉장고 식재료 관리",
    short_name: "FreshFridge",
    description: "버리기 전에 먼저 먹도록 도와주는 냉장고 식재료 관리. 미래에이아이랩 MVP 샘플.",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf6",
    theme_color: "#fbfaf6",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
