"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatWon } from "@/lib/expiry-calculator";
import {
  monthlyReport,
  wasteByCategory,
  wasteReasonCounts,
  weeklySavings,
} from "@/lib/stats";

const IMPROVEMENT_TIPS: Record<string, string> = {
  vegetable:
    "채소류를 구매한 뒤 4일 안에 사용하지 못하는 경우가 많아요. 다음 구매에서는 조금 적게 구매해보세요.",
  fruit:
    "과일은 한 번에 많이 사기보다 먹을 만큼만 사면 폐기를 줄일 수 있어요.",
  dairy:
    "유제품은 유통기한이 짧아요. 구매 후 앞쪽에 보관하면 잊지 않고 먹을 수 있어요.",
  meat: "육류는 바로 먹지 않을 분량을 소분해 냉동하면 폐기를 크게 줄일 수 있어요.",
};

export default function ReportPage() {
  const { ready, state } = useStore();
  const report = useMemo(() => monthlyReport(state.logs), [state.logs]);
  const weekly = useMemo(() => weeklySavings(state.logs), [state.logs]);
  const byCategory = useMemo(() => wasteByCategory(state.logs), [state.logs]);
  const reasons = useMemo(() => wasteReasonCounts(state.logs), [state.logs]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  const improved = report.wasteRateDelta <= 0;
  const maxCatCount = Math.max(1, ...byCategory.map((c) => c.count));

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-6">
      <div>
        <h1 className="text-[28.6px] font-extrabold tracking-tight text-ink-900">절약 리포트 🌱</h1>
        <p className="mt-1 text-[17.6px] text-ink-500">
          버리지 않고 먹은 만큼, 식비가 절약돼요.
        </p>
      </div>

      {/* 이번 달 요약 */}
      <section className="card bg-gradient-to-br from-fresh-50 via-white to-mint-50 p-5">
        <p className="text-[16.9px] font-bold text-fresh-700">이번 달 예상 절약</p>
        <p className="mt-1 text-[41.6px] font-extrabold tracking-tight text-ink-900">
          {formatWon(report.savedAmount)}
        </p>
        <p className="mt-1 flex items-center gap-1 text-[16.2px] font-semibold">
          {improved ? (
            <>
              <TrendingDown size={20} className="text-fresh-600" />
              <span className="text-fresh-600">
                폐기율이 지난달보다 {Math.abs(report.wasteRateDelta)}%p 줄었어요
              </span>
            </>
          ) : (
            <>
              <TrendingUp size={20} className="text-coral-500" />
              <span className="text-coral-500">
                폐기율이 지난달보다 {report.wasteRateDelta}%p 늘었어요
              </span>
            </>
          )}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: "사용", value: `${report.usedCount}개`, tone: "text-fresh-600" },
            { label: "폐기", value: `${report.wastedCount}개`, tone: "text-coral-500" },
            { label: "폐기율", value: `${report.wasteRate}%`, tone: "text-ink-900" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/80 p-3 text-center shadow-soft">
              <p className="text-[15px] text-ink-400">{s.label}</p>
              <p className={`mt-0.5 text-[22.1px] font-extrabold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 이번 주 */}
      <section className="card p-5">
        <p className="text-[18.9px] font-bold text-ink-900">
          이번 주 {weekly.usedCount}개의 식재료를 알뜰하게 사용했어요 👏
        </p>
        <p className="mt-0.5 text-[16.2px] text-ink-500">
          예상 절약 {formatWon(weekly.savedAmount)}
        </p>
      </section>

      {/* 낭비 분석 */}
      <section>
        <h2 className="mb-3 text-[20.8px] font-extrabold text-ink-900">가장 많이 버린 식재료</h2>
        {byCategory.length === 0 ? (
          <div className="card p-5 text-center text-[17.6px] text-ink-500">
            폐기 기록이 없어요. 완벽한 냉장고예요! 🎉
          </div>
        ) : (
          <div className="card space-y-3.5 p-5">
            {byCategory.slice(0, 4).map((c, i) => (
              <div key={c.category}>
                <div className="mb-1 flex items-center justify-between text-[16.9px]">
                  <p className="font-bold text-ink-700">
                    {i + 1}. {c.label}
                  </p>
                  <p className="text-ink-400">
                    {c.count}회 · {formatWon(c.amount)}
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-fresh-50">
                  <div
                    className="h-full rounded-full bg-coral-400/70 transition-all duration-300"
                    style={{ width: `${(c.count / maxCatCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 폐기 이유 */}
      {reasons.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20.8px] font-extrabold text-ink-900">버리게 된 이유</h2>
          <div className="flex flex-wrap gap-2">
            {reasons.map((r) => (
              <span key={r.reason} className="chip bg-white text-ink-600 shadow-soft">
                {r.reason} <span className="font-extrabold text-coral-500">{r.count}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* 개선 제안 */}
      {byCategory.length > 0 && (
        <section className="card border-amberish-100 bg-amberish-50/50 p-5">
          <p className="text-[16.9px] font-extrabold text-amberish-600">💡 개선 제안</p>
          <p className="mt-1.5 text-[17.6px] leading-relaxed text-ink-700">
            {IMPROVEMENT_TIPS[byCategory[0].category] ??
              `${byCategory[0].label} 재료의 폐기가 가장 많아요. 구매량을 조금 줄이거나 냉동 보관을 활용해보세요.`}
          </p>
        </section>
      )}
    </div>
  );
}
