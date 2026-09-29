"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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

/** 메뉴별 아이콘 색상 — 각 메뉴를 색으로 빠르게 구분할 수 있게 한다. */
const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home, tint: "bg-fresh-100 text-fresh-600" },
  { href: "/fridge", label: "내 냉장고", icon: Refrigerator, tint: "bg-sky-100 text-sky-600" },
  { href: "/priority", label: "우선소비", icon: AlarmClock, tint: "bg-coral-100 text-coral-600" },
  { href: "/recipes", label: "레시피 추천", icon: ChefHat, tint: "bg-amberish-100 text-amberish-600" },
  { href: "/shopping", label: "장보기 리스트", icon: ShoppingBasket, tint: "bg-mint-100 text-mint-600" },
  { href: "/history", label: "소비 기록", icon: History, tint: "bg-violet-100 text-violet-600" },
  { href: "/report", label: "절약 리포트", icon: LineChart, tint: "bg-emerald-100 text-emerald-600" },
  { href: "/my", label: "마이페이지", icon: UserRound, tint: "bg-rose-100 text-rose-500" },
];

const MOBILE_NAV = [
  { href: "/", label: "홈", icon: Home, tint: "text-fresh-500" },
  { href: "/fridge", label: "냉장고", icon: Refrigerator, tint: "text-sky-500" },
  { href: "/add", label: "추가", icon: Plus, emphasized: true, tint: "" },
  { href: "/recipes", label: "레시피", icon: ChefHat, tint: "text-amberish-500" },
  { href: "/my", label: "마이", icon: UserRound, tint: "text-rose-400" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-fresh-500 text-lg text-white shadow-soft">
        🥬
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[22px] font-extrabold tracking-tight text-ink-900 max-[380px]:text-[19px]">
            FreshFridge
          </span>
          <span className="block text-[14.5px] font-medium text-ink-500 max-[380px]:hidden">
            냉장고 식재료 관리
          </span>
        </span>
      )}
    </Link>
  );
}

function MvpBanner() {
  return (
    <div className="border-b border-fresh-100 bg-gradient-to-r from-white via-fresh-50/60 to-white">
      <div className="mx-auto flex max-w-[1720px] items-center justify-center gap-3 px-4 py-2.5 sm:gap-4">
        <Image
          src="/images/mirae-ai-lab-logo.png"
          alt="미래에이아이랩 (MIRAE AI LAB)"
          width={755}
          height={147}
          className="h-7 w-auto sm:h-9"
          priority
        />
        <span className="h-6 w-px shrink-0 bg-fresh-200 sm:h-7" aria-hidden />
        <p className="text-[14.5px] font-semibold leading-tight text-ink-600 sm:text-[16.5px]">
          <span className="hidden sm:inline">미래에이아이랩이 만든 </span>
          <span className="font-extrabold text-fresh-600">FreshFridge</span>
          <span className="hidden sm:inline"> · </span>
          <span className="ml-1.5 inline-flex items-center rounded-chip bg-fresh-500 px-2 py-0.5 text-[12.5px] font-bold text-white sm:ml-0 sm:text-[13.5px]">
            MVP Sample
          </span>
        </p>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { ready } = useStore();
  const notifications = useNotifications();
  // 저장된 데이터를 불러온 뒤에만 배지를 그린다 (서버/클라이언트 불일치 방지)
  const unread = ready ? notifications.filter((n) => !n.read).length : 0;

  return (
    <div className="min-h-dvh">
      <MvpBanner />

      <div className="mx-auto flex w-full max-w-[1720px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-fresh-100 bg-white/70 px-3 py-6 backdrop-blur lg:flex">
          <div className="px-2">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, tint }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-2 text-[18.5px] font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-fresh-50 text-fresh-700"
                      : "text-ink-500 hover:bg-fresh-50/60 hover:text-ink-700"
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-200 ${tint} ${
                      active ? "scale-105 shadow-soft" : ""
                    }`}
                  >
                    <Icon size={21} strokeWidth={active ? 2.6 : 2.2} />
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-card border border-fresh-100 bg-gradient-to-br from-fresh-50 to-mint-50 p-4">
            <p className="text-xs font-semibold text-fresh-700">음식 낭비를 줄여요! 🌱</p>
            <p className="mt-1 text-[14.5px] leading-relaxed text-ink-500">
              버리기 전에 먼저 먹는 습관, FreshFridge가 도와드려요.
            </p>
            <div className="mt-3 border-t border-fresh-200/70 pt-3">
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
          <header className="sticky top-0 z-30 border-b border-fresh-100/80 bg-warmwhite/85 backdrop-blur">
            <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-5">
              <div className="min-w-0 flex-1 lg:hidden">
                <Logo />
              </div>
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="hidden w-full max-w-sm items-center gap-2 rounded-2xl border border-ink-300/30 bg-white px-4 py-2.5 text-sm text-ink-400 transition-colors hover:border-fresh-300 lg:flex"
              >
                <Search size={22} />
                식재료·레시피 검색
              </button>
              {/* 오늘 날짜·요일·현재 시각 (데스크톱) */}
              <div className="hidden shrink-0 lg:block">
                <LiveClock />
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label="검색"
                  onClick={() => router.push("/search")}
                  className="grid h-12 w-12 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-fresh-50 lg:hidden"
                >
                  <Search size={26} />
                </button>
                <button
                  type="button"
                  aria-label={unread > 0 ? `알림 ${unread}개` : "알림"}
                  onClick={() => router.push("/notifications")}
                  className="relative grid h-12 w-12 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-fresh-50"
                >
                  <Bell size={26} />
                  {unread > 0 && (
                    <span className="absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral-500 px-1 text-[12.5px] font-bold leading-none text-white">
                      {unread}
                    </span>
                  )}
                </button>
                <Link
                  href="/my"
                  aria-label="마이페이지"
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-fresh-100 text-base transition-transform hover:scale-105"
                >
                  🧑‍🍳
                </Link>
              </div>
            </div>
            {/* 오늘 날짜·요일·현재 시각 (모바일·태블릿) */}
            <div className="border-t border-fresh-100/70 bg-fresh-50/40 px-4 py-1.5 sm:px-5 lg:hidden">
              <LiveClock compact />
            </div>
          </header>

          <main className="w-full flex-1 px-4 pb-28 pt-5 sm:px-5 lg:pb-12">
            {children}

            {/* 샘플 공통 브릿지 CTA — 모든 페이지 하단에 동일하게 노출 */}
            <SampleBridgeCTA className="mx-auto mt-12 max-w-6xl" />
          </main>

          <footer className="hidden flex-col items-center gap-2.5 pb-10 pt-4 lg:flex">
            <Image
              src="/images/mirae-ai-lab-logo.png"
              alt="미래에이아이랩 (MIRAE AI LAB)"
              width={755}
              height={147}
              className="h-9 w-auto opacity-90"
            />
            <span className="text-[14.5px] text-ink-400">
              © 미래에이아이랩 · FreshFridge MVP Sample
            </span>
          </footer>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fresh-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between px-6 pb-2 pt-1.5">
          {MOBILE_NAV.map(({ href, label, icon: Icon, emphasized, tint }) => {
            const active = isActive(pathname, href);
            if (emphasized) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="-mt-6 flex shrink-0 flex-col items-center gap-1"
                >
                  <span className="grid h-[58px] w-[58px] place-items-center rounded-full bg-fresh-500 text-white shadow-lift transition-transform duration-200 active:scale-95">
                    <Icon size={30} strokeWidth={2.6} />
                  </span>
                  <span className="text-[13px] font-semibold text-fresh-600">{label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 transition-colors duration-200"
              >
                <Icon
                  size={25}
                  strokeWidth={active ? 2.6 : 2}
                  className={active ? tint : "text-ink-300"}
                />
                <span
                  className={`text-[13px] font-semibold ${active ? "text-ink-900" : "text-ink-400"}`}
                >
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
