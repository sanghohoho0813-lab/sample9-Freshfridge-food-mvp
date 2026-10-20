"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AlarmClock,
  Bell,
  ChefHat,
  Home,
  LineChart,
  Plus,
  Refrigerator,
  Search,
  ShoppingBasket,
  History,
  UserRound,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import ToastHost from "./ToastHost";
import LiveClock from "./LiveClock";
import SampleBridgeCTA from "./SampleBridgeCTA";
import LogoMark from "./LogoMark";

/** 메뉴는 한 가지 색으로 — 지금 있는 곳만 초록으로 표시한다 */
const NAV_ITEMS: { href: string; label: string; icon: typeof Home; also?: string[] }[] = [
  { href: "/", label: "홈", icon: Home },
  { href: "/fridge", label: "내 냉장고", icon: Refrigerator, also: ["/ingredient"] },
  { href: "/priority", label: "우선소비", icon: AlarmClock },
  { href: "/recipes", label: "레시피 추천", icon: ChefHat },
  { href: "/shopping", label: "장보기 리스트", icon: ShoppingBasket },
  { href: "/history", label: "소비 기록", icon: History },
  { href: "/report", label: "낭비 리포트", icon: LineChart },
  { href: "/my", label: "마이페이지", icon: UserRound },
];

/** also: 하단 탭에 없는 화면을 어느 탭 아래로 볼지 (현재 위치를 잃지 않게) */
const MOBILE_NAV = [
  { href: "/", label: "홈", icon: Home, also: ["/priority"] },
  { href: "/fridge", label: "냉장고", icon: Refrigerator, also: ["/ingredient"] },
  { href: "/add", label: "추가", icon: Plus, emphasized: true, also: [] },
  { href: "/recipes", label: "레시피", icon: ChefHat, also: [] },
  { href: "/my", label: "마이", icon: UserRound, also: ["/shopping", "/history", "/report", "/notifications"] },
];

function isActive(pathname: string, href: string, also: string[] = []): boolean {
  const under = (base: string) => pathname === base || pathname.startsWith(base + "/");
  if (also.some(under)) return true;
  if (href === "/") return pathname === "/";
  return under(href);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2">
      <LogoMark className="h-10 w-10 shrink-0 drop-shadow-sm sm:h-11 sm:w-11" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[21px] font-bold tracking-[-0.02em] text-ink-900 max-[380px]:text-[19px]">
            FreshFridge
          </span>
          <span className="hidden text-[14px] font-medium text-ink-500 sm:block">버리기 전에, 먼저 먹기</span>
        </span>
      )}
    </Link>
  );
}

function MvpBanner() {
  return (
    <div className="border-b border-ink-900/[0.06] bg-white">
      <div className="mx-auto flex max-w-[1720px] items-center justify-center gap-3 whitespace-nowrap px-4 py-2 sm:gap-4 sm:py-2.5">
        <Image
          src="/images/mirae-ai-lab-logo.png"
          alt="미래에이아이랩 (MIRAE AI LAB)"
          width={755}
          height={147}
          className="h-6 w-auto sm:h-8"
          priority
        />
        <span className="h-5 w-px shrink-0 bg-ink-900/10 sm:h-6" aria-hidden />
        <p className="flex items-center gap-2 text-[15.5px] font-semibold text-ink-600">
          <span className="hidden sm:inline">
            미래에이아이랩이 만든 <span className="font-bold text-fresh-700">FreshFridge</span>
          </span>
          <span className="rounded-chip bg-fresh-600 px-2.5 py-0.5 text-[13px] font-bold text-white">MVP Sample</span>
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, state } = useStore();
  const notifications = useNotifications();
  // 저장된 데이터를 불러온 뒤에만 배지를 그린다 (서버/클라이언트 불일치 방지)
  const unread = ready ? notifications.filter((n) => !n.read).length : 0;

  return (
    <div className="min-h-dvh">
      {/* 키보드 사용자가 메뉴를 건너뛰고 바로 본문으로 */}
      <a
        href="#main"
        className="sr-only z-[70] rounded-xl bg-ink-900 px-4 py-2.5 font-semibold text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        본문으로 건너뛰기
      </a>
      <MvpBanner />

      <div className="mx-auto flex w-full max-w-[1720px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-7 overflow-y-auto border-r border-ink-900/[0.06] bg-white px-3 py-6 lg:flex">
          <div className="px-2">
            <Logo />
          </div>
          <nav aria-label="주 메뉴" className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, also }) => {
              const active = isActive(pathname, href, also);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[48px] items-center gap-3 rounded-xl px-3.5 text-[18px] transition-colors duration-200 ${
                    active
                      ? "bg-fresh-600/[0.08] font-semibold text-fresh-800"
                      : "font-medium text-ink-600 hover:bg-ink-900/[0.035] hover:text-ink-900"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-fresh-600" aria-hidden />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.3 : 1.9}
                    className={active ? "text-fresh-700" : "text-ink-400"}
                    aria-hidden
                  />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-card bg-warmwhite p-4 ring-1 ring-inset ring-ink-900/[0.05]">
            <p className="text-[15px] font-semibold text-ink-800">버리기 전에, 먼저 먹기</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink-500">
              기한이 가까운 재료와 그걸로 만들 요리를 매일 챙겨드려요.
            </p>
            <div className="mt-3 border-t border-ink-900/[0.06] pt-3">
              <p className="text-[12.5px] font-semibold text-ink-400">Made by</p>
              <Image
                src="/images/mirae-ai-lab-logo.png"
                alt="미래에이아이랩 (MIRAE AI LAB)"
                width={755}
                height={147}
                className="mt-1.5 h-8 w-auto"
              />
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-h-dvh w-full min-w-0 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-ink-900/[0.06] bg-warmwhite/85 backdrop-blur-md backdrop-saturate-150">
            <div className="flex h-16 items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-3 sm:px-5">
              <div className="min-w-0 flex-1 lg:hidden">
                <Logo />
              </div>
              <Link
                href="/search"
                className="hidden w-full max-w-sm items-center gap-2.5 rounded-full border border-ink-900/[0.08] bg-white px-5 py-2.5 text-[17px] text-ink-500 shadow-[0_1px_2px_rgba(38,48,42,0.04)] transition-colors hover:border-ink-900/20 lg:flex"
              >
                <Search size={20} aria-hidden />
                식재료·레시피 검색
              </Link>
              {/* 오늘 날짜·요일·현재 시각 (데스크톱) */}
              <div className="hidden shrink-0 lg:block">
                <LiveClock />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href="/search"
                  aria-label="검색"
                  className="grid h-12 w-12 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-900/[0.05] lg:hidden"
                >
                  <Search size={24} strokeWidth={2.1} aria-hidden />
                </Link>
                <Link
                  href="/notifications"
                  className="relative grid h-12 w-12 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-900/[0.05]"
                >
                  <Bell size={24} strokeWidth={2.1} aria-hidden />
                  <span className="sr-only">알림</span>
                  {unread > 0 && (
                    <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral-700 px-1 text-[12.5px] font-bold leading-none text-white ring-2 ring-warmwhite">
                      {unread}
                      <span className="sr-only">개 안 읽음</span>
                    </span>
                  )}
                </Link>
                <Link
                  href="/my"
                  aria-label="마이페이지"
                  className="hidden h-11 w-11 place-items-center rounded-full bg-fresh-100 text-[17px] font-bold text-fresh-800 transition-colors hover:bg-fresh-200 lg:grid"
                >
                  <span aria-hidden>{state.userName.slice(0, 1)}</span>
                </Link>
              </div>
            </div>
          </header>
          {/* 오늘 날짜·요일·현재 시각 (모바일·태블릿) — 스크롤하면 자연스럽게 사라지도록 고정하지 않는다 */}
          <div className="px-4 pt-2.5 sm:px-6 lg:hidden">
            <LiveClock compact />
          </div>

          <main id="main" tabIndex={-1} className="w-full flex-1 px-4 pb-28 pt-4 outline-none sm:px-6 sm:pt-6 lg:pb-12">
            {/* 본문이 짧거나 아직 불러오는 중이어도 아래 CTA 가 첫 화면에 들어와 있다가 밀려나지 않게(CLS) */}
            {/* 화면이 바뀔 때 본문만 살짝 떠오르며 나타난다 (움직임 줄이기 설정이면 생략) */}
            <div key={pathname} className="min-h-[calc(100dvh-220px)] animate-page-in">
              {children}
            </div>

            {/* 샘플 공통 브릿지 CTA — 모든 페이지 하단에 동일하게 노출 */}
            <SampleBridgeCTA className="mx-auto mt-10 max-w-6xl sm:mt-12" />
          </main>

          <footer className="hidden flex-col items-center gap-2.5 pb-10 pt-4 lg:flex">
            <Image
              src="/images/mirae-ai-lab-logo.png"
              alt="미래에이아이랩 (MIRAE AI LAB)"
              width={755}
              height={147}
              className="h-9 w-auto opacity-90"
            />
            <span className="text-[14.5px] text-ink-400">© 미래에이아이랩 · FreshFridge MVP Sample</span>
          </footer>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="하단 메뉴"
        className="tab-bar fixed inset-x-0 bottom-0 z-40 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-bar backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-end justify-between px-6 pb-2 pt-1.5">
          {MOBILE_NAV.map(({ href, label, icon: Icon, emphasized, also }) => {
            const active = isActive(pathname, href, also);
            if (emphasized) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="-mt-6 flex shrink-0 flex-col items-center gap-1"
                >
                  <span className="grid h-[56px] w-[56px] place-items-center rounded-full bg-fresh-600 text-white shadow-cta ring-[5px] ring-white transition-transform duration-200 active:scale-95">
                    <Icon size={28} strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-[13px] font-semibold text-fresh-700">{label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors duration-200 active:opacity-70"
              >
                {/* 지금 있는 탭은 아이콘 뒤에 옅은 알약을 깔아 한눈에 보이게 */}
                <span
                  className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-200 ${
                    active ? "bg-fresh-600/10" : ""
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.4 : 1.9}
                    className={active ? "text-fresh-700" : "text-ink-400"}
                    aria-hidden
                  />
                </span>
                <span className={`text-[13px] ${active ? "font-bold text-fresh-800" : "font-medium text-ink-500"}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ToastHost />
    </div>
  );
}
