import { expiryLevel, formatKoreanDate, freshness } from "@/lib/expiry-calculator";

const FILL: Record<string, string> = {
  expired: "bg-coral-700",
  urgent: "bg-coral-500",
  soon: "bg-amberish-500",
  ok: "bg-fresh-500",
  unknown: "bg-ink-300",
};

/**
 * 산 날 → 오늘 → 기한 을 한 줄로. "얼마나 지났고 얼마나 남았는지"를 날짜 계산 없이 본다.
 * 색은 기한 상태(초록·주황·빨강)를 따르고, 같은 내용을 문장으로도 쓴다.
 */
export default function FreshnessTimeline({
  purchasedAt,
  expiresAt,
}: {
  purchasedAt: string;
  expiresAt: string | null;
}) {
  const f = freshness(purchasedAt, expiresAt);
  const level = expiryLevel(expiresAt);

  if (!f || !expiresAt) {
    return (
      <p className="text-[16px] text-ink-500">
        {formatKoreanDate(purchasedAt)}에 샀어요 · 기한을 모르면 냄새와 상태를 먼저 확인해주세요.
      </p>
    );
  }

  const summary =
    f.remaining < 0
      ? `산 지 ${f.elapsed}일째 · 기한이 ${-f.remaining}일 지났어요`
      : f.remaining === 0
        ? `산 지 ${f.elapsed}일째 · 오늘이 마지막 날이에요`
        : `산 지 ${f.elapsed}일째 · 기한까지 ${f.remaining}일 남았어요`;
  const pct = Math.round(f.ratio * 100);

  return (
    <div>
      <p className="text-[16.5px] font-semibold text-ink-800">{summary}</p>
      <div className="relative mt-3 h-2.5 rounded-full bg-ink-900/[0.07]" aria-hidden>
        <div className={`absolute inset-y-0 left-0 rounded-full ${FILL[level]}`} style={{ width: `${pct}%` }} />
        {/* 오늘 위치 */}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-ink-900 shadow-sm"
          style={{ left: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[14.5px] text-ink-500">
        <span>{formatKoreanDate(purchasedAt)} 구매</span>
        <span>{formatKoreanDate(expiresAt)}까지</span>
      </div>
    </div>
  );
}
