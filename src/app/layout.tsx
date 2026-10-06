import type { Metadata, Viewport } from "next";
import "./pretendard.css";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/lib/toast";
import AppShell from "@/components/AppShell";
import Script from "next/script";

const DESCRIPTION =
  "냉장고 속 식재료를 관리하고, 버리기 전에 먼저 먹도록 도와주는 생활형 식품관리 서비스. 미래에이아이랩 MVP 샘플.";

export const metadata: Metadata = {
  // 공유 미리보기 이미지의 절대 주소를 만들 때 쓴다 (배포 주소는 환경변수로)
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "FreshFridge — 냉장고 식재료 관리", template: "%s · FreshFridge" },
  description: DESCRIPTION,
  applicationName: "FreshFridge",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "FreshFridge",
    title: "FreshFridge — 냉장고 식재료 관리",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: "FreshFridge", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fbfaf6",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        {/* 미래AI랩 데모 공용 뒤로·앞으로 버튼 */}
        <Script src="/mirae-history-nav.js" strategy="beforeInteractive" />
        <ToastProvider>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
