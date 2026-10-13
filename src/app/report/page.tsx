"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BarChart3, Minus, PartyPopper, TrendingDown, TrendingUp } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { addDays, formatWon, toISODate, todayStart } from "@/lib/expiry-calculator";
import { monthCompare, wasteByFood, wasteReasonsBetween, weeklyTrend } from "@/lib/stats";
import { wasteActions } from "@/lib/insights";
import { ingredientDefaults } from "@/lib/demo-data";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import EmptyState from "@/components/EmptyState";
import IngredientThumb from "@/components/IngredientThumb";

/** 패턴(자주 버리는 재료·이유)은 한 달보다 길게 봐야 보인다 */
const PATTERN_DAYS = 60;

// 먹음/버림 두 계열 — 범례 + 행마다 숫자를 함께 적는다 (색만으로 구분하지 않게)
const USED = "bg-fresh-700";
const WASTED = "bg-coral-500";
// 크기 비교 막대는 한 가지 무채색 — 빨강·주황은 기한 상태색으로만 쓴다
const MAGNITUDE = "bg-ink-600";

export default function ReportPage() {
  const { ready, state } = useStore();
  const fridge = useFridge();
  const month = useMemo(() => monthCompare(state.logs, state.cooks), [state.logs, state.cooks]);
  const patternFrom = toISODate(addDays(todayStart(), -(PATTERN_DAYS - 1)));
  const today = toISODate(todayStart());
  const foods = useMemo(() => wasteByFood(state.logs, patternFrom, today), [state.logs, patternFrom, today]);
  const reasons = useMemo(() => wasteReasonsBetween(state.logs, patternFrom, today), [state.logs, patternFrom, today]);
  const actions = useMemo(() => wasteActions(state.logs, fridge), [state.logs, fridge]);
  const trend = useMemo(() => weeklyTrend(state.logs, 4), [state.logs]);

  if (!ready)
    return (
      <PageLoading title="낭비 리포트" back="/my">
        <div className="skeleton h-56 w-full" />
        <div className="skeleton h-40 w-full" />
      </PageLoading>
    );

  const { span, current: cur, previous: prev } = month;
  const hasAny = state.logs.length > 0;

  if (!hasAny) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader back="/my" title="낭비 리포트" />
        <EmptyState
          icon={BarChart3}
          title="아직 리포트에 쓸 기록이 없어요"
          description="재료를 먹거나 버린 기록이 쌓이면 버린 금액과 자주 버리는 재료, 줄이는 방법을 보여드려요."
          ctaLabel={fridge.length > 0 ? "먼저 먹을 재료 보기" : "식재료 추가하기"}
          ctaHref={fridge.length > 0 ? "/priority" : "/add"}
        />
      </div>
    );
  }

  const delta = prev
    ? { amount: cur.wastedAmount - prev.wastedAmount, count: cur.wastedCount - prev.wastedCount }
    : null;
  const maxWeek = Math.max(1, ...trend.map((w) => w.used + w.wasted));
  const maxFood = Math.max(1, ...foods.map((f) => f.amount));
  const maxReason = Math.max(1, ...reasons.map((r) => r.count));
  const periodLabel = `${span.month}월 1일~${span.day}일`;

  return (
    <div className="mx-auto max-w-3xl space-y-7 sm:space-y-8">
      <PageHeader
        back="/my"
        title="낭비 리포트"
        description={`${periodLabel} 기록이에요. 지난달 같은 기간과 비교해요.`}
      />

      {/* 1. 이번 달 얼마나 버렸는지 + 지난달 대비 */}
      <section aria-labelledby="month-title" className="card p-5 sm:p-6">
        <h2 id="month-title" className="text-[16.5px] font-semibold text-ink-600">
          {span.month}월에 버린 식재료
        </h2>
        <p className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[38px] font-extrabold tabular-nums leading-none tracking-tight text-ink-900 sm:text-[44px]">
            {formatWon(cur.wastedAmount)}
          </span>
          <span className="text-[18px] font-bold tabular-nums text-ink-500">{cur.wastedCount}개</span>
        </p>

        <CompareLine delta={delta} prevLabel={`${span.prevMonth}월 1~${span.day}일`} />
        {cur.wastedCount === 0 && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[16px] text-fresh-700">
            <PartyPopper size={18} aria-hidden /> 이번 달은 아직 버린 재료가 없어요.
          </p>
        )}

        <dl className="mt-5 grid grid-cols-3 divide-x divide-ink-300/25 border-t border-ink-300/25 pt-4 text-center">
          <div className="px-1">
            <dt className="text-[14.5px] text-ink-500">아낀 금액</dt>
            <dd className="mt-0.5 text-[19px] font-extrabold tabular-nums text-ink-900">
              {formatWon(cur.savedAmount)}
            </dd>
          </div>
          <div className="px-1">
            <dt className="text-[14.5px] text-ink-500">버린 비율</dt>
            <dd className="mt-0.5 text-[19px] font-extrabold tabular-nums text-ink-900">{cur.wasteRate}%</dd>
          </div>
          <div className="px-1">
            <dt className="text-[14.5px] text-ink-500">임박 재료 살림</dt>
            <dd className="mt-0.5 text-[19px] font-extrabold tabular-nums text-ink-900">{cur.rescuedCount}개</dd>
          </div>
        </dl>
      </section>

      {foods.length === 0 ? (
        <section className="card px-5 py-6 text-center">
          <p className="text-[17.5px] font-bold text-ink-800">최근 두 달 동안 버린 재료가 없어요</p>
          <p className="mt-1 text-[15.5px] text-ink-500">버린 기록이 생기면 자주 버리는 재료와 이유를 알려드려요.</p>
        </section>
      ) : (
        <>
          {/* 2. 가장 많이 버린 식품 */}
          <section aria-labelledby="foods-title">
            <h2 id="foods-title" className="text-[20.5px] font-extrabold text-ink-900">
              많이 버린 식재료
            </h2>
            <p className="mb-3 mt-0.5 text-[15px] text-ink-500">최근 두 달 기준, 버린 금액이 큰 순이에요.</p>
            <ul className="overflow-hidden rounded-card border border-ink-300/25 bg-white">
              {[...foods]
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5)
                .map((f) => (
                  <li
                    key={f.name}
                    className="flex items-center gap-3 border-b border-ink-300/20 px-3.5 py-3 last:border-b-0 sm:px-4"
                  >
                    <IngredientThumb
                      name={f.name}
                      category={ingredientDefaults(f.name).category}
                      className="h-11 w-11 bg-warmwhite"
                      sizes="44px"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate text-[17.5px] font-bold text-ink-900">{f.name}</p>
                        <p className="shrink-0 text-[15.5px] font-semibold tabular-nums text-ink-700">
                          {f.count}번 · {formatWon(f.amount)}
                        </p>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="h-2 flex-1 rounded-full bg-ink-300/20" aria-hidden>
                          <span
                            className={`block h-full rounded-[4px] ${MAGNITUDE}`}
                            style={{ width: `${(f.amount / maxFood) * 100}%` }}
                          />
                        </span>
                        {f.topReason && <span className="shrink-0 text-[14px] text-ink-500">{f.topReason}</span>}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </section>

          {/* 3. 주요 폐기 이유 */}
          <section aria-labelledby="reasons-title">
            <h2 id="reasons-title" className="text-[20.5px] font-extrabold text-ink-900">
              버린 이유
            </h2>
            <p className="mb-3 mt-0.5 text-[15px] text-ink-500">최근 두 달 기준이에요.</p>
            <ul className="space-y-3 rounded-card border border-ink-300/25 bg-white p-4 sm:p-5">
              {reasons.map((r) => (
                <li key={r.reason} aria-label={`${r.reason} ${r.count}번, ${formatWon(r.amount)}`}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-[16px]">
                    <span className="font-semibold text-ink-800">{r.reason}</span>
                    <span className="tabular-nums text-ink-600">
                      {r.count}번 · {formatWon(r.amount)}
                    </span>
                  </div>
                  <span className="block h-2.5 w-full rounded-full bg-ink-300/20" aria-hidden>
                    <span
                      className={`block h-full rounded-[4px] ${MAGNITUDE}`}
                      style={{ width: `${(r.count / maxReason) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {/* 4. 다음 달에 줄일 수 있는 행동 — 위의 재료·이유를 근거로 */}
          {actions.length > 0 && (
            <section aria-labelledby="actions-title">
              <h2 id="actions-title" className="text-[20.5px] font-extrabold text-ink-900">
                다음 달엔 이렇게 줄여봐요
              </h2>
              <p className="mb-3 mt-0.5 text-[15px] text-ink-500">위에서 많이 버린 재료와 버린 이유를 보고 골랐어요.</p>
              <ol className="space-y-2.5">
                {actions.map((a, i) => (
                  <li key={a.name} className="card flex gap-3 p-4">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fresh-100 text-[16px] font-extrabold tabular-nums text-fresh-700">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17.5px] font-bold leading-snug text-ink-900">{a.title}</p>
                      <p className="mt-1 text-[15.5px] leading-relaxed text-ink-600">{a.detail}</p>
                      {a.href && (
                        <Link
                          href={a.href}
                          className="mt-1.5 inline-flex min-h-[40px] items-center gap-1 text-[15.5px] font-semibold text-fresh-700 hover:underline"
                        >
                          {a.linkLabel} <ArrowRight size={16} aria-hidden />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      {/* 5. 최근 4주 — 먹음 vs 버림 (범례 + 행마다 숫자) */}
      <section aria-labelledby="trend-title">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="trend-title" className="text-[20.5px] font-extrabold text-ink-900">
            최근 4주
          </h2>
          <div className="flex items-center gap-4 text-[15px] text-ink-600" aria-hidden>
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
              className="grid grid-cols-[4.2rem_minmax(0,1fr)_auto] items-center gap-3"
              title={`${w.label}: 먹음 ${w.used}개, 버림 ${w.wasted}개`}
              aria-label={`${w.label}: 먹음 ${w.used}개, 버림 ${w.wasted}개`}
            >
              <span className={`text-[15.5px] ${w.label === "이번 주" ? "font-bold text-ink-900" : "text-ink-600"}`}>
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
              <span className="whitespace-nowrap text-right text-[15px] tabular-nums text-ink-600">
                먹음 {w.used} · 버림 {w.wasted}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** 지난달 같은 기간 대비 — 금액이 같으면 개수로, 기록이 없으면 비교하지 않는다고 말한다 */
function CompareLine({ delta, prevLabel }: { delta: { amount: number; count: number } | null; prevLabel: string }) {
  if (!delta) {
    return (
      <p className="mt-3 text-[16.5px] font-semibold leading-snug text-ink-500">
        지난달 같은 기간 기록이 없어 비교하지 않았어요.
      </p>
    );
  }
  const less = delta.amount < 0 || (delta.amount === 0 && delta.count < 0);
  const more = delta.amount > 0 || (delta.amount === 0 && delta.count > 0);
  const size = delta.amount !== 0 ? formatWon(Math.abs(delta.amount)) : `${Math.abs(delta.count)}개`;
  const Icon = less ? TrendingDown : more ? TrendingUp : Minus;
  const tone = less ? "text-fresh-700" : more ? "text-coral-700" : "text-ink-600";
  return (
    <p className={`mt-3 flex items-start gap-1.5 text-[16.5px] font-semibold leading-snug ${tone}`}>
      <Icon size={20} className="mt-0.5 shrink-0" aria-hidden />
      <span>
        {less || more
          ? `지난달 같은 기간(${prevLabel})보다 ${size} ${less ? "덜" : "더"} 버렸어요`
          : `지난달 같은 기간(${prevLabel})과 같아요`}
      </span>
    </p>
  );
}
