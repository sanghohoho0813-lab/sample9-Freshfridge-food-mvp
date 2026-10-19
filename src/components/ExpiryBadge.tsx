import { dDayLabel, expiryLevel, type ExpiryLevel } from "@/lib/expiry-calculator";

/** 색은 급한 정도에만 쓴다 — 지남(진한 빨강) · 오늘·내일(빨강) · 2~3일(주황) · 나머지(무채색) */
const STYLES: Record<ExpiryLevel, string> = {
  expired: "bg-coral-700 text-white",
  urgent: "bg-coral-50 text-coral-700 ring-1 ring-inset ring-coral-100",
  soon: "bg-amberish-50 text-amberish-700 ring-1 ring-inset ring-amberish-100",
  ok: "bg-ink-300/15 text-ink-600",
  unknown: "bg-ink-300/15 text-ink-500",
};

export default function ExpiryBadge({
  expiresAt,
  size = "md",
}: {
  expiresAt: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const level = expiryLevel(expiresAt);
  const sizeClass =
    size === "lg"
      ? "px-3 py-1 text-[18px] font-bold"
      : size === "sm"
        ? "px-2 py-0.5 text-[14px] font-bold"
        : "px-2.5 py-0.5 text-[16px] font-bold";
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md tabular-nums ${sizeClass} ${STYLES[level]}`}
    >
      {dDayLabel(expiresAt)}
    </span>
  );
}
