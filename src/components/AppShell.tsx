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
import ToastHost from "./ToastHost";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/fridge", label: "내 냉장고", icon: Refrigerator },
  { href: "/priority", label: "우선소비", icon: AlarmClock },
  { href: "/recipes", label: "레시피 추천", icon: ChefHat },
  { href: "/shopping", label: "장보기 리스트", icon: ShoppingBasket },
  { href: "/history", label: "소비 기록", icon: History },
  { href: "/report", label: "절약 리포트", icon: LineChart },
  { href: "/my", label: "마이페이지", icon: UserRound },
];

const MOBILE_NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/fridge", label: "냉장고", icon: Refrigerator },
  { href: "/add", label: "추가", icon: Plus, emphasized: true },
  { href: "/recipes", label: "레시피", icon: ChefHat },
  { href: "/my", label: "마이", icon: UserRound },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-fresh-500 text-lg text-white shadow-soft">
        🥬
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[17px] font-extrabold tracking-tight text-ink-900">
            FreshFridge
          </span>
          <span className="block text-[11px] font-medium text-ink-500">
            냉장고 식재료 관리
          </span>
        </span>
      )}
    </Link>
  );
}

function MvpBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-ink-900 px-4 py-1.5 text-center">
      <Image
        src="/images/mirae-ai-lab-logo.jpg"
        alt="미래에이아이랩 로고"
        width={66}
        height={20}
        className="h-5 w-auto rounded-[4px]"
        priority
      />
      <p className="text-[11px] font-medium text-white/90 sm:text-xs">
        이 서비스는 <span className="font-bold text-mint-300">미래에이아이랩</span>의 MVP 샘플입니다
      </p>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-dvh">
      <MvpBanner />

      <div className="mx-auto flex w-full max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-fresh-100 bg-white/70 px-4 py-6 backdrop-blur lg:flex">
          <div className="px-2">
            <Logo />
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors duration-200 ${
                    active
                      ? "bg-fresh-50 text-fresh-700"
                      : "text-ink-500 hover:bg-fresh-50/60 hover:text-ink-700"
                  }`}
                >
                  <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-card bg-gradient-to-br from-fresh-50 to-mint-50 p-4">
            <p className="text-xs font-semibold text-fresh-700">음식 낭비를 줄여요! 🌱</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
              버리기 전에 먼저 먹는 습관, FreshFridge가 도와드려요.
            </p>
            <div className="mt-3 flex items-center gap-1.5 border-t border-fresh-100 pt-3">
              <Image
                src="/images/mirae-ai-lab-logo.jpg"
                alt="미래에이아이랩"
                width={80}
                height={24}
                className="h-6 w-auto rounded"
              />
              <span className="text-[10px] font-medium text-ink-400">MVP Sample</span>
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-h-dvh w-full min-w-0 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-fresh-100/80 bg-warmwhite/85 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="lg:hidden">
                <Logo />
              </div>
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="hidden w-full max-w-sm items-center gap-2 rounded-2xl border border-ink-300/30 bg-white px-4 py-2.5 text-sm text-ink-400 transition-colors hover:border-fresh-300 lg:flex"
              >
                <Search size={17} />
                식재료·레시피 검색
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="검색"
                  onClick={() => router.push("/search")}
                  className="grid h-10 w-10 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-fresh-50 lg:hidden"
                >
                  <Search size={20} />
                </button>
                <button
                  type="button"
                  aria-label="알림"
                  onClick={() => router.push("/notifications")}
                  className="relative grid h-10 w-10 place-items-center rounded-2xl text-ink-500 transition-colors hover:bg-fresh-50"
                >
                  <Bell size={20} />
                  {unread > 0 && (
                    <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral-500 px-0.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                <Link
                  href="/my"
                  aria-label="마이페이지"
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-fresh-100 text-base transition-transform hover:scale-105"
                >
                  🧑‍🍳
                </Link>
              </div>
            </div>
          </header>

          <main className="w-full flex-1 px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
            {children}
          </main>

          <footer className="hidden items-center justify-center gap-2 pb-8 text-[11px] text-ink-400 lg:flex">
            <Image
              src="/images/mirae-ai-lab-logo.jpg"
              alt="미래에이아이랩"
              width={66}
              height={20}
              className="h-5 w-auto rounded"
            />
            <span>© 미래에이아이랩 · FreshFridge MVP Sample</span>
          </footer>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-fresh-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-between px-6 pb-2 pt-1.5">
          {MOBILE_NAV.map(({ href, label, icon: Icon, emphasized }) => {
            const active = isActive(pathname, href);
            if (emphasized) {
              return (
                <Link key={href} href={href} aria-label={label} className="-mt-6 flex flex-col items-center gap-1">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-fresh-500 text-white shadow-lift transition-transform duration-200 active:scale-95">
                    <Icon size={26} strokeWidth={2.6} />
                  </span>
                  <span className="text-[10px] font-semibold text-fresh-600">{label}</span>
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex w-14 flex-col items-center gap-1 py-1.5 transition-colors duration-200 ${
                  active ? "text-fresh-600" : "text-ink-400"
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ToastHost />
    </div>
  );
}
