"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlarmClock,
  Bell,
  ChevronRight,
  History,
  LineChart,
  RefreshCcw,
  ShoppingBasket,
} from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import { daysLeft, formatWon } from "@/lib/expiry-calculator";
import { monthlyReport } from "@/lib/stats";
import PageHeader from "@/components/ui/PageHeader";
import ListGroup from "@/components/ui/ListGroup";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function MyPage() {
  const { ready, state, resetDemo, showToast } = useStore();
  const fridge = useFridge();
  const notifications = useNotifications();
  const [confirmReset, setConfirmReset] = useState(false);
  const report = useMemo(() => monthlyReport(state.logs, state.cooks).current, [state.logs, state.cooks]);

  if (!ready) {
    return <div className="mx-auto max-w-3xl"><div className="skeleton h-40 w-full" /></div>;
  }

  const urgentCount = fridge.filter((i) => {
    const d = daysLeft(i.expiresAt);
    return d !== null && d <= 3;
  }).length;
  const toBuy = state.shopping.filter((s) => !s.checked).length;
  const unread = notifications.filter((n) => !n.read).length;

  const menu = [
    {
      href: "/priority",
      label: "우선소비",
      value: urgentCount > 0 ? `${urgentCount}개 급해요` : "급한 재료 없음",
      icon: AlarmClock,
      tint: "bg-coral-100 text-coral-600",
    },
    {
      href: "/shopping",
      label: "장보기 리스트",
      value: toBuy > 0 ? `살 것 ${toBuy}개` : "비어 있어요",
      icon: ShoppingBasket,
      tint: "bg-mint-100 text-mint-600",
    },
    {
      href: "/history",
      label: "소비 기록",
      value: `${state.logs.length}건`,
      icon: History,
      tint: "bg-violet-100 text-violet-600",
    },
    {
      href: "/report",
      label: "절약 리포트",
      value: `${formatWon(report.savedAmount)} 절약`,
      icon: LineChart,
      tint: "bg-emerald-100 text-emerald-600",
    },
    {
      href: "/notifications",
      label: "알림",
      value: unread > 0 ? `안 읽은 알림 ${unread}개` : "모두 읽음",
      icon: Bell,
      tint: "bg-amberish-100 text-amberish-600",
    },
  ];

  const stats = [
    { label: "보관 중", value: `${fridge.length}개` },
    { label: "30일간 먹음", value: `${report.usedCount}개` },
    { label: "폐기율", value: `${report.wasteRate}%` },
  ];

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
      <PageHeader title="마이페이지" />

      {/* 프로필 + 핵심 숫자 */}
      <section className="card overflow-hidden">
        <div className="flex items-center gap-4 p-4 sm:p-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-fresh-100 text-[30px]" aria-hidden>
            🧑‍🍳
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-extrabold text-ink-900">{state.userName}님</p>
            <p className="mt-0.5 text-[16px] text-ink-500">
              {report.savedAmount > 0
                ? `최근 30일 동안 ${formatWon(report.savedAmount)}을 아꼈어요`
                : "먹은 재료를 기록하면 아낀 금액이 쌓여요"}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 border-t border-ink-300/20">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-2 py-3.5 text-center ${i > 0 ? "border-l border-ink-300/20" : ""}`}>
              <dt className="whitespace-nowrap text-[14.5px] text-ink-500">{s.label}</dt>
              <dd className="mt-0.5 text-[20.5px] font-extrabold text-ink-900">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 바로가기 — 각 화면의 지금 상태를 함께 보여준다 */}
      <ListGroup>
        {menu.map(({ href, label, value, icon: Icon, tint }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[64px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-warmwhite/70"
            >
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tint}`}>
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1 text-[18px] font-bold text-ink-900">{label}</span>
              <span className="shrink-0 text-[15.5px] font-medium text-ink-500">{value}</span>
              <ChevronRight size={20} className="shrink-0 text-ink-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ListGroup>

      {/* 데모 데이터 */}
      <section className="flex items-center justify-between gap-3 rounded-card border border-ink-300/25 bg-white px-4 py-3.5">
        <div className="min-w-0">
          <p className="text-[17px] font-bold text-ink-800">데모 데이터 초기화</p>
          <p className="text-[15px] text-ink-500">처음 예시 상태로 되돌려요</p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="btn-ghost min-h-[48px] shrink-0 px-3.5 text-[16.5px]"
        >
          <RefreshCcw size={18} />
          초기화
        </button>
      </section>

      <p className="text-center text-[14.5px] leading-relaxed text-ink-500">
        보관 상태가 좋지 않다면 기한 전이라도 드시지 마세요.
      </p>

      {confirmReset && (
        <ConfirmDialog
          title="데모 데이터를 초기화할까요?"
          description="지금까지 추가한 재료와 기록이 모두 지워지고 처음 예시 상태로 돌아가요."
          confirmLabel="초기화"
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            resetDemo();
            setConfirmReset(false);
            showToast("데모 데이터를 초기화했어요", "🔄");
          }}
        />
      )}
    </div>
  );
}
