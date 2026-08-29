import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // 기본 텍스트 스케일 1.3배 (가독성 우선 설정)
      fontSize: {
        xs: ["15.6px", { lineHeight: "20.8px" }],
        sm: ["18.2px", { lineHeight: "26px" }],
        base: ["20.8px", { lineHeight: "31.2px" }],
        lg: ["23.4px", { lineHeight: "36.4px" }],
        xl: ["26px", { lineHeight: "36.4px" }],
        "2xl": ["31.2px", { lineHeight: "41.6px" }],
        "3xl": ["39px", { lineHeight: "46.8px" }],
        "4xl": ["46.8px", { lineHeight: "52px" }],
        "5xl": ["62.4px", { lineHeight: "1" }],
        "6xl": ["78px", { lineHeight: "1" }],
        "7xl": ["93.6px", { lineHeight: "1" }],
      },
      colors: {
        fresh: {
          50: "#f2f9f2",
          100: "#e3f3e4",
          200: "#c5e6c8",
          300: "#98d29e",
          400: "#64b76e",
          500: "#3f9c4b",
          600: "#2e7f39",
          700: "#276530",
          800: "#22512a",
          900: "#1d4324",
        },
        mint: {
          50: "#effaf6",
          100: "#d8f3e7",
          200: "#b3e7d2",
          300: "#81d3b7",
          400: "#4db898",
          500: "#2a9d7f",
          600: "#1d7e66",
          700: "#186553",
          800: "#165143",
          900: "#134338",
        },
        cream: "#fdfbf5",
        warmwhite: "#fbfaf6",
        coral: {
          50: "#fef3f1",
          100: "#fde5e1",
          400: "#f3806e",
          500: "#e8604c",
          600: "#d44a36",
        },
        amberish: {
          50: "#fef8ec",
          100: "#fcefd0",
          500: "#e9932a",
          600: "#cf7a18",
        },
        ink: {
          900: "#26302a",
          700: "#414d46",
          500: "#65726b",
          400: "#8b968f",
          300: "#aeb7b1",
        },
      },
      borderRadius: {
        card: "18px",
        chip: "999px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(46, 74, 52, 0.06)",
        lift: "0 6px 24px rgba(46, 74, 52, 0.10)",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "60%": { transform: "scale(1.03)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "toast-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.28s ease-out both",
        "pop-in": "pop-in 0.26s ease-out both",
        "toast-in": "toast-in 0.24s ease-out both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
