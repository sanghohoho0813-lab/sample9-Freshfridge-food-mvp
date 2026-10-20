"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClock, Bell, ChevronRight, History, LineChart, RefreshCcw, ShoppingBasket } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { useNotifications } from "@/lib/notifications";
import { daysLeft, formatWon } from "@/lib/expiry-calculator";
import { monthCompare, monthlyReport } from "@/lib/stats";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import ListGroup from "@/components/ui/ListGroup";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function MyPage() {
  const { ready, state, resetDemo, showToast } = useStore();
  const fridge = useFridge();
  const notifications = useNotifications();
  const [confirmReset, setConfirmReset] = useState(false);
  const report = useMemo(() => monthlyReport(state.logs, state.cooks).current, [state.logs, state.cooks]);
  const month = useMemo(() => monthCompare(state.logs, state.cooks), [state.logs, state.cooks]);

  if (!ready)
    return (
      <PageLoading title="마이페이지">
        <div className="skeleton h-44 w-full" />
        <div className="skeleton h-80 w-full" />
      </PageLoading>
    );

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
    },
    {
      href: "/shopping",
      label: "장보기 리스트",
      value: toBuy > 0 ? `살 것 ${toBuy}개` : "비어 있어요",
      icon: ShoppingBasket,
    },
    {
      href: "/history",
      label: "소비 기록",
      value: `${state.logs.length}건`,
      icon: History,
    },
    {
      href: "/report",
      label: "낭비 리포트",
      value: `${month.span.month}월 ${formatWon(month.current.wastedAmount)} 버림`,
      icon: LineChart,
    },
    {
      href: "/notifications",
      label: "알림",
      value: unread > 0 ? `안 읽은 알림 ${unread}개` : "모두 읽음",
      icon: Bell,
    },
  ];

  const stats = [
    { label: "보관 중", value: `${fridge.length}개` },
    { label: "30일간 먹음", value: `${report.usedCount}개` },
    { label: "폐기율", value: `${report.wasteRate}%` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="마이페이지" />

      {/* 프로필 + 핵심 숫자 */}
      <section className="card overflow-hidden">
        <div className="flex items-center gap-4 bg-gradient-to-br from-fresh-50 via-white to-white p-4 sm:p-5">
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-fresh-600 text-[26px] font-bold text-white shadow-cta"
            aria-hidden
          >
            {state.userName.slice(0, 1)}
          </span>
          <div className="min-w-0">
            <p className="text-[22px] font-bold text-ink-900">{state.userName}님</p>
            <p className="mt-0.5 text-[16px] text-ink-500">
              {report.savedAmount > 0 ? (
                <>
                  최근 30일 동안{" "}
                  <b className="font-semibold tabular-nums text-fresh-700">{formatWon(report.savedAmount)}</b>을
                  아꼈어요
                </>
              ) : (
                "먹은 재료를 기록하면 아낀 금액이 쌓여요"
              )}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 border-t border-ink-900/[0.06]">
          {stats.map((s, i) => (
            <div key={s.label} className={`px-2 py-3.5 text-center ${i > 0 ? "border-l border-ink-900/[0.06]" : ""}`}>
              <dt className="whitespace-nowrap text-[14.5px] text-ink-500">{s.label}</dt>
              <dd className="mt-0.5 text-[20.5px] font-bold tabular-nums text-ink-900">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 바로가기 — 성격별로 묶고, 각 화면의 지금 상태를 함께 보여준다 */}
      {[
        {
          title: "오늘 챙길 것",
          items: menu.filter((m) => ["/priority", "/shopping", "/notifications"].includes(m.href)),
        },
        { title: "기록과 리포트", items: menu.filter((m) => ["/history", "/report"].includes(m.href)) },
      ].map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 className="mb-2 px-1 text-[15.5px] font-semibold text-ink-500">{group.title}</h2>
          <ListGroup>
            {group.items.map(({ href, label, value, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-[64px] items-center gap-3.5 px-4 py-3 transition-colors hover:bg-warmwhite active:bg-ink-900/[0.03]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-900/[0.04] text-ink-600">
                    <Icon size={22} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 text-[18px] font-semibold text-ink-900">{label}</span>
                  <span className="shrink-0 text-[15.5px] font-medium text-ink-500">{value}</span>
                  <ChevronRight size={20} className="shrink-0 text-ink-300" aria-hidden />
                </Link>
              </li>
            ))}
          </ListGroup>
        </section>
      ))}

      {/* 데모 데이터 */}
      <section className="flex items-center justify-between gap-3 rounded-card border border-ink-900/[0.07] bg-white px-4 py-3.5">
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
            showToast("데모 데이터를 초기화했어요");
          }}
        />
      )}
    </div>
  );
}
