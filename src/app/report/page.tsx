"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlarmClock, ArrowRight, ChefHat, TrendingDown, TrendingUp } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { daysLeft, formatWon } from "@/lib/expiry-calculator";
import { monthlyReport, wasteByCategory, wasteReasonCounts, weeklyTrend } from "@/lib/stats";
import type { IngredientCategory } from "@/lib/types";
import { josa } from "@/lib/text";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import EmptyState from "@/components/EmptyState";

// 사용/폐기 두 계열 — 색약(CVD)·대비 검증을 통과한 조합 (fresh-700 / coral-500)
const USED = "bg-fresh-700";
const WASTED = "bg-coral-500";

const TIPS: Partial<Record<IngredientCategory, string>> = {
  vegetable: "채소는 사고 나서 4일 안에 못 쓰는 경우가 많았어요. 이번 주 채소 구매량을 조금 줄여보세요.",
  fruit: "과일은 한 번에 많이 사기보다 이틀 안에 먹을 만큼만 사면 폐기를 줄일 수 있어요.",
  dairy: "유제품은 기한이 짧아요. 냉장고 앞쪽에 두면 잊지 않고 먹을 수 있어요.",
  meat: "바로 먹지 않을 육류는 소분해서 냉동하면 폐기를 크게 줄일 수 있어요.",
};

export default function ReportPage() {
  const { ready, state } = useStore();
  const fridge = useFridge();
  const report = useMemo(() => monthlyReport(state.logs, state.cooks), [state.logs, state.cooks]);
  const trend = useMemo(() => weeklyTrend(state.logs, 4), [state.logs]);
  const byCategory = useMemo(() => wasteByCategory(state.logs, 30), [state.logs]);
  const reasons = useMemo(() => wasteReasonCounts(state.logs, 30), [state.logs]);

  if (!ready)
    return (
      <PageLoading title="절약 리포트" back="/my">
        <div className="skeleton h-56 w-full" />
        <div className="skeleton h-40 w-full" />
      </PageLoading>
    );

  const { current: cur, previous: prev, wasteCountDelta } = report;
  const cookedItems30 = state.cooks.filter((c) => daysAgo(c.date) <= 29).reduce((s, c) => s + c.usedCount, 0);

  const topWaste = byCategory[0];
  const urgentInTopCategory = topWaste
    ? fridge.filter((i) => {
        const d = daysLeft(i.expiresAt);
        return i.category === topWaste.category && d !== null && d <= 3;
      }).length
    : 0;
  const maxWeek = Math.max(1, ...trend.map((w) => w.used + w.wasted));
  const maxCat = Math.max(1, ...byCategory.map((c) => c.count));

  const hasRecords = cur.usedCount + cur.wastedCount > 0;
  if (!hasRecords) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader back="/my" title="절약 리포트" />
        <EmptyState
          emoji="📊"
          title="아직 리포트에 쓸 기록이 없어요"
          description="재료를 먹거나 버린 기록이 쌓이면 아낀 금액과 자주 버리는 재료를 보여드려요."
          ctaLabel={fridge.length > 0 ? "먼저 먹을 재료 보기" : "식재료 추가하기"}
          ctaHref={fridge.length > 0 ? "/priority" : "/add"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-7 sm:space-y-8">
      <PageHeader back="/my" title="절약 리포트" description="최근 30일 기준이에요." />

      {/* 헤드라인 — 숫자 하나 + 변화 한 줄 */}
      <section className="card p-5 sm:p-6">
        <p className="text-[16.5px] font-semibold text-ink-500">버리지 않고 먹어서 아낀 금액</p>
        <p className="mt-1.5 text-[36px] font-extrabold leading-none tracking-tight text-ink-900 sm:text-[41.5px]">
          {formatWon(cur.savedAmount)}
        </p>
        {prev && wasteCountDelta !== null && (
          <div className="mt-3">
            <p
              className={`inline-flex items-center gap-1.5 text-[16.5px] font-semibold ${
                wasteCountDelta <= 0 ? "text-fresh-700" : "text-coral-700"
              }`}
            >
              {wasteCountDelta <= 0 ? <TrendingDown size={19} aria-hidden /> : <TrendingUp size={19} aria-hidden />}
              {wasteCountDelta === 0
                ? "그 전 30일과 폐기 개수가 같아요"
                : `그 전 30일보다 폐기 ${Math.abs(wasteCountDelta)}개 ${wasteCountDelta < 0 ? "줄었어요" : "늘었어요"}`}
            </p>
            <p className="mt-0.5 text-[15.5px] text-ink-500">
              폐기율 {prev.wasteRate}% → {cur.wasteRate}%
            </p>
          </div>
        )}
        <dl className="mt-5 grid grid-cols-3 divide-x divide-ink-300/25 border-t border-ink-300/25 pt-4 text-center">
          <div>
            <dt className="text-[15.5px] text-ink-500">먹은 재료</dt>
            <dd className="mt-0.5 text-[22px] font-extrabold text-ink-900">{cur.usedCount}개</dd>
          </div>
          <div>
            <dt className="text-[15.5px] text-ink-500">버린 재료</dt>
            <dd className="mt-0.5 text-[22px] font-extrabold text-ink-900">{cur.wastedCount}개</dd>
          </div>
          <div>
            <dt className="text-[15.5px] text-ink-500">폐기율</dt>
            <dd className="mt-0.5 text-[22px] font-extrabold text-ink-900">{cur.wasteRate}%</dd>
          </div>
        </dl>
      </section>

      {/* 내 행동이 만든 변화 */}
      <section>
        <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">내 행동이 만든 변화</h2>
        <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amberish-50 text-amberish-700">
              <AlarmClock size={21} />
            </span>
            <p className="text-[17.5px] text-ink-700">
              기한이 임박했던 재료 <b className="text-ink-900">{cur.rescuedCount}개</b>를 버리기 전에 먹었어요
            </p>
          </li>
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fresh-50 text-fresh-700">
              <ChefHat size={21} />
            </span>
            <p className="text-[17.5px] text-ink-700">
              <b className="text-ink-900">{cur.cookCount}번</b> 요리해서 재료 {cookedItems30}가지를 썼어요
            </p>
          </li>
          {prev && wasteCountDelta !== null && wasteCountDelta < 0 && (
            <li className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fresh-50 text-fresh-700">
                <TrendingDown size={21} />
              </span>
              <p className="text-[17.5px] text-ink-700">
                버린 금액이 {formatWon(prev.wastedAmount)} →{" "}
                <b className="text-ink-900">{formatWon(cur.wastedAmount)}</b>로 줄었어요
              </p>
            </li>
          )}
        </ul>
      </section>

      {/* 최근 4주 추이 — 사용 vs 폐기, 행마다 수치를 직접 표기 */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[20.5px] font-extrabold text-ink-900">주간 추이</h2>
          <div className="flex items-center gap-4 text-[15.5px] text-ink-500" aria-hidden>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${USED}`} />
              먹음
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${WASTED}`} />
              버림
            </span>
          </div>
        </div>
        <ul className="space-y-3 rounded-card border border-ink-300/25 bg-white p-4 sm:p-5">
          {trend.map((w) => (
            <li
              key={w.label}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3"
              title={`${w.label}: 먹음 ${w.used}개, 버림 ${w.wasted}개`}
              aria-label={`${w.label}: 먹음 ${w.used}개, 버림 ${w.wasted}개`}
            >
              <span className={`text-[15.5px] ${w.label === "이번 주" ? "font-bold text-ink-900" : "text-ink-500"}`}>
                {w.label}
              </span>
              <span className="flex h-3.5 gap-0.5">
                {w.used > 0 && (
                  <span className={`h-full rounded-[4px] ${USED}`} style={{ width: `${(w.used / maxWeek) * 100}%` }} />
                )}
                {w.wasted > 0 && (
                  <span
                    className={`h-full rounded-[4px] ${WASTED}`}
                    style={{ width: `${(w.wasted / maxWeek) * 100}%` }}
                  />
                )}
              </span>
              <span className="whitespace-nowrap text-right text-[15.5px] tabular-nums text-ink-500">
                먹음 {w.used} · 버림 {w.wasted}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 낭비 분석 */}
      <section>
        <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">가장 많이 버린 식재료</h2>
        {byCategory.length === 0 ? (
          <div className="card p-5 text-center text-[17.5px] text-ink-500">
            최근 30일 동안 버린 재료가 없어요. 완벽한 냉장고예요! 🎉
          </div>
        ) : (
          <div className="space-y-3.5 rounded-card border border-ink-300/25 bg-white p-4 sm:p-5">
            {byCategory.slice(0, 4).map((c, i) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-[16.5px]">
                  <p className="font-bold text-ink-700">
                    {i + 1}. {c.label}
                  </p>
                  <p className="tabular-nums text-ink-500">
                    {c.count}번 · {formatWon(c.amount)}
                  </p>
                </div>
                <div className="h-2.5 w-full rounded-full bg-ink-300/15">
                  <div className={`h-full rounded-[4px] ${WASTED}`} style={{ width: `${(c.count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {reasons.length > 0 && (
              <p className="border-t border-ink-300/20 pt-3 text-[15.5px] text-ink-500">
                버린 이유: {reasons.map((r) => `${r.reason} ${r.count}`).join(" · ")}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 다음 행동 제안 — 한 가지만 */}
      {topWaste && (
        <section className="rounded-card border border-amberish-100 bg-amberish-50/60 p-5">
          <p className="text-[16.5px] font-extrabold text-amberish-700">이번 주 제안</p>
          <p className="mt-1.5 text-[17.5px] leading-relaxed text-ink-700">
            최근 30일 동안 <b>{josa(topWaste.label, "을/를")}</b> 가장 많이 버렸어요({topWaste.count}번).{" "}
            {TIPS[topWaste.category] ??
              `${josa(topWaste.label, "은/는")} 구매량을 조금 줄이거나 냉동 보관을 활용해보세요.`}
          </p>
          <Link
            href={urgentInTopCategory > 0 ? `/fridge?category=${topWaste.category}` : "/shopping"}
            className="btn-primary mt-4 min-h-[52px]"
          >
            {urgentInTopCategory > 0
              ? `지금 먹어야 할 ${topWaste.label} ${urgentInTopCategory}개 보기`
              : "장보기 목록 점검하기"}
            <ArrowRight size={20} />
          </Link>
        </section>
      )}
    </div>
  );
}

function daysAgo(dateISO: string): number {
  const d = daysLeft(dateISO);
  return d === null ? 0 : -d;
}
