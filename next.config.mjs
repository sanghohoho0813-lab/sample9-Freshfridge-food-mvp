/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 음식 사진은 AVIF(지원 브라우저) → WebP 순으로 내려 용량을 줄인다
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
};

export default nextConfig;
